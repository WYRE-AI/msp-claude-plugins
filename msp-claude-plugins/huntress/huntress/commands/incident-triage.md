---
description: Triage open Huntress incidents by severity
argument-hint: "[severity] [organization_id] [limit]"
arguments: [severity, organization_id, limit]
---

# Huntress Incident Triage

Triage open incidents across all managed client organizations. Lists incidents filtered by open status, sorted by severity, with a summary of counts by severity level. This is the primary daily workflow for MSP security operations.

## Prerequisites

- Huntress MCP server connected with valid API credentials
- MCP tools `huntress_incidents_list` and `huntress_incidents_get` available

## Steps

1. **Fetch open incidents sorted by severity**

   Call `huntress_incidents_list` with `status=open`. If `severity` or `organization_id` filters are provided, include them. Paginate through all results up to the specified `limit`.

2. **Count incidents by severity**

   Aggregate results to show counts of critical, high, and low incidents.

3. **Build triage summary table**

   For each incident, extract: incident ID, severity, title, creation time, affected hosts, and organization.

4. **Highlight critical items**

   Flag critical severity incidents that need immediate attention and identify which clients are affected.

5. **Provide next-step recommendations**

   Suggest investigating the most critical incidents first using `/investigate-incident`.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| severity | string | No | all | Filter by severity (critical, high, low) |
| organization_id | string | No | all | Filter to a specific organization |
| limit | integer | No | 50 | Maximum number of incidents to return |

## Examples

### Triage All Open Incidents

```
/incident-triage
```

### Triage Critical Incidents Only

```
/incident-triage --severity critical
```

### Triage for a Specific Client

```
/incident-triage --organization_id "org-456"
```

## Error Handling

- **Authentication Error:** Verify `HUNTRESS_API_KEY` and `HUNTRESS_API_SECRET` are set correctly
- **Rate Limit:** Wait and retry; use severity or organization filters to reduce result set
- **No Results:** Confirm filters are correct; no open incidents is a good sign

## Related Commands

- `/investigate-incident` - Deep investigation of a specific incident
- `/org-health` - Organization health check
- `/resolve-escalation` - Review related escalations
