---
name: "Rootly Alerts"
description: >
  Rootly's alerting layer between monitoring tools and incident management: alert
  sources (`alerts_source`) and their webhook/email intake, alert routing rules,
  alert groups (deduplication/noise reduction), alert urgencies, escalation policies,
  and the acknowledge/resolve actions on an individual alert.
when_to_use: >-
  When configuring alert routing, escalation policies, or monitoring-tool integrations in
  Rootly, or tracing how an alert became an incident. Use when: rootly alert, alert routing,
  escalation policy, monitoring integration, alert rule, pagerduty, datadog alert, alert
  escalation, or on-call.
---

# Rootly Alerts

## Overview

Rootly's alerting system connects monitoring tools (Datadog, PagerDuty, New Relic, Grafana, etc.) to the incident management workflow. Each integration is registered as an **alert source**; alerts land in Rootly tagged with a source, status, and urgency, and can be attached to incidents. Routing rules and alert groups control where alerts go and how noisy duplicates are suppressed.

## Anti-triggers

PagerDuty appears here as an *upstream alert source and paging target*.
Questions about PagerDuty's own objects are not this skill.

- **Managing the PagerDuty side** — PagerDuty's own incidents, schedules,
  and escalation policies are `pagerduty-incidents`, `pagerduty-oncall`,
  and `pagerduty-alerts`. This skill only covers how a PagerDuty signal
  enters Rootly as an alert source and how Rootly pages back out to it.
- **The incident an alert became** — once an alert is attached to
  an incident via `attach_alert`, lifecycle, severity, and response
  coordination are `rootly-incidents`.
- **Alerts raised by another product** — RMM device alerts are
  `datto-rmm-alerts`, network alerts are `auvik-alerts`, EDR detections
  are `sentinelone-alerts`.
- **The automation that runs when an alert lands** — trigger, condition,
  and action definitions are `rootly-workflows`.

## Key Concepts

### Alert Sources

An **alert source** (`alerts_source`) is a configured integration -- Datadog, PagerDuty, New Relic, Grafana, Opsgenie, CloudWatch, or a custom webhook. Each source has:

- `source_type` -- Which integration this is
- `webhook_endpoint` / `email` -- Intake mechanism
- `alert_urgency_id` -- Default urgency applied to alerts from this source
- `owner_group_ids` -- Team(s) responsible for this source

### Alert Fields

An individual `alert` carries:

- `status` -- Alert status
- `source` -- The originating source
- `summary` / `description` -- What the alert is about
- `service_ids`, `group_ids`, `environment_ids` -- What it's scoped to
- `alert_urgency_id` -- Its urgency level
- `noise` -- Whether the alert is flagged as noise
- `external_id` / `external_url` -- Link back to the originating system

### Alert Urgencies

Alerts carry an **urgency** (`alert_urgency`) rather than a severity -- a named, ordered level (`name`, `description`, `position`) used to prioritize triage. This is a separate concept from an incident's severity.

### Alert Routing Rules

An **alert routing rule** (`alert_routing_rule`) determines how incoming alerts from a given source are handled:

- `alerts_source_id` -- Which source this rule applies to
- `condition_type` / `conditions` -- What must match for the rule to fire
- `destination` -- Where the matched alert is routed
- `enabled` -- Whether the rule is active

### Alert Groups

An **alert group** (`alert_group`) deduplicates or bundles related alerts to reduce noise:

- `condition_type` / `conditions` -- What alerts belong in the group
- `time_window` -- The grouping window
- `group_by_alert_title`, `group_by_alert_urgency` -- Grouping keys

### Escalation Policies

An **escalation policy** (`escalation_policy`) defines who is paged and how many times an alert repeats through the chain before giving up:

- `repeat_count` -- How many times to repeat the escalation chain
- `group_ids` -- Teams this policy applies to
- `service_ids` -- Services this policy covers
- `business_hours` -- Business-hours scoping for the policy

