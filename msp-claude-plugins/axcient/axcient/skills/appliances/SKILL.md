---
name: "Axcient Appliances"
description: >
  Axcient x360Recover appliances: the physical/virtual hardware running
  local backups, its device roster, and the org-wide vs client-scoped list
  tools.
when_to_use: >-
  When looking up Axcient appliance inventory or hardware detail. Use when:
  axcient appliance, appliance list, appliance capacity, appliance devices,
  or x360recover appliance.
---

# Axcient Appliances

## Overview

An appliance is the physical or virtual box running local backups for
appliance-based devices (as opposed to direct-to-cloud devices, which have
no appliance at all). Every appliance-based device belongs to exactly one
appliance; D2C devices never appear under one.

## Anti-triggers

- **A D2C-only device** — it has no appliance and won't appear in any
  appliance's device list. Use the `devices` skill directly.
- **Vault capacity** — an appliance's local storage is separate from vault
  storage; see the `vaults` skill for replication-target capacity.

## Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `axcient_list_appliances` | Every appliance in the organization | `service_id?`, `include_devices?` |
| `axcient_list_appliances_by_client` | Appliances for one client | `client_id`, `include_devices?` |
| `axcient_get_appliance` | One appliance's detail | `appliance_id`, `include_devices?` |

`include_devices` defaults to `true` on all three — pass `false`
explicitly when you only need appliance-level fields and want a smaller
response for a large fleet.

### Service ID Filtering

`axcient_list_appliances` accepts an optional `service_id` — the
appliance's 4-character serial/service identifier, useful when a
technician has the physical unit's ID label in hand but not its
`client_id`.

## Common Workflows

### Appliance Inventory for a Client

1. `axcient_list_appliances_by_client` with the client's ID
2. For each appliance, note model/version fields and the attached device
   count (from the embedded device list, if `include_devices` was left at
   its default `true`)

### Locating an Appliance by Serial

1. `axcient_list_appliances` with `service_id` set to the label on the
   physical unit
2. If nothing matches, the unit may be decommissioned or the service ID
   was misread — cross-check with `axcient_list_clients` for the expected
   client instead of assuming the appliance doesn't exist in the API

### Capacity Planning for New Devices

1. `axcient_get_appliance` for the target appliance with `include_devices`
   to see current load
2. Cross-reference against the vault(s) those devices replicate to (see
   the `vaults` skill) — appliance-local capacity and vault capacity are
   independent constraints, and a new device can be fine locally while
   pushing a private vault over capacity

## Error Handling

### Appliance Not Found

**Cause:** Invalid `appliance_id`, or the appliance belongs to a different
organization than the credential
**Solution:** Verify against `axcient_list_appliances` or
`axcient_list_appliances_by_client`.

## Best Practices

- Prefer the client-scoped list when you already know the client — it's
  one call instead of listing everything and filtering client-side.
- Treat appliance device counts as a proxy for local load, not vault
  replication health — a fully-loaded appliance can still have current
  vault/cloud recovery points, or vice versa.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, tool catalog, error codes
- [devices](../devices/SKILL.md) - Devices protected by a given appliance
- [clients](../clients/SKILL.md) - Client-scoped appliance listing
- [vaults](../vaults/SKILL.md) - Replication targets, independent of appliance-local capacity
