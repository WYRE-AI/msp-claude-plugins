---
description: List all devices at a Domotz-monitored site
argument-hint: "<agent_id> [status] [type]"
arguments: [agent_id, status, type]
---

# Device Inventory

List and categorize all devices discovered at a Domotz-monitored site. Provides device counts, status breakdown, vendor distribution, and highlights devices needing attention.

## Prerequisites

- Domotz MCP server connected with valid API credentials
- MCP tools `domotz_get_agent`, `domotz_list_devices`, and `domotz_get_device` available

## Steps

1. **Verify the agent**

   Call `domotz_get_agent` to confirm the agent exists and get the site name.

2. **List all devices**

   Call `domotz_list_devices` with the `agent_id`. Paginate through all results.

3. **Apply filters**

   If `status` or `type` filters are provided, narrow the result set accordingly.

4. **Aggregate statistics**

   Compute:
   - Total devices
   - Devices by status (online/offline)
   - Devices by type (servers, workstations, network devices, printers, IoT, other)
   - Devices by vendor (top 10 vendors)

5. **Build inventory table**

   For each device, show: device name, IP address, MAC address, vendor, type, status, and last status change.

6. **Highlight issues**

   Flag:
   - Offline devices that were recently online
   - Devices with unknown vendor (may need manual classification)
   - Recently discovered devices (new to the network)

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agent_id | integer | Yes | The agent/site to inventory |
| status | string | No | Filter by status (ONLINE, OFFLINE) |
| type | string | No | Filter by device type |

## Examples

### Full Device Inventory

```
/device-inventory --agent_id "12345"
```

### Online Devices Only

```
/device-inventory --agent_id "12345" --status "ONLINE"
```

### Network Devices Only

```
/device-inventory --agent_id "12345" --type "network"
```

## Error Handling

- **Large Result Sets:** Devices are paginated; all pages are fetched automatically
- **Agent Offline:** Data may be stale if the agent is offline; report the last seen time
- **No Devices:** Agent may not have completed initial scan; suggest running `/network-scan`
- **Authentication Error:** Verify API credentials and region

## Related Commands

- `/device-lookup` - Find a specific device by name/IP/MAC
- `/network-scan` - Trigger a fresh network scan
- `/site-overview` - Full site health overview
- `/alert-status` - Check alerts for devices at this site
