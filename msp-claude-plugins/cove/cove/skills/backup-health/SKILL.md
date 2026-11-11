---
name: "Cove Backup Health Triage"
description: >
  Finding Cove devices whose backups failed, finished with errors, or have
  gone stale, for one customer or the whole customer tree, using
  cove_device_statistics_list column queries; classifying each device;
  drilling into a device's profile and data sources; and writing a ranked
  triage list a technician can work through.
when_to_use: >-
  When someone asks which Cove backups failed, which devices have not backed
  up recently, or wants a daily or weekly backup check for a client. Use
  when: failed backups, stale backups, missed backups, backup health, backup
  report, last successful backup, cove morning check, or backup triage.
---

# Cove Backup Health Triage

## Overview

The daily backup check is the most common Cove job for an MSP: which devices
did not back up, since when, and what to fix first. In Cove, the answer comes
from `cove_device_statistics_list`, which returns per-device columns for a
customer and everything below it. Everything here is read-only. Re-running a
backup, changing a profile or removing a device happens in the Cove console.

All tools in this skill are read tier in Conduit. None is admin-gated.

## Anti-triggers

- **Storage used, growth, or where data is stored**: use
  `cove-customer-inventory`.
- **Who changed a device, profile or retention setting**: use
  `cove-access-review` (the audit log).

## Classification

Classify each device from two columns: `D09F00` (last session status, all
data sources) and `D09F09` (last successful session, Unix seconds).

| Class | Rule | Priority |
|-------|------|----------|
| **Never succeeded** | `D09F09` is empty or 0 | 1 |
| **Failed** | `D09F00` is 2 (Failed), 3 (Aborted), 6 (Interrupted) or 10 (Over quota) | 1 |
| **Stale** | Last success older than the threshold, whatever the last status | 2 |
| **Warning** | `D09F00` is 8 (Completed with errors) or 9 (In progress with faults) | 3 |
| **Not configured** | `D09F00` is 11 (No selection), or `I78` is empty | 3 |
| **Healthy** | `D09F00` is 5 (Completed) and last success within the threshold | none |

Default stale threshold: 48 hours. Use 24 hours when the user says the
devices back up more than once a day, and 8 days for weekly schedules. Say
which threshold you used.

A device can be both Failed and Stale. Report it once, under the higher
priority, and give its last success age.

Status 1 (In process) and 12 (Restarted) are not failures. Judge those
devices on their last success age alone.

## Workflow

1. **Resolve the customer.** Call `cove_auth_context_get` for the root
   `PartnerId`. For a named client, call `cove_partners_list` with that
   `parent_partner_id` and `fetch_recursively: true`, then match the name.
   Confirm the match with the user when two customers have similar names.
2. **Pull the columns.** Call `cove_device_statistics_list` with:
   - `partner_id`: the customer (sub-customers are included)
   - `columns`: `["I1", "I18", "I78", "D09F00", "D09F09", "I14"]`
   - `records_count`: 500
   - `start_record_number`: 0, then 500, and so on until a page returns
     fewer than 500 rows
3. **Check for truncation.** If a page has `truncated: true`, repeat it with
   fewer columns or a smaller `records_count`. Never classify from a
   truncated page as if it were complete.
4. **Classify** every device with the table above. Compute the last success
   age from `D09F09` against the current time.
5. **Group by customer.** Statistics rows carry the device's `PartnerId`. Map
   it to a customer name from the `cove_partners_list` result.
6. **Drill in** on the devices the user asks about:
   - `cove_device_get` for one device's details and home storage node
   - `cove_profiles_list` for the customer's backup profiles, then
     `cove_profile_get` for the profile the device uses, to see what it is
     meant to back up
   - per-data-source status: ask `cove_columns_list` for the codes, then
     re-query the device with `D<nn>F00` and `D<nn>F09` for each data source
     in its `I78` list, to show which data source failed
7. **Report** (see Output).

## Narrowing the Query

- `filter` takes a Cove filter expression on named columns, for example
  `"I1 =~ 'ACME-*'"` for devices whose name starts with ACME-, or
  `"I78 =~ '*D01*'"` for devices with the Files and Folders data source.
  If Cove rejects a filter, drop it and classify the full list yourself.
- `excluded_partners` leaves out customer IDs, for example internal test
  customers.
- `selection_mode: "Merged"` returns one row per device. Use it unless the
  user asks about individual installations.

## Output

Lead with the counts, then the work list:

1. **Summary**: devices checked, and the count per class. State the
   threshold and the time of the check.
2. **Work list**: one row per device in priority order, oldest last success
   first within a priority. Columns: customer, device name (`I1`), computer
   name (`I18`), class, last status (name, not number), last success (date
   and age), data sources (`I78`).
3. **Patterns**: several failures at one customer at once often point to a
   site problem (network, storage quota, a shared credential) rather than
   many device problems. Say so when you see it.

Keep healthy devices out of the work list. Give their count only.

## Gotchas

- A device that was never configured often shows status 11 or an empty
  `I78`. Treat it as a setup gap, not a failure.
- A decommissioned device keeps showing as stale until someone removes it in
  the console. If a device has been stale for months, suggest checking
  whether it still exists before chasing the backup.
- `cove_devices_list` covers only one customer level and has no status
  columns. Do not use it for health checks.
- `I14` is bytes. Convert before you show it.
