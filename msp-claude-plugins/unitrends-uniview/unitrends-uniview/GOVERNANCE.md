# Unitrends UniView plugin — governance and safety model

Unofficial. Community-built plugin for the Unitrends UniView public API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches UniView through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which stores the org's
UniView Client ID and Client Secret. The UniView MCP server behind the gateway
exchanges them for a short-lived access token and caches it in memory.

- No UniView secret or token is stored on the technician's machine, in this
  repo, or in the model's context. The token is redacted from tool output.
- The org's UniView credential is stored once at the gateway, so replacing it
  is one edit rather than a change on every technician's machine. There is no
  rotate action: create a new credential in UniView (settings icon > API
  Access), re-submit the Conduit connect form, then revoke the old one.
- Every call carries operator identity, so the gateway audit log answers "who
  pulled this customer's backup history". UniView's own log records only the
  API credential.
- Complete offboarding in the gateway console, and confirm the person no
  longer has access before you treat it as done.

## Tool permission groups

Confirm the live permission grant in the gateway access editor before you rely
on a tier in this document.

| Group | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change UniView state. | `unitrends_uniview_customers_list`, `unitrends_uniview_appliances_list`, `unitrends_uniview_backups_list`, `unitrends_uniview_backupiq_alerts_list`, `unitrends_uniview_assets_list`, `unitrends_uniview_epb_assets_list`, `unitrends_uniview_spanning_domains_list`, `unitrends_uniview_spanning_domain_users_list`, `unitrends_uniview_spanning_domains_list_v1`, `unitrends_uniview_spanning_domain_users_list_v1`, `unitrends_uniview_entra_domains_list`, `unitrends_uniview_agent_latest_get` (12) |
| **Write** | *Empty.* | None. |
| **Delete** | *Empty.* | None. |
| **Admin** | *Empty.* No tool is admin-gated in Conduit. | None. |

**This plugin is read-only.** The UniView public API publishes only `GET`
operations. An agent cannot start, cancel or restore a backup, dismiss or mute a
BackupIQ alert, or change an appliance.

## Recommended agent policy

- All 12 tools: safe to allow for autonomous and scheduled agents.
- Restrict the two Spanning user tools
  (`unitrends_uniview_spanning_domain_users_list` and
  `unitrends_uniview_spanning_domain_users_list_v1`) if your agents post
  results into shared channels: they return end-user email addresses.

## What it cannot reach

- Only the UniView tenant that issued the credential. Inside that tenant the
  credential reads **every** customer, appliance, asset, backup and alert;
  UniView has no per-customer credential scoping. The gateway controls who in
  your organisation may use the credential and which tools they may call, not
  which customers come back.
- On-prem appliance APIs. Direct appliance work is the separate `unitrends`
  plugin.
- No filesystem, no shell, no other vendor's data.

## Data handling

- Responses pass through the gateway into model context for the session and
  are not persisted by this plugin.
- `unitrends_uniview_spanning_domain_users_list` and its `_v1` twin return
  Microsoft 365 and Google Workspace user email addresses and identifiers.
- The Spanning domain lists leave users out by default. Passing
  `include: {"users": "true"}` embeds every user of every domain, which is
  personal data and can be too large to return.
- Asset, appliance and backup records include hostnames, IP and MAC addresses.

## Known sharp edges

- **One credential, whole tenant.** A leaked UniView secret exposes every
  customer's backup estate. Revoke it in UniView first, then reconnect Conduit.
- **Undocumented rate limits.** A sweep across many customers can hit a 429.
  The error carries `Retry-After` when UniView sends it; wait that long.
- **Pages are not followed automatically.** A list tool returns one page. An
  agent that reads only page 1 will under-report failures.
