# Spanning Plugin

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install spanning@msp-claude-plugins
```

Claude Code skills for working with Spanning Cloud Backup — SaaS backup for Microsoft 365, Google Workspace, and Salesforce.

## Status

**Scaffolding** — skill content is in place; the matching MCP server (`spanning-mcp`) and SDK (`node-spanning`) are in development.

Note: Spanning and Datto SaaS Protection share marketing branding under Kaseya but are distinct products with separate APIs and customer bases. This plugin targets Spanning specifically.

## Capabilities (planned)

- User backup status: per-user, per-platform
- License management: assign, unassign, archive
- Backup runs: history, success/failure, errors
- Restore operations: queue, monitor, complete
- Audit log: admin actions, restore actions
- Cross-tenant reporting (M365 + GWS + Salesforce in one view)

## Authentication

Spanning uses an admin email + API token issued from the Spanning admin console. See `skills/api-patterns/SKILL.md`.

## Skills

- `api-patterns` — auth, pagination, error handling

## License

Apache-2.0
