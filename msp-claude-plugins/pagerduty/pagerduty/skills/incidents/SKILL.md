---
name: "PagerDuty Incidents"
description: >
  PagerDuty incident lifecycle (triggered/acknowledged/resolved), urgency vs.
  priority, alerts-to-incident grouping, the 14 incident MCP tools, incident
  fields, notes, log entries, past-incident similarity search, merge and
  snooze semantics, and cross-vendor PSA ticket correlation for MSPs.
when_to_use: >-
  When listing, triaging, creating, updating, resolving, or investigating PagerDuty
  incidents. Use when:
  pagerduty incident, pagerduty outage, pagerduty triggered, pagerduty acknowledged, pagerduty
  resolved, pagerduty alert, pagerduty triage, pagerduty urgency, pagerduty severity, pagerduty
  priority, pagerduty create incident, pagerduty merge, pagerduty snooze, or pagerduty log entry.
---

# PagerDuty Incident Management

## Overview

Incidents are the core resource in PagerDuty — created automatically from alert rules, event orchestrations, or manually by responders. They represent an active service disruption that requires acknowledgment and resolution. For MSPs, PagerDuty incidents typically represent internal infrastructure issues or customer-impacting events routed from monitoring integrations (Datadog, CloudWatch, Nagios, etc.).

PagerDuty has 14 MCP tools for incident management — more than any other domain.

## Anti-triggers

"Incident" names three different objects across this marketplace, and the
routing test is what the operator does next: page a responder (this
skill), approve a remediation on a compromised endpoint, or answer a
customer under an SLA clock.

- **A confirmed security incident** — malware, intrusion, a host to
  contain. That object carries a SOC-recommended remediation to approve,
  not a responder to page; use `huntress-incidents`, or
  `sentinelone-alerts` for raw EDR detections.
- **A customer ticket typed "Incident"** — ITIL ticket classification
  inside a PSA or helpdesk, where the deliverable is an SLA-timed
  response and a billable time entry rather than a page; use
  `freshdesk-ticketing`, `halopsa-tickets`, `connectwise-psa-tickets`,
  or `autotask-tickets`.
- **A Rootly incident** — a different vendor with a different lifecycle
  (`detected → in_triage → mitigated → resolved → closed`, not
  `triggered → acknowledged → resolved`); use `rootly-incidents`.
- **Who would be paged, rather than what fired** — schedules, escalation
  policies, and overrides are `pagerduty-oncall`.
- **The raw monitoring signal itself** — dedup keys, grouping modes, and
  Events API payloads are `pagerduty-alerts`.
- **A monitoring or uptime incident** — an incident opened by a failing
  health check and published to a status page never enters a PagerDuty
  escalation policy; use `betterstack-incidents`.

## MCP Tools

### Core Incident Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `list_incidents` | List incidents with filters | `statuses[]`, `urgencies[]`, `service_ids[]`, `team_ids[]`, `since`, `until` |
| `get_incident` | Get full incident details | `id` (required) |
| `create_incident` | Create a new incident | `title`, `service.id`, `urgency`, `body.details` |
| `update_incident` | Update incident fields | `id`, `status`, `priority`, `urgency`, `title`, `assignments[]` |
| `merge_incidents` | Merge duplicate incidents | `id` (target), `source_incidents[]` |
| `snooze_incident` | Snooze for a duration | `id`, `duration` (seconds) |
| `manage_incidents` | Bulk update multiple incidents | `incidents[]` with individual update payloads |

### Investigation Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `list_incident_alerts` | Alerts that triggered this incident | `id` |
| `list_incident_notes` | Comments and notes on the incident | `id` |
| `create_incident_note` | Add a note to an incident | `id`, `note.content` |
| `list_incident_log_entries` | Full audit trail of events | `id`, `include[]` |
| `list_past_incidents` | Find historically similar incidents | `id` (finds similar to this incident) |

### Custom Fields

| Tool | Description |
|------|-------------|
| `get_incident_field_values` | Read custom field values |
| `set_incident_field_values` | Write custom field values |

## Key Concepts

### Incident Lifecycle

```
┌───────────┐   Alert fires   ┌──────────────┐   Responder acts   ┌───────────┐
│ triggered │ ──────────────> │ acknowledged │ ──────────────────> │ resolved  │
└───────────┘                 └──────────────┘                     └───────────┘
      │
      │ Nobody acks within escalation timeout
      ▼
 [Escalates to next layer in escalation policy]
```

| Status | Description |
|--------|-------------|
| `triggered` | Alert fired; awaiting acknowledgment |
| `acknowledged` | Responder is working on it; escalation paused |
| `resolved` | Incident is over; service restored |

