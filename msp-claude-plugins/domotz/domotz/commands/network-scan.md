---
description: Scan a network for devices via a Domotz agent
argument-hint: "<agent_id>"
arguments: [agent_id]
---

# Network Scan

Trigger a network discovery scan from a Domotz agent to find all devices on the monitored network. After the scan completes, displays a summary of discovered devices.

## Prerequisites

- Domotz MCP server connected with valid API credentials
- MCP tools `domotz_scan_network`, `domotz_list_devices`, and `domotz_get_agent` available

## Steps

1. **Verify the agent**

   Call `domotz_get_agent` to confirm the agent exists and is online. If the agent is offline, report that and stop.

2. **Trigger the scan**

   Call `domotz_scan_network` with the `agent_id` to initiate a network discovery scan.

3. **Retrieve device list**

   Call `domotz_list_devices` for the agent. Paginate through all results.

4. **Build scan summary**

   Aggregate results:
   - Total devices discovered
   - Devices by type (servers, workstations, network devices, printers, IoT, other)
   - Devices by status (online/offline)
   - Devices by vendor (top vendors)

5. **Highlight new devices**

   Flag recently discovered devices (recent `first_seen` dates) that may need investigation.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agent_id | integer | Yes | The agent/site to scan |

## Examples

### Scan a Site

```
/network-scan --agent_id "12345"
```

## Error Handling

- **Agent Offline:** The agent must be online to perform a scan; check agent connectivity
- **Scan Timeout:** Large networks may take time; wait and check device list later
- **Authentication Error:** Verify API credentials and region

## Related Commands

- `/device-inventory` - Detailed device inventory for a site
- `/device-lookup` - Find a specific device
- `/site-overview` - Full site health overview
