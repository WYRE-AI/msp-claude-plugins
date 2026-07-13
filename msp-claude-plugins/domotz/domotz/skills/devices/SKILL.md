---
name: "Domotz Devices"
description: >
  Use this skill when working with Domotz device inventory --
  listing devices, searching by name/IP/MAC, checking device status,
  viewing device details, and understanding network topology.
when_to_use: >-
  When listing devices, searching by name/IP/MAC, checking device status, viewing device details,
  and understanding network topology. Use when: domotz device, device inventory, device discovery,
  device status, device search, device lookup, network device, device list, find device, or device
  details.
---

# Domotz Devices

## Overview

Domotz automatically discovers and monitors devices on networks where agents are deployed. Devices include servers, workstations, network equipment, IoT devices, printers, and any IP-connected hardware. Each device is associated with a specific agent (site).

## Key Concepts

### Device Discovery

Domotz agents continuously scan local networks and automatically discover new devices. Discovered devices are classified by type and can be:
- **Monitored** - Actively tracked with status checks
- **Unmonitored** - Discovered but not actively tracked

### Device Identification

Devices are identified by multiple attributes:
- **IP Address** - Current network address
- **MAC Address** - Hardware identifier (persistent)
- **Hostname** - DNS or NetBIOS name
- **Display Name** - User-assigned friendly name
- **Vendor** - Manufacturer identified from MAC OUI

### Device Status

| Status | Meaning |
|--------|---------|
| `ONLINE` | Device is reachable on the network |
| `OFFLINE` | Device is not responding |
| `UNKNOWN` | Status cannot be determined |

## API Patterns

### List Devices

```
domotz_list_devices
```

Parameters:
- `agent_id` -- The agent monitoring this network (required)
- `page` -- Page number for pagination
- `page_size` -- Results per page

**Example response:**

```json
[
  {
    "id": 789,
    "display_name": "Core Switch",
    "ip_addresses": ["192.168.1.1"],
    "hw_address": "AA:BB:CC:DD:EE:FF",
    "vendor": "Cisco Systems",
    "type": {
      "detected_id": 3,
      "label": "Network Device"
    },
    "status": "ONLINE",
    "last_status_change": "2026-03-27T10:00:00Z",
    "first_seen": "2025-06-15T08:30:00Z"
  }
]
```

### Get Device Details

```
domotz_get_device
```

Parameters:
- `agent_id` -- The agent ID
- `device_id` -- The specific device ID

### Search Devices

```
domotz_search_devices
```

Parameters:
- `agent_id` -- The agent ID
- `query` -- Search term (name, IP, or MAC)

## Common Workflows

### Device Lookup by IP

1. Call `domotz_search_devices` with the IP address as `query`
2. Review matching devices for the correct match
3. Call `domotz_get_device` for full details if needed

### Device Lookup by MAC

1. Call `domotz_search_devices` with the MAC address as `query`
2. MAC lookups are useful when devices change IPs (DHCP)

### Full Site Inventory

1. Call `domotz_list_devices` with the `agent_id` for the site
2. Paginate through all results
3. Group devices by type (servers, workstations, network devices, etc.)
4. Note online vs offline status for each

### Device Change Detection

1. List all devices for an agent
2. Compare against a previous inventory snapshot
3. Identify new devices (potential rogue devices)
4. Identify missing devices (potentially decommissioned)

### Network Topology Mapping

1. List all devices for an agent
2. Group by subnet based on IP addresses
3. Identify network devices (switches, routers, APs)
4. Map device-to-switch port relationships where available

## Error Handling

### Device Not Found

**Cause:** Invalid device ID, device has been removed, or wrong agent
**Solution:** Verify the device ID and agent ID; search by IP or MAC instead

### Empty Device List

**Cause:** Agent has not completed initial scan, or no devices on network
**Solution:** Verify agent is online; trigger a network scan; wait for discovery

### Stale Device Data

**Cause:** Agent is offline or device status hasn't been refreshed
**Solution:** Check agent status; trigger a fresh scan if possible

## Best Practices

- Use MAC address for persistent device identification (IPs change with DHCP)
- Paginate through all results for accurate device counts
- Monitor `last_status_change` to detect recent outages
- Use `vendor` field to categorize devices by manufacturer
- Cross-reference device inventory with IT documentation (IT Glue configurations)
- Track `first_seen` dates to detect new/rogue devices on the network
- Use display names consistently with your documentation platform

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and rate limiting
- [agents](../agents/SKILL.md) - Agents that monitor devices
- [alerts](../alerts/SKILL.md) - Alerts triggered by device events
- [network](../network/SKILL.md) - Network scanning and port monitoring
- [eyes](../eyes/SKILL.md) - Sensors monitoring specific devices
