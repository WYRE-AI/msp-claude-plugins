---
name: "Jamf Pro User Onboarding"
description: >
  New-hire setup in Jamf Pro: user records and how to avoid duplicates,
  scoping a new Mac's serial to a computer PreStage enrollment for Automated
  Device Enrollment, assigning computers and mobile devices to a user,
  building, department, and site, and adding Macs to static groups so the
  right policies and profiles apply.
when_to_use: >-
  When a client has a new starter who needs a Mac, iPhone, or iPad, when a
  device needs to be reassigned to a different user, or when a Mac must be
  scoped to a PreStage before it ships. Use when: jamf new hire, onboard user
  jamf, assign mac to user, prestage enrollment, automated device enrollment,
  add serial to prestage, reassign device, jamf static group.
---

# Jamf Pro User Onboarding

## Overview

Onboarding in Jamf Pro has three jobs. Get the new Mac to enroll with the client's configuration at Setup Assistant (PreStage scoping). Record who the device belongs to (user and location assignment). Put it in the groups that scope the client's apps and settings. All of the changes here are write tier and non-destructive.

## Anti-triggers

- **Leaver, lost, or stolen device**: use `jamf-device-offboarding`.
- **Creating the person's identity account (Entra ID, Google)**: Jamf user records are inventory assignments, not IdP accounts.

## Key Concepts

| Thing | Tools |
|-------|-------|
| Jamf users (who devices are assigned to) | `jamf_search_users`, `jamf_get_user`, `jamf_create_user`, `jamf_update_user` |
| Computer PreStages (ADE profiles) | `jamf_list_computer_prestages`, `jamf_add_serials_to_computer_prestage` |
| Mobile PreStages | `jamf_list_mobile_device_prestages` (read only, no serial scoping tool) |
| Location ids | `jamf_list_buildings`, `jamf_list_departments`, `jamf_list_sites` |
| Assignment | `jamf_assign_computer`, `jamf_assign_mobile_device` |
| Groups | `jamf_list_computer_groups`, `jamf_get_computer_group`, `jamf_add_computers_to_static_group` |

## Common Workflows

### New starter with a new Mac

1. **Find or create the user.** `jamf_search_users` by `email` and `username` first. Only if nothing matches, `jamf_create_user` with `username` (match the IdP username), `realname`, `email`, and `position`.
2. **Scope the serial before the Mac is unboxed.** `jamf_list_computer_prestages` to find the client's PreStage, then `jamf_add_serials_to_computer_prestage` with `prestageId` and `serialNumbers`. Serials must already be in Apple Business Manager and assigned to this Jamf instance, or Jamf rejects them.
3. **After enrollment, assign the Mac.** `jamf_search_computers` with `serialNumber` to get the computer id. Resolve `departmentId`, `buildingId`, and `siteId` with the list tools, then `jamf_assign_computer` with the id and only the fields you want to set.
4. **Group it.** `jamf_list_computer_groups` to find the client's onboarding or department static group, then `jamf_add_computers_to_static_group`.
5. Report back: user id, PreStage name, computer id, assigned fields, and groups.

### New iPhone or iPad

Mobile devices have no serial-scoping tool here. The client's Apple Business Manager default assignment usually handles PreStage selection. After enrollment, `jamf_search_mobile_devices` by `serialNumber`, then `jamf_assign_mobile_device` with the user fields.

### Reassigning a device

1. `jamf_search_users` for the new owner (create if missing).
2. `jamf_assign_computer` or `jamf_assign_mobile_device` with the new `username`, `realName`, `email`, and location ids.
3. If the old owner left the company, run the leaver steps in `jamf-device-offboarding` for their other devices.

### Updating a user record

`jamf_update_user` reads the current record and changes only the fields you pass (`username`, `realname`, `email`, `phone`, `position`, `managedAppleId`). Use it for name changes and new job titles. It does not touch device assignments.

## Gatekeeping

- Lookups are **read** tier.
- `jamf_create_user`, `jamf_update_user`, `jamf_add_serials_to_computer_prestage`, `jamf_assign_computer`, `jamf_assign_mobile_device`, and `jamf_add_computers_to_static_group` are **write** tier.
- Nothing in onboarding is admin tier. The reverse operations differ: `jamf_remove_computers_from_static_group` is also **write** tier, while `jamf_delete_user` is **admin** tier.

## Gotchas

- `jamf_create_user` does not look for existing records first. Always search, by email as well as username, because people get re-hired under new usernames.
- The two assign tools take `realName` (capital N). The user tools take `realname`. Pass the right one or the field is dropped.
- `jamf_assign_computer` and `jamf_assign_mobile_device` need at least one field besides `id`. Fields you leave out keep their current values.
- `jamf_add_serials_to_computer_prestage` uppercases serials and accepts up to 100. Serials must be 8-20 letters and digits.
- `jamf_add_computers_to_static_group` refuses smart groups. Smart group membership comes from criteria. Pick a static group, or change the attribute the smart group keys on (often department or building through the assign tools).
