---
name: "SaaS Alerts Triage"
description: >
  Triaging the SaaS Alerts queue across managed M365 / Google Workspace tenants:
  the triage tool surface, the critical-first sweep, per-customer summary and
  cross-tenant pattern workflows, the low/medium/critical severity model and its
  default dispositions, and the edge cases — legitimately empty results,
  time-window sensitivity, whitelist suppression, and per-partner rate limits.
when_to_use: >-
  When sweeping and prioritizing the SaaS Alerts queue across tenants and deciding what to
  escalate. Use when: triage saas alerts, saas alerts queue, prioritize saas alerts, or m365
  security alerts.
---

# SaaS Alerts Triage

## Overview

Triage means sweeping the alert queue across all managed customers,
ranking by severity and customer impact, separating true positives from
noise, and handing the on-shift analyst a prioritized, actionable plan.
The SaaS Alerts MCP surface is well-suited to this: event queries are
customer-scoped or cross-tenant, severity is a first-class filter, and
recommended actions are machine-generated per alert.

## API Tools

| Tool | Role in Triage |
|------|---------------|
| `saas_alerts_status` | Confirm gateway + upstream connectivity before the sweep |
| `saas_alerts_customers_list` | Enumerate all managed customers |
| `saas_alerts_events_query` | Pull events filtered by severity and time window, per customer or all |
| `saas_alerts_events_query_advanced` | Cross-tenant pattern queries (impossible travel across tenants, bulk sign-in anomalies) |
| `saas_alerts_recommended_actions` | Fetch vendor-generated remediation steps for a specific alert |
| `saas_alerts_users_get` | Attribute an event to a specific user for context |
| `saas_alerts_devices_get` | Attribute an event to a specific device |

## Common Workflows

### 1 — Critical-first sweep (standard shift start)

1. `saas_alerts_status` — confirm connectivity.
2. `saas_alerts_events_query` with `alert_status: critical` and a
   24-hour window across all customers.
3. For each critical alert, call `saas_alerts_recommended_actions` to
   surface remediation guidance.
4. Attribute each alert to a user via `saas_alerts_users_get` if a
   user ID is present.
5. Produce a ranked table: customer | alert type | user | recommended action | disposition.

### 2 — Per-customer summary

1. `saas_alerts_customers_list` → select the target customer.
2. `saas_alerts_events_query` scoped to `customer_id` for the last 7 days.
3. Roll up: count by `alert_status`, top event types, affected users.
4. Flag any customer with a new alert type not seen in the prior window.

### 3 — Cross-tenant pattern detection

1. `saas_alerts_events_query_advanced` with a pattern filter (e.g.,
   `impossible_travel` or `bulk_delete`) across all customers.
2. Group by customer and user to identify whether an attacker pattern
   spans multiple tenants.
3. Escalate immediately if the same user identity (email) appears in
   critical events across two or more customers — credential compromise
   indicator.

## Severity Model

| Level | Meaning | Default Disposition |
|-------|---------|---------------------|
| `critical` | High-confidence attack or active compromise | Investigate immediately; escalate to client |
| `medium` | Suspicious but may be legitimate; needs review | Review within shift |
| `low` | Informational or likely benign | Batch review; lower priority |

Always start with `critical`. Do not skip `medium` — attackers often
generate medium-severity events as precursors.

## Edge Cases

- **Empty results are real** — If `saas_alerts_events_query` returns no
  events for a customer, that is the correct answer. Do not fabricate
  alerts. The `emptyGuard` isError signal in the MCP server will surface
  if the tool call itself failed rather than legitimately returning empty.
- **Time window matters** — A 1-hour window that returns nothing may
  show many events at a 24-hour window. Always state the time window in
  your output.
- **Whitelist suppression** — Some alerts may be suppressed by existing
  customer whitelists. If an expected alert is missing, check
  `saas_alerts_customers_get` for whitelist configuration.
- **Rate limits** — Back off on 429 responses; the SaaS Alerts API has
  per-partner rate limits that can trigger during large multi-tenant sweeps.

## Best Practices

- Always carry customer name through every line of output — an alert
  without customer attribution is not actionable for an MSP.
- Rank, do not just list. Severity is the primary key; customer size and
  strategic importance break ties. State the ranking logic.
- Pair every critical alert with its `saas_alerts_recommended_actions`
  output — the analyst should not have to make a separate tool call.
- For cross-tenant sweeps, watch for volume anomalies: a customer that
  normally generates five events per day suddenly generating fifty is
  itself a signal regardless of individual severity.
- Write operations (`set_whitelists`, `customers_update`) must be
  confirmed with the operator before execution.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — Auth, hierarchy, event filters, pagination
