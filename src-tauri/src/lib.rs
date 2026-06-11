mod ssl;

use std::collections::HashMap;
use std::sync::OnceLock;
use std::time::Duration;

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use argon2::Argon2;
use rand::RngCore;
use serde::Serialize;
use tauri_plugin_sql::{Migration, MigrationKind};

// ── constants ────────────────────────────────────────────────────────────────

const KEYRING_SERVICE: &str = "nexus-pcc";
const BUNDLE_MAGIC: &[u8] = b"NEXUSPJ1";
const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12;
const KEY_LEN: usize = 32;
const DEFAULT_TIMEOUT_MS: u64 = 15_000;

// ── shared HTTP client ────────────────────────────────────────────────────────

static HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

fn http_client() -> &'static reqwest::Client {
    HTTP_CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .use_rustls_tls()
            .gzip(true)
            .build()
            .expect("failed to build reqwest client")
    })
}

// ── response type ─────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct HttpResponse {
    pub status: u16,
    pub ok: bool,
    pub body: String,
    pub headers: HashMap<String, String>,
}

// ── 1. Secret vault ───────────────────────────────────────────────────────────

#[tauri::command]
fn secret_set(key: String, value: String) -> Result<(), String> {
    let entry =
        keyring::Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())
}

#[tauri::command]
fn secret_get(key: String) -> Result<Option<String>, String> {
    let entry =
        keyring::Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(val) => Ok(Some(val)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn secret_delete(key: String) -> Result<(), String> {
    let entry =
        keyring::Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

// ── 2. HTTP proxy ─────────────────────────────────────────────────────────────

/// Strip the request URL from an error string so secrets embedded in URLs
/// (bot tokens, webhook paths) never reach logs or the UI.
fn redact_url(message: &str, url: &str) -> String {
    let mut out = message.replace(url, "<url>");
    // reqwest may echo the URL without a trailing slash or with minor
    // normalization; also redact the host+path portion conservatively.
    if let Some(stripped) = url.strip_suffix('/') {
        out = out.replace(stripped, "<url>");
    }
    out
}

/// reqwest's Display hides the underlying cause (DNS, refused, TLS, timeout)
/// in the error source chain — walk it so the UI shows something actionable.
fn describe_request_error(e: &reqwest::Error, url: &str) -> String {
    let mut msg = e.to_string();
    let mut source = std::error::Error::source(e);
    while let Some(s) = source {
        msg.push_str(": ");
        msg.push_str(&s.to_string());
        source = std::error::Error::source(s);
    }
    redact_url(&msg, url)
}

#[tauri::command]
async fn http_request(
    method: String,
    url: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
    timeout_ms: Option<u64>,
) -> Result<HttpResponse, String> {
    let timeout = Duration::from_millis(timeout_ms.unwrap_or(DEFAULT_TIMEOUT_MS));

    let method_parsed = reqwest::Method::from_bytes(method.to_uppercase().as_bytes())
        .map_err(|e| format!("invalid method: {e}"))?;

    let mut builder = http_client()
        .request(method_parsed, &url)
        .timeout(timeout);

    if let Some(hdrs) = headers {
        for (k, v) in &hdrs {
            builder = builder.header(k.as_str(), v.as_str());
        }
    }

    if let Some(raw_body) = body {
        builder = builder.body(raw_body);
    }

    let response = builder
        .send()
        .await
        .map_err(|e| describe_request_error(&e, &url))?;

    let status = response.status().as_u16();
    let ok = response.status().is_success();

    let mut resp_headers: HashMap<String, String> = HashMap::new();
    for (name, value) in response.headers() {
        resp_headers.insert(
            name.as_str().to_owned(),
            value.to_str().unwrap_or("").to_owned(),
        );
    }

    let body_bytes = response
        .bytes()
        .await
        .map_err(|e| describe_request_error(&e, &url))?;
    let body_str = String::from_utf8_lossy(&body_bytes).into_owned();

    Ok(HttpResponse {
        status,
        ok,
        body: body_str,
        headers: resp_headers,
    })
}

// ── 3. Encrypted bundle export / import ──────────────────────────────────────

fn derive_key(passphrase: &[u8], salt: &[u8]) -> Result<[u8; KEY_LEN], String> {
    let mut key = [0u8; KEY_LEN];
    Argon2::default()
        .hash_password_into(passphrase, salt, &mut key)
        .map_err(|e| e.to_string())?;
    Ok(key)
}

#[tauri::command]
fn export_bundle(path: String, plaintext: String, passphrase: String) -> Result<(), String> {
    let mut rng = rand::thread_rng();

    let mut salt = [0u8; SALT_LEN];
    rng.fill_bytes(&mut salt);

    let mut nonce_bytes = [0u8; NONCE_LEN];
    rng.fill_bytes(&mut nonce_bytes);

    let key_bytes = derive_key(passphrase.as_bytes(), &salt)?;
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_bytes));
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| e.to_string())?;

    let mut file_data: Vec<u8> =
        Vec::with_capacity(BUNDLE_MAGIC.len() + SALT_LEN + NONCE_LEN + ciphertext.len());
    file_data.extend_from_slice(BUNDLE_MAGIC);
    file_data.extend_from_slice(&salt);
    file_data.extend_from_slice(&nonce_bytes);
    file_data.extend_from_slice(&ciphertext);

    std::fs::write(&path, &file_data).map_err(|e| e.to_string())
}

