# Nexus — Local-First Project Control Center

## Vision

Nexus is an open-source local-first hub for web developers and maintainers managing multiple AI-assisted projects. As AI enables a single developer to ship and maintain more applications, the main bottleneck becomes project context: monitoring, API tracking, repository activity, and task coordination. Nexus brings these signals into one workspace and gives maintainers a structured project memory that can be used by AI coding tools like Codex and Claude Code.

Desktop application for small IT teams (3–50 people) to manage multiple projects from one unified interface. Consolidates service health, support tickets, git activity, deployments, and documentation — eliminating the need to context-switch between GitLab, Jira, Grafana, cloud dashboards, and admin panels.

## Core Principles

**Local First**: All data stored on device. No mandatory cloud backend. Network calls only to integrate with external services (project APIs, GitHub, GitLab).

**Vendor Independent**: Plug in any backend via standardized HTTP endpoints. Not locked to one platform or vendor.

**Zero Trust Secrets**: API tokens, SSH keys, and credentials never leave the OS keyring. Not stored in SQLite, config files, or network traffic.

**Extensible**: Project API Standard allows custom endpoints for any git provider, monitoring system, or CI/CD platform.

## Entities

```
Workspace
  └── Projects (many)
        ├── Integrations (health, tickets, git, deploy, docs)
        ├── Status (health state, latency, error log)
        └── Activity (commits, MRs, deployments)
```

- **Workspace**: Single per device (future: multi-workspace + cloud sync)
- **Project**: Uniquely identified by name; configured once, polled automatically
- **Integration**: HTTP endpoint + auth method (none, static bearer token, login endpoint with auto-refreshed token)
- **Status**: Real-time health, tickets, git activity (refreshed on poll interval)

## MVP Scope

### Implemented
- **Project CRUD**: Create, read, update, delete projects with endpoint configuration
- **Health Polling**: Periodic HTTP checks to configured health endpoints; latency + status
- **Support Tickets**: Fetch from any support API (configurable endpoint, generic login adapter, custom credential payload)
- **Git Activity**: Recent commits, open MRs, failed pipelines (GitHub & GitLab adapters)
- **Settings**: Global poll interval, dark/light theme
- **Bundle Export/Import**: Encrypt project config + credentials with passphrase for handoff
- **Secrets Vault**: OS keyring integration; auto-save/load per project

### Post-MVP Roadmap
- Project Memory for AI Tools: Structured, machine-readable project context (architecture, conventions, integrations, runbooks, recent activity) exportable to AI coding tools like Codex and Claude Code
- AI Provider Usage: Connect one or more accounts (Anthropic/Claude, OpenAI/GPT, Google/Gemini) and show usage vs. limits per account, so the maintainer knows what's left
- Branding: Company logo + workspace name in settings
- Theming: Color scheme picker (light/dark + accent palettes)
- Internationalization: Multi-language UI (i18n)
- Workspaces: Multi-company/team profiles with cloud sync option
- Notifications: System tray alerts for critical status changes
- Deployment Center: View, trigger, rollback deployments per project
- Team Activity Feed: Timeline of commits, MRs, deployments, tickets across all projects
- Documentation Hub: Aggregate markdown docs, Swagger specs, runbooks
- AI Assistant: ChatGPT/Claude/local LLM integration for quick troubleshooting, runbook generation
- Cloud Sync: Optional shared workspaces, roles, audit logs, billing (for teams)
- GitHub Actions: Failed run detection + quick-fix suggestions
- Packaging: macOS (.dmg), Windows (.msi/.exe), Linux (.deb/.rpm)
- Auto-Updates: Built-in upgrade path

## Target Audience

**Primary**
- DevOps/SRE teams at small SaaS companies
- Managed IT Service Providers (MSPs) monitoring customer systems
- In-house tech teams at mid-market orgs (manufacturing, healthcare, retail)

**Secondary**
- Freelance consultants managing multiple client projects
- Startup CTOs monitoring internal infrastructure

**Anti-pattern**: Enterprise IT (100+ projects) — use dedicated monitoring/ticketing stack.

## Positioning

- **"All credentials stay on your device"** — no cloud requirement, no SaaS subscription
- **"No vendor lock-in"** — HTTP endpoints only; works with any git provider, monitoring tool, or CI/CD system
- **"Bring your own endpoints"** — custom Project API endpoints for internal tools
- **"One pane of glass"** — consolidate health, tickets, deployments in 60 seconds per project

## Success Metrics

- Time to add new project: < 2 min
- Health check latency: < 3 sec (avg)
- Ticket sync accuracy: 100% (no data loss)
- Git activity freshness: < 5 min (poll interval configurable)
- App startup time: < 2 sec
- Memory footprint: < 100 MB
- Battery impact: < 1% per hour (idle)
