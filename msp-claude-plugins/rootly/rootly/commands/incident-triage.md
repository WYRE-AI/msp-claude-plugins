---
description: Triage active Rootly incidents by severity and status
argument-hint: "[severity] [status] [limit]"
arguments: [severity, status, limit]
---

# Rootly Incident Triage

Triage active incidents across all services and environments. Lists incidents filtered by status, sorted by severity, with a summary of counts by severity level. This is the primary workflow for on-call engineers and incident responders.

## Prerequisites

- Rootly MCP server connected with valid API credentials
- MCP tools `incidents_get`, `find_related_incidents`, and `suggest_solutions` available

## Steps

1. **Fetch active incidents sorted by severity**

   Call `incidents_get` with `status=in_triage` (or the specified status filter). If `severity` is provided, include it as a filter. Use `page[size]` set to the specified `limit`.

2. **Count incidents by severity**

   Aggregate results to show counts by severity level (SEV0/Critical, SEV1/High, SEV2/Medium, SEV3/Low).

3. **Build triage summary table**

   For each incident, extract: sequential ID, severity, title, status, creation time, affected services, and assigned team.

4. **Highlight critical items**

   Flag critical and high severity incidents that need immediate attention. Identify affected services and on-call teams.

5. **Run AI analysis on critical incidents**

   For each critical incident, call `find_related_incidents` to check for recurring patterns and `suggest_solutions` for AI-generated remediation recommendations.

6. **Provide next-step recommendations**

   Suggest investigating the most critical incidents first using `/create-incident` for any untracked issues or escalating as needed.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| severity | string | No | all | Filter by severity (critical, high, medium, low) |
| status | string | No | in_triage | Filter by status (detected, in_triage, mitigated) |
| limit | integer | No | 50 | Maximum number of incidents to return |

## Examples

### Triage All Active Incidents

```
/incident-triage
```

### Triage Critical Incidents Only

```
/incident-triage --severity critical
```

### Triage Detected but Not Yet Triaged

```
/incident-triage --status detected
```

## Error Handling

- **Authentication Error:** Verify `ROOTLY_API_TOKEN` is set correctly
- **Rate Limit:** Wait and retry; use severity or status filters to reduce result set
- **No Results:** Confirm filters are correct; no active incidents is a good sign

## Related Commands

- `/create-incident` - Create a new incident
- `/postmortem-summary` - Generate postmortem for a resolved incident
- `/service-status` - Check service health
- `/action-items` - List outstanding action items
