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

- **events** — `saas_alerts_events_query`, `saas_alerts_events_query_advanced`, `saas_alerts_recommended_actions`
- **customers** — `saas_alerts_customers_list`, `saas_alerts_customers_get`
- **users** — `saas_alerts_users_list`, `saas_alerts_users_get`, `saas_alerts_users_get_msp`
- **devices** — `saas_alerts_devices_list`, `saas_alerts_devices_get`
- **billing** — `saas_alerts_billing_list`, `saas_alerts_billing_get`
- **reports** — `saas_alerts_reports_list_scheduled`, `saas_alerts_reports_get_scheduled`
- **partner** — `saas_alerts_partner_get_profile`

Write/admin tools (`customers_create/update/delete`, `set_whitelists`,
`reports_create/delete_scheduled`, `partner_update_branding`) mutate state
and require explicit user confirmation before calling.

## Event Filters

`saas_alerts_events_query` accepts:

| Filter | Values | Notes |
|--------|--------|-------|
| `alert_status` | `low`, `medium`, `critical` | Start triage with `critical` |
| `event_type` | taxonomy string (e.g. `impossible_travel`, `new_ip_sign_in`) | Multiple types can be combined |
| `customer_id` | UUID | Scope to one customer |
| `start_time` / `end_time` | ISO 8601 | Default window is last 24 hours if omitted |

For cross-tenant pattern detection use `saas_alerts_events_query_advanced`
which accepts richer filter expressions across all customers simultaneously.

## Pagination

Event and customer list endpoints return a scroll cursor. Always check
whether a `next_cursor` (or equivalent) is present before declaring
results complete. Large tenants can return thousands of events in a
24-hour window.

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
