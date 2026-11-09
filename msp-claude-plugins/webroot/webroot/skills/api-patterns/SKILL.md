---
name: "Webroot API Patterns"
description: >
  Webroot Unity API fundamentals through Conduit: the five X-Webroot-* headers
  and the console-user password grant behind them, the GSM key bound to the
  connection, the 25 read-only tools and which four Conduit admin-gates, the
  three paging styles (PageNr/TotalAvailable, PageNr/MoreAvailable,
  ContinuationToken), siteId vs. site keycode, date-range defaults, error
  statuses, and response size limits.
when_to_use: >-
  When connecting to Webroot through Conduit, paging a Webroot list, or
  diagnosing a failed Webroot tool call. Use when: webroot api, webroot
  authentication, webroot 401, webroot 403, webroot pagination, gsm key,
  site keycode, unity api, or webroot connection test.
---

# Webroot API Patterns

## Overview

The Webroot MCP server is a read-only view of one MSP's **GSM console** (Global Site
Manager) through the Webroot Unity API. The hierarchy is GSM console > sites (one per
customer) > groups > endpoints. Every tool is a `GET`; nothing can issue agent
commands or change configuration.

## Authentication through Conduit

Conduit stores the credential once and sends five headers on every call:

| Header | Conduit field |
|---|---|
| `X-Webroot-Client-Id` | API client ID |
| `X-Webroot-Client-Secret` | API client secret |
| `X-Webroot-Username` | Console username (email) |
| `X-Webroot-Password` | Console password |
| `X-Webroot-Gsm-Key` | GSM key (parent keycode) |

The server exchanges these for a short-lived Unity API token (about five minutes) and
refreshes it itself. A `401` from Webroot gets one fresh token and one retry, so a
`401` that reaches you means the credential itself is wrong or the console user was
disabled or had its password changed.

The API acts **as the console user**. That user's role and site permissions decide what
comes back: a site the user cannot see is simply missing from `webroot_sites_list`, not
an error.

The GSM key is never a tool argument. It is bound to the connection, so one Conduit
connection always reads one GSM console.

## Connection test

- `webroot_health_ping`: is the Unity API reachable? Uses no credentials, so it proves
  nothing about the connection.
- `webroot_console_get`: the real authenticated test. Returns the console name, license
  type, seats allowed, site counts and end date.

## Tool surface and Conduit access groups

All 25 tools are read-only. Conduit puts 21 in its **Read** group and 4 in its **Admin**
group. A user granted only Read on the Webroot connection cannot call the Admin tools;
confirm the live grant in Conduit's access editor.

| Conduit group | Tools |
|---|---|
| Read | `webroot_health_ping`, `webroot_console_get`, `webroot_statistics_console_get`, `webroot_sites_list`, `webroot_sites_get`, `webroot_sites_lookup`, `webroot_statistics_site_get`, `webroot_endpoints_list`, `webroot_endpoints_get`, `webroot_groups_list`, `webroot_groups_list_endpoints`, `webroot_policies_list`, `webroot_policies_list_site`, `webroot_threats_list_site`, `webroot_threats_list_endpoint`, `webroot_blockedurls_list`, `webroot_dnsp_traffic_summary`, `webroot_dnsp_blocked_list`, `webroot_agent_status_gsm`, `webroot_agent_status_site`, `webroot_usage_sites_report` |
| **Admin** | `webroot_commands_list_site`, `webroot_commands_list_endpoint` (agent command audit history), `webroot_admins_list`, `webroot_admins_list_site` (admin names, emails, phone numbers) |

If an Admin tool is refused, say the user needs Admin access to Webroot in Conduit.
Do not retry or work around it.

## Identifiers

| You have | You need | Tool |
|---|---|---|
| A customer name | `siteId` | `webroot_sites_list` (not paginated; returns every site) |
| A site keycode (from an agent, an installer or an invoice) | `siteId` | `webroot_sites_lookup` |
| A `siteId` | The site keycode | `webroot_sites_get` (the `AccountKeyCode` field) |
| A hostname | `endpointId` | `webroot_endpoints_list` with `hostName` |
| A group name | `groupId` | `webroot_groups_list` |

