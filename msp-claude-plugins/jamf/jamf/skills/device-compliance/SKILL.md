---
name: "Jamf Pro Device Compliance"
description: >
  Fleet compliance review for Jamf Pro: what jamf_backup_check measures on
  Macs (FileVault, recovery key escrow, managed state, inventory and check-in
  age) and iOS/iPadOS (passcode, data protection, device-reported iCloud
  Backup), its finding codes and severities, drilling into single devices,
  safe remediation with the write-tier tools, and smart groups for ongoing
  visibility.
when_to_use: >-
  When reviewing whether a client's Apple devices are encrypted, managed, and
  checking in, or preparing a security or compliance section for a QBR. Use
  when: filevault status, recovery key escrow, unencrypted macs, stale macs,
  devices not checking in, jamf compliance, iphone passcode, mdm compliance
  report, jamf backup check.
---

# Jamf Pro Device Compliance

## Overview

MSPs use Jamf Pro to prove client Macs and iPhones are encrypted, managed, and still reporting in. Cyber-insurance questionnaires and QBRs ask for these numbers. `jamf_backup_check` does the fleet scan in one call. The other read tools let you explain individual findings, and a few write tools fix the common ones.

## Anti-triggers

- **OS versions and app patching**: use `jamf-patch-management`.
- **Lost or stolen device, or wiping a leaver's Mac**: use `jamf-device-offboarding`.
- **Whether backups actually exist**: Jamf Pro is not a backup product. `jamf_backup_check` reports device-side protection signals only. Check the backup vendor's plugin.

## Key Concepts

### What `jamf_backup_check` checks

| Platform | Code | Severity | Meaning |
|----------|------|----------|---------|
| Mac | `unmanaged` | critical | Jamf reports the Mac as not managed |
| Mac | `not_encrypted` | critical | FileVault `NOT_ENCRYPTED` or not reported |
| Mac | `encryption_incomplete` | warning | Only some volumes encrypted |
| Mac | `encryption_not_applicable` | info | Jamf reports FileVault as not applicable (not counted against compliance) |
| Mac | `recovery_key_invalid` | critical | Encrypted, and the escrowed personal key is invalid |
| Mac | `recovery_key_not_escrowed` | critical | Encrypted, with no valid personal key and no institutional key |
| Mac | `inventory_stale` / `inventory_missing` | warning | Last inventory report older than `staleDays`, or none |
| Mac | `checkin_stale` / `checkin_missing` | warning | Last check-in older than `staleDays`, or none |
| iOS/iPadOS | `unmanaged` | critical | Not managed |
| iOS/iPadOS | `no_passcode` | critical | No passcode, so data protection is off |
| iOS/iPadOS | `data_not_protected` | critical | File-level data protection not active |
| iOS/iPadOS | `inventory_stale` / `inventory_missing` | warning | Last inventory update older than `staleDays`, or none |
| iOS/iPadOS | `icloud_backup_disabled` / `icloud_backup_stale` | warning | Device reports iCloud Backup off, or last backup older than `staleDays` |

A device with any critical or warning finding counts as non-compliant. Info findings do not.

### Arguments

| Arg | Default | Notes |
|-----|---------|-------|
| `platform` | `all` | `all`, `computers`, or `mobile_devices` |
| `staleDays` | 14 | 1-365. Use 30 for a monthly review. |
| `maxDevices` | 1000 | Per platform, max 5000 |
| `computerFilter` / `mobileFilter` | none | RSQL, e.g. `general.site.name=="Contoso"` for one site |
| `includeCompliant` | false | Also list devices with no findings |

### Reading the result

Each platform block has `scanned`, `totalInJamf`, `compliant`, `nonCompliant`, `findingCounts`, and `devices`. Check two things before you report numbers:

- `truncated: true` means the scan stopped at `maxDevices` before `totalInJamf`. Raise `maxDevices` or scope by site.
- At most 200 devices are listed. `devicesOmitted` counts the rest. The counts still cover every scanned device.

The tool never returns recovery keys. Do not try to retrieve one through any other tool.

## Common Workflows

### Monthly compliance summary for one client

1. If the tenant is shared across clients, `jamf_list_sites` to get the client's site name.
2. `jamf_backup_check` with `staleDays: 30` and the site filter.
3. Report compliance rate per platform (`compliant / scanned`), then `findingCounts` grouped by severity.
4. List critical devices by name and serial with the finding detail.
5. Say plainly that encryption and escrow are device protection, not backup.

### Explaining one device

`jamf_get_computer` with `sections: ["GENERAL", "DISK_ENCRYPTION", "OPERATING_SYSTEM", "SECURITY", "USER_AND_LOCATION"]` shows FileVault status, key validity, last contact, and the assigned user. For iPhones and iPads, `jamf_get_mobile_device` returns the full record.

### Remediating common findings

| Finding | First step | Tool (tier) |
|---------|------------|-------------|
| `checkin_stale` on a Mac that is still in use | Redeploy the Jamf management framework so policies and inventory resume | `jamf_redeploy_management_framework` (write) |
| `inventory_stale` on a mobile device | Ask the device for fresh inventory | `jamf_update_mobile_device_inventory` (write, up to 100 ids) |
| `not_encrypted` | Find the FileVault enforcement policy and check its scope | `jamf_list_policies` with `contains: "FileVault"`, then `jamf_get_policy` |
| `recovery_key_not_escrowed` | Usually FileVault enabled before the escrow profile arrived. Re-issuing the key is a console task. | Report it. No tool rotates keys. |
| `unmanaged` on a device the client has retired | Offboard it | See `jamf-device-offboarding` (admin-gated) |

Confirm each write action with the user before calling it. Redeploying the framework and requesting inventory are non-destructive, but they still send MDM commands to client devices.

### Ongoing visibility

Create a smart group so the gap stays visible in Jamf between reviews:

`jamf_create_smart_computer_group` (write) with `criteria: [{"name": "FileVault 2 Status", "searchType": "is not", "value": "All Partitions Encrypted"}]`.

Criterion names match the Jamf Pro UI. Confirm the exact value strings in the client's console before relying on the group.

## Gatekeeping

- Everything in the summary workflow is **read** tier.
- `jamf_redeploy_management_framework`, `jamf_update_mobile_device_inventory`, and `jamf_create_smart_computer_group` are **write** tier.
- Unmanaging or wiping a non-compliant device is **admin-gated in Conduit** and off by default in the sidecar. See `jamf-device-offboarding`.

## Gotchas

- A Mac with both `checkin_stale` and `inventory_stale` is usually powered off, in a drawer, or with a user on leave. Ask the client before redeploying the framework or treating it as broken.
- A Mac can report `BOOT_ENCRYPTED` (boot volume only). The check counts that as encrypted.
- iCloud Backup state is self-reported by iOS. A managed Apple Account or MDM restriction can legitimately disable it, so treat `icloud_backup_disabled` as a question for the client, not a failure.
