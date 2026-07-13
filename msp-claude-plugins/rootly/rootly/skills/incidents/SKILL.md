---
name: "Rootly Incidents"
description: >
  Use this skill when working with Rootly incidents - creating, searching,
  triaging, updating, and resolving incidents. Covers the incident lifecycle,
  severity levels, status transitions, AI-powered analysis tools
  (find_related_incidents, suggest_solutions), action items, alert attachment,
  and cross-vendor PSA ticket correlation workflows.
when_to_use: >-
  When creating, searching, triaging, updating, and resolving incidents. Use when: rootly
  incident, rootly outage, rootly alert, rootly triage, rootly severity, rootly resolve, rootly
  status, rootly action item, incident management rootly, rootly postmortem, rootly on-call,
  create incident rootly, rootly similar incidents, or rootly ai suggest.
---

# Rootly Incident Management

## Overview

Incidents are the primary resource in Rootly — the central record for any production issue, outage, or service degradation. Rootly is used by SRE and platform engineering teams to coordinate response in real time and drive continuous improvement via postmortems. In MSP environments, Rootly typically manages internal infrastructure incidents rather than per-client ticketing, but can be configured with team-based routing to support multi-customer workflows.

The incident system supports:

- **Automated Detection** - Incidents created from monitoring alert integrations (Datadog, PagerDuty, Prometheus, Grafana, Sentry, etc.)
- **Manual Creation** - On-call engineers and responders create incidents via Slack, web UI, or API
- **AI-Assisted Analysis** - `find_related_incidents` and `suggest_solutions` surface past patterns and recommendations
- **Real-Time Coordination** - Slack channel auto-creation, Zoom bridges, timeline tracking
- **Post-Incident Learning** - Automated postmortem generation and action item tracking

All read and write operations on incidents are available through the Rootly MCP tools.

## MCP Tools

### Core Incident Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `incidents_get` | List and search incidents | `status`, `severity`, `page[number]`, `page[size]` |
| `incidents_post` | Create a new incident | `title`, `severity_id`, `team_ids`, `service_ids` |
| `incidents_by_incident_id_alerts_post` | Attach an alert to an incident | `incident_id`, alert data |
| `incidents_by_incident_id_alerts_get` | List alerts attached to an incident | `incident_id` |
| `incidents_by_incident_id_action_items_post` | Create an action item on an incident | `incident_id`, `summary`, `assignee_id` |
| `incidents_by_incident_id_action_items_get` | List action items on an incident | `incident_id` |

### AI Analysis Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `find_related_incidents` | Find historically similar incidents using TF-IDF | `query` or `incident_id` |
| `suggest_solutions` | Suggest remediation steps based on past resolutions | `incident_id` or `description` |

### Supporting Lookups

| Tool | Description |
|------|-------------|
| `severities_get` | List configured severity levels (ID, slug, color) |
| `services_get` | List services to scope incident to the right owner |
| `teams_get` | List teams for incident assignment and routing |
| `incident_types_get` | List incident types (bug, outage, performance, etc.) |
| `environments_get` | List environments (production, staging, etc.) |
| `users_get` | List users for assignment |

### Discover Available Tools

Call `list_endpoints` to get the current list of all available API endpoints and tool names from the Rootly OpenAPI specification.

## Key Concepts

### Incident Lifecycle

```
┌───────────┐   Triage starts   ┌────────────┐   Contained   ┌───────────┐
│ detected  │ ─────────────────> │  in_triage │ ────────────> │ mitigated │
└───────────┘                   └────────────┘               └───────────┘
                                                                     │
                                                               Full fix done
                                                                     ▼
                                                               ┌──────────┐
                                                               │ resolved │
                                                               └──────────┘
                                                                     │
                                                             PIR complete
                                                                     ▼
                                                               ┌────────┐
                                                               │ closed │
                                                               └────────┘
```

Key lifecycle timestamps on the incident record:

| Timestamp | Meaning |
|-----------|---------|
| `detected_at` | Alert fired or issue first observed |
| `acknowledged_at` | Responder acknowledged the page |
| `in_triage_at` | Active investigation started |
| `started_at` | Response team coordinating |
| `mitigated_at` | Immediate impact contained |
| `resolved_at` | Issue fully resolved |
| `closed_at` | Post-incident review complete |
| `cancelled_at` | False alarm; incident cancelled |

### Severity Levels

Severities are configurable per Rootly organization. Common conventions:

| Severity | Typical Name | Description | SLA Target |
|----------|-------------|-------------|------------|
| SEV-1 / Critical | P1 | Complete outage or data loss; business-critical impact | Immediate (15 min) |
| SEV-2 / High | P2 | Major feature degraded; significant user impact | 30 minutes |
| SEV-3 / Medium | P3 | Partial degradation; workaround available | 2 hours |
| SEV-4 / Low | P4 | Minor issue; minimal user impact | Next business day |

> **Note:** Severity IDs are UUIDs in Rootly. Always call `severities_get` to map severity slugs to IDs before creating an incident.

### Incident Status Values

Rootly uses free-text status descriptors alongside timestamps. Common values:

- `detected` — Newly created, not yet acknowledged
- `in_triage` — Actively being investigated
- `mitigated` — Impact contained, monitoring for recurrence
- `resolved` — Issue fixed, normal operation restored
- `cancelled` — False alarm or invalid incident

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the incident |
| `sequential_id` | integer | Human-readable incident number (e.g., INC-342) |
| `title` | string | Short summary of the incident |
| `summary` | string | Detailed description of impact and current status |
| `status` | string | Current lifecycle status |
| `severity` | object | Severity record with `slug`, `color`, `description` |
| `services` | array | Affected services |
| `environments` | array | Affected environments (production, staging) |
| `teams` | array | Teams assigned to respond |
| `labels` | array | Custom tags for filtering and reporting |
| `started_at` | datetime | When the incident started |
| `resolved_at` | datetime | When the incident was resolved (null if open) |
| `slack_channel_id` | string | Auto-created Slack channel for coordination |
| `url` | string | Web UI link to the incident |

## Common Workflows

### Triage New Incidents

1. Call `incidents_get` with `status=in_triage` or `status=detected`, sorted by severity
2. For each high-severity incident, review title and summary
3. Call `find_related_incidents` with the `incident_id` to surface similar past incidents
4. Call `suggest_solutions` with the `incident_id` to get AI-generated remediation suggestions
5. Create action items via `incidents_by_incident_id_action_items_post` for each remediation step
6. Update status as the incident progresses

### Create an Incident

1. Call `severities_get` to find the correct severity ID for the impact level
2. Call `services_get` to identify which service is affected
3. Call `teams_get` to find the on-call team to assign
4. Call `incidents_post` with `title`, `severity_id`, `service_ids`, `team_ids`
5. Attach any triggering alerts via `incidents_by_incident_id_alerts_post`

### Investigate a Specific Incident

1. Find the incident via `incidents_get` or by `sequential_id`
2. Call `find_related_incidents` — look for recurring patterns (same service, same time of day, same symptoms)
3. Call `suggest_solutions` — surface past resolutions that worked for similar incidents
4. Review action items via `incidents_by_incident_id_action_items_get`
5. Review attached alerts via `incidents_by_incident_id_alerts_get`

### Daily Incident Review

1. Call `incidents_get` with a 24-hour window and `status=resolved`
2. Count by severity for a daily health summary
3. Identify incidents that exceeded SLA targets (compare `detected_at` vs `resolved_at`)
4. Flag any incidents without postmortem action items for follow-up

### Cross-Vendor PSA Ticket Correlation

Rootly incidents often correspond to PSA service tickets for MSP billing:

1. When an incident is created or resolved, create a matching ticket in your PSA (ConnectWise, HaloPSA, Autotask, etc.)
2. Include the Rootly `sequential_id` (e.g., INC-342) and `url` in the PSA ticket body
3. Map Rootly severity → PSA priority: SEV-1 → Critical, SEV-2 → High, SEV-3 → Medium, SEV-4 → Low
4. When the Rootly incident resolves, update the PSA ticket with resolution summary from `summary`
5. Use action items as sub-tasks in the PSA ticket for follow-up work

### On-Call Handoff Summary

Before handing off to the next on-call engineer:

1. Call `get_oncall_handoff_summary` to see current and next on-call status plus open incidents
2. Call `incidents_get` with `status=in_triage` to review any actively open incidents
3. Add handoff notes as action items on open incidents
4. See the [oncall skill](../oncall/SKILL.md) for full on-call workflows

## Error Handling

### Common Errors

| Error | HTTP Code | Resolution |
|-------|-----------|------------|
| Invalid API token | 401 | Regenerate at Account > Manage API Keys |
| Insufficient permissions | 403 | Token may be Team-scoped; use an Account or Global token |
| Incident not found | 404 | Verify `incident_id`; use `incidents_get` to list active incidents |
| Severity ID invalid | 422 | Call `severities_get` to get valid IDs before creating |
| Rate limited | 429 | Back off 30 seconds; retry with exponential backoff |

### Authentication Error

```
401 Unauthorized

Verify your Rootly API token:
- Generate at Account > Manage API Keys
- Token type: Global (full access) or Team (limited to team resources)
- Pass as: Authorization: Bearer <token>
```

## Best Practices

1. **Use AI analysis first** — Always call `find_related_incidents` and `suggest_solutions` before manual investigation
2. **Track action items** — Every resolved incident should have at least one follow-up action item
3. **Attach alerts** — Link the triggering alert to the incident for audit trail completeness
4. **Scope to the right team** — Include `team_ids` when creating incidents so on-call routing works correctly
5. **Map severity consistently** — Use `severities_get` to confirm slug-to-ID mapping rather than hardcoding
6. **Use sequential IDs in external tools** — Reference `INC-{sequential_id}` in PSA tickets and Slack
7. **Check on-call health** — Use `check_oncall_health_risk` before major deployments or planned maintenance

## Related Skills

- [On-Call Management](../oncall/SKILL.md) — On-call schedules, handoffs, shift metrics
- [API Patterns](../api-patterns/SKILL.md) — Auth, pagination, all available tools
