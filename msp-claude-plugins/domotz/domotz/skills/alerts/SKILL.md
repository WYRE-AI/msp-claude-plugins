---
name: "Domotz Alerts"
description: >
  Domotz alerting: the alert types (device status, SNMP threshold, port, Eyes,
  agent, speed test, new device), how alert profiles define triggers, severity,
  notification channels and scope, the triggered/active/resolved lifecycle, and
  the tools for listing alerts and profiles.
when_to_use: >-
  When reviewing, triaging, or reasoning about Domotz alerts and alert profile
  coverage. Use when: domotz alert, alert profile, alert
  status, alert trigger, alert notification, device alert, network alert, or monitoring alert.
---

# Domotz Alerts

## Overview

Domotz provides a comprehensive alerting system that monitors device status, network conditions, and sensor results. Alerts are generated when monitored conditions meet configured thresholds and can be routed to various notification channels including email, webhooks, and PSA integrations.

## Anti-triggers

- **A security detection** — Domotz alerts are availability and
  threshold conditions, never threat findings; use
  `huntress-incidents`.
- **An incident record with acknowledgement, escalation, and MTTR** —
  Domotz alerts have no responder lifecycle; use
  `betterstack-incidents`, `pagerduty-incidents`, or
  `rootly-incidents`.
- **The same condition seen across every client** — if the question
  spans tenants rather than one site, use `auvik-alerts`.

## Key Concepts

### Alert Types

- **Device Status** - Device goes online/offline
- **SNMP Threshold** - SNMP polled value exceeds configured threshold
- **Port Status** - TCP port becomes reachable/unreachable
- **Domotz Eyes** - Sensor check fails or exceeds latency threshold
- **Agent Status** - Agent goes offline
- **Speed Test** - Bandwidth drops below threshold
- **New Device** - Previously unseen device appears on network

### Alert Profiles

Alert profiles define the conditions and notification channels for alerts. Each profile specifies:
- **Trigger condition** - What event generates the alert
- **Severity** - Priority level of the alert
- **Notification channels** - Where alerts are sent (email, webhook, PSA)
- **Scope** - Which agents/devices the profile applies to

### Alert Lifecycle

1. **Triggered** - Condition met, alert created
2. **Active** - Alert is ongoing
3. **Resolved** - Condition cleared, alert closed

## API Patterns

### List Active Alerts

```
domotz_list_alerts
```

Parameters:
- `agent_id` -- Filter alerts by agent (optional)
- `page` -- Page number
- `page_size` -- Results per page

**Example response:**

```json
[
  {
    "id": 5678,
    "agent_id": 12345,
    "device_id": 789,
    "type": "device_status",
    "severity": "critical",
    "message": "Device 'Core Switch' went OFFLINE",
    "created_at": "2026-03-27T14:00:00Z",
    "status": "active"
  }
]
```

### Get Alert Details

```
domotz_get_alert
```

Parameters:
- `alert_id` -- The specific alert ID

### List Alert Profiles

```
domotz_list_alert_profiles
```

Parameters:
- `agent_id` -- Filter profiles by agent (optional)

## Common Workflows

### Check Active Alerts Across All Sites

1. Call `domotz_list_agents` to get all agents
2. For each agent, call `domotz_list_alerts`
3. Aggregate alerts across all sites
4. Sort by severity (critical first)
5. Present a summary table with alert type, device, site, and age

### Review Alert Profile Coverage

1. Call `domotz_list_alert_profiles`
2. Check which agents/devices are covered
3. Identify gaps in monitoring coverage
4. Recommend additional profiles for unmonitored conditions

### Alert Triage

1. List active alerts sorted by severity
2. Group by agent (site) to identify sites with most issues
3. Check device status for each alerted device
4. Prioritize critical alerts for immediate action
5. Recommend resolution steps based on alert type

## Error Handling

### No Active Alerts

**Cause:** No conditions currently triggered (this is good)
**Solution:** Verify alert profiles are configured; check that agents are online

### Alert Profile Not Found

**Cause:** Invalid profile ID or profile has been deleted
**Solution:** List current profiles to verify available IDs

### Too Many Alerts

**Cause:** Noisy monitoring or cascading failure
**Solution:** Check for agent-level issues; review alert profile thresholds

## Best Practices

- Configure alerts for all critical network devices (switches, routers, firewalls)
- Set up device offline alerts with appropriate delay to avoid flapping
- Use SNMP threshold alerts for bandwidth, CPU, and disk monitoring
- Route critical alerts to PSA for automatic ticket creation
- Review and tune alert profiles periodically to reduce noise
- Monitor agent offline alerts to detect site connectivity issues

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and rate limiting
- [agents](../agents/SKILL.md) - Agents that generate alerts
- [devices](../devices/SKILL.md) - Devices that trigger alerts
- [network](../network/SKILL.md) - Network conditions that cause alerts
- [eyes](../eyes/SKILL.md) - Sensor checks that generate alerts
