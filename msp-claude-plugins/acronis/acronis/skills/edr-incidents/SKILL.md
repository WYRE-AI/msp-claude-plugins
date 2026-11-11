---
name: "Acronis EDR Incidents"
description: >
  Endpoint Detection and Response (EDR) incident review in Acronis Cyber
  Protect Cloud: listing open incidents across customers, reading an
  incident's detections, activities and response actions, checking the
  status of a response action started in the console, and updating the
  investigation state or adding a comment (off by default, write tier in
  Conduit). Starting response actions is not available.
when_to_use: >-
  When an MSP needs to review Acronis EDR or Cyber Protect security incidents,
  triage open incidents by severity, read what happened on an endpoint,
  check whether an isolation or other response action finished, or record an
  investigation decision. Use when: acronis incident, acronis edr, acronis
  malware detected, cyber protect incident, acronis investigation state,
  acronis isolate status, or security incident review.
---

# Acronis EDR Incidents

## Overview

Acronis EDR groups related detections on an endpoint into an incident. Each
incident has a severity, a verdict, a mitigation state (was the threat
stopped) and an investigation state (has a person looked at it). An MSP's job
is to make sure every incident that isn't auto-mitigated gets looked at, and
that the investigation state reflects reality.

## Anti-triggers

- **Backup failures and missed backups** — those are alerts, not incidents.
  Use `acronis-backup-health`.

## Key Concepts

| Field | Values |
|-------|--------|
| `severity` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `verdict` | `SUSPICIOUS`, `MALICIOUS` |
| `mitigation_state` | `NOT_MITIGATED`, `MITIGATED`, `AUTO_MITIGATED` |
| `state` (investigation) | `NOT_STARTED`, `INVESTIGATING`, `TRIAGED`, `FALSE_POSITIVE`, `CLOSED` |
| `incident_category` | Such as `MALWARE_DETECTED`, `PROCESS_DETECTED`, `URL_BLOCKED`, `MS_DEFENDER` |

`is_mitigated` is a simple true/false filter on whether the threat was
stopped. `positivity` is a confidence score from 0 to 10 that you can filter
with `range(min, max)`.

## Workflow: Daily Incident Review

1. **Open incidents for a customer.** Call `acronis_fetch_incidents` with
   `customer_id`, `state: "or(NOT_STARTED,INVESTIGATING)"` and
   `created_at: "ge(<start date>)"`. With a partner-level API client, always
   pass `customer_id`; without it the call uses the API client's own tenant.
2. **Unmitigated first.** Re-run with `mitigation_state: "NOT_MITIGATED"`.
   Those are threats Acronis didn't stop, and they come before everything
   else regardless of severity.
3. **Then by severity.** `severity: "or(HIGH,CRITICAL)"` next, then the rest.
4. **Page.** Use `limit` and `cursor`. Keep every other parameter exactly the
   same between pages or the cursor is rejected.
5. **Read one incident.** `acronis_fetch_incident` with `path.incident_id`,
   `customer_id`, and `with_detections`, `with_activities` and
   `with_incident_actions` set to `true`. Detections say what was seen,
   activities say what happened on the machine, and incident actions say what
   was done about it.
6. **Check a response action.** If someone isolated the machine or killed a
   process from the console, call `acronis_fetch_response_action_status` with
   the incident ID and the action's `activity_id` from step 5.

## Deciding the Outcome

| Situation | Typical investigation state |
|-----------|-----------------------------|
| Auto-mitigated known malware, nothing else on the machine | `TRIAGED`, then `CLOSED` after a quick check |
| Not mitigated, or malicious verdict with unexpected activity | `INVESTIGATING`; open a PSA ticket and escalate |
| Legitimate admin tool or line-of-business software flagged | `FALSE_POSITIVE`, with a comment naming the software and who confirmed it |
| Same detection across many machines at once | Treat as one event; investigate the common source before closing any |

## Updating the Investigation (write, off by default)

`acronis_update_investigation_state` changes an incident's investigation
state, adds a comment, or links an external ticket. Body fields: `state`,
`comment`, `ticket_id`, `ticket_subject`, `assignee`, `assignee_id`, and
`priority` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). Pass `customer_id` in
`query` with a partner-level API client.

- It's **off by default**. If it isn't in the tool list, writes are turned
  off for the Acronis connector; tell the operator to update the incident in
  the console.
- When writes are on, Conduit puts it at the **write** tier (not admin).
- Put the PSA ticket number in `ticket_id` so the incident and the ticket
  point at each other.
- Never set `FALSE_POSITIVE` or `CLOSED` on an unmitigated incident without
  the operator's explicit confirmation.
- Send an `Idempotency-Key` header when retrying after a network error, so a
  retry doesn't add the same comment twice.

## What This Connector Can't Do

Starting a response action (isolating a machine, killing a process,
quarantining a file, rolling back) is **not available** through this
connector. Say so, and point the operator to the incident in the Acronis
console. Reading the status of an action started there is available.

## Gotchas

- `incident_id` filtering on `acronis_fetch_incidents` only works for a
  single customer, so pass `customer_id` with it.
- Multi-workload incidents span several machines. Pass
  `with_multi_workload: true` to get the `workloads` list; without it you
  see one machine.
- Incidents that were merged into another are hidden unless you pass
  `with_transferred: true`.
- Incident dates use `range(from, to)` and `ge(from)`, not the nanosecond
  operators that alerts use.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Headers, pagination and errors
- [tenants-and-usage](../tenants-and-usage/SKILL.md) - Find the customer tenant UUID
