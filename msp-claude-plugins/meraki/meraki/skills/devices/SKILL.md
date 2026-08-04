---
name: "Meraki Devices"
description: >
  Cisco Meraki device inventory and lifecycle: serial-based identity, the
  MX/MS/MR/MV/MG/MT product lines, org inventory vs network assignment,
  reboot and removal, and device/uplink status via meraki_raw_request.
when_to_use: >-
  When working with Meraki device inventory and lifecycle -- list, get by serial, reboot, remove,
  and check device or uplink status. Use when: meraki device, meraki serial, meraki inventory,
  meraki reboot, device status, device offline, meraki uplink, device lifecycle, claim device, or
  remove device.
---

# Meraki Device Inventory & Lifecycle

## Overview

Meraki devices are cloud-managed hardware identified by an immutable **serial number** (format `Q2XX-XXXX-XXXX`). Devices are claimed into an organization's inventory, then assigned to a network. This skill covers listing, inspecting, rebooting, and removing devices, plus reading device and uplink status through the `meraki_raw_request` passthrough.

## Anti-triggers

- **Hardware that is not Meraki** — every tool here keys off a Meraki
  serial and the Dashboard API. Mixed-vendor network inventory is
  `auvik-devices`; per-site LAN discovery is `domotz-devices`.
- **Power-cycling something the Dashboard does not manage** —
  `meraki_devices_reboot` reboots Meraki hardware only. Cutting power
  to anything else at the site needs a switched PDU, which the Domotz
  plugin controls; start from `domotz-devices` to find it.
- **Firewall rules, VPN peers, or MX uplink policy** — use
  `meraki-security-appliance`.
- **Proving a device is genuinely unreachable** — status fields are
  point-in-time and go stale; run live diagnostics with
  `meraki-troubleshooting`.

## Key Concepts

### The Serial Is the Identity

Every device operation keys off the serial number, not a name or internal ID. Names (`name` field) are optional, mutable, and non-unique across a network. Always resolve to a serial before acting.

### Product Lines

| Line | Product | Notes |
|------|---------|-------|
| **MX** | Security appliance / SD-WAN | Firewall, VPN, WAN uplinks |
| **MS** | Switch | Ports, PoE, VLANs, port statuses |
| **MR** | Wireless access point | SSIDs, RF, radio status |
| **MV** | Smart camera | Video, snapshots (raw_request) |
| **MG** | Cellular gateway | LTE/5G uplink (raw_request) |
| **MT** | Environmental sensor | Temp/humidity/water/power (raw_request) |

### Inventory vs. Network Assignment

- **Org inventory** (`meraki_organizations_inventory_list`) is the pool of all hardware claimed to the org -- including devices not yet assigned to any network.
- **Network devices** (`meraki_devices_list`) are the subset assigned to a specific network.

A device can be in inventory but unassigned. Removing a device from a network (`meraki_devices_remove`) returns it to inventory; it is not the same as deleting the network.

## API Patterns

### List Org Inventory

```
meraki_organizations_inventory_list
```

Parameters:
- `organization_id` -- The org to list inventory for (required unless `MERAKI_ORG_ID` is set)

Returns each device's serial, model, MAC, product type, network assignment (or null if unassigned), and claim/license state.

### List Devices in a Network

```
meraki_devices_list
```

Parameters:
- `network_id` -- The network to list devices for (required)

### Get a Device by Serial

```
meraki_devices_get
```

Parameters:
- `serial` -- The device serial (required)

**Example response:**

```json
{
  "serial": "Q2XX-XXXX-XXXX",
  "name": "HQ-MX-01",
  "model": "MX68",
  "mac": "00:11:22:33:44:55",
  "networkId": "L_123456789012345678",
  "productType": "appliance",
  "tags": ["hq", "primary"],
  "lanIp": "192.168.1.1",
  "firmware": "wired-18-107"
}
```

### Reboot a Device