### Urgency Levels

| Urgency | Description | Notification Behavior |
|---------|-------------|----------------------|
| `high` | Critical service impact; requires immediate response | Phone, SMS, push |
| `low` | Non-critical; informational or degraded state | Email, push only |

### Priority

Priorities are account-configured (P1–P5 is common). Priority is separate from urgency:
- **Urgency** — controls notification escalation behavior
- **Priority** — business classification of impact severity

### Alerts vs. Incidents

- **Alert** — Raw signal from a monitoring integration (many per incident)
- **Incident** — The grouped, actionable work item (one or more alerts)

`list_incident_alerts` shows you which monitoring signals triggered an incident.

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique incident ID |
| `incident_number` | integer | Human-readable number (#342) |
| `title` | string | Short summary of the incident |
| `status` | string | triggered / acknowledged / resolved |
| `urgency` | string | high / low |
| `priority` | object | Account-configured priority (P1–P5) |
| `service` | object | The service this incident belongs to |
| `assignments` | array | Responders currently assigned |
| `escalation_policy` | object | Escalation policy in effect |
| `created_at` | datetime | When the incident was created |
| `resolved_at` | datetime | When it was resolved (null if open) |
| `body.details` | string | Incident description/details |
| `alert_counts.triggered` | integer | Number of triggered alerts |

## Common Workflows

### Triage Open Incidents

1. Call `list_incidents` with `statuses[]=triggered&statuses[]=acknowledged`, sorted by created_at desc
2. Group by urgency: `high` urgency first
3. For each critical incident, call `get_incident` for full details
4. Call `list_incident_alerts` to understand the triggering signal
5. Call `list_past_incidents` on the incident ID to find similar historical events
6. Add acknowledgment note via `create_incident_note` with your investigation steps

### Investigate a Triggered Incident

1. Call `get_incident` to get full details (service, escalation policy, assignments)
2. Call `list_incident_alerts` to see what monitoring signals fired
3. Call `list_past_incidents` — this uses AI to find similar past incidents and their resolutions
4. Call `list_incident_log_entries` for the full audit trail of notifications and escalations
5. Acknowledge via `update_incident` with `status=acknowledged`

### Bulk Resolve After Maintenance

After a maintenance window resolves multiple incidents:
1. Call `list_incidents` with `statuses[]=triggered&statuses[]=acknowledged` filtered to the affected service
2. Call `manage_incidents` with all incident IDs and `status=resolved`
3. Add a resolution note to each with `create_incident_note`

### Cross-Vendor PSA Ticket Correlation

PagerDuty incidents often need to be tracked in a PSA for billing/SLA reporting:

1. When a high-urgency PagerDuty incident is created, create a corresponding PSA ticket
2. Store the PagerDuty incident number (`#342`) in the PSA ticket body for cross-reference
3. Map PagerDuty urgency → PSA priority: `high` → Critical/High, `low` → Medium/Low
4. When the PagerDuty incident resolves, update the PSA ticket with the resolution timestamp
5. Use `list_incident_log_entries` to extract total response time for SLA tracking

### Merge Duplicate Incidents

When the same root cause fires multiple incidents:

1. Identify the primary incident (earliest or highest urgency)
2. Call `merge_incidents` with the primary incident `id` and the IDs of the duplicates in `source_incidents[]`
3. PagerDuty merges all alerts and log entries into the primary incident
4. The secondary incidents are automatically resolved

## Error Handling

| Error | HTTP Code | Resolution |
|-------|-----------|------------|
| Invalid token | 401 | Use `Token token=<key>` format — NOT `Bearer` |
| Incident not found | 404 | Verify ID; use `list_incidents` to find valid IDs |
| Service not found | 404 | Verify service ID with `list_services` |
| Status conflict | 409 | Incident may already be resolved; check current status |
| Rate limited | 429 | Back off 60 seconds; PagerDuty limits 900 req/min |

## Best Practices

1. **Use `list_past_incidents`** — PagerDuty's AI similarity search often surfaces the exact runbook needed
2. **Filter by service and team** — Always scope incident queries to relevant services to avoid noise
3. **Acknowledge before investigating** — Stops escalation clock while you triage
4. **Add notes as you go** — `create_incident_note` builds a shared investigation timeline
5. **Merge duplicates immediately** — Reduces responder confusion during active incidents
6. **Use `since`/`until` for reports** — Unbounded queries on large accounts are slow

## Related Skills

- [On-Call Management](../oncall/SKILL.md) — Who is on-call, escalation policies, overrides
- [API Patterns](../api-patterns/SKILL.md) — Token format, 66-tool reference, pagination
