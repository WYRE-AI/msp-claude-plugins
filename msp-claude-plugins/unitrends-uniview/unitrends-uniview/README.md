# Unitrends UniView Plugin

Claude plugin for **Unitrends UniView**, the Kaseya multi-tenant backup portal at
`backup.net`, through the Conduit gateway. Backed by
[`WYRE-AI/unitrends-uniview-mcp`](https://github.com/WYRE-AI/unitrends-uniview-mcp):
12 read-only tools over the UniView public API.

One UniView API credential gives an MSP a cross-customer view of backup jobs and
replication, BackupIQ alerts, appliance health and storage, protected assets,
Endpoint Backup devices, Spanning SaaS backup tenants, and Entra ID tenants.

**This plugin is read-only.** The UniView public API has no write operations.
Nothing here can start a backup, restore data, dismiss or mute an alert, or change
an appliance.

## UniView or Unitrends?

There are two Unitrends plugins, and they talk to different products:

| Plugin | Product | How it connects |
|---|---|---|
| `unitrends-uniview` (this one) | The UniView cloud portal at `backup.net`, one credential for every customer | Conduit connector **Unitrends UniView**, OAuth2 Client ID + Client Secret |
| `unitrends` ([README](../../kaseya/unitrends/README.md)) | A single on-prem Unitrends appliance | Its own appliance base URL and login |

If the MSP manages its Unitrends estate in UniView, use this plugin. Use the
`unitrends` plugin only for direct appliance work.

## What It Does

- **Backup health triage**: failed and warning backups, failed replication,
  offline appliances, and low appliance storage across every customer.
- **BackupIQ alerts**: the open alert queue by severity, customer and appliance.
- **Protection coverage**: protected assets with their last backup, Endpoint Backup
  devices, and Spanning and Entra tenants mapped to customers.
- **Spanning SaaS backup**: Microsoft 365 and Google Workspace domains, license
  usage, expiration, and per-user backup status.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install unitrends-uniview
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at
`https://conduit.wyre.ai/v1/unitrends-uniview/mcp`.

## Connect in Conduit

1. In the UniView portal, open the **settings icon > API Access > + New**.
2. Copy the **Client ID** and the **Client Secret**. The secret is shown only once.
   You can revoke the credential on the same page.
3. In Conduit, connect **Unitrends UniView** and enter the Client ID and Client
   Secret. Conduit checks the pair against UniView's token endpoint before saving it.

This is the UniView cloud portal at `backup.net`, not an on-prem Unitrends
appliance. Use the Unitrends connector for an appliance.

One credential reads the **whole UniView tenant** that issued it: every customer,
appliance, asset, backup and alert. UniView has no way to limit a credential to one
customer, so treat the secret as a tenant-wide read key.

The Unitrends UniView connector may still be hidden in the Conduit catalog while it
completes staging validation. If you cannot find it, ask your Conduit administrator.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `UNITRENDS_UNIVIEW_CLIENT_ID` | Yes | UniView API Client ID (sent as `X-Unitrends-UniView-Client-ID`) |
| `UNITRENDS_UNIVIEW_CLIENT_SECRET` | Yes | UniView API Client Secret (sent as `X-Unitrends-UniView-Client-Secret`) |

## Skills

- `api-patterns`: Conduit headers, the OAuth exchange, response shape, pagination,
  truncation, errors and rate limits.
- `backup-health-triage`: the daily cross-customer sweep of failed backups, failed
  replication, BackupIQ alerts, offline appliances and low storage.
- `protection-coverage`: which assets, endpoints and SaaS tenants a customer has
  protected, and when each was last backed up.
- `spanning-saas-backup`: Spanning Microsoft 365 and Google Workspace domains, license
  usage, expiration and per-user backup status.

## Agents

- `backup-health-reviewer`: runs the full cross-customer backup health sweep and
  writes a prioritized triage report.

## Tools

All 12 tools are `GET` requests against UniView and are plain reads in Conduit.
**None is admin-gated in Conduit**, and none writes. Confirm the live grant in the
Conduit access editor.

| Tool | What it returns |
|---|---|
| `unitrends_uniview_customers_list` | Customers visible to the credential (ID, name) |
| `unitrends_uniview_appliances_list` | Appliances: online state, version, storage size and free space (MB), Helix status |
| `unitrends_uniview_backups_list` | Backup jobs: status, replication status, start and completion time, size |
| `unitrends_uniview_backupiq_alerts_list` | BackupIQ alerts (`type` is required) |
| `unitrends_uniview_assets_list` | Protected assets, optionally with their last backup |
| `unitrends_uniview_epb_assets_list` | Endpoint Backup devices: license type, storage used, status, OS |
| `unitrends_uniview_spanning_domains_list` | Spanning Microsoft 365 and Google Workspace domains |
| `unitrends_uniview_spanning_domain_users_list` | Users of one Spanning domain with last backup status (**personal data**) |
| `unitrends_uniview_spanning_domains_list_v1` | Older v1 shape of the Spanning domain list |
| `unitrends_uniview_spanning_domain_users_list_v1` | Older v1 shape of the Spanning user list (**personal data**) |
| `unitrends_uniview_entra_domains_list` | Entra ID tenants protected through UniView and their mapped customer |
| `unitrends_uniview_agent_latest_get` | Latest Unitrends backup agent package: version, download link, checksum |

## Limitations

- Read-only. Acting on a finding (rerunning a job, freeing storage, dismissing an
  alert) happens in UniView or on the appliance.
- UniView documents no rate limits and no token lifetime. A 429 is reported with its
  `Retry-After` value.
- The API documents one host, `https://public-api.backup.net`. Whether non-US UniView
  tenants use another host is not documented.
- The Spanning user tools return Microsoft 365 and Google Workspace email addresses.

See [GOVERNANCE.md](GOVERNANCE.md) for the safety model.

## License

Apache-2.0
