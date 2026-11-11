---
name: "Jamf Pro Patch Management"
description: >
  OS and third-party patch posture in Jamf Pro: which macOS and iOS versions
  Jamf can deploy, measuring OS version spread from inventory, managed
  software update plans and their status, patch management titles and per-title
  patch reports, the policies that deliver patches, and scheduling OS updates
  without forcing restarts.
when_to_use: >-
  When answering how current a client's Macs, iPhones, or iPads are, finding
  devices behind on macOS/iOS or on an app like Chrome or Zoom, or scheduling
  an OS update. Use when: macos updates, ios updates, os version report, jamf
  patch report, outdated apps mac, jamf patch management, schedule os update,
  software update plan.
---

# Jamf Pro Patch Management

## Overview

Jamf Pro patches Apple devices two ways. **Managed software updates** push macOS and iOS/iPadOS versions through MDM update plans. **Patch management titles** track third-party apps (Chrome, Zoom, Office) and report which version each Mac runs. Policies deliver the packages. MSPs need a patch posture number for each client, plus a short list of devices to chase.

## Anti-triggers

- **Encryption, check-in, or managed state**: use `jamf-device-compliance`.
- **Windows patching**: this plugin only covers Jamf-managed Apple devices.

## Key Concepts

| Thing | Tool | Notes |
|-------|------|-------|
| Deployable OS versions | `jamf_list_available_os_updates` | What Jamf can push today, macOS and iOS/iPadOS |
| Device OS version | `jamf_search_computers` / `jamf_search_mobile_devices` | `OPERATING_SYSTEM` is in the computer search default sections |
| OS update plans | `jamf_list_software_update_plans` | Scheduled updates and their status. Filter e.g. `device.deviceId=="42"`. |
| Third-party titles | `jamf_list_patch_titles` | Each id is a patch software title configuration |
| Per-title report | `jamf_get_patch_report` | Which computers run which version. Filter e.g. `version!="120.0"`. |
| Delivery policies | `jamf_list_policies`, `jamf_get_policy` | Scope, packages, scripts, Self Service settings |

## Common Workflows

### OS patch posture for one client

1. `jamf_list_available_os_updates` to get the newest deployable macOS and iOS versions.
2. `jamf_search_computers` with `sections: ["GENERAL", "OPERATING_SYSTEM"]`, paging with `pageSize: 200` until you have `totalCount` records. Add a site filter if the tenant is shared.
3. Group by `operatingSystem.version`: current, one minor behind, older minors, previous major, unsupported.
4. Repeat for mobile devices with `jamf_search_mobile_devices` (`GENERAL` holds the OS version).
5. `jamf_list_software_update_plans` to show which behind devices already have an update scheduled, and which plans failed.

Report the percentage on the latest minor of each major in use, then list devices two or more minors behind.

### Third-party app currency

1. `jamf_list_patch_titles`, pick the titles the client cares about.
2. `jamf_get_patch_report` for each, with `filter: 'version!="<latest>"'` to get only outdated Macs.
3. If many Macs are behind, `jamf_list_policies` with `contains: "<app name>"` and `jamf_get_policy` to check the patch policy's scope and whether it is enabled.

### Scheduling an OS update (write)

`jamf_schedule_os_update` creates a managed software update plan for up to 50 devices of one type.

| Arg | Values |
|-----|--------|
| `deviceType` | `computer` or `mobile_device` |
| `deviceIds` | Up to 50 ids |
| `updateAction` | `DOWNLOAD_ONLY`, `DOWNLOAD_INSTALL_ALLOW_DEFERRAL` (needs `maxDeferrals`), `DOWNLOAD_INSTALL_SCHEDULE` (needs `forceInstallLocalDateTime`, device-local, e.g. `2026-11-14T22:00:00`) |
| `versionType` | `LATEST_MINOR`, `LATEST_MAJOR`, `LATEST_ANY`, `SPECIFIC_VERSION` (needs `specificVersion` from `jamf_list_available_os_updates`) |

Immediate forced install and forced restart are not offered. Before calling, confirm with the user: the device list, the action, the target version, and the user-facing impact (deferral count or install time). Prefer `LATEST_MINOR` with deferrals for routine patching. Major upgrades should go through the client's change process.

After scheduling, check `jamf_list_software_update_plans` for the new plans' status.

### Keeping a patch target group

`jamf_create_smart_computer_group` (write) with a criterion like `{"name": "Operating System Version", "searchType": "less than", "value": "15.6"}` gives the client's admins a live view in Jamf, and policies can scope to it.

## Gatekeeping

- Posture review is entirely **read** tier.
- `jamf_schedule_os_update` and `jamf_create_smart_computer_group` are **write** tier.
- No patching tool is admin tier. `jamf_remove_computers_from_static_group`, which stops policies applying to the removed Macs, is **write** tier like the other group changes.

## Gotchas

- Large fleets: request only `GENERAL` and `OPERATING_SYSTEM` sections. Each response is capped, and `APPLICATIONS` alone can blow the cap.
- `jamf_list_available_os_updates` lists what Jamf can deploy, not what Apple has released in total. A version missing there cannot be scheduled.
- Update plans for devices that are offline stay pending. A device with a stale check-in (see `jamf-device-compliance`) will not patch until it reconnects.
- `jamf_list_policies` returns at most `limit` names (default 100). Check `totalMatched` before saying no patch policy exists.
