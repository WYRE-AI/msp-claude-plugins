---
description: Triage current open PagerDuty incidents by urgency and priority
argument-hint: "[urgency] [service_name] [limit]"
arguments: [urgency, service_name, limit]
---

# PagerDuty Incident Triage

Triage open incidents across all services. Lists triggered and acknowledged incidents sorted by urgency and creation time, with a summary of counts by urgency level. This is the primary daily workflow for on-call responders and MSP security operations.

## Prerequisites

- PagerDuty MCP server connected with valid API token
- MCP tools `list_incidents` and `get_incident` available

## Steps

1. **Fetch open incidents**

   Call `list_incidents` with `statuses[]=triggered&statuses[]=acknowledged`. If `urgency` or `service_name` filters are provided, include them. If filtering by service name, first call `list_services` with `query` to resolve the service ID. Paginate through all results up to the specified `limit`.

2. **Count incidents by urgency**

   Aggregate results to show counts of high and low urgency incidents.

3. **Build triage summary table**

   For each incident, extract: incident number, urgency, priority, title, creation time, service name, and current assignee.

4. **Highlight critical items**

   Flag high-urgency triggered (unacknowledged) incidents that need immediate attention. Identify which services are affected.

5. **Check for similar past incidents**

   For each high-urgency incident, call `list_past_incidents` to find historically similar incidents and their resolutions.

6. **Provide next-step recommendations**

   Suggest acknowledging the most urgent incidents first. Recommend investigating with `/escalate-incident` for incidents that have been open too long.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| urgency | string | No | all | Filter by urgency (high, low) |
| service_name | string | No | all | Filter to a specific service by name |
| limit | integer | No | 50 | Maximum number of incidents to return |

## Examples

### Triage All Open Incidents

```
/incident-triage
```

### Triage High-Urgency Incidents Only

```
/incident-triage --urgency high
```

### Triage for a Specific Service

```
/incident-triage --service_name "Payment API"
```

## Error Handling

- **Authentication Error:** Verify `PAGERDUTY_API_TOKEN` is set correctly; use Token format, not Bearer
- **Rate Limit:** Wait and retry; use urgency or service filters to reduce result set
- **No Results:** Confirm filters are correct; no open incidents is a good sign

## Related Commands

- `/create-incident` - Create a new incident
- `/escalate-incident` - Escalate an incident to the next level
- `/oncall-schedule` - Check who is currently on call
- `/service-health` - Check service health status
