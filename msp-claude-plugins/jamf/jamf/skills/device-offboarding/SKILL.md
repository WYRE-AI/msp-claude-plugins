---
name: "Jamf Pro Device Offboarding"
description: >
  Lost, stolen, and leaver device handling in Jamf Pro, almost all of it
  in the admin tier: operator-only Mac locking through
  jamf_prepare_computer_lock, mobile device lock, wipe, unmanage, record
  deletion, static group removal (write tier), and the read-only evidence to
  gather before any of them.
when_to_use: >-
  When a client reports a lost or stolen Mac, iPhone, or iPad, when a leaver's
  devices must be locked, wiped, or released from management, or when stale
  device and user records need deleting. Use when: lost macbook, stolen
  iphone, lock device jamf, wipe mac, erase ipad, unmanage device, remove
  from jamf, delete computer record, leaver devices jamf, offboarding jamf.
---

# Jamf Pro Device Offboarding

## Overview

Every action in this skill destroys data or removes management, except `jamf_prepare_computer_lock`, which only prepares a lock for a human operator. None of it can be undone from Claude. All but one tool sit in the admin tier, which is off by default in the sidecar and needs an admin grant in Conduit. The exception is `jamf_remove_computers_from_static_group`, which is write tier. `jamf_prepare_computer_lock` is flagged both write and admin in Conduit even though it sends nothing, so it also needs an admin grant. If the tools are not listed, say so and give the user the Jamf Pro console steps. Do not look for a workaround.

## Anti-triggers

- **Finding stale or unmanaged devices**: use `jamf-device-compliance` (read only).
- **Reassigning a device to a new owner without wiping it**: use `jamf-user-onboarding`.

## Offboarding Tools

| Tool | What it does | Tier | `confirm` |
|------|--------------|------|-----------|
| `jamf_prepare_computer_lock` | Checks the Mac and returns a console link and steps for an operator. **Sends nothing.** | admin | no |
| `jamf_lock_mobile_device` | MDM Device Lock on an iPhone/iPad, with optional `message` and `phoneNumber` | admin | yes |
| `jamf_wipe_computer` | MDM EraseDevice on a Mac | admin | yes |
| `jamf_wipe_mobile_device` | EraseDevice on iOS/iPadOS. Optional `preserveDataPlan`, `clearActivationLock` | admin | yes |
| `jamf_unmanage_computer` | Removes the MDM profile from a Mac | admin | yes |
| `jamf_unmanage_mobile_device` | Unmanages a mobile device and removes Jamf-managed apps, profiles, and data | admin | yes |
| `jamf_delete_computer` | Deletes the computer record and its inventory history | admin | yes |
| `jamf_delete_user` | Deletes a Jamf user record. Devices lose that assignment. | admin | yes |
| `jamf_delete_computer_group` | Deletes a smart or static computer group | admin | yes |
| `jamf_remove_computers_from_static_group` | Removes Macs from a static group, so scoped policies stop applying | write | no |

`confirm: true` stops accidental calls. It does not prove anyone approved the action. Set it only after the user has named the device and the action in this conversation.

## Before Any Action

1. **Identify the exact device.** `jamf_search_computers` or `jamf_search_mobile_devices` by `serialNumber` (preferred) or `username`. If more than one result comes back, stop and ask.
2. **Read the record.** `jamf_get_computer` (sections `GENERAL`, `HARDWARE`, `USER_AND_LOCATION`, `DISK_ENCRYPTION`) or `jamf_get_mobile_device`. Confirm the serial, model, assigned user, and last check-in with the user.
3. **Check encryption.** A FileVault-encrypted Mac that is lost is far less urgent to wipe than an unencrypted one. Say which it is.
4. **State the consequence** in one sentence (what data is lost, what management stops), and get an explicit yes.

## Common Workflows

### Lost or stolen Mac

1. Run the steps above.
2. `jamf_prepare_computer_lock` with the computer id. Give the user the returned `operatorUrl` and `operatorSteps`. A human operator signs in to Jamf Pro, sets a 6-digit PIN, records it in the client's password manager or ticket, and sends the lock. **The Mac is not locked until they do.** Never ask for, suggest, or repeat a PIN in chat.
3. If the client decides to wipe instead: `jamf_wipe_computer` with `confirm: true`. Intel Macs without a T2 chip need a firmware PIN this tool does not take. For those, the operator erases from the console (same link).
4. The command is queued. It runs when the Mac next contacts Jamf. Tell the user that, and record the time.

### Lost or stolen iPhone or iPad

1. Run the steps above.
2. `jamf_lock_mobile_device` with `confirm: true`, plus a `message` and `phoneNumber` for whoever finds it.
3. If it is not recovered, `jamf_wipe_mobile_device` with `confirm: true`. Leave `clearActivationLock` false unless the client wants the device back in service after recovery. Set `preserveDataPlan` true only if the eSIM must survive.

### Leaver

1. `jamf_search_computers` and `jamf_search_mobile_devices` by `username` to list every device assigned to them.
2. For devices coming back to the client: reassign or re-provision with `jamf-user-onboarding`. A wipe before handing a Mac to the next person is the client's call.
3. For BYOD or devices leaving with the person: `jamf_unmanage_mobile_device` or `jamf_unmanage_computer`, after confirming the client's policy.
4. Clean up only after devices are handled: `jamf_remove_computers_from_static_group` for groups that grant access to client resources, then `jamf_delete_user` if the client wants the record gone.

### Retired hardware

`jamf_delete_computer` permanently removes the record and its history, which some clients need for audits. Suggest keeping the record (unassigned) unless the client asks for deletion.

## Gotchas

- Lock, wipe, and unmanage return `queued: true`. They are MDM commands. Nothing has happened on the device until it checks in.
- Unmanaging a Mac means Jamf can no longer lock or wipe it. Do not unmanage a lost device.
- `jamf_list_api_roles`, `jamf_list_api_integrations`, `jamf_create_api_role`, and `jamf_delete_api_role` are also admin tier. They change who can do what in Jamf Pro and are not part of device offboarding. Use them only for an explicit API access review.
- If an admin tool fails with HTTP 403, the API client's role lacks the matching privilege (for example Send Computer Remote Wipe Command). That is a deliberate client choice. Report it rather than asking for broader access.
