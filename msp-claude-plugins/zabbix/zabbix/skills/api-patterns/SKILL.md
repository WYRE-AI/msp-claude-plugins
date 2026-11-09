---
name: "Zabbix API Patterns"
description: >
  Zabbix MCP fundamentals through Conduit: the X-Zabbix-Base-Url and
  X-Zabbix-Api-Token headers, version-dependent token auth, the read-only
  18-tool surface (one admin-gated tool, three opt-in tools Conduit does not
  list), the shared JSON-RPC get parameters (output, filter, search, tags,
  sortfield, limit), keyset paging by event ID or time range, the 500-row
  cap, output truncation and redaction, and the error types the sidecar
  returns.
when_to_use: >-
  When authenticating to or calling Zabbix through the MCP tools, shaping a
  get query, paging through results, or diagnosing a failed Zabbix request.
  Use when: zabbix api, zabbix token, zabbix connection, zabbix mcp, zabbix
  pagination, zabbix limit, zabbix error, zabbix permission error, or zabbix
  unexpected parameter.
---

# Zabbix MCP Tools & API Patterns

## Overview

Zabbix is self-hosted: every customer runs their own frontend, and the
Zabbix API is JSON-RPC at `<frontend>/api_jsonrpc.php`. The Zabbix MCP
server (`zabbix-mcp`, behind Conduit) exposes one read-only tool per
allowlisted `*.get` method. There are no write tools and no raw JSON-RPC
passthrough, because the same endpoint also serves every write method,
including `script.execute`. Problems are acknowledged, closed and suppressed
in the Zabbix frontend, never through this plugin.

Read this skill first; the other Zabbix skills assume these patterns.

## Connection & Authentication

Conduit stores two fields per connection and forwards them as headers:

| Conduit field | Header | `.mcp.json` variable |
|---------------|--------|----------------------|
| Zabbix frontend URL | `X-Zabbix-Base-Url` | `ZABBIX_BASE_URL` |
| API token | `X-Zabbix-Api-Token` | `ZABBIX_API_TOKEN` |

- The frontend URL is the address users open Zabbix at (for example
  `https://zabbix.acme.com/zabbix`), https only, no query string. Private,
  loopback and metadata addresses are refused; an on-prem frontend needs
  Conduit's egress IP allowlisted or a Conduit tunnel.
- The token is created in the frontend under **Users > API tokens** and is
  64 letters and digits. It should belong to a dedicated user whose role can
  only read the customer's host groups. **Never a Super admin token**: Super
  admin can run `script.execute` on every monitored agent.
- The sidecar calls `apiinfo.version` (no credentials) and caches it for 10
  minutes. Zabbix 6.4+ gets `Authorization: Bearer`; 6.0 and 6.2 get the
  JSON-RPC body `auth` property. You never choose this.
- `zabbix_api_version` is the connection test. It works even with a bad
  token, so a successful version call proves only that the URL is right.
  Follow it with a small `zabbix_hostgroups_list` call to prove the token.

## Tool Surface

All tools are read tier. Conduit lists 18:

- **Scoping**: `zabbix_hostgroups_list`, `zabbix_hosts_list`
- **Problems and history**: `zabbix_problems_list`, `zabbix_events_list`,
  `zabbix_triggers_list`, `zabbix_alerts_list`, `zabbix_maintenance_list`
- **Coverage and collectors**: `zabbix_templates_list`, `zabbix_proxies_list`,
  `zabbix_proxy_groups_list`, `zabbix_web_scenarios_list`
- **Services and SLAs**: `zabbix_services_list`, `zabbix_slas_list`,
  `zabbix_sla_sli_get`, `zabbix_trends_get`
- **Other**: `zabbix_api_version`, `zabbix_dashboards_list`,
  `zabbix_auditlog_list`

### Admin-gated in Conduit

`zabbix_auditlog_list` is the only admin-gated tool: Conduit lets only
members with the `admin` permission tier call it. Zabbix additionally allows
`auditlog.get` only for Super admin tokens, so with the recommended
read-only token it fails with a permission error for everyone. Do not plan
a workflow around it.

### Opt-in tools Conduit does not list

`zabbix_items_list`, `zabbix_history_get` and `zabbix_host_interfaces_list`
exist in the sidecar but are listed only when it runs with
`ZABBIX_ENABLE_SENSITIVE_TOOLS=1`, which Conduit's deployment does not set.
If they are absent from the tool list, that is expected. Use triggers and
problems for "what is wrong" and `zabbix_trends_get` (with item IDs from a
trigger or the frontend) for numeric history.

## Shared Get Parameters

