// AI agent monitor.
//
// Reads LOCAL session state for Claude Code, Codex CLI, and Gemini/Antigravity,
// the running agent processes, and listening dev ports. Read-only: no network,
// no API keys, no auth — exactly the abtop privacy model, surfaced in the GUI.
//
// Session sources (JSONL, one event per line):
//   Claude : ~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl
//   Codex  : ~/.codex/sessions/YYYY/MM/DD/rollout-<ts>-<id>.jsonl
//   Gemini : ~/.gemini/tmp/**  and  ~/.gemini/antigravity/conversations/**  (best-effort)
//
// Only the most-recently-modified sessions are fully parsed (token totals need a
// full read); the rest are ignored to keep a refresh cheap.

use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;
use serde_json::Value;
use sysinfo::{ProcessesToUpdate, System};

/// How many of the most-recent sessions to fully parse per refresh.
const SESSION_LIMIT: usize = 40;
/// Skip files larger than this when summing tokens (avoids pathological reads).
const MAX_PARSE_BYTES: u64 = 30 * 1024 * 1024;

#[derive(Serialize)]
pub struct AiSession {
    id: String,
    agent: String,
    project: String,
    cwd: Option<String>,
    title: Option<String>,
    model: Option<String>,
    git_branch: Option<String>,
    input_tokens: u64,
    output_tokens: u64,
    cache_tokens: u64,
    total_tokens: u64,
    /// Size of the most recent prompt (input + cache) = current context occupancy.
    context_tokens: u64,
    context_window: u64,
    context_pct: f64,
    message_count: u64,
    last_activity_ms: i64,
    /// "active" (<3 min), "idle" (<60 min), or "stale".
    status: String,
}

#[derive(Serialize)]
pub struct AiProcess {
    pid: u32,
    name: String,
    agent: String,
    cpu: f32,
    mem_mb: u64,
    cwd: Option<String>,
}

#[derive(Serialize)]
pub struct OrphanPort {
    port: u16,
    pid: u32,
    process: String,
    proto: String,
}

#[derive(Serialize)]
pub struct AiMonitorReport {
    sessions: Vec<AiSession>,
    processes: Vec<AiProcess>,
    orphan_ports: Vec<OrphanPort>,
    generated_at_ms: i64,
    /// Non-fatal collection problems, surfaced in the UI without failing the whole report.
    errors: Vec<String>,
}

