---
name: "Blumira Agents"
description: >
  Use this skill when working with Blumira agents, devices, and agent keys,
  including listing devices, checking agent health, and managing agent
  deployment keys.
when_to_use: >-
  When working with Blumira agents, devices, and agent keys, including listing devices, checking
  agent health, and managing agent deployment keys. Use when: blumira agent, blumira device, agent
  key, device inventory, agent health, or sensor status.
---

# Blumira Agents & Devices

## Overview

Blumira agents (sensors) are deployed on devices to collect log data and detect threats. This skill covers device inventory management, agent health monitoring, and agent key management for deployments.

## Key Concepts

### Devices

Devices represent endpoints, servers, or network appliances with Blumira agents installed. Each device record includes agent status, last seen time, OS information, and network details.

### Agent Keys

Agent keys are deployment tokens used to register new agents with your Blumira organization. Keys can be scoped and rotated as needed.

## API Patterns

### List Devices

```
blumira_agents_devices_list
  page_size=50
  order_by=-last_seen
```

Filter examples:
```
blumira_agents_devices_list
  os.contains=Windows
  status.eq=active
```

### Get Device Details

```
blumira_agents_devices_get
  device_id=<UUID>
```

### List Agent Keys

```
blumira_agents_keys_list
```

### Get Agent Key Details

```
blumira_agents_keys_get
  key_id=<UUID>
```

## Common Workflows

### Agent Health Check

1. `blumira_agents_devices_list` with `order_by=last_seen` to find stale agents
2. Identify devices that haven't checked in recently
3. Cross-reference with user/admin to determine if device is offline or agent needs attention
4. Document findings for remediation

### Device Inventory Audit

1. `blumira_agents_devices_list` with `page_size=100` to enumerate all devices
2. Page through results using pagination
3. Group by OS, status, or location for reporting
4. Identify gaps in coverage (known devices without agents)

### Agent Deployment

1. `blumira_agents_keys_list` to find available deployment keys
2. Use key details to provision new agents
3. After deployment, verify with `blumira_agents_devices_list` that the new device appears

## Error Handling

### Device Not Found

**Cause:** Invalid device ID or device not in current org scope
**Solution:** Verify the device ID with `blumira_agents_devices_list`.

### No Agent Keys Available

**Cause:** No keys have been created for the organization
**Solution:** Agent keys must be created in the Blumira portal. The API is read-only for key management.

## Best Practices

- Monitor `last_seen` timestamps to catch offline agents early
- Audit device inventory regularly against known asset lists
- Rotate agent keys periodically for security
- Use filtering to segment inventory by OS or status for targeted reporting
- For MSP environments, use `blumira_msp_devices_list` to audit across accounts

## Related Skills

- [API Patterns](../api-patterns/SKILL.md) — Filtering and pagination
- [MSP](../msp/SKILL.md) — MSP device management across accounts
- [Users](../users/SKILL.md) — Correlating devices with users
