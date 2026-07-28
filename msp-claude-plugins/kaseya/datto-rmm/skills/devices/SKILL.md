---
name: "Datto RMM Devices"
description: >
  Datto RMM device management: identifiers (UID, hostname, MAC), device
  types and statuses, user-defined fields (UDF1-30), warranty data, and
  device lookup/update/delete operations.
when_to_use: >-
  When listing, searching, managing, and monitoring endpoints. Use when: datto device, rmm device,
  device status, device lookup, managed device, device hostname, device online, device offline,
  endpoint management, or device udf.
---

# Datto RMM Device Management

## Overview

Devices are the core managed entities in Datto RMM. Each device represents an endpoint with the Datto agent installed - workstations, servers, ESXi hosts, or network devices. This skill covers device identification, status monitoring, user-defined fields, and common device operations.

## Key Concepts

### Device Identifiers

Every device has multiple identifiers:

| Identifier | Type | Description | Example |
|------------|------|-------------|---------|
| `deviceUid` | string | Globally unique identifier | `d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a` |
| `deviceId` | integer | Legacy numeric ID | `123456` |
| `hostname` | string | Computer name | `ACME-DC01` |
| `intIpAddress` | string | Internal IP address | `192.168.1.100` |
| `extIpAddress` | string | External/public IP | `203.0.113.50` |
| `macAddresses` | array | Network interface MACs | `["00:1A:2B:3C:4D:5E"]` |

### Device Types

| Type | Description | Typical Use |
|------|-------------|-------------|
| `Desktop` | Workstation/PC | End-user computers |
| `Laptop` | Portable workstation | Mobile workers |
| `Server` | Windows/Linux server | Infrastructure |
| `ESXi Host` | VMware hypervisor | Virtualization |
| `Network Device` | Router/switch/firewall | SNMP-monitored |
| `Printer` | Network printer | Print infrastructure |

### Device Status

| Status | Description | Business Impact |
|--------|-------------|-----------------|
| `online` | Agent checking in | Normal operation |
| `offline` | No agent communication | May require attention |
| `rebooting` | Restart in progress | Temporary state |
| `unknown` | Status undetermined | Check connectivity |

### Field Reference

Devices carry identifier, site, type/status, network, OS, hardware, agent, and
timestamp fields, plus 30 user-defined fields (`udf1`-`udf30`, 255 char max,
commonly used for asset tag, department, primary user, location, purchase
date, lease expiration). See [references/fields.md](references/fields.md)
for the complete `Device` interface and UDF table.

## Common Workflows

### Device Lookup by Hostname

```javascript
async function findDeviceByHostname(client, hostname) {
  // Fetch all devices (with pagination)
  const allDevices = [];
  let url = '/api/v2/devices?max=250';

  while (url) {
    const response = await client.request(url);
    allDevices.push(...response.devices);
    url = response.pageDetails?.nextPageUrl;
  }

  // Search case-insensitive
  const matches = allDevices.filter(d =>
    d.hostname.toLowerCase().includes(hostname.toLowerCase())
  );

  if (matches.length === 0) {
    return { found: false, suggestions: [] };
  }

  if (matches.length === 1) {
    return { found: true, device: matches[0] };
  }

  return {
    found: false,
    ambiguous: true,
    suggestions: matches.map(d => ({
      hostname: d.hostname,
      uid: d.uid,
      site: d.siteName
    }))
  };
}
```

Equivalent lookups by IP and MAC address, an offline-device report, and a
bulk UDF update helper follow the same pagination pattern - see
[references/examples.md](references/examples.md) for the full
implementations, including UDF/description length validation.

## API Patterns

- `GET /api/v2/devices?max=250` - list all devices (paginated via `pageDetails.nextPageUrl`)
- `GET /api/v2/device/{deviceUid}` - get a single device
- `GET /api/v2/site/{siteUid}/devices?max=250` - devices scoped to a site
- `POST /api/v2/device/{deviceUid}` - update device fields (description, UDFs)
- `DELETE /api/v2/device/{deviceUid}` - remove device from Datto RMM (does not uninstall the agent)

See [references/api.md](references/api.md) for full request/response examples.

## Gotchas

- **Deleting a device does not uninstall the agent** - it only removes the device record from Datto RMM.
- **UDF values are capped at 255 characters**; `description` is capped at 1000. Both fail with 400 `Invalid field value` when exceeded.
- **`status` can lag behind real connectivity.** Combine it with `lastSeen` to determine effective status - see `getDeviceEffectiveStatus` in [references/examples.md](references/examples.md).
- **MAC addresses arrive in inconsistent formats** (colons, dashes, none) - normalize before comparing.
- **Use `deviceUid`, not hostname, for lookups and updates** - hostnames are not guaranteed unique across sites.
- Respect rate limits on bulk operations (e.g., a short sleep between sequential per-device requests).

See [references/errors.md](references/errors.md) for the full device API error table.

## Related Skills

- [Datto RMM Alerts](../alerts/SKILL.md) - Device alert management
- [Datto RMM Audit](../audit/SKILL.md) - Device hardware/software inventory
- [Datto RMM Jobs](../jobs/SKILL.md) - Running jobs on devices
- [Datto RMM Sites](../sites/SKILL.md) - Site-level device management
- [Datto RMM API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