Most list tools share the standard Zabbix `get` parameters:

| Parameter | Use |
|-----------|-----|
| `output` | `"extend"` or an array of property names. Ask for only what you need; it keeps responses under the size cap. |
| `countOutput` | `true` returns a count instead of objects. Use it to size a query before pulling rows. |
| `limit` | 1-500, default 100 on paged tools. Larger values are capped at 500, silently. |
| `sortfield` / `sortorder` | Sort field from the tool's allowed list; `ASC` or `DESC`. |
| `filter` | Exact match, e.g. `{"status": 0}` or `{"value": 1}`. |
| `search` | Case-insensitive substring, e.g. `{"name": "web"}`. Pair with `searchWildcardsEnabled`, `startSearch`, `searchByAny`, `excludeSearch`. |
| `tags` / `evaltype` | Tag filters, e.g. `[{"tag":"customer","value":"contoso","operator":1}]`. Operators: 0 contains, 1 equals, 2 does not contain, 3 does not equal, 4 exists, 5 does not exist. |
| `select*` | Include related objects, e.g. `selectHostGroups: ["name"]`, `selectTags: "extend"`. |

Input rules the sidecar enforces before calling Zabbix:

- IDs are digit strings (`"10084"`), at most 500 per array.
- Time parameters accept Unix seconds or ISO 8601 (`2026-11-01T00:00:00Z`).
- Severities are integers: 0 not classified, 1 information, 2 warning,
  3 average, 4 high, 5 disaster.
- Unknown arguments are dropped, not sent.
- "Flag" parameters such as `monitored_hosts`, `only_true` and
  `skipDependent` are sent only when `true`. Passing `false` is the same as
  leaving them out.

## Paging

Zabbix has no offset paging and the sidecar never pages for you.

- **Problems and events**: sort by `eventid` `DESC`, then pass the lowest
  event ID you received minus one as `eventid_till` for the next page.
  (`eventid_from` walks forward.)
- **Alerts, trends, audit log**: page by time with `time_from` / `time_till`.
- **Hosts, triggers, templates and the rest**: there is no cursor. Use
  `countOutput` first; if the count is over 500, narrow by `groupids`,
  `hostids`, `tags` or `search` instead of trying to page.

Never report a list as complete when it came back with exactly `limit` rows.

## Output Size and Redaction

- Tool output is capped (60,000 characters by default). Overflow ends with
  `[truncated: N more characters omitted ...]`. If you see it, the answer is
  incomplete: narrow `output`, `limit`, or the time range and query again.
- String values under secret-looking keys (password, passphrase, community,
  psk, token, authorization) come back as `[REDACTED]`. That is the sidecar,
  not missing data.
- The sidecar never requests `selectMacros`, `selectItems` on hosts and
  templates, `selectMediatypes`, `selectUsers` or `selectPreprocessing`;
  those parameters do not exist on these tools.

## Errors

Errors come back as tool results starting with `Error:`.

| Error | Cause | Action |
|-------|-------|--------|
| Argument error (`"hostids[0]" must be a numeric Zabbix ID`, `"sortfield" must be one of ...`) | Bad input, caught before Zabbix is called | Fix the argument; nothing reached the customer's server |
| Auth error | Token missing, malformed, expired, disabled, or rejected | Reconnect Zabbix in Conduit with a valid token |
| Zabbix JSON-RPC error `-32602` (invalid params) | Often an 8.0 parameter name on an older frontend, e.g. `selectHostGroups` on 6.0 | Check `zabbix_api_version`; drop or rename the parameter |
| Zabbix JSON-RPC error `-32500` (application error), "no permissions" | The token's role cannot read that object type or host group | Expected for `zabbix_auditlog_list`; otherwise the role needs read access to that group |
| Unsafe base URL | Frontend URL is http, private, a placeholder, or redirects | Fix the URL in Conduit or route it through a tunnel |
| Timeout / unreachable | Frontend down, or firewall blocks Conduit | Check the frontend is up and Conduit's egress IP is allowed |

## Rate Limits

Zabbix has no API rate limiting. Every call runs directly against the
customer's Zabbix database, so an unscoped `zabbix_events_list` over months
can hurt a small instance. Always scope by host group and time range, prefer
`countOutput` for counts, and do not fan out hundreds of per-host calls when
one call with `hostids` (up to 500) will do.

## Related Skills

- [problem-triage](../problem-triage/SKILL.md) - NOC triage of open problems
- [monitoring-coverage](../monitoring-coverage/SKILL.md) - Hosts, templates, proxies, maintenance
- [sla-reporting](../sla-reporting/SKILL.md) - Services, SLAs, SLI and trends
