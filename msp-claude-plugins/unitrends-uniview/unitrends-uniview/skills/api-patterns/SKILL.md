---
name: "Unitrends UniView API Patterns"
description: >
  Unitrends UniView MCP fundamentals: the two Conduit credential headers and the
  OAuth2 client_credentials exchange behind them, the flat 12-tool read-only
  surface, the {data, paging} response shape, page_number/page_size paging and
  truncation, parameter validation (enums, UUIDs, ISO 8601, include objects),
  error and 429 handling, and which tools return personal data.
when_to_use: >-
  When connecting to Unitrends UniView, reading its paging or error output, or
  building any UniView query through Conduit. Use when: uniview api, uniview
  authentication, uniview client id, uniview pagination, uniview error,
  backup.net api, or unitrends uniview mcp.
---

# Unitrends UniView API Patterns

## Overview

UniView is Kaseya's multi-tenant Unitrends portal at `backup.net`. Its public
API is read-only, and one credential reads every customer in the MSP's UniView
tenant. The MCP server exposes the 12 published operations as 12 tools, all
`GET`, all listed flat in `tools/list`.

## Anti-triggers

- **A single on-prem Unitrends appliance** (appliance base URL, username and
  password): that is the separate `unitrends` plugin, not UniView.
- **Kaseya's other backup products** (Datto BCDR, Datto SaaS Protection): this
  plugin speaks only the UniView API.

## Connection & Authentication

Conduit stores the credential, entered in the Conduit web UI
(`/connect/unitrends-uniview`), and sends it on every call as two headers.
Nothing is set on the client, and Conduit drops any `X-Unitrends-UniView-*`
header a client sends:

| Header | Conduit field |
|--------|---------------|
| `X-Unitrends-UniView-Client-ID` | Client ID |
| `X-Unitrends-UniView-Client-Secret` | Client Secret |

Create the credential in the UniView portal under the settings icon > API
Access > + New. The secret is shown once; the credential can be revoked on the
same page.

The MCP server exchanges the pair for a bearer token (OAuth2
`client_credentials` against `login.backup.net`) and caches it until shortly
before it expires. On a 401 it drops the token and retries once with a fresh
one, so a 401 that reaches you means the credential itself was rejected or
revoked.

## Tool Surface

| Tool | Required args | Notes |
|------|---------------|-------|
| `unitrends_uniview_customers_list` | none | Start here: customer `id` (UUID) filters every other tool |
| `unitrends_uniview_appliances_list` | none | `is_online`, `total_mb_free_to`, `version`, `helix_status` |
| `unitrends_uniview_backups_list` | none | `status`, `replication_status`, `start_time_from`/`_to`, `complete_time_from`/`_to` |
| `unitrends_uniview_backupiq_alerts_list` | `type` | `type` is one of `alert`, `job`, `conditional`, `helix` |
| `unitrends_uniview_assets_list` | none | `include: {"backups": "last"}` adds each asset's last backup |
| `unitrends_uniview_epb_assets_list` | none | Endpoint Backup devices |
| `unitrends_uniview_spanning_domains_list` | none | Users left out unless `include: {"users": "true"}` |
| `unitrends_uniview_spanning_domain_users_list` | `domain_id` | Personal data |
| `unitrends_uniview_spanning_domains_list_v1` | none | Older shape; prefer the v2 tool |
| `unitrends_uniview_spanning_domain_users_list_v1` | `domain_id` | Older shape; personal data |
| `unitrends_uniview_entra_domains_list` | none | Entra tenants and mapped customer |
| `unitrends_uniview_agent_latest_get` | none | Not paged |

**Conduit gating:** all 12 are plain reads in Conduit. None is admin-gated and
none writes. Confirm the live grant in the Conduit access editor.

## Response Shape

Every tool returns:

```json
{
  "data": [ ... ],
  "paging": { "page_number": 1, "page_size": 50, "total_records": 312, "total_pages": 7 }
}
```

`data` is UniView's JSON unchanged (a bare array for list tools). `paging` comes
from UniView's `Paging-*` response headers and is absent when UniView sends
none.

## Pagination

- List tools take `page_number` (1-based, default 1) and `page_size` (default
  50, capped at 1000).
- The server never pages for you. Read `paging.total_pages` and request each
  page. Never call a count or a "no failures" result complete from page 1 alone.
- When a page exceeds the server's output cap, items are dropped from the end
  of `data` and the response adds `truncated: true`, `returned_items`,
  `total_items_in_page` and a `truncation_hint`. Repeat with a smaller
  `page_size`.
- Narrow with filters (`customer_id`, `status`, time windows) before raising
  `page_size`.

## Parameters

- Enums are checked before the request: `status` is `Successful`, `Warning`,
  `Failed`, `InProgress` or `Unknown`; `replication_status` is `Successful`,
  `Failed` or `Unknown`; `severity` is `alarm`, `critical` or `warning`. Case
  matters.
- `customer_id`, `asset_key` and `key` must be UUIDs. `asset_tag` is the
  appliance ID string, not a UUID.
- Time filters are ISO 8601, e.g. `2026-11-01T00:00:00Z`.
- `include` is an object, not a string: `{"backups": "last", "links": "all"}`.
- Storage filters and sizes are in MB.
- Arguments a tool does not declare are dropped.

## Error Handling

Vendor errors come back as tool errors with the HTTP status, a hint, UniView's
`title`/`detail`, and a `request_id` when UniView sends one.

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | A filter value UniView rejected | Check enum case, UUID and date formats |
| 401 | Credential rejected after a token refresh | Credential revoked or wrong; reconnect in Conduit |
| 403 | Credential not allowed to read this resource | Check the credential in UniView API Access |
| 404 | Unknown ID (for example a `domain_id`) | Re-list to get a current ID |
| 429 | Rate limited | Wait the `Retry-After` seconds in the message, then retry |

Quote the `request_id` when raising a ticket with Kaseya support.

## Gotchas

- **Rate limits are undocumented.** In a sweep across many customers, prefer
  one tenant-wide call with a filter (`status: "Failed"`) over one call per
  customer, and pause on a 429.
- **BackupIQ hides muted alerts by default.** `is_muted` defaults to `false`;
  pass `all` to include them.
- **The v1 Spanning tools are older shapes of the same data.** Use the v2 tools
  unless a field is missing there.
- **Only one host is documented** (`public-api.backup.net`). If a non-US tenant
  returns errors on every call, the region question is open with the vendor.

## Related Skills

- [backup-health-triage](../backup-health-triage/SKILL.md): the daily failure sweep
- [protection-coverage](../protection-coverage/SKILL.md): what each customer has protected
- [spanning-saas-backup](../spanning-saas-backup/SKILL.md): Microsoft 365 and Google Workspace backup