// ── time / path helpers ──────────────────────────────────────────────────────

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn mtime_ms(path: &Path) -> i64 {
    fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn status_from_ms(ms: i64, now: i64) -> String {
    let age = now - ms;
    if age < 3 * 60_000 {
        "active".into()
    } else if age < 60 * 60_000 {
        "idle".into()
    } else {
        "stale".into()
    }
}

/// Last path segment of a (possibly Windows) path string.
fn basename(p: &str) -> String {
    let norm = p.replace('\\', "/");
    norm.trim_end_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or(p)
        .to_string()
}

/// Recursively collect files under `dir` whose extension is in `exts`.
fn walk(dir: &Path, exts: &[&str], out: &mut Vec<PathBuf>) {
    let rd = match fs::read_dir(dir) {
        Ok(r) => r,
        Err(_) => return,
    };
    for entry in rd.flatten() {
        let p = entry.path();
        if p.is_dir() {
            walk(&p, exts, out);
        } else if let Some(ext) = p.extension().and_then(OsStr::to_str) {
            if exts.contains(&ext) {
                out.push(p);
            }
        }
    }
}

// ── Claude Code ──────────────────────────────────────────────────────────────

fn claude_window(model: &str) -> u64 {
    let m = model.to_lowercase();
    if m.contains("1m]") || m.contains("-1m") || m.contains("[1m") {
        1_000_000
    } else {
        200_000
    }
}

fn parse_claude(path: &Path, now: i64) -> Option<AiSession> {
    let meta = fs::metadata(path).ok()?;
    if meta.len() > MAX_PARSE_BYTES {
        return None;
    }
    let content = fs::read_to_string(path).ok()?;
    let id = path.file_stem()?.to_string_lossy().to_string();

    let (mut input, mut output, mut cache, mut ctx, mut msg) = (0u64, 0u64, 0u64, 0u64, 0u64);
    let mut model: Option<String> = None;
    let mut cwd: Option<String> = None;
    let mut branch: Option<String> = None;
    let mut title: Option<String> = None;

    for line in content.lines() {
        let v: Value = match serde_json::from_str(line) {
            Ok(v) => v,
            Err(_) => continue,
        };
        match v.get("type").and_then(Value::as_str).unwrap_or("") {
            "assistant" => {
                msg += 1;
                if let Some(u) = v.get("message").and_then(|m| m.get("usage")) {
                    let i = u.get("input_tokens").and_then(Value::as_u64).unwrap_or(0);
                    let o = u.get("output_tokens").and_then(Value::as_u64).unwrap_or(0);
                    let cr = u.get("cache_read_input_tokens").and_then(Value::as_u64).unwrap_or(0);
                    let cc = u.get("cache_creation_input_tokens").and_then(Value::as_u64).unwrap_or(0);
                    input += i;
                    output += o;
                    cache += cr + cc;
                    let prompt = i + cr + cc;
                    if prompt > 0 {
                        ctx = prompt; // most recent non-empty prompt = live context size
                    }
                }
                if let Some(m) = v.get("message").and_then(|m| m.get("model")).and_then(Value::as_str) {
                    if m != "<synthetic>" {
                        model = Some(m.to_string());
                    }
                }
                if cwd.is_none() {
                    if let Some(c) = v.get("cwd").and_then(Value::as_str) {
                        cwd = Some(c.to_string());
                    }
                }
                if branch.is_none() {
                    if let Some(b) = v.get("gitBranch").and_then(Value::as_str) {
                        if !b.is_empty() {
                            branch = Some(b.to_string());
                        }
                    }
                }
            }
            "user" => msg += 1,
            "ai-title" => {
                if title.is_none() {
                    title = v
                        .get("title")
                        .and_then(Value::as_str)
                        .or_else(|| v.get("payload").and_then(Value::as_str))
                        .or_else(|| v.get("message").and_then(Value::as_str))
                        .map(str::to_string);
                }
            }
            _ => {}
        }
    }

    let total = input + output + cache;
    let mut window = model.as_deref().map(claude_window).unwrap_or(200_000);
    // The 1M-context flag isn't always encoded in the model id; if the live
    // prompt already exceeds the base tier, it must be a 1M-context session.
    if ctx > window {
        window = 1_000_000;
    }
    let pct = if window > 0 {
        (ctx as f64 / window as f64) * 100.0
    } else {
        0.0
    };
    let last = mtime_ms(path);
    let project = cwd.as_deref().map(basename).unwrap_or_else(|| "—".into());

    Some(AiSession {
        id,
        agent: "claude".into(),
        project,
        cwd,
        title,
        model,
        git_branch: branch,
        input_tokens: input,
        output_tokens: output,
        cache_tokens: cache,
        total_tokens: total,
        context_tokens: ctx,
        context_window: window,
        context_pct: pct,
        message_count: msg,
        last_activity_ms: last,
        status: status_from_ms(last, now),
    })
}

// ── Codex CLI ────────────────────────────────────────────────────────────────

fn parse_codex(path: &Path, now: i64) -> Option<AiSession> {
    let meta = fs::metadata(path).ok()?;
    if meta.len() > MAX_PARSE_BYTES {
        return None;
    }
    let content = fs::read_to_string(path).ok()?;

    let mut id: Option<String> = None;
    let mut cwd: Option<String> = None;
    let mut model: Option<String> = None;
    let (mut window, mut input, mut output, mut cache, mut ctx, mut msg) =
        (0u64, 0u64, 0u64, 0u64, 0u64, 0u64);

    for line in content.lines() {
        let v: Value = match serde_json::from_str(line) {
            Ok(v) => v,
            Err(_) => continue,
        };
        let t = v.get("type").and_then(Value::as_str).unwrap_or("");
        let payload = v.get("payload");
        match t {
            "session_meta" => {
                if let Some(p) = payload {
                    if id.is_none() {
                        id = p.get("id").and_then(Value::as_str).map(str::to_string);
                    }
                    if cwd.is_none() {
                        cwd = p.get("cwd").and_then(Value::as_str).map(str::to_string);
                    }
                    if model.is_none() {
                        model = p
                            .get("model")
                            .and_then(Value::as_str)
                            .or_else(|| p.get("model_provider").and_then(Value::as_str))
                            .map(str::to_string);
                    }
                }
            }
            "event_msg" => {
                if let Some(p) = payload {
                    match p.get("type").and_then(Value::as_str).unwrap_or("") {
                        "task_started" => {
                            if let Some(w) = p.get("model_context_window").and_then(Value::as_u64) {
                                if w > 0 {
                                    window = w;
                                }
                            }
                        }
                        "token_count" => {
                            if let Some(info) = p.get("info") {
                                if let Some(tot) = info.get("total_token_usage") {
                                    input = tot.get("input_tokens").and_then(Value::as_u64).unwrap_or(input);
                                    output = tot.get("output_tokens").and_then(Value::as_u64).unwrap_or(output);
                                    cache = tot
                                        .get("cached_input_tokens")
                                        .and_then(Value::as_u64)
                                        .unwrap_or(cache);
                                }
                                if let Some(w) = info.get("model_context_window").and_then(Value::as_u64) {
                                    if w > 0 {
                                        window = w;
                                    }
                                }
                                if let Some(last) = info.get("last_token_usage") {
                                    let li = last.get("input_tokens").and_then(Value::as_u64).unwrap_or(0);
                                    let lc = last.get("cached_input_tokens").and_then(Value::as_u64).unwrap_or(0);
                                    if li + lc > 0 {
                                        ctx = li + lc;
                                    }
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }
            "response_item" => {
                if let Some(p) = payload {
                    if p.get("type").and_then(Value::as_str) == Some("message") {
                        msg += 1;
                    }
                }
            }
            _ => {}
        }
    }

    let id = id.unwrap_or_else(|| {
        path.file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default()
    });
    if window == 0 {
        window = 272_000;
    }
    if ctx == 0 {
        ctx = input.min(window);
    }
    let total = input + output + cache;
    let pct = if window > 0 {
        (ctx as f64 / window as f64) * 100.0
    } else {
        0.0
    };
    let last = mtime_ms(path);
    let project = cwd.as_deref().map(basename).unwrap_or_else(|| "—".into());

    Some(AiSession {
        id,
        agent: "codex".into(),
        project,
        cwd,
        title: None,
        model: model.or_else(|| Some("gpt-5".into())),
        git_branch: None,
        input_tokens: input,
        output_tokens: output,
        cache_tokens: cache,
        total_tokens: total,
        context_tokens: ctx,
        context_window: window,
        context_pct: pct,
        message_count: msg,
        last_activity_ms: last,
        status: status_from_ms(last, now),
    })
}

// ── Gemini / Antigravity (best-effort) ───────────────────────────────────────

fn parse_gemini(path: &Path, now: i64) -> Option<AiSession> {
    let id = path.file_stem()?.to_string_lossy().to_string();
    let last = mtime_ms(path);
    let project = path
        .parent()
        .and_then(|p| p.file_name())
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "gemini".into());

    Some(AiSession {
        id,
        agent: "gemini".into(),
        project,
        cwd: None,
        title: None,
        model: Some("gemini".into()),
        git_branch: None,
        input_tokens: 0,
        output_tokens: 0,
        cache_tokens: 0,
        total_tokens: 0,
        context_tokens: 0,
        context_window: 1_000_000,
        context_pct: 0.0,
        message_count: 0,
        last_activity_ms: last,
        status: status_from_ms(last, now),
    })
}

// ── session collection ───────────────────────────────────────────────────────

fn collect_sessions(now: i64, errors: &mut Vec<String>) -> Vec<AiSession> {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => {
            errors.push("Could not resolve the home directory".into());
            return vec![];
        }
    };

    let mut files: Vec<(&'static str, PathBuf)> = vec![];

    let mut claude = vec![];
    walk(&home.join(".claude").join("projects"), &["jsonl"], &mut claude);
    files.extend(claude.into_iter().map(|p| ("claude", p)));

    let mut codex = vec![];
    walk(&home.join(".codex").join("sessions"), &["jsonl"], &mut codex);
    files.extend(codex.into_iter().map(|p| ("codex", p)));

    let mut gemini = vec![];
    walk(&home.join(".gemini").join("tmp"), &["json", "jsonl"], &mut gemini);
    walk(
        &home.join(".gemini").join("antigravity").join("conversations"),
        &["json", "jsonl"],
        &mut gemini,
    );
    files.extend(gemini.into_iter().map(|p| ("gemini", p)));

    // Most recent first, then keep only the cheapest-to-parse window of files.
    files.sort_by_key(|(_, p)| std::cmp::Reverse(mtime_ms(p)));
    files.truncate(SESSION_LIMIT);

    let mut out: Vec<AiSession> = files
        .into_iter()
        .filter_map(|(agent, path)| match agent {
            "claude" => parse_claude(&path, now),
            "codex" => parse_codex(&path, now),
            _ => parse_gemini(&path, now),
        })
        .collect();

    out.sort_by_key(|s| std::cmp::Reverse(s.last_activity_ms));
    out
}

// ── processes + ports (single sysinfo snapshot) ──────────────────────────────

fn classify_agent(name_lower: &str, cmd_lower: &str) -> Option<&'static str> {
    if cmd_lower.contains("claude") || name_lower.contains("claude") {
        Some("claude")
    } else if cmd_lower.contains("codex") || name_lower.contains("codex") {
        Some("codex")
    } else if cmd_lower.contains("antigravity")
        || cmd_lower.contains("gemini")
        || name_lower.contains("gemini")
    {
        Some("gemini")
    } else {
        None
    }
}

/// Process names (lowercased, `.exe` stripped) treated as dev servers when they
/// hold a listening port. Surfaces forgotten `npm run dev` / DB / tunnel processes.
const DEV_PROC: &[&str] = &[
    "node", "python", "python3", "deno", "bun", "php", "ruby", "dotnet",
    "postgres", "httpd", "nginx", "ngrok", "redis-server", "mongod", "mysqld",
    "java", "gunicorn", "uvicorn", "caddy", "vite", "esbuild", "go", "rails",
];

fn collect_processes_and_ports(self_pid: u32) -> (Vec<AiProcess>, Vec<OrphanPort>, Vec<String>) {
    let mut errors = vec![];
    let mut sys = System::new();
    // Two refreshes spaced by the minimum interval give meaningful CPU percentages.
    sys.refresh_processes(ProcessesToUpdate::All, true);
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    sys.refresh_processes(ProcessesToUpdate::All, true);

    // Single pass over every process: build a reliable pid→name map (used for the
    // port owners) and pick out the agent processes.
    let mut pid_name: std::collections::HashMap<u32, String> = std::collections::HashMap::new();
    let mut processes = vec![];
    for (pid, proc_) in sys.processes() {
        let pid_u = pid.as_u32();
        let name = proc_.name().to_string_lossy().to_string();
        pid_name.insert(pid_u, name.clone());
        if pid_u == self_pid {
            continue;
        }
        let cmd_lower = proc_
            .cmd()
            .iter()
            .map(|s| s.to_string_lossy().to_lowercase())
            .collect::<Vec<_>>()
            .join(" ");
        if let Some(agent) = classify_agent(&name.to_lowercase(), &cmd_lower) {
            processes.push(AiProcess {
                pid: pid_u,
                name,
                agent: agent.into(),
                cpu: proc_.cpu_usage(),
                mem_mb: proc_.memory() / (1024 * 1024),
                cwd: proc_.cwd().map(|p| p.to_string_lossy().to_string()),
            });
        }
    }
    processes.sort_by(|a, b| b.mem_mb.cmp(&a.mem_mb));

    // Listening TCP ports → owning process name (via the map), kept when the owner
    // looks like a dev server.
    let orphan_ports = match listening_ports() {
        Ok(rows) => {
            let scanned = rows.len();
            let kept: Vec<OrphanPort> = rows
                .into_iter()
                .filter_map(|(port, pid)| {
                    let name = pid_name.get(&pid).cloned().unwrap_or_default();
                    let nl = name.to_lowercase();
                    let base = nl.strip_suffix(".exe").unwrap_or(&nl);
                    if DEV_PROC.contains(&base) {
                        Some(OrphanPort {
                            port,
                            pid,
                            process: if name.is_empty() { format!("pid {pid}") } else { name },
                            proto: "TCP".into(),
                        })
                    } else {
                        None
                    }
                })
                .collect();
            if kept.is_empty() && scanned > 0 {
                errors.push(format!(
                    "scanned {scanned} listening ports — none owned by a recognised dev server"
                ));
            }
            kept
        }
        Err(e) => {
            errors.push(e);
            vec![]
        }
    };

    (processes, orphan_ports, errors)
}

/// Parse the OS tool output into (port, pid) for LISTENING TCP sockets.
fn listening_ports() -> Result<Vec<(u16, u32)>, String> {
    #[cfg(windows)]
    let output = {
        // Use the absolute path so a stripped-down PATH in the app process can't
        // hide netstat.exe.
        let exe = std::env::var("SystemRoot")
            .map(|r| format!("{r}\\System32\\netstat.exe"))
            .unwrap_or_else(|_| "netstat".into());
        std::process::Command::new(exe).args(["-ano", "-p", "tcp"]).output()
    };
    #[cfg(not(windows))]
    let output = std::process::Command::new("lsof")
        .args(["-nP", "-iTCP", "-sTCP:LISTEN"])
        .output();

    let output = output.map_err(|e| format!("port scan failed: {e}"))?;
    let text = String::from_utf8_lossy(&output.stdout);
    let mut rows = vec![];
    let mut seen = std::collections::HashSet::new();

    #[cfg(windows)]
    {
        for line in text.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            // proto local foreign STATE pid
            if parts.len() >= 5 && parts[0].eq_ignore_ascii_case("tcp") && parts[3] == "LISTENING" {
                if let (Some(port), Ok(pid)) = (port_of(parts[1]), parts[4].parse::<u32>()) {
                    if seen.insert(port) {
                        rows.push((port, pid));
                    }
                }
            }
        }
    }
    #[cfg(not(windows))]
    {
        // lsof: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME(*:PORT)
        for line in text.lines().skip(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 9 {
                if let (Ok(pid), Some(port)) = (parts[1].parse::<u32>(), port_of(parts[8])) {
                    if seen.insert(port) {
                        rows.push((port, pid));
                    }
                }
            }
        }
    }

    Ok(rows)
}

/// Extract the trailing port number from a `host:port` socket string.
fn port_of(addr: &str) -> Option<u16> {
    addr.rsplit(':').next().and_then(|s| s.parse::<u16>().ok())
}

// ── command ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn ai_monitor() -> Result<AiMonitorReport, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let now = now_ms();
        let mut errors = vec![];
        let sessions = collect_sessions(now, &mut errors);
        let (processes, orphan_ports, mut perrors) =
            collect_processes_and_ports(std::process::id());
        errors.append(&mut perrors);
        AiMonitorReport {
            sessions,
            processes,
            orphan_ports,
            generated_at_ms: now,
            errors,
        }
    })
    .await
    .map_err(|e| format!("ai_monitor task failed: {e}"))
}