Escalation levels (`escalation_level`) and escalation paths (`escalation_path`) are nested under a policy and define the actual tiers/steps of the chain.

## API Patterns

### List Alerts

```
list_alerts
```

Parameters:
- `filter[status]` -- Filter by alert status
- `page[number]` / `page[size]` -- Pagination

**Example response:**

```json
{
  "data": [
    {
      "id": "alert-789",
      "type": "alerts",
      "attributes": {
        "summary": "High error rate on payment-service",
        "source": "datadog",
        "status": "triggered",
        "service_ids": ["svc-001"],
        "alert_urgency_id": "urgency-critical",
        "external_url": "https://app.datadoghq.com/monitors/12345"
      }
    }
  ]
}
```

### Get Alert Details

```
get_alert
```

Parameters:
- Alert ID

### Get Alert by Short ID

```
get_alert_by_short_id
```

Parameters:
- Alert short ID (as referenced in Slack or the web UI)

### Create / Update an Alert

```
create_alert
update_alert
```

### Acknowledge / Resolve an Alert

```
acknowledge_alert
resolve_alert
```

Parameters:
- Alert ID

### List Alert Sources

```
list_alerts_sources
```

Returns the configured integrations (Datadog, PagerDuty, custom webhook, etc.) and their intake settings.

### List Alert Routing Rules

```
list_alert_routing_rules
```

Parameters:
- Optionally scope by `alerts_source_id`

### List Alert Groups

```
list_alert_groups
```

### List Alert Urgencies

```
list_alert_urgencies
```

### List Escalation Policies

```
list_escalation_policies
```

## Common Workflows

### Alert Triage

1. Call `list_alerts` with `filter[status]=triggered`
2. Group by `source` and `alert_urgency_id`
3. Identify alerts not yet linked to an incident
4. For uncaught critical alerts, attach them to an incident with `attach_alert` (see [incidents](../incidents/SKILL.md))
5. `acknowledge_alert` once triage begins

### Escalation Policy Review

1. Call `list_escalation_policies`
2. Verify each critical service (`service_ids`) has a policy
3. Review `repeat_count` and `business_hours` for appropriateness
4. Confirm on-call schedules backing the policy are current (see [oncall](../oncall/SKILL.md))

### Alert Routing Audit

1. Call `list_alert_routing_rules` to get all rules
2. Map rules to `alerts_source_id` and `destination`
3. Identify sources without routing rules (gap)
4. Check for overly broad `conditions` that create noise
5. Review `list_alert_groups` to confirm noisy alerts are actually being deduplicated

### Monitoring Integration Check

1. Call `list_alerts_sources` to verify each integration is configured and has a `status` of active
2. List alerts by `source` to check for sources with no recent alerts (potential integration failure)
3. Verify `webhook_endpoint` connectivity for custom sources

## Error Handling

### Alert Not Found

**Cause:** Invalid alert ID or alert expired
**Solution:** List recent alerts to verify the correct ID, or try `get_alert_by_short_id`

### Routing Rule Conflict

**Cause:** Multiple routing rules match the same alert with conflicting `destination`
**Solution:** Review `position` ordering on routing rules; use more specific `conditions`

### Escalation Timeout

**Cause:** No responder acknowledged before the escalation chain repeated (`repeat_count` exhausted)
**Solution:** Review on-call schedules and ensure coverage

## Best Practices

- Map every critical service to an escalation policy via `service_ids`
- Use `alert_urgency` consistently so triage prioritization is meaningful
- Use alert groups to reduce noise from flapping/duplicate monitors
- Review alert routing rules monthly for accuracy
- Test integrations periodically by sending test alerts through the source's `webhook_endpoint`
- Tag alerts with `service_ids` and `environment_ids` for accurate routing
- Track alert-to-incident conversion (via `attach_alert`) as a reliability metric

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Incidents created from alerts
- [services](../services/SKILL.md) - Service-to-alert mapping
- [workflows](../workflows/SKILL.md) - Alert-triggered workflows
