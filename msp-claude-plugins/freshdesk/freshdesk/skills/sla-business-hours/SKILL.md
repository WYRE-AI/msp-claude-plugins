---
name: "Freshdesk SLA & Business Hours"
when_to_use: "When inspecting Freshdesk SLA policies and business-hours calendars, or reasoning about how they drive due_by / fr_due_by and breach detection on tickets"
description: >
  Use this skill when working with Freshdesk SLA policies and business hours —
  listing the policies and calendars, understanding how SLA targets combined
  with business hours compute a ticket's due_by and fr_due_by deadlines, and
  detecting breached or at-risk tickets through the Freshdesk REST API v2.
triggers:
  - freshdesk sla
  - freshdesk sla policy
  - freshdesk business hours
  - freshdesk due_by
  - freshdesk first response
  - sla breach freshdesk
  - escalation freshdesk
  - freshdesk response time
---

# Freshdesk SLA Policies & Business Hours

## Overview

SLA policies define the response and resolution targets a Freshdesk account
commits to, and business-hours calendars define when the SLA clock runs.
Together they compute each ticket's `fr_due_by` (first-response deadline) and
`due_by` (resolution deadline). This skill covers listing policies and
calendars and reasoning about deadlines and breaches through tools named
`freshdesk_sla_policies_list` and `freshdesk_business_hours_list`.

## SLA Policies

### List SLA Policies

```http
GET /api/v2/sla_policies
```

Each policy describes targets per priority and the conditions under which it
applies.

### Key SLA Policy Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Unique identifier |
| `name` | String | Policy name |
| `is_default` | Boolean | Applies when no other policy matches |
| `active` | Boolean | Whether the policy is in force |
| `applicable_to` | Object | Conditions (company, group, source) that select the policy |
| `sla_target` | Object | Targets keyed by priority |
| `escalation` | Object | Who is notified, and when, as deadlines approach or pass |

### SLA Targets by Priority

Targets are defined per priority level (recall the encodings: 1 Low, 2 Medium,
3 High, 4 Urgent). Each target typically specifies:

| Target | Drives | Description |
|--------|--------|-------------|
| `respond_within` | `fr_due_by` | Time allowed for the first agent response |
| `resolve_within` | `due_by` | Time allowed to resolve the ticket |
| `business_hours` | clock mode | Whether the target counts only business hours or calendar (24x7) time |
| `escalation_enabled` | escalations | Whether breach/approach escalations fire |

Higher-priority tickets get tighter targets — an Urgent (4) ticket usually has
a much shorter `respond_within` and `resolve_within` than a Low (1) ticket.

## Business Hours

### List Business Hours

```http
GET /api/v2/business_hours
```

Each calendar defines the working week, daily hours, time zone, and holidays.

### Key Business-Hours Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Unique identifier |
| `name` | String | Calendar name |
| `is_default` | Boolean | Default calendar for the account |
| `time_zone` | String | Time zone the hours are expressed in |
| `business_hours` | Object | Working hours per weekday |
| `holidays` | Array | Dates excluded from the SLA clock |

## How Targets + Business Hours Drive Deadlines

When a ticket is created or its priority changes, Freshdesk selects the
matching SLA policy and computes deadlines:

1. **Select the policy** — match the ticket against each policy's
   `applicable_to` conditions (company, group, source); fall back to the
   `is_default` policy.
2. **Pick the target** — choose the `sla_target` entry for the ticket's
   `priority`.
3. **Choose the clock** — if the target uses business hours, the SLA clock
   only advances during the calendar's working hours and skips holidays; if it
   is 24x7, the clock runs continuously.
4. **Compute `fr_due_by`** — created-time plus `respond_within`, advanced
   through the chosen clock.
5. **Compute `due_by`** — created-time plus `resolve_within`, advanced through
   the chosen clock.
6. **Pause on Pending** — when a ticket moves to Pending (status 3) awaiting
   the customer, the resolution clock can pause depending on policy
   configuration, shifting `due_by` accordingly.

```text
Urgent (priority 4) ticket created Fri 16:00, business-hours calendar Mon-Fri 09:00-17:00
  respond_within = 1h  -> fr_due_by = Fri 17:00  (1 business hour)
  resolve_within = 8h  -> due_by    = Mon 15:00  (1h Fri + 7h spilling into Mon)
```

## Breach Detection

To detect breached and at-risk tickets:

1. **Pull the unresolved queue** — search tickets with `status:2 OR status:3`.
2. **Read SLA timestamps** — fetch each ticket with `include=stats` to get
   `fr_due_by`, `due_by`, and whether first response / resolution has
   occurred.
3. **Classify against now:**

| Condition | State |
|-----------|-------|
| `fr_due_by` in the past and no first response sent | First-response breached |
| `due_by` in the past and not resolved | Resolution breached |
| `due_by` within the next escalation window | At risk |
| Both deadlines comfortably ahead | Healthy |

4. **Prioritize** — breached first (longest overdue first), then at-risk
   ordered by nearest deadline.
5. **Escalate** — for breached/at-risk tickets, follow the policy's
   `escalation` settings: notify the responsible agent/group, bump priority,
   and record an internal note.

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| 404 Not found | Unknown policy/calendar (or none configured) | List policies/calendars to confirm what exists |
| 403 Forbidden | API key lacks admin scope for SLA config | Use an admin-scoped key to read SLA/business-hours config |
| 400 Bad request | Malformed include on the ticket fetch | Use `include=stats` to retrieve SLA timestamps |

## Best Practices

- **Map priorities to targets explicitly** — translate priority integers to
  the policy's targets when explaining deadlines.
- **Account for business hours** — never assume 24x7; check whether each
  target counts business hours and skip holidays accordingly.
- **Use `include=stats`** — it is the reliable source for `fr_due_by`,
  `due_by`, and response/resolution timestamps.
- **Watch Pending transitions** — a paused clock shifts `due_by`; recompute
  rather than trusting a stale value.
- **Drive triage by deadline** — order the queue by SLA pressure, not just
  raw priority.

## Related Skills

- [Freshdesk Ticketing](../ticketing/SKILL.md) - due_by / fr_due_by live on tickets; triage by SLA
- [Freshdesk API Patterns](../api-patterns/SKILL.md) - Search and include parameters for SLA stats
- [Freshdesk Contacts & Companies](../contacts-companies/SKILL.md) - Company/tier conditions that select SLA policies
