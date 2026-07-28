---
name: "Auvik Devices"
description: >
  Auvik device records: device types, manageStatus and onlineStatus,
  lifecycle and warranty fields, and choosing between the v1 list endpoint
  and the detailed device endpoints.
when_to_use: >-
  When listing, inspecting, or auditing Auvik devices, including lifecycle and warranty checks and
  managed vs unmanaged classification. Use when: auvik device, auvik inventory, auvik endpoint,
  auvik switch, auvik router, auvik firewall, auvik unmanaged, auvik lifecycle, auvik warranty, or
  auvik end of life.
---

# Auvik Devices

Devices are the unit of inventory in Auvik. Every discovered piece of network gear or endpoint - whether actively monitored or just seen on a discovery scan - has a device record. This skill covers the device type taxonomy, the manage-status model, lifecycle fields, and which tool to call for which question.

## Tools

| Tool | Use For |
|------|---------|
| `auvik_devices_list` | Bulk listing (v1 record - light) |
| `auvik_devices_get` | Single device, v1 fields |
| `auvik_devices_get_details` | Extended attributes (interfaces, IPs, SNMP) |
| `auvik_devices_get_lifecycle` | End-of-sale, end-of-support dates |
| `auvik_devices_get_warranty` | Warranty start / end / status |

## Device Types

Auvik classifies every device with a `deviceType` value. The set you'll see in practice:

| Type | Notes |
|------|-------|
| `router` | L3 routing device |
| `switch` | L2 switch |
| `firewall` | Dedicated firewall (Fortinet, Palo, Meraki MX, etc.) |
| `accessPoint` | Wireless AP |
| `controller` | Wireless or SD-WAN controller |
| `server` | Physical or virtual server with SNMP / WMI |
| `hypervisor` | VMware, Hyper-V, etc. |
| `workstation` | End-user PC / Mac |
| `printer` | Network printer / MFD |
| `voipPhone` | IP phone |
| `storage` | NAS / SAN |
| `ups` | UPS via SNMP |
| `camera` | IP camera |
| `unknown` | Discovered but not classified |

For infrastructure reports, focus on `router`, `switch`, `firewall`, `accessPoint`, `controller`, `server`, `hypervisor`. For lifecycle reports, those plus `ups` and `storage`.

## manageStatus

Every device has a `manageStatus` value:

| Value | Meaning |
|-------|---------|
| `managed` | Auvik is actively monitoring (SNMP / API credentials configured) |
| `unmanaged` | Discovered but not actively polled (no credentials, or marked unmanaged) |
| `unknown` | Status not yet determined |

`unmanaged` infrastructure devices are visibility gaps - Auvik sees them on a scan but is not polling them for health. In an audit, these are the most important things to surface to the customer.

## onlineStatus

Separate from manageStatus:

| Value | Meaning |
|-------|---------|
| `online` | Reachable on last scan/poll |
| `offline` | Not reachable |
| `unreachable` | SNMP / API call failed last attempt |

A `managed` + `offline` device is a real alert. A `managed` + `unreachable` device is usually a credentials problem on the Auvik side.

## Lifecycle Fields

`auvik_devices_get_lifecycle` returns:

- `endOfSale` - vendor stopped selling new units
- `endOfSoftwareMaintenance` - last software / security update date
- `endOfSupport` (or `endOfLife`) - vendor stopped supporting
- `currentPhase` - vendor-derived lifecycle phase

For risk reports, flag anything past `endOfSoftwareMaintenance` first - that is the operational risk threshold. Past `endOfSupport` is the absolute deadline.

Lifecycle data is populated only for hardware whose vendor publishes it. Whitebox and consumer gear typically returns empty.

## Warranty Fields

`auvik_devices_get_warranty` returns:

- `warrantyStart`, `warrantyEnd`
- `warrantyStatus` - `active`, `expired`, `unknown`

Devices `warrantyEnd` within 90 days are worth surfacing to the customer for renewal decisions.

## v1 vs Detailed Endpoints

- `auvik_devices_list` returns the v1 record - fast, paginated, but minimal fields. Use for inventories and counts.
- `auvik_devices_get` returns the v1 record for one device.
- `auvik_devices_get_details` returns the extended v2-style record - interface list, IP addresses, SNMP details, vendor info. Use when you need anything beyond name / type / status.

Do not call `auvik_devices_get_details` in a tight loop over every device in a large tenant - it is significantly heavier than the v1 list. Filter to the device subset you need first.

## Common Workflows

### Full inventory

1. `auvik_devices_list` paginated to completion.
2. Group client-side by `deviceType` and `manageStatus`.

### Lifecycle risk audit

1. `auvik_devices_list`, filter to infrastructure types.
2. For each, `auvik_devices_get_lifecycle` and `auvik_devices_get_warranty`.
3. Bucket: past EOSM, past EOS, warranty expiring < 90d.

### Unmanaged gap

1. `auvik_devices_list`.
2. Filter to `deviceType in {router, switch, firewall, accessPoint, controller}` and `manageStatus = unmanaged`.
3. These are devices Auvik sees but is not polling - the highest-priority coverage gap.

## Edge Cases

- A device can change `deviceType` over time as Auvik's classifier improves - especially `unknown` -> a real type. Don't trust a single classification for a long-lived report.
- Some vendors publish lifecycle for the chassis but not for line cards or modules - the device-level lifecycle is what's exposed.
- `auvik_devices_list` returns devices across all networks visible to the credentials. Filter by tenant explicitly if you have a multi-tenant key.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md)
- [networks](../networks/SKILL.md)
- [alerts](../alerts/SKILL.md)
