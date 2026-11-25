# Kaseya VSA Plugin

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install kaseya-vsa@msp-claude-plugins
```

Claude Code skills for working with the Kaseya VSA (and VSA 10 / VSA X) RMM platform.

## Status

**Scaffolding** — skill content is in place; the matching MCP server (`kaseya-vsa-mcp`) and SDK (`node-kaseya-vsa`) are in development. Until those ship, these skills act as reference documentation for the API and as a placeholder in the plugin marketplace.

## Capabilities (planned)

- Endpoint inventory: agents, organizations, machine groups
- Patch management: scan, deploy, schedule, rollback
- Agent procedures (scripts): list, run, schedule, view status
- Live Connect / remote control session orchestration
- Audit data: hardware, software, OS, disk, network adapter inventories
- Tickets (when VSA Service Desk is enabled)
- Monitoring: alerts, monitor sets, log monitors

## Authentication

Kaseya VSA uses an API key per user, with optional Kaseya One SSO bearer tokens for unified-login deployments. See `skills/api-patterns/SKILL.md` for the full auth flow.

## Skills

- `api-patterns` — auth, pagination, rate limits, error handling

Domain skills (agents, patches, procedures, etc.) will be added alongside the MCP server build-out.

## License

Apache-2.0
