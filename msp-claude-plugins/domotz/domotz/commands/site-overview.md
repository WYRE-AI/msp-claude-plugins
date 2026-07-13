---
description: Overview of a Domotz site's network health
argument-hint: "<agent_id>"
arguments: [agent_id]
---

# Site Overview

Generate a comprehensive health overview for a Domotz-monitored site including agent status, device counts, active alerts, and sensor health.

## Prerequisites

- Domotz MCP server connected with valid API credentials
- MCP tools `domotz_get_agent`, `domotz_list_devices`, `domotz_list_alerts`, and `domotz_list_eyes` available

## Steps

1. **Get agent details**

   Call `domotz_get_agent` with the `agent_id` to get site name, status, license info, and last seen time.

2. **Get device summary**

   Call `domotz_list_devices` for the agent. Paginate through all results. Aggregate:
   - Total devices
   - Online vs offline count
   - Devices by type
   - Top vendors

3. **Get active alerts**

   Call `domotz_list_alerts` for the agent. Count and categorize by severity and type.

4. **Get sensor status**

   Call `domotz_list_eyes` for the agent. Summarize:
   - Total sensors
   - UP vs DOWN vs WARNING counts
   - Average latency across sensors

5. **Build health report**

   Present a structured overview:
   - **Site Info** - Name, agent status, license utilization
   - **Device Health** - Total devices, online/offline breakdown
   - **Alert Summary** - Active alerts by severity
   - **Sensor Health** - Eyes status summary
   - **Overall Health Score** - Quick assessment (Healthy / Warning / Critical)

6. **Recommend actions**

   Flag any issues needing attention: offline devices, active critical alerts, DOWN sensors, or license capacity concerns.

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

- **Agent Not Found:** Verify the agent ID; list agents to find correct ID
- **Agent Offline:** Report that the agent is offline and data may be stale
- **Authentication Error:** Verify API credentials and region

## Related Commands

- `/device-inventory` - Detailed device list for the site
- `/alert-status` - Detailed alert breakdown
- `/network-scan` - Trigger a fresh network scan
- `/device-lookup` - Find a specific device at the site
