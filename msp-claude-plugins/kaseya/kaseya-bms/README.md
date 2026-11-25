# Kaseya BMS Plugin

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install kaseya-bms@msp-claude-plugins
```

Claude Code skills for working with the Kaseya BMS PSA platform — tickets, accounts, contracts, time entries, and billing.

## Status

**Scaffolding** — skill content is in place; the matching MCP server (`kaseya-bms-mcp`) and SDK (`node-kaseya-bms`) are in development.

BMS is Kaseya's organic PSA, sharing Kaseya One auth with VSA and (partially) Autotask. Vorex is the legacy product being absorbed into BMS — this plugin targets BMS only.

## Capabilities (planned)

- Tickets: list, create, update, close, assign, time entries
- Accounts (clients): search, create, update, contacts
- Contracts: list, billing rules
- Time entries: log, approve, billable status
- Service items / catalog
- Knowledge base articles

## Authentication

BMS REST API v2 uses an API token issued from BMS Admin → Service Desk → API Tokens, plus a tenant subdomain. Kaseya One SSO is supported on unified-login tenants.

## Skills

- `api-patterns` — auth, pagination, error handling

## License

Apache-2.0