Two tools take the **site keycode**, not the `siteId`: `webroot_agent_status_site` and
`webroot_sites_lookup`. Everything else per-site takes the `siteId` GUID.

## Pagination

Three styles, depending on the tool. Each call makes one request; page until done
before saying something does not exist.

| Style | Tools | How to continue |
|---|---|---|
| `PageNr` + `TotalAvailable` | `webroot_endpoints_list`, `webroot_groups_list_endpoints`, `webroot_commands_list_site`, `webroot_commands_list_endpoint` | Request `pageNr` + 1 until you have `TotalAvailable` records |
| `PageNr` + `MoreAvailable` | `webroot_threats_list_site`, `webroot_threats_list_endpoint`, `webroot_blockedurls_list`, `webroot_dnsp_blocked_list` | Request `pageNr` + 1 while `MoreAvailable` is true |
| `ContinuationToken` | `webroot_agent_status_gsm`, `webroot_agent_status_site` | Pass the returned `ContinuationToken` as `continuation`; no token means the last batch |

Page size limits: `pageSize` defaults to 50 on endpoints, threats and commands;
`webroot_blockedurls_list` takes 50 to 1000 (default 100); `webroot_dnsp_blocked_list`
takes 100 to 10000 (default 1000); agent status `batchSize` takes 1 to 1000 (default 50).
Values above a maximum are capped, not rejected.

For agent status, pass only the `returnedInfo` classes you need (`BasicInfo`,
`ExtendedInfo`, `TimesAndStats`, `Scheduling`, `EnabledFeatures`, `SystemAnalyzer`,
`OSAndVersions`). Omitting it returns every class and fills the response fast.

## Dates

Threat, URL and DNS tools default to **the last 24 hours** when you pass no dates. For a
monthly review, pass `startDate` and `endDate` explicitly as ISO 8601 date-times
(`2026-10-01T00:00:00Z`). Say which window a result covers; "no threats" over the default
window is not "no threats this month".

`webroot_usage_sites_report` data for a day is usually ready during the following UTC
day; asking for today returns the most recent complete report or nothing.

## Errors

Errors keep Webroot's HTTP status, error code, description and request id. Quote the
request id when escalating to Webroot support.

| Status | Meaning | What to do |
|---|---|---|
| 401 | Credential rejected even after a fresh token | Re-check the client ID/secret and the console login; reconnect Webroot in Conduit |
| 403 | The console user or API client lacks the scope or site permission | The console user's role or site access is too narrow for this call |
| 404 | Unknown site, endpoint or group ID | Re-list; IDs are GUIDs and are per site |
| 429 | Rate limited | Wait for the `Retry after` value in the error, then continue more slowly |
| Redirect refused | Webroot answered with a 3xx | The server never follows redirects; retry later, then report it |
| Response exceeded the size limit | Body over 4 MiB | Lower `pageSize`/`batchSize` or shorten the date range |

Webroot does not document rate limits. Prefer paging over maximum page sizes, and do not
fan out per-endpoint calls across every site at once.

## Gotchas

- **`webroot_sites_list` is the only full-console site list.** It is not paginated, so
  one call returns every site the console user can see.
- **Statistics are point-in-time.** `webroot_statistics_console_get` and
  `webroot_statistics_site_get` are current counts, not history. Use the threat tools for
  anything over time.
- **Deactivated and hidden endpoints.** `webroot_endpoints_list` returns active and
  deactivated endpoints unless you pass `type`. `webroot_blockedurls_list` excludes
  deactivated and hidden endpoints unless you set `includeDeactivated` /
  `includeHidden`.
- **Redacted output.** Credentials and token-shaped strings are redacted from responses,
  and long responses are truncated in a way that keeps the paging fields.

## Related Skills

- [endpoint-health](../endpoint-health/SKILL.md): protection posture triage
- [threat-review](../threat-review/SKILL.md): threat, web and DNS block review
- [usage-reconciliation](../usage-reconciliation/SKILL.md): seats and billing
- [console-audit](../console-audit/SKILL.md): admin access and command history (Admin tools)
