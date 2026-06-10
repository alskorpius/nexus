# Nexus Architecture

## Technology Stack

| Layer | Tech | Version |
|-------|------|---------|
| Desktop Runtime | Tauri | 2.0 |
| UI Framework | React | 19.1 |
| Language (Frontend) | TypeScript | 5.8 |
| Build Tool | Vite | 7.0 |
| Backend Runtime | Rust | 2021 edition |
| Database | SQLite | 3 (via tauri-plugin-sql) |
| Secrets Vault | OS Keyring | Windows/macOS/Linux |
| HTTP Client | reqwest | 0.12 (rustls, gzip) |
| Encryption | AES-256-GCM | aes_gcm 0.10 |
| Key Derivation | Argon2id | argon2 0.5 |
| Auth | Bearer token / custom login endpoint | per project |

## Database Schema

**SQLite file**: `nexus.db` in Tauri app data directory
- **Windows**: `%APPDATA%\Nexus\nexus.db`
- **macOS**: `~/Library/Application Support/dev.nexus.pcc/nexus.db`
- **Linux**: `~/.local/share/dev.nexus.pcc/nexus.db`

### Tables

#### `projects`
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  api_base_url TEXT NOT NULL,
  auth_method TEXT NOT NULL DEFAULT 'none', -- 'none', 'bearer', 'login'
  login_endpoint TEXT NOT NULL DEFAULT '', -- POST URL for 'login' auth
  token_field TEXT NOT NULL DEFAULT '',    -- dot-path to token in login response ('' = auto)
  git_provider TEXT NOT NULL DEFAULT 'none', -- 'none', 'github', 'gitlab'
  repo_url TEXT,
  git_project_id TEXT,
  support_endpoint TEXT,
  health_endpoint TEXT,
  deploy_endpoint TEXT,
  docs_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### `app_settings`
```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

**Stored settings**:
- `poll_interval_sec`: Integer (default 60, min 15)
- `theme`: 'light' | 'dark' (future)
- `notification_enabled`: 'true' | 'false' (future)

### Migrations

Defined in Rust (`src-tauri/src/lib.rs`) as `tauri_plugin_sql::Migration` objects. Applied on app startup.

## Secrets Vault (OS Keyring)

**Service name**: `nexus-pcc`

**Key naming convention**:
```
project:{project_id}:api_token       -- Bearer token for health/deploy endpoints
project:{project_id}:git_token       -- GitHub/GitLab personal access token
project:{project_id}:login_creds     -- raw login request body (JSON or form-encoded)
```

**Implementation**:
- Windows: DPAPI (Data Protection API) via keyring crate
- macOS: Keychain
- Linux: Secret Service (DBus)

**Rust commands**:
```rust
#[tauri::command]
fn secret_set(key: String, value: String) -> Result<(), String>
  -- Store secret in keyring

#[tauri::command]
fn secret_get(key: String) -> Result<Option<String>, String>
  -- Retrieve secret; returns None if not found

#[tauri::command]
fn secret_delete(key: String) -> Result<(), String>
  -- Delete secret from keyring
```

## Encrypted Bundle Format

**Use case**: Export project config + credentials for sharing with teammate.

**File format**:
```
[8 bytes]   MAGIC = "NEXUSPJ1"
[16 bytes]  SALT (random, per bundle)
[12 bytes]  NONCE (random, per bundle)
[N bytes]   CIPHERTEXT (AES-256-GCM encrypted)
[16 bytes]  AUTH TAG (appended by GCM)
```

**Encryption**:
1. User provides passphrase (user input)
2. Derive key: `Argon2id(passphrase, salt)` → 32 bytes
3. Generate random salt (16 bytes) and nonce (12 bytes)
4. Plaintext: JSON of `{project, apiToken?, gitToken?, loginCreds?}`
5. Encrypt with `AES-256-GCM(plaintext, nonce, key)`
6. Write magic + salt + nonce + ciphertext + tag

**Decryption**:
1. Read magic (verify "NEXUSPJ1")
2. Read salt, nonce, ciphertext + tag
3. Derive key from passphrase + salt
4. Decrypt with `AES-256-GCM(ciphertext, nonce, key)`
5. Parse JSON, validate, store project + restore secrets to keyring

**Rust commands**:
```rust
#[tauri::command]
fn export_bundle(path: String, plaintext: String, passphrase: String) -> Result<(), String>
  -- Encrypt plaintext and write to file

