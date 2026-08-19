---
name: "Axcient Devices"
description: >
  Axcient x360Recover protected devices (servers and workstations):
  SERVER/WORKSTATION typing, the current/previous health-status model,
  local vs vault vs cloud usage and recovery-point timestamps, AutoVerify
  screenshot verification, and restore points.
when_to_use: >-
  When looking up, listing, or auditing devices protected by Axcient
  x360Recover. Use when: axcient device, protected system, backup status,
  recovery point, autoverify, restore point, device health, or x360recover
  device.
---

# Axcient Devices

## Overview

A device is one protected server or workstation — either backed up through
a local appliance or replicating directly to the cloud (D2C). Devices carry
their own health status, usage figures across up to three storage tiers
(local appliance, private vault, Axcient cloud), and the list of backup
jobs running against them.

## Anti-triggers

- **The appliance itself (hardware/capacity)** — use the `appliances`
  skill; a device is what's *protected*, an appliance is what's *doing the
  protecting*.
- **A specific backup run's pass/fail history** — device-level
  `latest_*_rp` fields are point-in-time snapshots, not history. Use the
  `jobs` skill's `axcient_jobs_get_history` for that.

## Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `axcient_devices_list` | Every device across the organization | `limit?`, `offset?` |
| `axcient_devices_list_by_client` | Devices for one client | `client_id`, `service_id?`, `d2c_only?` |
| `axcient_devices_get` | Full detail for one device | `device_id` |
| `axcient_devices_get_autoverify` | Latest AutoVerify (screenshot boot-test) results | `device_id` |
| `axcient_devices_get_restore_points` | Available restore points | `device_id` |

`axcient_devices_list` is the only device tool with pagination
(`limit`/`offset`, in pages of ~100). `axcient_devices_list_by_client`
returns a client's full device set in one call — no pagination arguments.

### Device Type & Product

| Field | Values | Meaning |
|-------|--------|---------|
| `type` | `SERVER`, `WORKSTATION` | What kind of system this is |
| `product` | `BRC`, `X360RECOVER` | Which backup engine protects it — legacy BRC appliances vs. current x360Recover (Replibit-based) |
| `d2c` | boolean | `true` if this device has no local appliance and replicates straight to Axcient's cloud |

### Health Status

```json
"current_health_status": { "status": "NORMAL", "reason": null, "timestamp": "2024-01-03T11:33:07.000Z" },
"previous_health_status": null
```

Status values follow the same tier Axcient uses in the portal UI
(`NORMAL`/`WARNED`/similar — the OpenAPI schema does not enumerate the
full set). `reason` is populated when the status is not `NORMAL` and is
the fastest way to understand *why* a device is unhealthy without
cross-referencing job history. `previous_health_status` lets you detect a
status transition (e.g. just recovered vs. been healthy for weeks) from a
single call.

### Usage & Recovery Points

| Field | Meaning |
|-------|---------|
| `local_usage` / `local_total` | Space used/available on the local appliance |
| `vault_usage` | Space used on the private vault |
| `cloud_usage` | Space used in Axcient's cloud |
| `latest_local_rp` | Timestamp of the most recent **local** backup |
| `latest_vault_rp` | Timestamp of the most recent **private vault** replication |
| `latest_cloud_rp` | Timestamp of the most recent **cloud** replication |

These three `latest_*_rp` timestamps are independent — a device can be
current locally while its vault or cloud replication has silently stalled.
Always check all three that apply to the device's configuration rather than
treating "backed up" as a single boolean.

### AutoVerify

```
axcient_devices_get_autoverify
```

Returns the most recent automated screenshot-boot-test result: whether the
last recovery point actually boots, with `screenshot_url` and
`screenshot_thumbnail_url` for visual confirmation, plus `is_healthy` and
timing fields. This is the strongest signal that a backup is *actually
recoverable*, not just that a backup job reported success — a job can
succeed while producing an image that fails to boot.

### Restore Points

```
axcient_devices_get_restore_points
```

Lists available recovery points for the device across its storage tiers.
Use this before recommending a restore — the device's `latest_*_rp` fields
tell you the newest point exists, not what the full available history
looks like.

## Common Workflows

### Backup Health Check for One Device

1. `axcient_devices_get` — pull `current_health_status`, all three
   `latest_*_rp` timestamps, and `jobs` (list of job IDs/names)
2. `axcient_devices_get_autoverify` — confirm the latest recovery point
   actually boots, not just that it exists
3. For any `latest_*_rp` older than expected, `axcient_jobs_get_history`
   (see the `jobs` skill) on the relevant job to see whether it's been
   failing or simply hasn't run

### Fleet-Wide Backup Audit

1. `axcient_devices_list` (paginate with `limit`/`offset` if the
   organization is large)
2. Filter/sort by `current_health_status.status` and `latest_local_rp` /
   `latest_cloud_rp` age
3. Flag devices where the newest recovery point is older than the
   client's expected RPO — device thresholds (`thresholds.*_rp_threshold`)
   define what "too old" means per-device, not a global constant

### Verifying a Recovery Is Actually Possible

1. `axcient_devices_get_restore_points` for the candidate device
2. `axcient_devices_get_autoverify` — do not proceed on a device whose
   most recent AutoVerify failed or is stale, even if `latest_local_rp`
   looks current
3. Confirm target vault/appliance capacity before a real restore — see
   the `vaults` and `appliances` skills

## Error Handling

### Device Not Found

**Cause:** Invalid `device_id`, or a numeric-looking ID for a device the
credential's organization doesn't own
**Solution:** Verify against `axcient_devices_list` or
`axcient_devices_list_by_client`.

### AutoVerify Returns Empty/Null

**Cause:** AutoVerify has never run for this device, or it's a device type
AutoVerify doesn't support (not every protected system is bootable-image
verifiable)
**Solution:** Don't treat an empty AutoVerify result as a failure signal —
check whether the device type supports it before escalating.

## Best Practices

- Prefer `axcient_devices_get_autoverify` over `latest_local_rp` alone when
  the question is "can we actually recover this," not just "did a backup
  run."
- A device's `jobs` array on the full-detail response gives you job IDs
  directly — use those with the `jobs` skill's tools instead of re-listing.
- `excluded_volumes` on a device is worth checking before assuming full
  coverage — a device can look protected while explicitly skipping a
  volume.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, tool catalog, error codes
- [clients](../clients/SKILL.md) - Client-level health rollup and protected-system counts
- [jobs](../jobs/SKILL.md) - Backup job status and run history
- [vaults](../vaults/SKILL.md) - Where vault-tier replication data lives
- [appliances](../appliances/SKILL.md) - The hardware protecting appliance-based devices
