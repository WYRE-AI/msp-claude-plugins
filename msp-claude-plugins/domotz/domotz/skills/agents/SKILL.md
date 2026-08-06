---
name: "Domotz Agents"
description: >
  Domotz agents (collectors/probes) as the per-site entry point for all device
  and network operations: agent types, lifecycle, ONLINE/OFFLINE status, the
  list/get tools and their license and last-seen fields, and fleet health,
  site inventory, and capacity-planning workflows.
when_to_use: >-
  When listing agents, checking collector health, or working with Domotz sites.
  Use when: domotz
  agent, domotz collector, domotz site, domotz probe, agent health, agent status, agent list,
  collector management, or site management.
---

# Domotz Agents

## Overview

Domotz agents (also called collectors or probes) are software or hardware appliances deployed at customer sites that perform network discovery, device monitoring, and data collection. Each agent represents a monitored site/location and is the entry point for all device and network operations.

## Anti-triggers

- **Claude subagents** — "agent" here is a site collector appliance,
  never an AI subagent definition under `agents/*.md`.
- **Software installed on a workstation or server** — Domotz agents are
  one per site, not one per endpoint. RMM endpoint agents are `atera`
  or `ncentral`; the Huntress endpoint sensor is `huntress-agents`.
- **What the collector found** — this skill covers the collector's own
  health, licensing, and connectivity; the devices it discovered are
  `domotz-devices`.

## Key Concepts

### Agent Types

- **Software Agent** - Installed on a VM or physical machine at the site
- **Domotz Box** - Dedicated hardware appliance
- **Virtual Appliance** - Pre-configured VM image

### Agent Lifecycle

Agents are deployed at customer sites and maintain a persistent connection to the Domotz cloud. Each agent:
- Discovers and monitors devices on local networks
- Runs its own scan cycle on a schedule it controls — this integration
  cannot trigger one
- Polls SNMP metrics from devices that support it
- Evaluates the alert profiles bound to its devices

### Agent Status

| Status | Meaning |
|--------|---------|
| `ONLINE` | Agent is connected and reporting |
| `OFFLINE` | Agent is not connected to the cloud |

## Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `domotz_agents_list` | Every agent on the account, with status, IP, and location | *(none)* |
| `domotz_agents_get` | Detail for one collector | `agent_id` |

These two are the only account-wide entry point. Every other Domotz tool
requires an `agent_id`, so a fleet answer always starts here and then
fans out one call per agent.

Do not confuse `domotz_status` with agent status: `domotz_status` reports
whether the *MCP server* can reach Domotz at all. A collector's own state
is the `status` field on these two tools.

### List Agents

```
domotz_agents_list
```

Returns all agents associated with your account. Takes no arguments.

**Example response:**

```json
[
  {
    "id": 12345,
    "display_name": "Acme Corp - Main Office",
    "status": {
      "value": "ONLINE"
    },
    "license": {
      "bound_devices": 47
    },
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "last_seen": "2026-03-27T15:30:00Z"
  }
]
```

### Get Agent Details

```
domotz_agents_get
```

Parameters:
- `agent_id` -- The specific agent ID (required, number)

**Example response:**

```json
{
  "id": 12345,
  "display_name": "Acme Corp - Main Office",
  "status": {
    "value": "ONLINE"
  },
  "license": {
    "bound_devices": 47,
    "allowed_devices": 100
  },
  "access_right": {
    "api_enabled": true
  },
  "creation_time": "2025-01-15T10:00:00Z",
  "last_seen": "2026-03-27T15:30:00Z"
}
```

## Common Workflows

### Fleet Health Check

1. Call `domotz_agents_list` to get all agents
2. Group by status (ONLINE/OFFLINE)
3. Flag agents not seen in >1 hour as potentially unhealthy
4. Check `license.bound_devices` vs `license.allowed_devices` for capacity

This is the check that gates every other Domotz report. An offline
collector keeps serving its last-known device and metric data, so any
downstream read from that site is stale in a way the payload does not
advertise. Do it first, not last.

### Site Inventory

1. Call `domotz_agents_list` to get all sites
2. For each agent, note `display_name`, status, and bound device count
3. Build a summary table of all monitored sites

### Agent Capacity Planning

1. List all agents
2. Compare `bound_devices` to `allowed_devices` for each
3. Flag agents approaching their device limit
4. Recommend license upgrades where needed

## Error Handling

### Agent Not Found

**Cause:** Invalid agent ID or agent has been deleted
**Solution:** Verify the agent ID; check if the site was decommissioned

### Agent Offline

**Cause:** Network connectivity issue, agent service stopped, or hardware failure
**Solution:** Check site connectivity; verify agent service is running; contact site contact

### Empty Agent List

**Cause:** No agents deployed or API key has limited scope
**Solution:** Verify API key permissions; check Domotz Portal for agent list

## Best Practices

- Check agent status before trusting anything downstream of it
- Monitor `last_seen` timestamps to detect offline agents early
- Track `bound_devices` vs `allowed_devices` for license planning
- Use `display_name` consistently with client site names in your PSA
- Cross-reference agent sites with RMM site structures
- Set up alerts for agent offline events in the Domotz portal — this
  integration reads alert configuration but cannot create it
- `domotz_agents_get` returns site location coordinates and licence
  counts; treat it as customer data, not just an operational read

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, tool catalog, error codes
- [devices](../devices/SKILL.md) - Devices monitored by agents
- [alerts](../alerts/SKILL.md) - Alert profile coverage
- [network](../network/SKILL.md) - Topology, IP conflicts, and SNMP metrics
- [power](../power/SKILL.md) - PDU outlet control
