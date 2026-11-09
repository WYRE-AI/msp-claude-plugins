# Datto SaaS Protection Plugin

Claude Code skills for working with Datto SaaS Protection (formerly Backupify) — cloud-to-cloud backup for Microsoft 365 and Google Workspace.

## Connection

The plugin reaches Datto SaaS Protection through [Conduit](https://conduit.wyre.ai) (vendor slug `datto-saas-protection`), which runs the `datto-saas-protection-mcp` sidecar. This plugin does not ship its own `.mcp.json`: install the `wyre-gateway` plugin (or any workflow pack) to connect Claude Code to `https://conduit.wyre.ai/v1/mcp`, then connect Datto SaaS Protection in the Conduit web UI with the public/secret API key pair from the Datto Partner Portal.

## Tools

| Tool | Tier | Purpose |
|------|------|---------|
| `datto_saas_list_domains` | read | Customers / M365 tenants / Google domains, with the IDs every other tool needs |
| `datto_saas_list_seats` | read | Seats per customer, filterable by type and state |
| `datto_saas_get_seat` | read | One seat by email, site URL or remote ID |
| `datto_saas_list_applications` | read | Backup history per application (Exchange, OneDrive, SharePoint, Teams, Gmail, Drive) |
| `datto_saas_get_backup_stats` | read | Detailed per-service backup statistics |
| `datto_saas_bulk_seat_change` | write | License, Pause or Unlicense up to 100 seats (confirm-gated) |

There is no restore or activity-log tool; restores are started in the SaaS Protection portal.

## Skills

- `api-patterns` — auth, tools, object model, bulk seat change, errors
- `seat-coverage` — unprotected/paused seat sweep and backup-health review

See `GOVERNANCE.md` for the permission tiers.

## License

Apache-2.0
