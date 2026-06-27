import { invoke } from '@tauri-apps/api/core';

// Mirrors the Rust structs in src-tauri/src/aimon.rs (snake_case fields).

export type AiAgent = 'claude' | 'codex' | 'gemini';
export type SessionStatus = 'active' | 'idle' | 'stale';

export interface AiSession {
  id: string;
  agent: AiAgent;
  project: string;
  cwd: string | null;
  title: string | null;
  model: string | null;
  git_branch: string | null;
  input_tokens: number;
  output_tokens: number;
  cache_tokens: number;
  total_tokens: number;
  context_tokens: number;
  context_window: number;
  context_pct: number;
  message_count: number;
  last_activity_ms: number;
  status: SessionStatus;
}

export interface AiProcess {
  pid: number;
  name: string;
  agent: AiAgent;
  cpu: number;
  mem_mb: number;
  cwd: string | null;
}

export interface OrphanPort {
  port: number;
  pid: number;
  process: string;
  proto: string;
}

export interface AiMonitorReport {
  sessions: AiSession[];
  processes: AiProcess[];
  orphan_ports: OrphanPort[];
  generated_at_ms: number;
  errors: string[];
}

/** Read local AI-agent session state, processes, and listening dev ports. */
export async function fetchAiMonitor(): Promise<AiMonitorReport> {
  return await invoke<AiMonitorReport>('ai_monitor');
}
