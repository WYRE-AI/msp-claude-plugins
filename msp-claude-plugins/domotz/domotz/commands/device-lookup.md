---
description: Find a Domotz device by name, IP address, or MAC address
argument-hint: "<query> [agent_id]"
arguments: [query, agent_id]
---

# Device Lookup

Find a device across all monitored Domotz sites by name, IP address, or MAC address. Returns device details including status, vendor, type, and the site where it was found.

Domotz has no server-side device search, so this command lists each site's
devices and matches locally.

## Prerequisites

- Domotz MCP server connected with valid API credentials
- MCP tools `domotz_agents_list`, `domotz_devices_list`, and `domotz_devices_get` available

## Steps

1. **Determine search scope**

   If `agent_id` is provided, search only that agent. Otherwise, call `domotz_agents_list` to get all agents and search across all sites. Every device call needs an `agent_id` — there is no account-wide device query.

2. **List and match**

   For each agent in scope, call `domotz_devices_list` and match the `query` client-side against `display_name`, `ip_addresses`, `hw_address`, and hostname. Prefer MAC matches when the device may have moved on DHCP.

3. **Enrich results**

   For each match, call `domotz_devices_get` for full detail, and extract: device name, IP address, MAC address, vendor, device type, status (online/offline), and the agent/site name.

4. **Present results**

   Display matching devices in a table with site context. If multiple matches found, list all. State that matching was done client-side, and check the agent's status before reporting device status as current — a device missing from an offline collector's list is unknown, not absent.

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

- **No Results:** Verify the query format; try partial matches; check that the device is on a monitored network. A recently-connected device may not appear until the agent's own scan cycle finds it — there is no way to trigger one.
- **Authentication Error:** Verify `DOMOTZ_API_KEY` and `DOMOTZ_REGION` are set correctly
- **Rate Limit:** Searching every site is one call per agent; narrow scope with `agent_id`

## Related Commands

- `/device-inventory` - List all devices at a site
- `/site-overview` - Full site health overview