#[tauri::command]
fn import_bundle(path: String, passphrase: String) -> Result<String, String>
  -- Read encrypted file, decrypt, return plaintext (JSON)
```

## HTTP Client & CORS Bypass

**Problem**: Browser webview enforces CORS. Cross-origin API calls fail.

**Solution**: Rust HTTP proxy via `http_request` command.

**Implementation**:
- reqwest 0.12 with rustls (no OpenSSL dependency)
- Shared `OnceLock<Client>` singleton
- Gzip compression enabled
- TLS certificate validation (no insecure override)

**Command signature**:
```rust
#[tauri::command]
async fn http_request(
    method: String,                       // GET, POST, PUT, DELETE, PATCH
    url: String,                          // Full URL
    headers: Option<HashMap<String, String>>,  // Custom headers
    body: Option<String>,                 // JSON body
    timeout_ms: Option<u64>,              // Default 15s
) -> Result<HttpResponse, String>

struct HttpResponse {
    status: u16,                          // HTTP status code
    ok: bool,                             // true if 2xx, false if 4xx/5xx
    body: String,                         // Response body (UTF-8)
    headers: HashMap<String, String>,     // Response headers
}
```

**Behavior**:
- Returns `Ok(HttpResponse)` on all HTTP responses (1xx–5xx)
- Returns `Err(String)` only on network errors (timeout, DNS, TLS, connection refused)
- No exception text in error message (security: no credential leakage)

## Frontend Architecture

### Layer Map

```
src/
├── types.ts                 -- Core types: Project, Ticket, GitInfo, ProjectStatus, HealthState
├── main.tsx                 -- React entry point
├── App.tsx                  -- Root component (router shell)
├── vite-env.d.ts            -- Vite type definitions
├── lib/
│   ├── db.ts                -- SQLite repo: listProjects, saveProject, deleteProject, settings CRUD
│   ├── secrets.ts           -- Keyring wrapper: secretKeys namespace, getSecret, setSecret, deleteSecret
│   ├── http.ts              -- HTTP proxy: httpRequest, parseJson, error handling
│   ├── health.ts            -- Health check logic: checkHealth (periodic poll)
│   ├── bundle.ts            -- Bundle export/import: exportProjectBundle, importProjectBundle
│   └── format.ts            -- Utility: formatDate, formatLatency, etc.
├── adapters/
│   ├── tickets.ts           -- generic login + support-tickets API adapter
│   ├── git.ts               -- GitHub REST API + GitLab API v4 adapters
│   └── (future: more)
├── state/
│   └── store.tsx            -- React Context: projects, statuses, nav, polling, CRUD ops
├── components/
│   ├── Sidebar.tsx          -- Nav sidebar (projects list, settings link)
│   ├── StatusPill.tsx       -- Health state badge (healthy/warning/critical/unknown)
│   ├── PassphraseModal.tsx  -- Bundle export/import UI
│   └── (future: more)
└── pages/
    ├── Dashboard.tsx        -- Aggregate view: all projects + high-level stats
    ├── Projects.tsx         -- Project list + CRUD UI
    ├── ProjectDetail.tsx    -- Single project: health, tickets, git, links, notes
    └── Settings.tsx         -- Global settings, theme, poll interval
```

### Data Flow

```
1. User action (add project, refresh, navigate)
   ↓
2. StoreCtx dispatch (setNav, refreshProject, saveProjectWithSecrets)
   ↓
