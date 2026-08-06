---
description: Overview of a Domotz site's network health
argument-hint: "<agent_id>"
arguments: [agent_id]
---

# Site Overview

Generate a health overview for a Domotz-monitored site from collector status, device state, and network faults.

The overview is built from **device state**, not from alerts. Domotz's MCP
surface exposes alert *configuration* only — there is no way to query
fired alerts — so do not present this as an alert report.

## Prerequisites

- Domotz MCP server connected with valid API credentials
- MCP tools `domotz_agents_get`, `domotz_devices_list`, `domotz_network_ip_conflicts`, and `domotz_devices_history` available

## Steps

1. **Get agent details**

   Call `domotz_agents_get` with the `agent_id` to get site name, status, license info, and last seen time. **If the collector is OFFLINE, stop and say so.** Everything below would be last-known data reported as if it were current, which is worse than no report.

2. **Get device summary**

   Call `domotz_devices_list` for the agent. The full census arrives in one response. Aggregate:
   - Total devices
   - Online vs offline count
   - Devices by type
   - Top vendors

3. **Check for network faults**

   Call `domotz_network_ip_conflicts` for the agent. Addressing collisions present as intermittent device faults and are easily misread as failing hardware.

4. **Qualify the offline devices**

   For offline devices that matter, call `domotz_devices_history` to distinguish a clean outage from a device that has been flapping. A count of offline devices without this is not actionable.

5. **Build health report**

   Present a structured overview:
   - **Site Info** - Name, agent status, last seen, license utilization
   - **Device Health** - Total devices, online/offline breakdown, notable offline infrastructure
   - **Network Faults** - IP conflicts, if any
   - **Overall Assessment** - Healthy / Warning / Critical, with the evidence behind it

   State explicitly that this reflects device state observed by the collector, not what Domotz alerted on.

6. **Recommend actions**

   Flag any issues needing attention: offline infrastructure, flapping devices, IP conflicts, or license capacity concerns.

7. **Optionally check monitoring coverage**

   Call `domotz_alerts_profiles_list` and, for key devices, `domotz_alerts_device_list` to report which devices would actually generate a notification if they failed. Devices with no binding are silent on failure — usually the most useful finding in this report.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agent_id | integer | Yes | The agent/site to review |

## Examples

### Get Site Overview

```
/site-overview --agent_id "12345"
```

## Error Handling

- **Agent Not Found:** Verify the agent ID; call `domotz_agents_list` to find the correct one
- **Agent Offline:** Report that the collector is offline and that no site health assessment can be made from stale records
- **Asked for active alerts:** There is no fired-alert surface on this server. Say so and offer the coverage view in step 7 instead of synthesising alerts from device status
- **Authentication Error:** Verify API credentials and region

## Related Commands

- `/device-inventory` - Detailed device list for the site
- `/device-lookup` - Find a specific device at the site
