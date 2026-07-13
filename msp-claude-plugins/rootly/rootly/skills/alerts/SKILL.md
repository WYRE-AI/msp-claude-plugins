---
name: "Rootly Alerts"
description: >
  Use this skill when working with Rootly alerts -- alert routing, escalation
  policies, integration with monitoring tools (Datadog, PagerDuty, etc.),
  alert-to-incident creation, and managing alert rules.
when_to_use: >-
  When working with alert routing, escalation policies, integration with monitoring tools
  (Datadog, PagerDuty, etc.), alert-to-incident creation. Use when: rootly alert, alert routing,
  escalation policy, monitoring integration, alert rule, pagerduty, datadog alert, alert
  escalation, or on-call.
---

# Rootly Alerts

## Overview

Rootly's alerting system connects monitoring tools (Datadog, PagerDuty, New Relic, Grafana, etc.) to the incident management workflow. Alerts are routed through configurable rules to the right teams, and can automatically create incidents based on conditions. Escalation policies ensure alerts are acknowledged within SLA windows.

## Key Concepts

### Alert Sources

Rootly integrates with common monitoring tools:

- **Datadog** -- Monitors and alerts
- **PagerDuty** -- On-call and escalation
- **New Relic** -- APM alerts
- **Grafana** -- Dashboard alerts
- **Opsgenie** -- Alert management
- **CloudWatch** -- AWS infrastructure alerts
- **Custom Webhooks** -- Any HTTP-based alert source

### Alert Routing

Alert routing rules determine how incoming alerts are handled:

- **Match Conditions** -- Which alerts trigger the rule (source, severity, tags)
- **Target** -- Which team or channel receives the alert
- **Actions** -- What happens (create incident, notify, escalate)
- **Suppression** -- Deduplicate or silence noisy alerts

### Escalation Policies

Escalation policies define the escalation chain when alerts are not acknowledged:

- **Level 1** -- Primary on-call responder
- **Level 2** -- Secondary on-call or team lead
- **Level 3** -- Engineering manager or incident commander
- **Timeout** -- Time before escalating to next level

### Alert-to-Incident Flow

1. Alert arrives from monitoring tool
2. Routing rules match the alert
3. If conditions met, an incident is created automatically
4. Severity is mapped from alert priority
5. Services are tagged based on alert metadata
6. Responders are notified via Slack, email, or phone

## API Patterns

### List Alerts

```
rootly_list_alerts
```

Parameters:
- `status` -- Filter by status (triggered, acknowledged, resolved)
- `source` -- Filter by alert source
- `service` -- Filter by affected service

**Example response:**

```json
{
  "data": [
    {
      "id": "alert-789",
      "type": "alerts",
      "attributes": {
        "title": "High error rate on payment-service",
        "source": "datadog",
        "status": "triggered",
        "severity": "critical",
        "service": { "name": "payment-service" },
        "created_at": "2026-03-27T14:15:00Z",
        "incident_id": "inc-456"
      }
    }
  ]
}
```

### Get Alert Details

```
rootly_get_alert
```

Parameters:
- `alert_id` -- The alert ID

### List Escalation Policies

```
rootly_list_escalation_policies
```

Parameters:
- `team` -- Filter by team

### List Alert Routes

```
rootly_list_alert_routes
```

Parameters:
- `service` -- Filter by service
- `source` -- Filter by alert source

## Common Workflows

### Alert Triage

1. Call `rootly_list_alerts` with `status=triggered`
2. Group by source and severity
3. Identify alerts not yet linked to incidents
4. Check if auto-incident creation rules are working
5. Manually create incidents for uncaught critical alerts

### Escalation Policy Review

1. Call `rootly_list_escalation_policies`
2. Verify each critical service has a policy
3. Check timeout intervals are appropriate
4. Confirm on-call schedules are current
5. Test escalation paths for completeness

### Alert Routing Audit

1. Call `rootly_list_alert_routes` to get all rules
2. Map rules to services and teams
3. Identify services without routing rules (gap)
4. Check for overly broad rules that create noise
5. Verify suppression rules are not hiding critical alerts

### Monitoring Integration Check

1. List alerts by source to verify each integration is active
2. Check for sources with no recent alerts (potential integration failure)
3. Verify alert metadata (severity, service tags) maps correctly
4. Test webhook connectivity for custom sources

## Error Handling

### Alert Not Found

**Cause:** Invalid alert ID or alert expired
**Solution:** List recent alerts to verify the correct ID

### Routing Rule Conflict

**Cause:** Multiple routing rules match the same alert with conflicting actions
**Solution:** Review and prioritize routing rules; use more specific match conditions

### Escalation Timeout

**Cause:** No responder acknowledged within the policy timeout
**Solution:** Review on-call schedules and ensure coverage

## Best Practices

- Map every critical service to an escalation policy
- Set appropriate timeouts per severity level (5 min for SEV0, 15 min for SEV1)
- Use suppression rules to reduce alert fatigue from noisy monitors
- Review alert routing rules monthly for accuracy
- Test integrations periodically by sending test alerts
- Tag alerts with service and environment for accurate routing
- Configure auto-incident creation for critical alert patterns
- Track alert-to-incident conversion rates as a reliability metric

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Incidents created from alerts
- [services](../services/SKILL.md) - Service-to-alert mapping
- [workflows](../workflows/SKILL.md) - Alert-triggered workflows
