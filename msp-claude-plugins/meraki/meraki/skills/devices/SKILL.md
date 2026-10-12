---
name: "Meraki Devices"
description: >
  Cisco Meraki device inventory and status through the hosted Meraki MCP:
  serial-based identity, the MX/MS/MR/MV/MG/MT product lines, org inventory
  versus network assignment, availability and its change history, uplink
  addresses, provisioning, end-of-life (EOX) and firmware status.
when_to_use: >-
  When looking up Meraki hardware -- listing inventory, finding a device by serial, name or MAC,
  checking which devices are offline or alerting, auditing EOX and firmware, or preparing a reboot
  or removal for a human to carry out. Use when: meraki device, meraki serial, meraki inventory,
  device status, device offline, meraki uplink, unassigned device, end of sale, end of support,
  meraki firmware, reboot meraki device, or remove device.
---

# Meraki Devices

## Overview

Meraki devices are cloud-managed hardware identified by an immutable serial number (format `Q2XX-XXXX-XXXX`). A device is claimed into an organization's inventory, then assigned to a network. Every capability below is called with `execute_api`; anything not listed here can be found with `semantic_search`. Tool schemas, pagination and Conduit access are covered in `meraki-api-patterns`.

The hosted server is read-only. Reboots, removals, claims, renames and firmware scheduling cannot be done from here: read the current state, then give the human a precise instruction to carry out in the Meraki Dashboard.

## Anti-triggers

- **Hardware that is not Meraki** -- mixed-vendor network inventory is `auvik-devices`; per-site LAN discovery is `domotz-devices`.
- **Power-cycling something the Dashboard cannot reach** -- an offline device needs local power. If the site has a switched PDU, use `domotz-power`.
- **Firewall rules, NAT or VPN peers** -- use `meraki-security-appliance`.
- **Working out why a device is offline, slow or dropping clients** -- use `meraki-troubleshooting`.

## Key Concepts

### The serial is the identity

Every device capability keys off `serial`. The `name` field is optional, mutable and not unique. Resolve to a serial before doing anything else, and quote the serial in anything you hand to a human.

### Product lines

| Line | Product | `productType` |
|------|---------|---------------|
| MX / Z | Security appliance, SD-WAN, teleworker gateway | `appliance` |
| MS | Switch | `switch` |
| MR | Wireless access point | `wireless` |
| MV | Smart camera | `camera` |
| MG | Cellular gateway | `cellularGateway` |
| MT | Environmental sensor | `sensor` |

Most org-wide capabilities accept a `productTypes` filter with these values.

### Inventory vs. network assignment

- **Org inventory** (`getOrganizationInventoryDevices`) is every device claimed to the org, assigned or not. Unassigned devices have a null `networkId`; pass `usedState: "unused"` to list only those.
- **Org devices** (`getOrganizationDevices`) is only the devices assigned to a network. Filter with `networkIds` rather than looping per network.

Removing a device from a network returns it to inventory. Unclaiming takes it out of the org entirely. Both are Dashboard actions.

### Availability

`getOrganizationDevicesAvailabilities` reports a `status` of `online`, `offline`, `alerting` (checking in, but the Dashboard has flagged a problem) or `dormant` (offline for an extended period). Status reflects the device's connection to the Meraki cloud, not whether it is forwarding traffic -- a device that loses its cloud path keeps running its last configuration.

## Capabilities

| Need | `capability_id` | Required | Useful optional parameters |
|------|-----------------|----------|----------------------------|
| Status counts for the org | `getOrganizationDevicesStatusesOverview` | `organizationId` | `productTypes`, `networkIds` |
| Per-device availability | `getOrganizationDevicesAvailabilities` | `organizationId` | `statuses`, `networkIds`, `productTypes`, `serials`, `perPage` (max 1000) |
| When a device went down or flapped | `getOrganizationDevicesAvailabilitiesChangeHistory` | `organizationId` | `serials`, `networkIds`, `statuses`, `timespan` (max 31 days) |
| Devices assigned to networks | `getOrganizationDevices` | `organizationId` | `networkIds`, `productTypes`, `name`, `mac`, `serial`, `model`, `perPage` |
| Full inventory, incl. unassigned | `getOrganizationInventoryDevices` | `organizationId` | `usedState`, `search`, `serials`, `models`, `eoxStatuses`, `perPage` |
| One device from inventory | `getOrganizationInventoryDevice` | `organizationId`, `serial` | |
| One assigned device | `getDevice` | `serial` | |
| Current uplink IPs per device | `getOrganizationDevicesUplinksAddressesByDevice` | `organizationId` | `networkIds`, `serials`, `productTypes` |
| Provisioning state | `getOrganizationDevicesProvisioningStatuses` | `organizationId` | `status` (`unprovisioned`, `incomplete`, `complete`) |
| EOX counts | `getOrganizationInventoryDevicesEoxOverview` | `organizationId` | |
| Firmware upgrade status per device | `getOrganizationFirmwareUpgradesByDevice` | `organizationId` | `networkIds`, `serials`, `currentUpgradesOnly`, `perPage` (default 50) |

