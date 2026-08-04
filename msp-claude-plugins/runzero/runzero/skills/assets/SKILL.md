---
name: "runZero Assets"
description: >
  The runZero asset inventory: searching and browsing assets, asset attributes, OS
  fingerprinting, hardware details, and network interfaces.
when_to_use: >-
  When searching, browsing, or inspecting assets in the runZero inventory. Use when:
  runzero asset, runzero inventory, asset search, asset discovery, os fingerprint, asset
  attributes, asset list, network inventory, device inventory, or endpoint discovery.
---

# RunZero Assets

## Overview

RunZero discovers and inventories every asset on the network -- servers, workstations, IoT devices, OT systems, cloud instances, and more. Each asset includes OS fingerprinting, hardware details, network interfaces, open services, and a full attribute history. This skill covers searching, filtering, and inspecting assets.

## Anti-triggers

- **Live device state.** runZero records what the last scan saw, so it
  cannot answer "is it up right now", "what is the CPU doing", or "which
  port is it plugged into". Continuous monitoring and topology are
  `auvik-devices`; up/down and remote access are `domotz-devices`; the
  switch or AP's own configuration is `meraki-devices`.
- **Agent-managed endpoints.** runZero is agentless and discovers from
  the network, so its record of a workstation is thinner than the
  sensor's. Agent health, OS build, and logged-in user come from
  `sentinelone-inventory` or `threatlocker-computers`.
- **Launching or scheduling the scan** that produces this data — use
  `runzero-tasks`.
- **Ports, banners, and protocols** rather than the machine itself — each
  is its own record; use `runzero-services`.

## Key Concepts

### Asset Types

RunZero classifies assets by type based on fingerprinting:

| Type | Description |
|------|-------------|
| `server` | Server operating systems |
| `workstation` | Desktop/laptop endpoints |
| `network` | Routers, switches, firewalls |
| `printer` | Network printers and MFPs |
| `iot` | IoT devices (cameras, sensors, etc.) |
| `ot` | Operational technology / ICS |
| `mobile` | Mobile devices |
| `virtual` | Virtual machines and hypervisors |

### OS Fingerprinting

RunZero performs active and passive OS fingerprinting using multiple techniques:

- TCP/IP stack analysis
- Service banner matching
- SNMP sysDescr parsing
- HTTP server headers
- TLS certificate analysis
- MDNS/Bonjour responses

The result is a confidence-weighted OS identification with vendor, product, and version.

### Asset Attributes

Each asset carries a rich set of attributes:

| Attribute | Description |
|-----------|-------------|
| `addresses` | All discovered IP addresses |
| `macs` | MAC addresses |
| `hostnames` | All discovered hostnames |
| `os` | Operating system (fingerprinted) |
| `os_vendor` | OS vendor name |
| `os_version` | OS version string |
| `hw` | Hardware vendor/model |
| `type` | Asset type classification |
| `first_seen` | When the asset was first discovered |
| `last_seen` | When the asset was last seen |
| `alive` | Whether the asset responded to the last scan |
| `site_id` | The site this asset belongs to |
| `tags` | User-assigned tags |

## API Patterns

### List Assets

```
runzero_assets_list
```

Parameters:
- `site_id` -- Filter by site
- `search` -- RunZero query string (e.g., `os:Windows`)
- `count` -- Number of results per page (default 100)
- `offset` -- Pagination offset

**Example response:**

```json
{
  "assets": [
    {
      "id": "asset-uuid-123",
      "addresses": ["192.168.1.42"],
      "macs": ["00:1A:2B:3C:4D:5E"],
      "hostnames": ["ACME-DC01.acme.local"],
      "os": "Windows Server 2022",
      "os_vendor": "Microsoft",
      "type": "server",
      "alive": true,
      "first_seen": "2026-01-15T10:00:00Z",
      "last_seen": "2026-03-27T08:30:00Z",
      "site_id": "site-uuid-456"
    }
  ]
}
```

### Search Assets

```
runzero_assets_search
```

Parameters:
- `query` -- RunZero query language string

**Example queries:**

```
os:Windows AND type:server
address:10.0.0.0/8 AND alive:true
hostname:DC AND os:Windows Server
type:printer AND last_seen:<30d
NOT os:Windows AND alive:true
```

### Get Asset Details

```
runzero_assets_get
```

Parameters:
- `asset_id` -- The specific asset UUID

Returns full asset details including all attributes, services, network interfaces, and scan history.

### Export Assets

```
runzero_assets_export
```

Parameters:
- `search` -- RunZero query string to filter exports
- `site_id` -- Filter by site

Use the Export API for bulk retrieval of asset data.

## Common Workflows

### Full Asset Inventory

1. Call `runzero_assets_list` for each site
2. Paginate through all results
3. Group by type and OS
4. Generate counts and distribution reports

### Stale Asset Detection

1. Search for assets not seen recently: `alive:false AND last_seen:<30d`
2. Review for decommissioned or offline devices
3. Cross-reference with RMM agent inventory

### OS Distribution Report

1. Export all assets via `runzero_assets_export`
2. Group by `os_vendor` and `os` fields
3. Identify unsupported or end-of-life operating systems
4. Generate per-site breakdown

### Unmanaged Device Detection

1. Export all assets from RunZero
2. Compare against RMM/MDM agent lists
3. Identify assets with no management agent
4. Flag IoT and OT devices for security review

## Error Handling

### Asset Not Found

**Cause:** Invalid asset UUID or asset was merged/removed
**Solution:** Verify the asset ID; search by IP or hostname instead

### Empty Results

**Cause:** Query too restrictive or site has not been scanned
**Solution:** Broaden the query; verify the site has completed scans

## Best Practices

- Use the Export API for datasets larger than a few hundred assets
- Apply site filters to scope queries to specific clients
- Leverage the query language for precise searches
- Monitor `last_seen` to detect assets going offline
- Use `type` filtering to focus on specific device categories
- Cross-reference RunZero assets with PSA configuration items

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Query language and pagination
- [services](../services/SKILL.md) - Services running on assets
- [sites](../sites/SKILL.md) - Site-based asset organization
- [tasks](../tasks/SKILL.md) - Scans that discover assets