3. Service call (db.saveProject, health.checkHealth, tickets.fetchTickets, git.fetchGitInfo)
   ↓
4. Rust command (secret_set, http_request, export_bundle, etc.)
   ↓
5. Update StoreCtx state (projects, statuses, nav, refreshing)
   ↓
6. React re-render (pages, components consume context)
   ↓
7. User sees UI update (project added, status changed, ticket list updated)
```

### State Management

**StoreCtx** (React Context):
- `projects: Project[]` — Project list from SQLite
- `statuses: Record<number, ProjectStatus>` — Real-time health + tickets + git per project
- `nav: Nav` — Current page + projectId (dashboard | projects | project | settings)
- `loading: boolean` — Initial load in progress
- `refreshing: Record<number, boolean>` — Per-project refresh in progress
- `pollIntervalSec: number` — Global polling interval (default 60, min 15)

**Auto-polling**:
- Interval timer runs every `pollIntervalSec` seconds
- For each project: call `refreshProject(id)` if not already in-flight
- Concurrent refreshes guarded by `refreshInFlight` Set

**ProjectStatus**:
```typescript
interface ProjectStatus {
  projectId: number;
  health: HealthState;              // 'healthy' | 'warning' | 'critical' | 'unknown'
  latencyMs: number | null;         // Response time in ms (only if ok)
  httpStatus: number | null;        // HTTP status code (only if ok)
  error: string | null;             // Human-readable error (timeout, 500, etc.)
  checkedAt: string | null;         // ISO timestamp of last check
  tickets: Ticket[] | null;         // Support tickets from endpoint
  ticketsError: string | null;      // Error fetching tickets (if any)
  git: GitInfo | null;              // Commits, MRs, failed pipelines
  gitError: string | null;          // Error fetching git info (if any)
}
```

## Rust Backend Commands

All invoked via `tauri::command` and callable from TypeScript via `invoke()`.

### 1. Secrets (3 commands)

```rust
fn secret_set(key: String, value: String) -> Result<(), String>
fn secret_get(key: String) -> Result<Option<String>, String>
fn secret_delete(key: String) -> Result<(), String>
```

**Use**: Store/retrieve/delete credentials in OS keyring.

### 2. HTTP Proxy (1 command)

```rust
async fn http_request(
    method: String,
    url: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
    timeout_ms: Option<u64>,
) -> Result<HttpResponse, String>
```

**Use**: Make HTTP requests without CORS restrictions.

### 3. Bundle Encryption (2 commands)

```rust
fn export_bundle(path: String, plaintext: String, passphrase: String) -> Result<(), String>
fn import_bundle(path: String, passphrase: String) -> Result<String, String>
```

**Use**: Export/import encrypted project bundles.

## Security Model

### What's Encrypted

- **Bundle files** (.nexusproj): AES-256-GCM with Argon2id key derivation
- **OS Keyring**: OS-level encryption (DPAPI, Keychain, Secret Service)
- **Network**: TLS 1.3 enforced (rustls, no legacy protocols)

### What's Not Encrypted (and why)

- **SQLite database**: Not encrypted on disk (local device threat model)
  - Mitigation: File permissions on app data directory restrict OS user access
  - Future: Add SQLite encryption via `sqlcipher` if device-theft scenario required
- **In-memory state**: Not encrypted (React context, Rust HashMap)
  - Mitigation: Process memory protected by OS

### Threat Model

**In scope**:
- Credential interception (HTTPS + TLS validation)
- Accidental credential exposure (keyring + bundle encryption)
- Team handoff (encrypted bundles with passphrase)

**Out of scope**:
- Physical device theft (would require full-disk encryption)
- Malware with elevated privileges (can read process memory, keyring)
- Network-level attacks on localhost
- Endpoint compromise

### Zero-Trust Principles

1. **Never store secrets in SQLite** — use keyring only
2. **Never log secrets** — strip from error messages before user display
3. **Never send secrets over unencrypted channels** — TLS only
4. **Never hardcode defaults** — user must explicitly configure per project
5. **Never trust bundle import** — validate structure, encrypt passphrase, warn on success

## Polling & Refresh Logic

**Auto-polling** (background, every N seconds):
```
for each project in projects:
  if not refreshing[project.id]:
    refreshProject(project.id) in background
    set refreshing[project.id] = true
    await Promise.allSettled([checkHealth, fetchTickets, fetchGitInfo])
    clear refreshing[project.id]
