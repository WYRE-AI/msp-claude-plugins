---
name: "Better Stack Incidents"
description: >
  Better Stack incidents: incident records raised by uptime monitors or
  reported manually, and the triage, acknowledgment, and resolution
  lifecycle.
when_to_use: >-
  When listing, triaging, acknowledging, or resolving Better Stack
  incidents. Use when: betterstack incident, incident triage, incident
  acknowledgment, incident resolution, acknowledge incident, resolve
  incident, downtime incident, or better stack incident.
---

# Better Stack Incidents

## Overview

Incidents in Better Stack are triggered automatically when uptime monitors detect downtime, or created manually for ad-hoc issues. Each incident tracks the timeline from detection through acknowledgment to resolution, with associated monitors, status page updates, and on-call notifications.

## Key Concepts

### Incident Lifecycle

1. **Triggered** - Monitor detects downtime and creates an incident
2. **Acknowledged** - On-call responder acknowledges the incident
3. **Resolved** - The issue is fixed and the incident is closed
4. **Auto-resolved** - Monitor detects recovery and automatically resolves

### Incident Attributes

- **Started at** - When the incident was first detected
- **Acknowledged at** - When a responder acknowledged
- **Resolved at** - When the incident was resolved
- **Cause** - The monitor or manual source that triggered it
- **Call** - Whether a phone call alert was triggered
- **SMS** - Whether an SMS alert was sent
- **Email** - Whether an email alert was sent

### Incident Severity

Better Stack does not enforce severity levels on incidents directly -- severity is determined by the monitor's configuration and escalation policy. However, incidents from monitors with shorter check intervals and immediate escalation are implicitly higher priority.

## API Patterns

### List Incidents

```
betterstack_list_incidents
```

Parameters:
- `page` - Pagination cursor
- `per_page` - Results per page
- `from` - Start date filter (ISO 8601)
- `to` - End date filter (ISO 8601)

**Example response:**

```json
{
  "data": [
    {
      "id": "67890",
      "type": "incident",
      "attributes": {
        "name": "Example Website is down",
        "cause": "HTTP 503 Service Unavailable",
        "started_at": "2026-03-27T08:15:00Z",
        "acknowledged_at": null,
        "resolved_at": null,
        "call": true,
        "sms": true,
        "email": true
      },
      "relationships": {
        "monitor": {
          "data": { "id": "12345", "type": "monitor" }
        }
      }
    }
  ]
}
```

### Get Incident Details

```
betterstack_get_incident
```

Parameters:
- `incident_id` - The incident ID

### Acknowledge Incident

```
betterstack_acknowledge_incident
```

Parameters:
- `incident_id` - The incident ID

### Resolve Incident

```
betterstack_resolve_incident
```

Parameters:
- `incident_id` - The incident ID

## Common Workflows

### Daily Incident Triage

1. Call `betterstack_list_incidents` with date filters for the current period
2. Identify unacknowledged incidents (acknowledged_at is null)
3. Group incidents by monitor to identify patterns
4. Acknowledge incidents that are being investigated
5. Resolve incidents that have auto-recovered

### Incident Investigation

1. Get incident details with `betterstack_get_incident`
2. Identify the associated monitor and check its current status
3. Review the incident timeline (started, acknowledged, resolved)
4. Check if the monitor has recovered or is still down
5. Cross-reference with logs using `betterstack_query_logs`
6. Acknowledge the incident if actively investigating
7. Resolve once the root cause is addressed

### Post-Incident Review

1. List incidents for the review period
2. Calculate mean time to acknowledge (MTTA) and mean time to resolve (MTTR)
3. Identify monitors with recurring incidents
4. Review escalation policy effectiveness
5. Update monitors and alerts based on findings

## Error Handling

### Incident Not Found

**Cause:** Invalid incident ID or incident was deleted
**Solution:** List incidents to verify the correct ID

### Incident Already Resolved

**Cause:** Attempting to acknowledge or resolve an already-resolved incident
**Solution:** Check incident status before taking action

### Incident Already Acknowledged

**Cause:** Attempting to acknowledge an already-acknowledged incident
**Solution:** Proceed to resolve if the issue is fixed

## Best Practices

- Acknowledge incidents promptly to stop escalation chains
- Use date filters to scope incident lists to relevant periods
- Track MTTA and MTTR metrics per client for SLA compliance
- Cross-reference incidents with log data for root cause analysis
- Set up auto-resolve so monitors close incidents when services recover
- Review recurring incidents to identify systemic issues
- Create PSA tickets for incidents requiring follow-up work

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [monitors](../monitors/SKILL.md) - Monitors that trigger incidents
- [status-pages](../status-pages/SKILL.md) - Status page incident updates
- [oncall](../oncall/SKILL.md) - On-call notifications for incidents
- [logging](../logging/SKILL.md) - Log investigation during incidents
