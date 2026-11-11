---
name: "NinjaOne Custom Fields"
description: >
  Reading and writing NinjaOne device and organization custom fields through
  ninjaone_devices_get_custom_fields, ninjaone_devices_update_custom_fields,
  ninjaone_organizations_get_custom_fields and
  ninjaone_organizations_update_custom_fields: field-name keys, partial
  updates, and safe write practice.
when_to_use: >-
  When reading or setting a custom field on a NinjaOne device or organization. Use when: ninjaone
  custom field, ninja custom field, device custom field, organization custom field, set custom
  field ninjaone, asset tag ninjaone, or warranty field ninja.
---

# NinjaOne Custom Fields

## Overview

MSPs use NinjaOne custom fields to hold data the RMM does not collect itself: asset tags, warranty dates, backup product, contract tier, BitLocker escrow status, or the output of a scripted check. Fields live on two scopes, devices and organizations, and each scope has a read and a write tool.

## Anti-triggers

- **Ticket custom fields** — ticket attributes are a separate model; use `ninjaone-tickets` (`ninjaone_tickets_attributes_list`).
- **Device or organization core properties** (name, policy, location) — use `ninjaone-devices` or `ninjaone-organizations`.

## MCP Tools

| Tool | Tier | Arguments | Purpose |
|------|------|-----------|---------|
| `ninjaone_devices_get_custom_fields` | read | `device_id` | All custom field values on a device |
| `ninjaone_devices_update_custom_fields` | write | `device_id`, `fields` | Set one or more device custom fields |
| `ninjaone_organizations_get_custom_fields` | read | `organization_id` | All custom field values on an organization |
| `ninjaone_organizations_update_custom_fields` | write | `organization_id`, `fields` | Set one or more organization custom fields |

`fields` is an object of field-name/value pairs, for example `{ "assetTag": "ACME-0042", "warrantyExpiry": "2027-03-31" }`. Keys are the field's **API name** as defined in NinjaOne's custom-field configuration, not its display label.

## Workflows

### Read before write

1. Get the current values with the matching `get_custom_fields` tool.
2. Confirm the exact key spelling from that response; never guess a key.
3. Show the user the old and new value for each field.
4. After approval, call the matching `update_custom_fields` tool with only the fields that change.

### Fleet audit

1. `ninjaone_organizations_list`, then `ninjaone_organizations_devices` per organization.
2. `ninjaone_devices_get_custom_fields` per device.
3. Report devices where a required field (asset tag, warranty date) is empty. This is read-only and safe to run unattended.

## Gotchas

- **Partial update, not replace.** Only the keys you send change. Do not send a field with an empty value to "leave it alone"; omit it.
- **Technician-editable versus script-written fields.** Some fields are written by NinjaOne scripts on a schedule. Changing one by hand is overwritten on the next run; check with the user before editing a field a script maintains.
- **Per-call write.** Each update is one API call per device or organization; there is no bulk tool. A fleet-wide change is many write calls and should be approved as a batch first.

## Related Skills

- [Devices](../devices/SKILL.md) - Device lookup
- [Organizations](../organizations/SKILL.md) - Organization lookup
- [Tickets](../tickets/SKILL.md) - Ticket attributes
