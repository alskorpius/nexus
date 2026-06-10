/**
 * Creates a minimal test SQLite database matching the Nexus schema (migrations v1–v3).
 * Output: mcp-server/test/nexus-test.db
 */

import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testDir = join(__dirname, '..', 'test');
mkdirSync(testDir, { recursive: true });
const dbPath = join(testDir, 'nexus-test.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    api_base_url TEXT,
    auth_method TEXT DEFAULT 'none',
    git_provider TEXT,
    repo_url TEXT,
    git_project_id TEXT,
    support_endpoint TEXT,
    health_endpoint TEXT,
    deploy_endpoint TEXT,
    docs_url TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    login_endpoint TEXT,
    token_field TEXT
  );

  CREATE TABLE IF NOT EXISTS ai_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const insert = db.prepare(`
  INSERT INTO projects
    (name, description, api_base_url, auth_method, git_provider, repo_url, git_project_id,
     support_endpoint, health_endpoint, deploy_endpoint, docs_url, notes, login_endpoint, token_field)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insert.run(
  'EFAD',
  'Employee Feedback and Development platform. Manages support tickets and user profiles.',
  'http://localhost:8001',
  'login',
  'github',
  'https://github.com/example/efad',
  'example/efad',
  '/api/v1/support-requests/',
  '/health',
  '/api/v1/deploy',
  'https://docs.example.com/efad',
  `## Architecture\nFastAPI backend, PostgreSQL, Redis for caching.\n\n## Test credentials\n- Email: user@example.com\n- User ID: 002\n- Password: 123456\n\n## Notes\n- Token valid 20h\n- CORS restricted to localhost in dev`,
  '/api/v1/users/login',
  'access_token'
);

insert.run(
  'Nexus',
  'Local-first hub for managing AI-assisted projects. Stores project metadata, health status, and git activity.',
  null,
  'none',
  'github',
  'https://github.com/example/nexus',
  null,
  null,
  null,
  null,
  'https://github.com/example/nexus#readme',
  `## Stack\nTauri 2 + React 19 + TypeScript + SQLite (Rust backend)\n\n## Key paths\n- DB: %APPDATA%\\com.alsko.nexus\\nexus.db\n- Secrets: OS keyring (nexus-pcc)\n\n## Dev\nnpm run tauri dev`,
  null,
  null
);

db.close();
console.log(`Test database created at: ${dbPath}`);
