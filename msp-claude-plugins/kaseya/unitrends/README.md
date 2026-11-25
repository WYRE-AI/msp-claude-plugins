# Unitrends Plugin

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install unitrends@msp-claude-plugins
```

Claude Code skills for working with Unitrends Backup appliances and Unitrends MSP — backup jobs, recovery points, replication, and alerts.

## Status

**Scaffolding** — skill content is in place; the matching MCP server (`unitrends-mcp`) and SDK (`node-unitrends`) are in development.

## Capabilities (planned)

- Appliances: list managed Unitrends appliances
- Backup jobs: list, status, schedules, last run
- Assets (clients): protected machines, agent state
- Recovery points: list, mount, restore
- Replication / hot copy targets: status, queue
- Alerts: open and historical
- Reports: success rates, RPO/RTO compliance

## Authentication

Unitrends uses session-based auth: `POST /api/login` with username + password returns a token, sent as `Authorization: Bearer <token>` on subsequent calls. Tokens expire after 60 minutes idle.

## Skills

- `api-patterns` — auth, pagination, error handling

## License

Apache-2.0
