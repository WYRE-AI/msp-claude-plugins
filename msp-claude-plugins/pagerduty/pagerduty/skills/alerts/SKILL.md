---
name: "PagerDuty Alerts"
description: >
  Use this skill when working with PagerDuty alerts -- alert management,
  alert grouping, suppression, event routing, and the Events API v2
  for sending trigger, acknowledge, and resolve events.
when_to_use: >-
  When working with alert management, alert grouping, suppression, event routing, and the Events
  API v2 for sending trigger, acknowledge, and resolve events in PagerDuty alerts. Use when:
  pagerduty alert, alert grouping, alert suppression, event routing, events api, pagerduty event,
  alert deduplication, or alert noise.
---

# PagerDuty Alerts

## Overview

Alerts are the raw signals from monitoring tools that flow into PagerDuty. When an alert is received, PagerDuty creates or updates an incident based on the service's alert grouping configuration. Multiple alerts can be grouped into a single incident to reduce noise. Alerts can also be suppressed via event rules to prevent unnecessary notifications.

## Key Concepts

### Alert vs. Incident

| Concept | Description |
|---------|-------------|
| **Alert** | A single signal from a monitoring tool (e.g., one Datadog alert) |
| **Incident** | A PagerDuty object that groups one or more related alerts; this is what responders interact with |

An incident may contain many alerts. Resolving an incident resolves all its alerts. Resolving individual alerts does not resolve the incident unless all alerts are resolved.

### Alert Statuses

| Status | Description |
|--------|-------------|
| `triggered` | Alert is active and contributing to an incident |
| `resolved` | Alert has been resolved (manually or via resolve event) |

### Alert Grouping

Alerts on a service can be automatically grouped into a single incident:

| Mode | Description |
|------|-------------|
| `intelligent` | ML-based grouping of related alerts |
| `time` | Alerts within a configurable time window are grouped |
| `content_based` | Alerts with matching field values are grouped |

### Event Rules & Suppression

Event rules process incoming events before they create alerts:
- **Routing rules** -- Route events to specific services
- **Suppression rules** -- Suppress known-noisy events to prevent alert creation
- **Severity mapping** -- Map event severity to PagerDuty urgency

### Deduplication

The `dedup_key` in the Events API controls deduplication:
- Events with the same `dedup_key` and `routing_key` are deduplicated
- A `trigger` event with an existing `dedup_key` adds an alert to the existing incident
- An `acknowledge` or `resolve` event with a `dedup_key` updates the existing alert

## API Patterns

### List Incident Alerts

```
pagerduty_list_incident_alerts
```

Parameters:
- `incident_id` -- The incident ID
- `statuses[]` -- Filter by status (triggered, resolved)
- `sort_by` -- Sort field (created_at)
- `include[]` -- Include related resources
- `limit` / `offset` -- Pagination

**Example response:**

```json
{
  "alerts": [
    {
      "id": "PALERT01",
      "type": "alert",
      "status": "triggered",
      "created_at": "2026-03-27T08:15:00Z",
      "severity": "critical",
      "summary": "CPU usage at 98% on web-server-01",
      "body": {
        "type": "alert_body",
        "details": {
          "metric": "cpu.usage",
          "value": 98,
          "threshold": 90,
          "host": "web-server-01"
        }
      },
      "incident": {
        "id": "P1234ABC",
        "type": "incident_reference"
      },
      "service": {
        "id": "PSVC123",
        "summary": "Web Application"
      }
    }
  ],
  "limit": 25,
  "offset": 0,
  "total": 1,
  "more": false
}
```

### Get Alert Details

```
pagerduty_get_alert
```

Parameters:
- `incident_id` -- The incident ID
- `alert_id` -- The alert ID

### Update Alert

```
pagerduty_update_alert
```

Parameters:
- `incident_id` -- The incident ID
- `alert_id` -- The alert ID
- `status` -- New status (`resolved`)

### Events API v2 (Sending Events)

The Events API v2 is used by monitoring tools to send events to PagerDuty. Events are sent to `https://events.pagerduty.com/v2/enqueue`.

**Trigger Event:**

```json
{
  "routing_key": "INTEGRATION_KEY",
  "event_action": "trigger",
  "dedup_key": "unique-alert-key",
  "payload": {
    "summary": "High CPU on web-server-01",
    "severity": "critical",
    "source": "monitoring-tool",
    "component": "web-server-01",
    "group": "production",
    "class": "cpu",
    "custom_details": {
      "cpu_percent": 98,
      "threshold": 90
    }
  }
}
```

**Acknowledge Event:**

```json
{
  "routing_key": "INTEGRATION_KEY",
  "event_action": "acknowledge",
  "dedup_key": "unique-alert-key"
}
```

**Resolve Event:**

```json
{
  "routing_key": "INTEGRATION_KEY",
  "event_action": "resolve",
  "dedup_key": "unique-alert-key"
}
```

### Event Severity Mapping

| Events API Severity | PagerDuty Urgency |
|---------------------|-------------------|
| `critical` | High |
| `error` | High |
| `warning` | Low |
| `info` | Low (may be suppressed) |

## Common Workflows

### Review Alerts for an Incident

1. Get incident details with `pagerduty_get_incident`
2. List alerts with `pagerduty_list_incident_alerts`
3. Review each alert's summary, severity, and details
4. Identify the root cause from alert details
5. Resolve individual alerts that are no longer relevant

### Reduce Alert Noise

1. Review incident frequency by service with analytics
2. Identify services with high alert-to-incident ratios
3. Enable intelligent alert grouping on noisy services
4. Create suppression rules for known false positives
5. Tune monitoring thresholds at the source

### Investigate Alert Details

1. List alerts for the incident
2. Get detailed alert body for each alert
3. Review `custom_details` for monitoring data
4. Cross-reference with monitoring tool dashboards
5. Add investigation notes to the incident

## Error Handling

### Alert Not Found

**Cause:** Invalid alert ID or alert belongs to a different incident
**Solution:** List alerts for the incident to find the correct ID

### Cannot Resolve Acknowledged Alert

**Cause:** Alert is in an unexpected state
**Solution:** Check current alert status before updating

### Events API Rate Limit

**Cause:** Exceeded 120 events per minute per integration key
**Solution:** Batch events or distribute across multiple integration keys

## Best Practices

- Use meaningful `dedup_key` values for proper deduplication
- Include rich `custom_details` in events for faster investigation
- Configure intelligent alert grouping to reduce incident noise
- Create suppression rules for planned maintenance or known issues
- Set appropriate severity levels at the event source
- Monitor alert-to-incident ratios to identify noisy services
- Use the Events API v2 (not v1) for all new integrations
- Include `source`, `component`, and `group` fields for better context

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Incidents that group alerts
- [services](../services/SKILL.md) - Services where alerts are routed
- [analytics](../analytics/SKILL.md) - Alert and incident volume metrics
