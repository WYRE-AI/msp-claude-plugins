---
name: "Domotz Devices"
description: >
  Domotz device inventory: how agents discover and classify devices, the
  identification attributes (IP, MAC, hostname, display name, vendor), the
  ONLINE/OFFLINE/UNKNOWN status model, the five device tools — list, get,
  uptime, history, inventory metadata — and why device lookup is a
  client-side match rather than a server-side search.
when_to_use: >-
  When looking up, listing, or auditing devices discovered by a Domotz agent.
  Use when: domotz device, device inventory, device discovery,
  device status, device search, device lookup, network device, device list, find device, device
  uptime, device history, or device details.
---

# Domotz Devices

## Overview

Domotz automatically discovers and monitors devices on networks where agents are deployed. Devices include servers, workstations, network equipment, IoT devices, printers, and any IP-connected hardware. Each device is associated with a specific agent (site).

## Anti-triggers

- **A managed endpoint with software installed on it** — a Domotz
  device is anything that answered a LAN scan, including unmanaged
  phones, printers, and IoT gear. Managed-endpoint inventory is
  `atera` or `ncentral`.
- **Infrastructure across every client at once** — Domotz queries are
  scoped to a single agent, so fleet-wide network inventory means
  fanning out site by site; `auvik-devices` answers it directly.
- **Meraki hardware you intend to act on** — reading it here is fine,
  but reboot, removal, and config key off the Dashboard serial; use
  `meraki-devices`.
- **Attack-surface or rogue-asset discovery** — use `runzero`.

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

## Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `domotz_devices_list` | Every device on the agent's network, with status, IPs, MAC, and type | `agent_id` |
| `domotz_devices_get` | Full detail for one device — vendor, model, OS, services | `agent_id`, `device_id` |
| `domotz_devices_uptime` | Uptime history and current uptime | `agent_id`, `device_id` |
| `domotz_devices_history` | Online/offline event history | `agent_id`, `device_id` |
| `domotz_devices_inventory` | Inventory metadata — owner, location, notes, custom fields | `agent_id`, `device_id` |

All IDs are numbers. **There is no device search tool and no pagination
arguments** — `domotz_devices_list` returns the full census for the agent
in one response, and matching by name, IP, or MAC is done client-side over
that array.

`domotz_devices_inventory` is the operator-maintained metadata layer
(owner, location, notes), not the discovery data. It is where the human
context lives, and it is empty unless somebody filled it in.

### List Devices

```
domotz_devices_list
```

Parameters:
- `agent_id` -- The agent monitoring this network (required)

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
domotz_devices_get
```

Parameters:
- `agent_id` -- The agent ID (required)
- `device_id` -- The specific device ID (required)

## Common Workflows

### Device Lookup by IP or MAC

There is no server-side search, so a lookup is a list-and-filter:

1. Determine scope. One site means one `agent_id`; "anywhere in the
   estate" means `domotz_agents_list` then a call per agent.
2. Call `domotz_devices_list` for each agent in scope.
3. Match client-side on `ip_addresses`, `hw_address`, `display_name`, or
   hostname. Prefer MAC when devices move on DHCP.
4. Call `domotz_devices_get` on the match for full detail.

Say that the match was done locally when you report it — a device absent
from the list is absent from the agent's last scan, which is not the same
as "not on the network".

### Full Site Inventory

1. Call `domotz_devices_list` with the `agent_id` for the site
2. Group devices by type (servers, workstations, network devices, etc.)
3. Note online vs offline status for each
4. Pull `domotz_devices_inventory` for the devices that matter to pick up
   owner, location, and notes

### Device Change Detection

1. List all devices for an agent
2. Compare against a previous inventory snapshot, or sort by `first_seen`
3. Identify new devices (potential rogue devices)
4. Identify missing devices (potentially decommissioned)

New devices appear only as the agent's own scan cycle finds them. There is
no tool to force a rescan, so a device connected moments ago may not be
listed yet.

### Outage Investigation for One Device

1. Call `domotz_devices_get` for current status
2. Call `domotz_devices_history` for the online/offline event sequence —
   this is what distinguishes a flapping device from a clean outage
3. Call `domotz_devices_uptime` for how long it has been up since the
   last transition
4. Check `domotz_agents_get` before trusting any of it; a dead collector
   reports last-known state as if it were current

### Network Topology Mapping

For the actual connectivity graph, use `domotz_network_topology` — see the
`network` skill. `domotz_devices_list` grouped by subnet is a weaker
substitute and should not be presented as topology.

## Error Handling

### Device Not Found

**Cause:** Invalid device ID, device has been removed, or the ID belongs
to a different agent
**Solution:** Verify the `agent_id`/`device_id` pair against
`domotz_devices_list`. Device IDs are not globally unique across agents.

### Empty Device List

**Cause:** Agent has not completed its initial scan, agent is offline, or
no devices on the network
**Solution:** Check `domotz_agents_get` status. There is no scan trigger —
if discovery has not run yet, the only option is to wait for the agent's
own cycle.

### Stale Device Data

**Cause:** Agent is offline, so records persist and read as last-known
rather than current
**Solution:** Check the agent's status and `last_seen` first. A report of
"all devices online" from a site whose collector died is worse than no
report.

## Best Practices

- Use MAC address for persistent device identification (IPs change with DHCP)
- Expect one large response per site rather than paged results; scope by
  `agent_id` and filter locally
- Monitor `last_status_change` to detect recent outages
- Use `domotz_devices_history` rather than a single status read when the
  question is "has this been stable"
- Use `vendor` field to categorize devices by manufacturer
- Cross-reference device inventory with IT documentation (IT Glue configurations)
- Track `first_seen` dates to detect new/rogue devices on the network
- Treat the full list as premises data about people — at a small business
  it includes staff phones and personal laptops, not just managed assets

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, tool catalog, error codes
- [agents](../agents/SKILL.md) - Agents that monitor devices
- [alerts](../alerts/SKILL.md) - Alert profile coverage for devices
- [network](../network/SKILL.md) - Topology, IP conflicts, and SNMP metrics
- [power](../power/SKILL.md) - PDU outlet control
