---
description: Generate a postmortem summary for a resolved Rootly incident
argument-hint: "<incident_id>"
arguments: [incident_id]
---

# Generate Postmortem Summary

Generate a comprehensive postmortem summary for a resolved incident, including timeline, root cause analysis, impact assessment, and action items. Uses incident data, related incidents, and AI suggestions to produce a structured retrospective.

## Prerequisites

- Rootly MCP server connected with valid API credentials
- MCP tools `get_incident`, `find_related_incidents`, `suggest_solutions`, `list_incident_action_items`, and `list_incident_alerts` available

## Steps

1. **Get incident details**

   Call `get_incident` to retrieve the full incident record including title, severity, status, summary, affected services, timeline timestamps, and assigned teams.

2. **Verify incident is resolved**

   Confirm the incident has a `resolved_at` timestamp. If the incident is still active, warn the user and suggest resolving it first.

3. **Get attached alerts**

   Call `list_incident_alerts` to retrieve the triggering alerts, including source (Datadog, PagerDuty, etc.) and alert metadata.

4. **Find related incidents**

   Call `find_related_incidents` to identify historical patterns. Note any recurring themes (same service, same time of day, same root cause).

5. **Get AI-suggested solutions**

   Call `suggest_solutions` to surface remediation recommendations based on past incident resolutions.

6. **Get existing action items**

   Call `list_incident_action_items` to list follow-up tasks already created. If a retrospective process is configured for this incident, also check its steps with `get_incident_retrospective_step` (see the [postmortems skill](../skills/postmortems/SKILL.md)).

7. **Build postmortem summary**

   Compile a structured postmortem with these sections:
   - **Summary** -- What happened in plain language
   - **Timeline** -- Key timestamps (detected, acknowledged, mitigated, resolved) with duration calculations
   - **Impact** -- Affected services, environments, and estimated user impact
   - **Root Cause** -- Based on incident summary, alerts, and AI suggestions
   - **Detection** -- How the incident was discovered (alert source, manual report)
   - **Response** -- Steps taken, team assignments, escalation path
   - **Related Incidents** -- Similar past incidents and whether the same root cause recurred
   - **Action Items** -- Existing items plus recommended new ones from AI analysis
   - **Metrics** -- Time to detect, time to acknowledge, time to mitigate, time to resolve

8. **Suggest missing action items**

   If the AI analysis or related incidents suggest follow-up actions not yet tracked, recommend creating them.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| incident_id | string | Yes | The incident ID or sequential ID to summarize |

## Examples

### Generate Postmortem for an Incident

```
/postmortem-summary --incident_id "inc-456"
```

### Generate Postmortem by Sequential ID

```
/postmortem-summary --incident_id "INC-342"
```

## Error Handling

- **Incident Not Found:** Verify the incident ID; use `/incident-triage` to list recent incidents
- **Incident Not Resolved:** The incident must be resolved before generating a postmortem summary
- **Authentication Error:** Verify `ROOTLY_API_TOKEN` is set correctly

## Related Commands

- `/incident-triage` - List active incidents
- `/action-items` - List outstanding action items
- `/service-status` - Check current service health
