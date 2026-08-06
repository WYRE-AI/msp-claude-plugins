---
name: "SaaS Alerts API Patterns"
description: >
  SaaS Alerts MCP fundamentals: API-key authentication via the gateway header,
  the MSP → customer → account → user hierarchy, navigation and functional tool
  naming, event filter parameters, cursor pagination, and HTTP error codes.
when_to_use: >-
  When working with SaaS Alerts authentication, the MSP/customer/account hierarchy, or paging
  through alerts and events. Use when: saas alerts api, saas alerts authentication, saas alerts
  mcp, or m365 alert triage.
---

# SaaS Alerts MCP Tools & API Patterns

## Overview

SaaS Alerts is a SaaS security monitoring platform for MSPs. It monitors
M365, Google Workspace, and other SaaS applications for security events,
anomalies, and policy violations across all managed customer tenants.
The MSP (partner) sees all customers under their account; each customer
has one or more accounts (e.g., an M365 tenant, a Google Workspace domain).

## Anti-triggers

- **Working the alert queue.** This skill covers filters, cursors, and
  the customer hierarchy; sweeping, ranking, and dispositioning events is
  `saas-alerts-triage`.
- **A SaaS Alerts customer treated as an M365 tenant.** They describe the
  same organisation but are separate records with separate IDs, and this
  API cannot read or change tenant configuration — use `cipp-tenants`.

## Connection & Authentication

SaaS Alerts uses an API key passed as a request header. The key is issued
in the SaaS Alerts partner portal.

| Header | Value |
|--------|-------|
| `X-SaaS-Alerts-API-Key` | The raw partner API key |

The gateway maps the environment variable `SAAS_ALERTS_API_KEY` onto the
`X-SaaS-Alerts-API-Key` header automatically. Internally the MCP server
forwards this to the SaaS Alerts API as the `api_key` header — you do not
need to construct that header yourself.

```bash
export SAAS_ALERTS_API_KEY="your-partner-api-key"
```

## Hierarchy

```
MSP Partner
  └── Customer (managed organization)
        └── Account (M365 tenant / Google Workspace domain / other SaaS)
              └── User
                    └── Events / Alerts
```

Always navigate top-down: identify the customer first, then scope to an
account or user. `saas_alerts_customers_list` is the standard entry point.

## Navigation Tools

| Tool | Purpose |
|------|---------|
| `saas_alerts_navigate` | Discover available domains and tool categories |
| `saas_alerts_status` | Health and connectivity check |

Call `saas_alerts_status` at the start of any session to confirm the
gateway and upstream API are reachable before running queries.

## Functional Tool Surface

Tools follow `saas_alerts_<domain>_<action>`. Key domains:

- **events** — `saas_alerts_events_query`, `saas_alerts_events_count`, `saas_alerts_events_query_advanced`, `saas_alerts_events_count_advanced`, `saas_alerts_events_scroll`, `saas_alerts_recommended_actions`
- **customers** — `saas_alerts_customers_list`, `saas_alerts_customers_get`
- **users** — `saas_alerts_users_list_partner`, `saas_alerts_users_list_by_customer`, `saas_alerts_users_get_msp`
- **devices** — `saas_alerts_devices_list_orgs`, `saas_alerts_devices_list_mapped`, `saas_alerts_devices_list_unmapped`, `saas_alerts_devices_list_ignored`
- **billing** — `saas_alerts_billing_list_dates`, `saas_alerts_billing_get_details`
- **reports** — `saas_alerts_reports_list_scheduled`, `saas_alerts_reports_get_scheduled`
- **partner** — `saas_alerts_partner_get_profile`

The naming convention does *not* imply a get-by-id for every domain. **Users
and devices are list-only.** There is no per-user get and no per-device get
(`saas-alerts-mcp/src/domains/users.ts`,
`saas-alerts-mcp/src/domains/devices.ts`); an earlier revision of this list
named four tools — a bare users-list, a per-user get, a bare devices-list and a
per-device get — and none of them exist. Resolving a user or device ID to a
record means listing the relevant scope and matching client-side. Note that
`saas_alerts_users_get_msp` is not the missing per-user get: it takes no
arguments and always returns the API key's own MSP profile.

Write/admin tools (`customers_create/update/delete`, `set_whitelists`,
`reports_create/delete_scheduled`, `partner_update_branding`) mutate state
and require explicit user confirmation before calling.

## Event Filters

`saas_alerts_events_query` accepts:

| Filter | Values | Notes |
|--------|--------|-------|
| `alert_status` | `low`, `medium`, `critical` | Start triage with `critical` |
| `event_type` | array of taxonomy strings (e.g. `impossible_travel`, `new_ip_sign_in`) | Multiple types can be combined |
| `customer_id` | UUID | Scope to one customer |
| `user_email` | UPN | Scope to one person. This is the user handle the events carry — there is no user-ID lookup to translate through |
| `start_date` / `end_date` | ISO-8601 timestamp or epoch ms | Inclusive. Default window is last 24 hours if omitted |
| `size` / `from` | number | Page size (default 50) and offset |
| `time_sort` | `asc`, `desc` | Sort direction on event timestamp |

For cross-tenant pattern detection use `saas_alerts_events_query_advanced`
which accepts richer filter expressions across all customers simultaneously.

## Pagination

Two mechanisms, and they are not interchangeable:

- `saas_alerts_events_query` pages with `size` and `from`. Walk `from`
  forward until a page comes back short.
- `saas_alerts_events_query_advanced` returns a scroll ID; feed it to
  `saas_alerts_events_scroll` and keep calling until the result set is
  exhausted.

Large tenants can return thousands of events in a 24-hour window, so a
first page is never evidence of a complete answer. When you only need a
total, `saas_alerts_events_count` and `saas_alerts_events_count_advanced`
avoid paging entirely.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Bad or missing API key | Re-check `SAAS_ALERTS_API_KEY` |
| 403 | Key valid but insufficient scope for the requested resource | Confirm the partner account has access to the requested customer |
| 404 | Unknown customer / account / user | Re-list to confirm IDs |
| 429 | Rate limit exceeded | Back off and retry with exponential delay |

## Best Practices

- Scope queries to a customer or time window before listing events — an
  unscoped query against all customers in a large MSP account can be slow.
- Pair events with `saas_alerts_recommended_actions` for the same alert
  to give the analyst actionable next steps immediately.
- For write operations (`set_whitelists`, `customers_update`) always
  show the operator the current state before making changes.

## Related Skills

- [triage](../triage/SKILL.md) — Sweep and prioritize the SaaS Alerts queue
