---
description: Deep dive investigation into a specific Huntress incident with remediations
argument-hint: "<incident_id>"
arguments: [incident_id]
---

# Investigate Huntress Incident

Perform a deep investigation of a specific incident, including affected hosts, timeline, indicators, and available remediations. Provides actionable recommendations for remediation approval/rejection.

## Prerequisites

- Huntress MCP server connected with valid API credentials
- MCP tools `huntress_incidents_get`, `huntress_incidents_remediations`, and `huntress_incidents_remediation_get` available

## Steps

1. **Get incident details**

   Call `huntress_incidents_get` with the specified `incident_id` to retrieve full incident information including title, severity, affected hosts, and timeline.

2. **List remediations**

   Call `huntress_incidents_remediations` to get all recommended remediations for this incident.

3. **Review each remediation**

   For each remediation, present the type, description, target host, and current status.

4. **Check related context**

   Look up the organization details and any related escalations for full context.

5. **Provide recommendations**

   Recommend whether to approve or reject each remediation based on the investigation findings. Suggest next steps.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| incident_id | string | Yes | The incident ID to investigate |

## Examples

### Investigate an Incident

```
/investigate-incident --incident_id "inc-789"
```

## Error Handling

- **Incident Not Found:** Verify the incident ID; use `/incident-triage` to list open incidents
- **No Remediations:** Some incidents may not have remediations yet; check back later
- **Authentication Error:** Verify API credentials

## Related Commands

- `/incident-triage` - List open incidents to find incident IDs
- `/org-health` - Check overall health of the affected organization
- `/resolve-escalation` - Handle related escalations