#[tauri::command]
fn import_bundle(path: String, passphrase: String) -> Result<String, String> {
    let data = std::fs::read(&path).map_err(|e| e.to_string())?;

    let header_len = BUNDLE_MAGIC.len() + SALT_LEN + NONCE_LEN;
    if data.len() < header_len || &data[..BUNDLE_MAGIC.len()] != BUNDLE_MAGIC {
        return Err("not a Nexus project bundle".to_string());
    }

    let salt = &data[BUNDLE_MAGIC.len()..BUNDLE_MAGIC.len() + SALT_LEN];
    let nonce_bytes = &data[BUNDLE_MAGIC.len() + SALT_LEN..header_len];
    let ciphertext = &data[header_len..];

    let key_bytes = derive_key(passphrase.as_bytes(), salt)?;
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_bytes));
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext_bytes = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "Wrong passphrase or corrupted file".to_string())?;

    String::from_utf8(plaintext_bytes)
        .map_err(|e| format!("invalid UTF-8 in decrypted bundle: {e}"))
}

// ── 3b. Plain text file export (handover docs) ───────────────────────────────

/// Unrestricted write — the `path` MUST originate from a native save dialog
/// (user-chosen), never from remote or computed input.
#[tauri::command]
fn save_text_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

// ── 4. App entry point ────────────────────────────────────────────────────────

const DB_MIGRATION_SQL: &str = "
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  api_base_url TEXT NOT NULL DEFAULT '',
  auth_method TEXT NOT NULL DEFAULT 'none',
  git_provider TEXT NOT NULL DEFAULT 'none',
  repo_url TEXT NOT NULL DEFAULT '',
  git_project_id TEXT NOT NULL DEFAULT '',
  support_endpoint TEXT NOT NULL DEFAULT '',
  health_endpoint TEXT NOT NULL DEFAULT '',
  deploy_endpoint TEXT NOT NULL DEFAULT '',
  docs_url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
";

const DB_MIGRATION_V2_SQL: &str = "
ALTER TABLE projects ADD COLUMN login_endpoint TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN token_field TEXT NOT NULL DEFAULT '';
";

const DB_MIGRATION_V3_SQL: &str = "
CREATE TABLE IF NOT EXISTS ai_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
";

const DB_MIGRATION_V4_SQL: &str = "
CREATE TABLE IF NOT EXISTS health_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  checked_at TEXT NOT NULL,
  health TEXT NOT NULL,
  latency_ms INTEGER,
  http_status INTEGER,
  error TEXT
);
CREATE INDEX IF NOT EXISTS idx_health_history_project_time
  ON health_history(project_id, checked_at);

CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  severity TEXT NOT NULL,
  first_error TEXT,
  checks_count INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_incidents_project_time
  ON incidents(project_id, started_at);
";

const DB_MIGRATION_V5_SQL: &str = "
CREATE TABLE IF NOT EXISTS notification_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  config TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "initial schema",
            sql: DB_MIGRATION_SQL,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "generic login auth: login_endpoint + token_field",
            sql: DB_MIGRATION_V2_SQL,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "ai_accounts for provider usage dashboard",
            sql: DB_MIGRATION_V3_SQL,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "health_history + incidents for health timeline",
            sql: DB_MIGRATION_V4_SQL,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "notification_channels for the notification hub",
            sql: DB_MIGRATION_V5_SQL,
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:nexus.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            secret_set,
            secret_get,
            secret_delete,
            http_request,
            export_bundle,
            import_bundle,
            save_text_file,
            ssl::ssl_check,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
