# Nexus MCP Server

The Nexus MCP Server exposes your local project memory to AI coding tools — Claude Code, Codex, Cursor, and any other tool that supports the [Model Context Protocol](https://modelcontextprotocol.io/).

It is a standalone Node.js process that reads from the same SQLite database used by the Nexus desktop app, with **no write access** and **no exposure of secrets** (secrets are in the OS keyring, never in the database).

---

## Install

```bash
cd mcp-server
npm install
```

Requirements: Node.js 18 or later. `better-sqlite3` uses prebuilt native binaries (no Rust/Python build required on Node ≥18 with npm ≥7).

---

## Usage

```bash
# Auto-detect db path (see resolution order below)
node mcp-server/src/index.js

# Explicit db path
node mcp-server/src/index.js --db "C:\Users\you\AppData\Roaming\com.alsko.nexus\nexus.db"

# Via environment variable
NEXUS_DB="C:\path\to\nexus.db" node mcp-server/src/index.js
```

The server communicates over **stdio** (stdin/stdout). Logging goes to **stderr** only, so it never pollutes the MCP transport.

---

## Connecting to Claude Code

### Option 1 — `claude mcp add` command

```bash
claude mcp add nexus -- node C:\Projects\nexus\mcp-server\src\index.js
```

Pass a custom db path if needed:

```bash
claude mcp add nexus -- node C:\Projects\nexus\mcp-server\src\index.js --db "C:\Users\you\AppData\Roaming\com.alsko.nexus\nexus.db"
```

### Option 2 — `.mcp.json` in your project root

Create or extend `.mcp.json`:

```json
{
  "mcpServers": {
    "nexus": {
      "command": "node",
      "args": ["C:\\Projects\\nexus\\mcp-server\\src\\index.js"],
      "env": {}
    }
  }
}
```

With an explicit DB path:

```json
{
  "mcpServers": {
    "nexus": {
      "command": "node",
      "args": [
        "C:\\Projects\\nexus\\mcp-server\\src\\index.js",
        "--db",
        "C:\\Users\\you\\AppData\\Roaming\\com.alsko.nexus\\nexus.db"
      ]
    }
  }
}
```

### Option 3 — User-level `~/.claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "nexus": {
      "command": "node",
      "args": ["C:\\Projects\\nexus\\mcp-server\\src\\index.js"]
    }
  }
}
```

---

## MCP Tools

### `list_projects`

List all projects. No arguments.

**Returns**: JSON array of `{ id, name, description, repo_url, docs_url }`.

**Example prompt**: *"List my Nexus projects"*

---

### `get_project`

Get full details for a specific project.

**Arguments**:
| Field | Type | Description |
|-------|------|-------------|
| `idOrName` | string | Numeric project id or project name (case-insensitive) |

**Returns**: Full project row with all fields (no secrets — none are stored in the DB).

> **Lookup order**: if `idOrName` parses as an integer it is tried as a numeric id first; if no row is found (or the value is non-numeric) it falls back to a case-insensitive name match.

**Example prompt**: *"Show me the full config for the EFAD project"*

---

### `get_project_context`

The killer tool. Returns a clean markdown **context briefing** for an AI coding session, including:

- Project name and description
- All endpoints (API base, health, support, deploy, login, docs)
- Git info (provider, repo URL, project id)
- Authentication method
- Full `notes` field as **Project Notes / Memory**

**Arguments**:
| Field | Type | Description |
|-------|------|-------------|
| `idOrName` | string | Numeric project id or project name (case-insensitive) |

**Returns**: Markdown string — paste it into context or let Claude Code pull it automatically.

> **Lookup order**: same as `get_project` — integer input tries id first, then falls back to case-insensitive name match.

**Example prompt**: *"Load context for the EFAD project"*

---

### `search_projects`

Substring search across name, description, and notes.

**Arguments**:
| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Substring to match (case-insensitive) |

**Returns**: JSON array of matching projects with `id, name, description, repo_url, docs_url`.

**Example prompt**: *"Search my projects for anything related to authentication"*

---

## MCP Resources

The server also exposes two MCP resources (accessible via `resources/list` and `resources/read`):

| URI | MIME type | Description |
|-----|-----------|-------------|
| `nexus://projects` | `application/json` | Full project list |
| `nexus://projects/{id}/context` | `text/markdown` | Context briefing for project by numeric id |

---

## DB Path Resolution

The server resolves the database path in this order:

1. `--db <path>` CLI argument
2. `NEXUS_DB` environment variable
3. OS default paths (probed in order, first match wins):
   - **Windows**: `%APPDATA%\com.alsko.nexus\nexus.db` then `%LOCALAPPDATA%\com.alsko.nexus\nexus.db`
   - **macOS**: `~/Library/Application Support/com.alsko.nexus/nexus.db`
   - **Linux**: `$XDG_CONFIG_HOME/com.alsko.nexus/nexus.db` (falls back to `~/.config/com.alsko.nexus/nexus.db`)

If no path resolves to an existing file, the server prints a clear error to stderr listing all probed paths and exits with code 1.

---

## Security Notes

- **Read-only**: The database is opened with `{ readonly: true, fileMustExist: true }`. No writes are possible.
- **No secrets exposed**: All credentials (API tokens, passwords) live in the OS keyring (`nexus-pcc` service), never in the SQLite database. There is nothing sensitive to leak from the DB.
- **stdio transport**: The server communicates over stdio only — no network ports opened.
- **Local only**: The server is designed for local use. Do not expose it over a network without additional authentication.

---

## Development & Testing

```bash
# Create test database with two sample projects
cd mcp-server
node scripts/make-test-db.js

# Run smoke test (spawns server, drives full MCP handshake + all tools)
node scripts/smoke.js
```

The smoke test runs 23 assertions across initialize, tools/list, all four tools, and resources/list + resources/read. All must pass.
