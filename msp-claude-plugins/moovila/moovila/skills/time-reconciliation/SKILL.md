---
name: "Moovila Time Reconciliation"
description: >
  Reviewing Moovila time entries for billing: pulling a billing period's
  entries completely and filtering them on startTime, separating
  billable from non-billable and time adjustments, catching entries with
  missing billing codes, zero bill rates, billable flags that disagree
  with billable hours, or no task, and reconciling Moovila hours against
  PSA time per customer and project before invoicing.
when_to_use: >-
  When closing a billing period, checking that project time is ready to
  invoice, or reconciling Moovila hours with a PSA. Use when: moovila
  time entries, billable hours, unbilled time, time entry audit, billing
  reconciliation, month end project billing, missing billing code, or
  "do Moovila hours match the PSA".
---

# Moovila Time Reconciliation

## Overview

Project time logged in Moovila becomes invoice lines, usually by syncing
to the PSA. Errors there are revenue errors: billable work entered as
non-billable, a zero bill rate, time on the wrong project. This skill
finds them before the invoice run.

All tools used here are read tier. No Moovila tool is admin-gated in
Conduit. Nothing here can edit or approve a time entry; corrections are
made in Moovila or the PSA by a person.

## Anti-triggers

- **Project budget burn** - use
  [project-profitability](../project-profitability/SKILL.md).
- **Hours per technician against targets** - use
  [resource-utilization](../resource-utilization/SKILL.md).

## Pulling a billing period

`moovila_time_entries_list` has no date-range filter, and
`lastChangedDate` is a change time, so:

1. Call `moovila_time_entries_list` without `lastChangedDate` and with
   `limit` 100.
2. Page to the end, following any truncation note's resume offset.
3. Keep entries whose `startTime` falls inside the period.

A `lastChangedDate` at the period start (for example
`2026-10-01T00:00:00Z`) is much smaller, but it misses an entry entered
ahead of time with a `startTime` in the period and never edited since.
Use it only when the tenant confirms it does not pre-book time, and state
in the report which pull you used (see
[api-patterns](../api-patterns/SKILL.md)).

## Checks

Run these over the period's entries and list each hit with user, project,
date and hours:

| Check | Rule |
|-------|------|
| Billable with no rate | `billable` true and `billRate` empty or 0 |
| Billable flag disagrees | `billable` true and `billableHours` 0, or `billable` false and `billableHours` above 0 |
| No billing code | `billable` true and no `billingCode` |
| No task | empty `taskID` (time is on the project but not attributable to work) |
| Long entry | `totalHours` over 10 for a single entry |
| Open entry | `startTime` set and no `endTime` |
| Adjustment | `timeEntryType` 2; list separately so a reviewer confirms each |

Use `status.name` to separate approved from submitted or draft time; the
names are tenant-configured, so read them from the first page before
filtering.

## Reconciling with the PSA

1. Group the period's entries by project, then by the project's
   `organization.name` (look projects up once with
   `moovila_projects_list`, not per entry).
2. Sum `totalHours` and `billableHours` per customer and project.
3. Pull the same period's time from the PSA plugin the MSP uses and
   group the same way.
4. Report differences over 0.25 hours per project. Most differences are
   entries not yet synced (check `status`) or entries edited in Moovila
   after the sync.

Match on customer name and project name, not on IDs; Moovila GUIDs do not
appear in the PSA. When a name matches more than one customer or project
on either side, or only loosely, list the candidates and ask the user to
confirm the mapping before reconciling them.

## Report shape

```
Period 2026-10-01 to 2026-10-31
Total hours 412.5   Billable 356.0   Adjustments 3 (-2.5 h)

Issues (12)
Billable with no rate   4   J. Ruiz, Acme M365 migration, 2026-10-14, 3.0 h ...
No billing code         6   ...

PSA differences
Acme - M365 migration   Moovila 42.0 h   PSA 38.5 h   +3.5 h
```

## Gotchas

- `billRate` and `payRate` are both on every entry. Never put `payRate`
  in a customer-facing report.
- `user` is a `{ id, name }` reference. For email or supervisor, resolve
  through `moovila_users_list` once, not `moovila_users_get` per entry.
- Smart Construction fields (`supervisorNotes`, `totalBreakTime`, travel
  distances) are empty on MSP tenants; ignore them.
