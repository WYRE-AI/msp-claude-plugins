---
name: "runZero Wireless"
description: >
  Use this skill when working with RunZero wireless network discovery —
  listing discovered wireless networks, identifying rogue access points,
  analyzing wireless security configurations, and auditing SSIDs.
when_to_use: >-
  When listing discovered wireless networks, identifying rogue access points, analyzing wireless
  security configurations, and auditing SSIDs. Use when: runzero wireless, wireless network, wifi
  discovery, rogue ap, rogue access point, wireless security, ssid, wireless audit, or wifi scan.
---

# RunZero Wireless

## Overview

RunZero discovers wireless networks visible from explorer locations, including authorized corporate networks, guest networks, and potential rogue access points. Wireless discovery helps MSPs maintain visibility into the RF environment and identify unauthorized network infrastructure.

## Key Concepts

### Wireless Network Attributes

Each discovered wireless network includes:

| Attribute | Description |
|-----------|-------------|
| `essid` | The network name (SSID) |
| `bssid` | The access point MAC address |
| `channel` | The wireless channel |
| `encryption` | Security protocol (WPA2, WPA3, WEP, Open) |
| `signal` | Signal strength |
| `type` | Infrastructure or ad-hoc |
| `vendor` | AP hardware vendor (from OUI lookup) |
| `first_seen` | When the network was first discovered |
| `last_seen` | When the network was last observed |
| `site_id` | The site where the network was detected |

### Encryption Types

| Encryption | Security Level | Notes |
|------------|---------------|-------|
| WPA3 | Strong | Recommended standard |
| WPA2-Enterprise | Strong | Requires RADIUS |
| WPA2-Personal | Moderate | Vulnerable to offline brute force |
| WPA | Weak | Deprecated; upgrade recommended |
| WEP | Critical | Trivially breakable; must replace |
| Open | None | No encryption; use only for guest with captive portal |

### Rogue AP Detection

A rogue access point is an unauthorized AP connected to the corporate network. Indicators include:

- Unknown BSSID not in the authorized AP list
- SSID spoofing a corporate network name
- Unexpected vendor or hardware
- AP on a channel not used by corporate infrastructure

## API Patterns

### List Wireless Networks

```
runzero_wireless_list
```

Parameters:
- `site_id` -- Filter by site
- `search` -- RunZero query string
- `count` -- Results per page
- `offset` -- Pagination offset

**Example response:**

```json
{
  "wireless": [
    {
      "id": "wireless-uuid-123",
      "essid": "ACME-Corporate",
      "bssid": "AA:BB:CC:DD:EE:FF",
      "channel": 6,
      "encryption": "WPA2-Enterprise",
      "signal": -45,
      "vendor": "Cisco Meraki",
      "type": "infrastructure",
      "first_seen": "2026-01-15T10:00:00Z",
      "last_seen": "2026-03-27T08:30:00Z",
      "site_id": "site-uuid-456"
    }
  ]
}
```

### Get Wireless Network Details

```
runzero_wireless_get
```

Parameters:
- `wireless_id` -- The specific wireless network UUID

## Common Workflows

### Wireless Security Audit

1. List all wireless networks for a site: `runzero_wireless_list`
2. Check encryption types -- flag WEP, WPA, and Open networks
3. Identify networks with weak security
4. Recommend upgrades to WPA2-Enterprise or WPA3
5. Generate a wireless security posture report

### Rogue AP Detection

1. Export all wireless networks for the site
2. Compare BSSIDs against the authorized AP inventory
3. Flag unknown BSSIDs as potential rogues
4. Check for SSID spoofing (matching corporate SSID with unknown BSSID)
5. Investigate vendor and location of suspicious APs
6. Report findings with recommended actions

### Wireless Inventory

1. List all wireless networks across sites
2. Group by SSID, encryption type, and vendor
3. Count unique access points per site
4. Generate per-client wireless infrastructure summary

### Channel Conflict Analysis

1. Export wireless networks for a site
2. Group by channel
3. Identify channels with multiple APs (potential interference)
4. Recommend channel planning adjustments

## Error Handling

### No Wireless Data

**Cause:** Explorer does not have a wireless adapter, or wireless scanning is disabled
**Solution:** Verify explorer has wireless capability; enable wireless scanning in scan configuration

### Limited Coverage

**Cause:** Explorer can only detect APs within radio range
**Solution:** Deploy explorers at multiple physical locations for comprehensive coverage

## Best Practices

- Run wireless scans regularly to detect new rogue APs
- Maintain an authorized AP inventory for comparison
- Flag any WEP or Open networks immediately for remediation
- Monitor for SSID spoofing of corporate network names
- Document wireless infrastructure per site for compliance
- Cross-reference wireless vendor (OUI) with procurement records

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Query language and pagination
- [assets](../assets/SKILL.md) - Assets associated with wireless networks
- [sites](../sites/SKILL.md) - Sites where wireless networks are detected
- [tasks](../tasks/SKILL.md) - Scans that discover wireless networks
