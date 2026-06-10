# Nexus

**Open-source, local-first hub for web developers and maintainers managing multiple AI-assisted projects.**

As AI enables a single developer to ship and maintain more applications, the main bottleneck becomes project context: monitoring, API tracking, repository activity, and task coordination. Nexus brings these signals into one workspace and gives maintainers a structured project memory that can be used by AI coding tools like Codex and Claude Code.

## Key Principles

- **Local first** — all data stays on your device. No cloud backend, no SaaS subscription.
- **Zero-trust secrets** — credentials live only in the OS keyring (DPAPI / Keychain / Secret Service), never in the database or config files.
- **Vendor independent** — plug in any backend via plain HTTP endpoints; works with GitHub and GitLab.

## Features

- **Project dashboard** — health checks with latency, status across all your projects at a glance
- **Support tickets** — pull tickets from any support API (configurable endpoint + flexible login: static bearer token or login endpoint with auto-refreshed token and custom credential payload)
- **Git activity** — recent commits, open MRs/PRs, failed pipelines (GitHub & GitLab)
- **Encrypted bundles** — export/import project config + credentials as an AES-256-GCM encrypted file (Argon2id key derivation) for handoff between machines
- **Auto-polling** — configurable refresh interval, no webhooks required

## Tech Stack

Tauri 2 · React 19 · TypeScript · Vite · SQLite · Rust (reqwest + rustls, keyring, aes-gcm, argon2)

Cross-platform: Windows, macOS, Linux.

## Development

```bash
# Prerequisites: Node.js 20+, Rust toolchain (rustup)
npm install

# Dev server with hot reload
npm run tauri dev

# Type check + production frontend build
npm run build

# Native installers (.exe/.msi, .app/.dmg, .deb/.AppImage)
npm run tauri build
```

## Documentation

- [PROJECT.md](PROJECT.md) — vision, scope, roadmap
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — technical architecture, DB schema, security model

## License

TBD