```

**Manual refresh** (user action):
```
on click "Refresh Project":
  refreshProject(id)  -- same logic as auto-poll, but immediate
```

**Concurrent guard**:
- `refreshInFlight: Set<number>` prevents duplicate requests
- Use `useCallback` to memoize refresh function
- Guard with `if (refreshInFlight.has(id)) return`

**Timeout**:
- Health check: 3 sec default (configurable per endpoint)
- Tickets: 5 sec default
- Git: 10 sec default (GitHub API can be slow)
- If timeout, `error` field set to "Request timeout"

## Database Migrations

**Location**: `src-tauri/src/lib.rs` in `migrations()` function.

**Format**:
```rust
Migration {
    version: 1,
    description: "Create projects table",
    sql: "CREATE TABLE projects (...)",
    kind: MigrationKind::Up,
}
```

**Execution**:
- On app startup, tauri-plugin-sql reads migrations
- If `_sqlx_migrations` table missing, creates it
- Applies all pending migrations in version order
- Stores applied version + timestamp in `_sqlx_migrations`

## Build & Deployment

### Dev Build
```bash
npm run tauri dev
```
Launches Vite dev server + Tauri window with hot reload.

### Production Build
```bash
npm run build
npm run tauri build
```
Creates:
- Windows: `src-tauri/target/release/nexus.exe` (+ .msi installer via WixToolset)
- macOS: `src-tauri/target/release/bundle/macos/Nexus.app`
- Linux: `.deb` + `.AppImage` (platform-dependent)

### Code Signing (future)
- Windows: Authenticode certificate (not yet implemented)
- macOS: Developer ID certificate (not yet implemented)
- Auto-updates: Tauri updater plugin (not yet implemented)

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| App startup | < 2 sec | SQLite load + initial poll |
| Health check latency | < 3 sec | HTTP timeout configurable |
| Ticket sync | < 5 sec | Depends on support API response |
| Git info fetch | < 10 sec | GitHub/GitLab rate limits apply |
| Memory footprint | < 100 MB | React + SQLite + Rust RT |
| CPU idle | < 1% | Poll interval 60s or more |
| Battery drain | < 1% per hour | No constant network activity |

## Dependencies

### Frontend (package.json)
- `@tauri-apps/api`: Tauri JS/TS bindings
- `@tauri-apps/plugin-sql`: SQLite plugin
- `@tauri-apps/plugin-dialog`: File picker (bundle import)
- `@tauri-apps/plugin-opener`: Open URLs + file browser
- `react`, `react-dom`: UI framework
- `typescript`: Language

### Backend (Cargo.toml)
- `tauri`: Desktop framework
- `tauri-plugin-sql`: SQLite integration
- `serde`, `serde_json`: JSON serialization
- `reqwest`: HTTP client
- `keyring`: OS credentials vault
- `aes-gcm`: Encryption
- `argon2`: Key derivation
- `rand`: Randomness (salt, nonce)

## Future Architecture Enhancements

1. **State Persistence**: IndexedDB for offline-first data caching
2. **Service Workers**: Background polling without app window open
3. **Database Encryption**: SQLcipher for device-theft mitigation
4. **Type Generation**: OpenAPI schema → TypeScript types (zero runtime validation)
5. **Plugin System**: Loadable adapters for custom endpoints
6. **Cloud Sync**: Optional end-to-end encrypted workspace sync
7. **Team Collaboration**: Multi-user mode with RBAC + audit logs
