---
name: "Rootly On-Call"
description: >
  Rootly on-call visibility built on the get_oncall_handoff_summary,
  get_oncall_shift_metrics, get_shift_incidents, and check_oncall_health_risk
  tools: schedule and rotation coverage, structured shift handoffs, per-shift
  incident scoping, shift metric fields, and the burnout risk signals.
when_to_use: >-
  When handing off or reviewing an on-call shift, checking schedule coverage, or assessing
  responder burnout risk. Use when: rootly oncall, rootly
  on-call, rootly handoff, rootly shift, rootly schedule, rootly rotation, rootly escalation,
  on-call health, oncall burnout, shift metrics rootly, rootly paging, or rootly responder.
---

# Rootly On-Call Management

## Overview

Rootly's on-call management provides visibility into who is currently on-call, what incidents occurred during a shift, and whether responders are at risk of burnout. For MSPs and SRE teams, the on-call tools help with:

- **Shift Handoffs** — Generate a structured summary of open incidents and shift history before handing off to the next responder
- **Health Monitoring** — Detect workload health risks before they cause burnout or missed pages
- **Shift Metrics** — Analyse incident volume, severity distribution, and response time per user, team, or schedule
- **Incident Scoping** — Pull only the incidents that occurred during a specific shift period

## Anti-triggers

This skill *analyses* on-call — handoffs, shift load, burnout risk. It
does not author rotations or decide who gets paged.

- **Building or editing a rotation** — schedule layers, restrictions, and
  temporary overrides are `pagerduty-oncall`; Rootly reads shift data
  rather than authoring it.
- **When the SLA clock runs against a customer** — business-hours
  calendars and coverage windows are a contractual construct, unrelated
  to responder shifts; use `freshdesk-sla-business-hours` or
  `halopsa-contracts`.
- **The incidents themselves** — triage, severity, and resolution are
  `rootly-incidents`; this skill only scopes them to a shift window.
- **Escalation policy configuration** — routing and escalation tiers are
  `rootly-alerts`.
- **A rotation kept in BetterStack** — BetterStack owns its schedules
  next to its monitors and feeds Rootly no shift data; use
  `betterstack-oncall`.

## MCP Tools

### On-Call Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_oncall_handoff_summary` | Current/next on-call status plus incidents from the current shift | Schedule or team context |
| `get_oncall_shift_metrics` | Shift metrics grouped by user, team, or schedule | `group_by`, time range |
| `get_shift_incidents` | Incidents filtered to a specific shift timeframe | `severity`, `status`, `tags`, time range |
| `check_oncall_health_risk` | Detects workload health risk in scheduled responders | Schedule/team context |

## Key Concepts

### On-Call Shift Structure

A **shift** is a period assigned to one or more responders in a schedule. Rootly supports:

- **Simple rotations** — Daily/weekly hand-offs (Engineer A → Engineer B → Engineer C)
- **Follow-the-sun** — Regional rotations based on business hours
- **Layered schedules** — Primary + secondary + escalation policy
- **Temporary overrides** — One-off coverage swaps without changing the base schedule

### Health Risk Indicators

`check_oncall_health_risk` analyses patterns that correlate with burnout:

| Indicator | Description |
|-----------|-------------|
| High incident volume | Significantly more incidents than the rolling average for this shift |
| Late-night pages | High proportion of pages during sleep hours |
| Long time-to-resolve | Incidents taking significantly longer than the team average |
| Repeat pages | Same alert firing multiple times (suggests a systemic issue, not a one-off) |
| Short time between pages | Responder has not had recovery time between incidents |

### Escalation Policies

When a page is not acknowledged within the configured timeout:

1. **Tier 1** — Primary on-call responder
2. **Tier 2** — Secondary responder or team lead
3. **Tier 3** — Engineering manager or global escalation
4. **Fallback** — Slack channel broadcast, status page alert

## Common Workflows

### On-Call Handoff (End of Shift)

