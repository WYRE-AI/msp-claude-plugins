---
description: Find a Domotz device by name, IP address, or MAC address
argument-hint: "<query> [agent_id]"
arguments: [query, agent_id]
---

# Device Lookup

Find a device across all monitored Domotz sites by name, IP address, or MAC address. Returns device details including status, vendor, type, and the site where it was found.

## Prerequisites

- Domotz MCP server connected with valid API credentials
- MCP tools `domotz_list_agents`, `domotz_search_devices`, and `domotz_get_device` available

## Steps

1. **Determine search scope**

   If `agent_id` is provided, search only that agent. Otherwise, call `domotz_list_agents` to get all agents and search across all sites.

2. **Search for the device**

   For each agent in scope, call `domotz_search_devices` with the `query` parameter. Collect all matching results.

3. **Enrich results**

   For each match, extract: device name, IP address, MAC address, vendor, device type, status (online/offline), and the agent/site name.

4. **Present results**

   Display matching devices in a table with site context. If multiple matches found, list all. If no matches, suggest checking the query format or trying a different search term.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search term -- device name, IP (e.g., 192.168.1.1), or MAC (e.g., AA:BB:CC:DD:EE:FF) |
| agent_id | integer | No | Limit search to a specific agent/site |

## Examples

### Find by IP Address

```
/device-lookup --query "192.168.1.1"
```

### Find by MAC Address

```
/device-lookup --query "AA:BB:CC:DD:EE:FF"
```

### Find by Name

```
/device-lookup --query "Core Switch"
```

### Find at a Specific Site

```
/device-lookup --query "printer" --agent_id "12345"
```

## Error Handling

- **No Results:** Verify the query format; try partial matches; check that the device is on a monitored network
- **Authentication Error:** Verify `DOMOTZ_API_KEY` and `DOMOTZ_REGION` are set correctly
- **Rate Limit:** If searching many agents, results may be throttled; narrow scope with `agent_id`

## Related Commands

- `/device-inventory` - List all devices at a site
- `/network-scan` - Trigger a network scan to discover new devices
- `/site-overview` - Full site health overview
