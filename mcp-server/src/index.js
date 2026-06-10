#!/usr/bin/env node
/**
 * Nexus MCP Server
 *
 * Exposes Nexus project memory to AI coding tools (Claude Code, Codex, Cursor)
 * via the Model Context Protocol over stdio.
 *
 * Read-only access to nexus.db — no secrets are stored in the database.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { argv, env, stderr, platform } from 'process';

// ---------------------------------------------------------------------------
// DB path resolution
// ---------------------------------------------------------------------------

function resolveDbPath() {
  // 1. CLI arg: --db <path>
  const dbArgIdx = argv.indexOf('--db');
  if (dbArgIdx !== -1 && argv[dbArgIdx + 1]) {
    return argv[dbArgIdx + 1];
  }

  // 2. NEXUS_DB env var
  if (env.NEXUS_DB) {
    return env.NEXUS_DB;
  }

  // 3. Probe OS defaults
  const appId = 'com.alsko.nexus';
  const candidates = [];

  if (platform === 'win32') {
    if (env.APPDATA) candidates.push(join(env.APPDATA, appId, 'nexus.db'));
    if (env.LOCALAPPDATA) candidates.push(join(env.LOCALAPPDATA, appId, 'nexus.db'));
  } else if (platform === 'darwin') {
    candidates.push(join(homedir(), 'Library', 'Application Support', appId, 'nexus.db'));
  } else {
    // Linux / others
    const configHome = env.XDG_CONFIG_HOME || join(homedir(), '.config');
    candidates.push(join(configHome, appId, 'nexus.db'));
  }

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }

  stderr.write(
    '[nexus-mcp] ERROR: Could not find nexus.db. Probed paths:\n' +
    candidates.map((p) => `  - ${p}`).join('\n') +
    '\nUse --db <path> or set NEXUS_DB env var.\n'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Open DB (read-only)
// ---------------------------------------------------------------------------

const dbPath = resolveDbPath();
stderr.write(`[nexus-mcp] Opening database: ${dbPath}\n`);

let db;
try {
  db = new Database(dbPath, { readonly: true, fileMustExist: true });
} catch (err) {
  stderr.write(`[nexus-mcp] ERROR: Failed to open database at ${dbPath}: ${err.message}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helper: look up a project by integer id or by name (case-insensitive)
// ---------------------------------------------------------------------------

function findProject(idOrName) {
  const asInt = parseInt(idOrName, 10);
  if (!isNaN(asInt)) {
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(asInt);
    if (row) return row;
  }
  // Fall through to name match even if numeric (handles names like "42")
  return db.prepare('SELECT * FROM projects WHERE lower(name) = lower(?)').get(idOrName);
}

// ---------------------------------------------------------------------------
// Helper: build a markdown context briefing for an AI coding agent
// ---------------------------------------------------------------------------

function buildContextBriefing(p) {
  const lines = [];
  lines.push(`# Project Context: ${p.name}`);
  lines.push('');

  if (p.description) {
    lines.push('## Description');
    lines.push(p.description.trim());
    lines.push('');
  }

  // Endpoints
  const endpoints = [
    ['API Base URL', p.api_base_url],
    ['Health Endpoint', p.health_endpoint],
    ['Support Endpoint', p.support_endpoint],
    ['Deploy Endpoint', p.deploy_endpoint],
    ['Login Endpoint', p.login_endpoint],
    ['Docs URL', p.docs_url],
  ].filter(([, v]) => v);

  if (endpoints.length > 0) {
    lines.push('## Endpoints');
    for (const [label, value] of endpoints) {
      lines.push(`- **${label}**: ${value}`);
    }
    lines.push('');
  }

  // Git
  const gitFields = [
    ['Provider', p.git_provider],
    ['Repository URL', p.repo_url],
    ['Project ID', p.git_project_id],
  ].filter(([, v]) => v);

  if (gitFields.length > 0) {
    lines.push('## Git');
    for (const [label, value] of gitFields) {
      lines.push(`- **${label}**: ${value}`);
    }
    lines.push('');
  }

  // Auth method
  if (p.auth_method) {
    lines.push('## Authentication');
    lines.push(`- **Method**: ${p.auth_method}`);
    lines.push('');
  }

  // Notes (the "project memory" — the killer field)
  if (p.notes && p.notes.trim()) {
    lines.push('## Project Notes / Memory');
    lines.push(p.notes.trim());
    lines.push('');
  }

  // Timestamps
  lines.push('---');
  lines.push(`*Created: ${p.created_at} | Updated: ${p.updated_at}*`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------

const server = new McpServer(
  { name: 'nexus', version: '0.1.0' },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ---------------------------------------------------------------------------
// Tool: list_projects
// ---------------------------------------------------------------------------

server.registerTool(
  'list_projects',
  {
    description: 'List all projects stored in Nexus. Returns id, name, description, repo_url, and docs_url for each.',
  },
  () => {
    const rows = db
      .prepare('SELECT id, name, description, repo_url, docs_url FROM projects ORDER BY name')
      .all();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(rows, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: get_project
// ---------------------------------------------------------------------------

server.registerTool(
  'get_project',
  {
    description: 'Get full details for a project by numeric id or name. Returns all fields (no secrets are stored in the database).',
    inputSchema: z.object({
      idOrName: z.string().describe('Numeric project id or project name (case-insensitive)'),
    }),
  },
  ({ idOrName }) => {
    const project = findProject(idOrName);
    if (!project) {
      return {
        content: [
          {
            type: 'text',
            text: `Project not found: "${idOrName}". Use list_projects to see available projects.`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(project, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: get_project_context
// ---------------------------------------------------------------------------

server.registerTool(
  'get_project_context',
  {
    description:
      'Get a structured markdown context briefing for a project — ideal for priming an AI coding session. ' +
      'Includes description, all endpoints, git info, auth method, and the full project notes/memory.',
    inputSchema: z.object({
      idOrName: z.string().describe('Numeric project id or project name (case-insensitive)'),
    }),
  },
  ({ idOrName }) => {
    const project = findProject(idOrName);
    if (!project) {
      return {
        content: [
          {
            type: 'text',
            text: `Project not found: "${idOrName}". Use list_projects to see available projects.`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: buildContextBriefing(project),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: search_projects
// ---------------------------------------------------------------------------

server.registerTool(
  'search_projects',
  {
    description: 'Search projects by substring across name, description, and notes. Returns matching projects with id, name, description, repo_url, docs_url.',
    inputSchema: z.object({
      query: z.string().describe('Substring to search for (case-insensitive) in project name, description, and notes'),
    }),
  },
  ({ query }) => {
    const like = `%${query}%`;
    const rows = db
      .prepare(
        `SELECT id, name, description, repo_url, docs_url
         FROM projects
         WHERE lower(name) LIKE lower(?)
            OR lower(description) LIKE lower(?)
            OR lower(notes) LIKE lower(?)
         ORDER BY name`
      )
      .all(like, like, like);
    return {
      content: [
        {
          type: 'text',
          text: rows.length === 0
            ? `No projects found matching "${query}".`
            : JSON.stringify(rows, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Resources: nexus://projects (list) + nexus://projects/{id}/context
// ---------------------------------------------------------------------------

// Static resource: project list
server.registerResource(
  'nexus-projects-list',
  'nexus://projects',
  {
    title: 'Nexus Projects',
    description: 'List of all projects in the Nexus local database',
    mimeType: 'application/json',
  },
  () => {
    const rows = db
      .prepare('SELECT id, name, description, repo_url, docs_url FROM projects ORDER BY name')
      .all();
    return {
      contents: [
        {
          uri: 'nexus://projects',
          mimeType: 'application/json',
          text: JSON.stringify(rows, null, 2),
        },
      ],
    };
  }
);

// Dynamic resource template: per-project context briefing
server.registerResource(
  'nexus-project-context',
  new ResourceTemplate('nexus://projects/{id}/context', { list: undefined }),
  {
    title: 'Nexus Project Context',
    description: 'Markdown context briefing for a specific project (by numeric id)',
    mimeType: 'text/markdown',
  },
  (uri, { id }) => {
    const project = findProject(String(id));
    if (!project) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/plain',
            text: `Project not found: id=${id}`,
          },
        ],
      };
    }
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: buildContextBriefing(project),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
stderr.write('[nexus-mcp] Server running on stdio. Waiting for MCP client...\n');