Before handing off to the incoming responder:

1. Call `get_oncall_handoff_summary` to get a structured overview:
   - Who is currently on-call and when their shift ends
   - Who is next on-call and when they take over
   - Open/in-triage incidents from the current shift with status and severity
2. Review any `in_triage` incidents — add a handoff note as an action item on each open incident
3. Call `get_shift_incidents` to list all incidents during the shift (for the outgoing responder's records)
4. Share the handoff summary in the team's Slack channel or incident war room

### Reviewing Shift Health (Manager / Team Lead)

1. Call `check_oncall_health_risk` for the current schedule or team
2. Review flagged risks (high volume, late-night pages, repeat alerts)
3. If risk is elevated:
   - Consider temporarily adding a secondary responder
   - Review the repeat alerts for systemic fixes (runbook gaps, noisy alerts)
   - Check if open incidents can be deprioritised to reduce cognitive load
4. Call `get_oncall_shift_metrics` grouped by `user` to identify individual responder load imbalances

### Weekly On-Call Retrospective

1. Call `get_oncall_shift_metrics` with `group_by=schedule` for the past 7 days
2. Review incident volume per shift and per responder
3. Identify the top noisy alerts (high frequency, low severity)
4. Identify incidents that escalated beyond Tier 1 (indicates alerting or runbook gaps)
5. Create action items in Rootly for the top 3 improvement areas

### Pre-Deployment Health Check

Before a major deployment or planned maintenance window:

1. Call `check_oncall_health_risk` to confirm responders are not already overloaded
2. Call `get_oncall_handoff_summary` to confirm the on-call team is available during the deployment window
3. If health risk is elevated, consider scheduling the deployment during a lighter shift

### Shift Incident Review

After a shift ends, review its full incident history:

1. Call `get_shift_incidents` scoped to the shift time range
2. Filter by `severity=critical` or `severity=high` to focus on the most impactful events
3. For each critical incident, call `find_related_incidents` to check if it is part of a pattern
4. Flag recurring incidents for postmortem action items

## Field Reference

### Handoff Summary Fields

| Field | Description |
|-------|-------------|
| `current_oncall` | Name and contact of the current on-call responder |
| `next_oncall` | Name, contact, and handoff time of the next responder |
| `shift_start` | When the current shift started |
| `shift_end` | When the current shift ends |
| `open_incidents` | List of in-progress incidents: ID, title, severity, status |
| `resolved_incidents` | Incidents resolved during this shift |

### Shift Metrics Fields

| Field | Description |
|-------|-------------|
| `group` | User, team, or schedule name |
| `incident_count` | Total incidents during the period |
| `mttr` | Mean time to resolve (seconds) |
| `mtta` | Mean time to acknowledge (seconds) |
| `escalations` | Number of incidents that escalated beyond Tier 1 |
| `severity_breakdown` | Incident count by severity level |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| No schedule found | Team or schedule not configured | Verify schedule exists in Rootly Settings > On-Call |
| Empty handoff summary | No incidents in current shift | This is expected for quiet shifts — healthy outcome |
| Health risk unavailable | Insufficient historical data | Need at least 2-3 past shifts to baseline |
| 401 Unauthorized | Invalid API token | Regenerate at Account > Manage API Keys |

## Best Practices

1. **Run handoff summary before every shift transition** — Prevents dropped context between responders
2. **Act on health risk signals early** — Don't wait for burnout; rotate responders proactively
3. **Review shift metrics weekly** — Trending upward volume is an early warning of systemic issues
4. **Tag incidents during a shift** — Labels like `deployment-related` or `third-party` make shift analysis more useful
5. **Combine with incident tools** — Always pair on-call review with `find_related_incidents` for recurring alerts

## Related Skills

- [Incidents](../incidents/SKILL.md) — Incident lifecycle, AI analysis, action items
- [API Patterns](../api-patterns/SKILL.md) — Auth, pagination, all available tools
