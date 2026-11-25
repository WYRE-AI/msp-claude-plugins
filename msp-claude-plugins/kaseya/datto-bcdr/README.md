# Datto BCDR Plugin

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install datto-bcdr@msp-claude-plugins
```

Claude Code skills for working with the Datto BCDR (Backup, Continuity, Disaster Recovery) platform — SIRIS, Alto, and the Datto Backup Portal API.

## Status

**Scaffolding** — skill content is in place; the matching MCP server (`datto-bcdr-mcp`) and SDK (`node-datto-bcdr`) are in development.

## Capabilities (planned)

- Backup status: agents, schedules, last successful backup
- Screenshot verification: list & retrieve hourly verification screenshots
- Recovery points: list, mount, file-level recovery
- Virtualization: local virtualization status, off-site VM start
- Off-site sync: status, queue depth, last sync time
- Alerts & escalations from the Backup Portal
- Device inventory: SIRIS / Alto appliance fleet view

## Authentication

Datto BCDR uses a public/private key pair issued from the Datto Partner Portal (`portal.dattobackup.com`). Each request signs a timestamp + body with HMAC-SHA256. See `skills/api-patterns/SKILL.md`.

## Skills

- `api-patterns` — HMAC auth, pagination, error handling

## License

Apache-2.0
