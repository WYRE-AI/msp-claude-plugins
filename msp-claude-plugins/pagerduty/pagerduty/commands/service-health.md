---
description: Check PagerDuty service health status and recent incident activity
argument-hint: "[service_name] [days]"
arguments: [service_name, days]
---

# PagerDuty Service Health

Check the health status of services by reviewing their current status, recent incident activity, MTTA/MTTR metrics, and maintenance windows. Provides a holistic view of service operational health.

## Prerequisites

- PagerDuty MCP server connected with valid API token
- MCP tools `list_services`, `get_service`, `list_incidents`, `list_maintenance_windows`, and analytics tools available

## Steps

1. **Fetch services**

   If `service_name` is provided, call `list_services` with `query` to find matching services. Otherwise, call `list_services` to get all services. Include `escalation_policies` and `teams` in the response.

2. **Check service status**

   For each service, report the current status: `active` (healthy), `warning` (acknowledged incidents), `critical` (triggered incidents), `maintenance` (in maintenance window), or `disabled`.

3. **Fetch recent incidents**

   Call `list_incidents` filtered by `service_ids[]` with `since` set to the current time minus `days` days. Count incidents by status and urgency.

4. **Get analytics metrics**

   Call `get_analytics_services` for the same time period filtered to the target services. Extract MTTA, MTTR, total incident count, and uptime percentage.

5. **Check maintenance windows**

   Call `list_maintenance_windows` filtered by `service_ids[]` with `filter=ongoing` and `filter=future` to show current and upcoming maintenance.

6. **Build health summary**

   For each service, present:
   - Current status
   - Total incidents in the period (by urgency)
   - Open incidents (triggered + acknowledged)
   - MTTA and MTTR
   - Uptime percentage
   - Current/upcoming maintenance windows

7. **Provide recommendations**

   Flag services with degrading metrics, high incident counts, or missing escalation policies. Suggest reviewing alert grouping for noisy services.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| service_name | string | No | all | Service name to check (partial match supported) |
| days | integer | No | 7 | Number of days of history to review |

## Examples

### Check All Services

```
/service-health
```

### Check a Specific Service

```
/service-health --service_name "Payment API"
```

### Check Service Health with 30-Day History

```
/service-health --service_name "Auth Service" --days 30
```

## Error Handling

- **Service Not Found:** Verify the service name; use `list_services` to find available services
- **No Incident Data:** The service may not have had any incidents in the selected time period
- **Analytics Not Available:** Analytics may require a higher PagerDuty plan tier
- **Authentication Error:** Verify `PAGERDUTY_API_TOKEN` is set correctly

## Related Commands

- `/incident-triage` - Triage open incidents across all services
- `/oncall-schedule` - Check who is on call for a service's escalation policy
- `/create-incident` - Create a new incident on a service
- `/escalate-incident` - Escalate an incident on a service