```
meraki_devices_reboot
```

Parameters:
- `serial` -- The device to reboot (required)

Returns `{ "success": true }` when the reboot is queued. The device drops offline briefly, then reconnects to the Dashboard cloud.

### Remove a Device from a Network

```
meraki_devices_remove
```

Parameters:
- `serial` -- The device to remove (required)
- `confirm_destructive_action` -- Must be `true` (required)

This unassigns the device from its network and returns it to org inventory. It is a **destructive** operation and requires explicit confirmation.

## Device & Uplink Status via Raw Request

The curated device tools do not include a status endpoint. Use `meraki_raw_request` for status and uplink data:

### Org-Wide Device Statuses

```
meraki_raw_request
  method: GET
  path: /organizations/{organizationId}/devices/statuses
```

Returns each device's `status` (`online`, `offline`, `alerting`, `dormant`), `lastReportedAt`, and `publicIp`. This is the most rate-efficient way to find offline/alerting devices across an entire org -- prefer it over looping per device.

### Appliance Uplink Statuses

```
meraki_raw_request
  method: GET
  path: /organizations/{organizationId}/appliance/uplink/statuses
```

Returns per-MX WAN interface status (`active`, `ready`, `failed`, `not connected`) for WAN1/WAN2/cellular -- useful for spotting failed-over or down uplinks.

### Single-Network Uplink Status

```
meraki_raw_request
  method: GET
  path: /networks/{networkId}/appliance/uplinks/statuses
```

## Common Workflows

### Offline Device Sweep

1. Call `meraki_raw_request` GET `/organizations/{organizationId}/devices/statuses`
2. Filter for `status` in (`offline`, `alerting`, `dormant`)
3. For each, enrich with `meraki_devices_get` (name, model, network)
4. Report by network, sorted by product type (appliances first -- they gate connectivity)

### Firmware / Model Audit

1. Call `meraki_organizations_inventory_list`
2. Group by `model` and `firmware`
3. Flag end-of-life models and devices lagging the recommended firmware train

### Controlled Reboot

1. Confirm the device and its role with `meraki_devices_get`
2. Warn if it is an appliance (MX) or core switch (MS) -- rebooting drops the site
3. Call `meraki_devices_reboot` only after explicit user confirmation
4. Re-check status via the org device statuses endpoint until it returns `online`

### Decommission

1. Verify the correct serial with `meraki_devices_get`
2. Confirm intent with the user
3. Call `meraki_devices_remove` with `confirm_destructive_action=true`
4. Optionally verify it now shows unassigned in `meraki_organizations_inventory_list`

## Error Handling

### Device Not Found (404)

**Cause:** Wrong serial, or the device is not assigned to the network you queried
**Solution:** Verify the serial via `meraki_organizations_inventory_list`; check network assignment

### Reboot / Remove Rejected

**Cause:** For remove, `confirm_destructive_action` was not `true`; or the account lacks write permission
**Solution:** Set the confirmation flag after user approval; verify the API key's admin role (403)

### Stale Status

**Cause:** `lastReportedAt` is old -- the device may be offline or the cloud has not polled recently
**Solution:** Cross-check with uplink statuses; a device offline for its full check-in interval is genuinely down

## Best Practices

- Always identify devices by serial; treat names as display-only
- Use org-wide statuses (`/organizations/.../devices/statuses`) instead of per-device polling to conserve the ~10 req/s budget
- Warn before rebooting appliances or core switches -- these interrupt the whole site
- Require explicit confirmation before any `meraki_devices_remove`
- Reconcile network devices against org inventory to spot unassigned or unclaimed hardware
- Track `firmware` and `model` for lifecycle and upgrade planning

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Auth, pagination, rate limiting, raw_request
- [troubleshooting](../troubleshooting/SKILL.md) - Live tools (ping, cable test) via raw_request
- [security-appliance](../security-appliance/SKILL.md) - MX firewall and VPN
