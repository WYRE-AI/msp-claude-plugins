---
description: List all devices at a Domotz-monitored site
argument-hint: "<agent_id> [status] [type]"
arguments: [agent_id, status, type]
---

# Device Inventory

List and categorize all devices discovered at a Domotz-monitored site. Provides device counts, status breakdown, vendor distribution, and highlights devices needing attention.

## Prerequisites

- Domotz MCP server connected with valid API credentials
- MCP tools `domotz_agents_get`, `domotz_devices_list`, `domotz_devices_get`, and `domotz_devices_inventory` available

## Steps

1. **Verify the agent**

   Call `domotz_agents_get` to confirm the agent exists, get the site name, and check it is ONLINE. If the collector is offline, say so up front — everything below will be last-known data presented as current.

2. **List all devices**

   Call `domotz_devices_list` with the `agent_id`. The full census returns in one response; there are no pagination arguments.

3. **Apply filters**

   If `status` or `type` filters are provided, narrow the result set client-side. The tool has no filter arguments.

4. **Aggregate statistics**

   Compute:
   - Total devices
   - Devices by status (online/offline)
   - Devices by type (servers, workstations, network devices, printers, IoT, other)
   - Devices by vendor (top 10 vendors)

5. **Build inventory table**

   For each device, show: device name, IP address, MAC address, vendor, type, status, and last status change. For devices that matter, call `domotz_devices_inventory` to pick up operator-maintained owner, location, and notes — that metadata is empty unless somebody filled it in.

6. **Highlight issues**

   Flag:
   - Offline devices that were recently online
   - Devices with unknown vendor (may need manual classification)
   - Recently discovered devices (new to the network)

7. **Handle the census responsibly**

   At a small business this list includes staff phones, personal laptops, and smart TVs alongside managed assets. Treat it as premises data about people. Do not paste a full census into a customer-facing document without checking that is what was asked for.

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

- **Large Result Sets:** The whole census arrives in one response; expect a large payload for a big site rather than several pages
- **Agent Offline:** Data may be stale if the agent is offline; report the last seen time and label the inventory as last-known
- **No Devices:** The agent may not have completed its initial scan. There is no scan-trigger tool — verify the agent is online and wait for its own cycle
- **Authentication Error:** Verify API credentials and region

## Related Commands

- `/device-lookup` - Find a specific device by name/IP/MAC
- `/site-overview` - Full site health overview