Each call returns one page. Use the filters to narrow the result rather than reading everything, and say when a result may be partial.

## Examples

```
execute_api { "capability_id": "getOrganizationDevicesAvailabilities", "parameters": { "organizationId": "<orgId>", "statuses": ["offline", "alerting"], "perPage": 500 } }
```

```
execute_api { "capability_id": "getDevice", "parameters": { "serial": "Q2XX-XXXX-XXXX" } }
```

A device record carries `serial`, `name`, `model`, `mac`, `networkId`, `productType`, `lanIp` and `firmware`:

```json
{
  "serial": "Q2XX-XXXX-XXXX",
  "name": "HQ-MX-01",
  "model": "MX68",
  "mac": "00:11:22:33:44:55",
  "networkId": "L_123456789012345678",
  "productType": "appliance",
  "lanIp": "192.168.1.1",
  "firmware": "wired-18-107"
}
```

```
execute_api { "capability_id": "getOrganizationInventoryDevices", "parameters": { "organizationId": "<orgId>", "usedState": "unused", "perPage": 200 } }
```

## Common Workflows

### Find a device from whatever the user gave you

1. **Serial** -- `getDevice`. If it is not found, try `getOrganizationInventoryDevice`; the device may be claimed but unassigned.
2. **Name, MAC or model fragment** -- `getOrganizationDevices` with `name`, `mac` or `model` (each matches on contains or exact), or `getOrganizationInventoryDevices` with `search` to include unassigned hardware.
3. Translate `networkId` to a network name with `getOrganizationNetworks`.

### Offline and alerting sweep

1. `getOrganizationDevicesStatusesOverview` for the headline counts.
2. `getOrganizationDevicesAvailabilities` with `statuses: ["offline", "alerting"]`.
3. `getOrganizationDevicesAvailabilitiesChangeHistory` with those `serials` and a `timespan` such as 604800 (7 days) to show when each dropped and whether it is flapping.
4. Report by network, appliances first. When an MX is offline, the switches and APs behind it usually show offline too because they reach the cloud through it -- treat that as one site outage, not many device faults.

For the cause, hand off to `meraki-troubleshooting`.

### Unassigned and unused hardware

`getOrganizationInventoryDevices` with `usedState: "unused"` lists claimed devices sitting in inventory. They are often spares, RMA replacements never deployed, or devices left behind by a decommission. List them by model for the account manager.

### Lifecycle audit (EOX and firmware)

1. `getOrganizationInventoryDevicesEoxOverview` for counts of end-of-sale, end-of-support and nearing end-of-support.
2. `getOrganizationInventoryDevices` with `eoxStatuses: ["endOfSupport", "nearEndOfSupport"]` to name the affected serials and models.
3. `getOrganizationFirmwareUpgradesByDevice` with `currentUpgradesOnly: true` for upgrades that are scheduled or in progress.
4. Group by model and `firmware`. Flag end-of-support hardware first, then devices running a firmware train that differs from the rest of their network.

### Reboot or removal request

The hosted server cannot reboot or remove a device. Prepare the change for a human:

1. Confirm identity with `getDevice`: name, model, network, `productType`.
2. Check availability. An `offline` device cannot receive a reboot from the Dashboard; it needs a local power cycle.
3. Assess impact. Rebooting an MX or a core switch drops the whole site; rebooting an AP drops only its clients.
4. Hand over a precise instruction, for example:

> Reboot HQ-MS-CORE (MS250-48, serial Q2XX-XXXX-XXXX, network "HQ") from the Dashboard: Switching > Monitor > Switches > HQ-MS-CORE > Tools > Reboot. All wired clients at HQ lose connectivity until it is back online.

For removal, the human uses Organization > Inventory, selects the serial and chooses Remove from network (or Unclaim to take it out of the org). Afterwards, confirm with `getOrganizationInventoryDevice` that `networkId` is null.

## Error Handling

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| `getDevice` returns not found | Wrong serial, or the device is not assigned to a network | Check `getOrganizationInventoryDevice`; check the serial for O/0 and I/1 typos |
| Empty list for an org | The API key's admin cannot see that org or network | Confirm the org with `getOrganizations`; scope is whatever the key's admin can see |
| Device listed but no availability record | Newly claimed or never brought online | Check `getOrganizationDevicesProvisioningStatuses` |
| Result stops at the page size | One page per call | Narrow with `networkIds`, `serials` or `productTypes`; report the result as partial |

## Best Practices

- Identify devices by serial; treat names as display-only.
- Prefer org-wide capabilities with filters over per-device calls; the per-org rate limit is in `meraki-api-patterns`.
- Warn before recommending a reboot of an appliance or core switch.
- Reconcile `getOrganizationDevices` against `getOrganizationInventoryDevices` to spot unassigned or forgotten hardware.

## Related Skills

- `meraki-api-patterns` -- tool schemas, pagination, Conduit access tiers
- `meraki-troubleshooting` -- why a device is offline, port and wireless diagnostics
- `meraki-security-appliance` -- MX firewall, NAT and VPN
