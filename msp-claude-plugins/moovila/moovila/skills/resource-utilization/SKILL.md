---
name: "Moovila Resource Utilization"
description: >
  Technician utilization from Moovila data: the active user roster with
  labor types, hours logged per user from time entries, billable
  utilization against each labor type's workTargetBillable, open task load
  and work estimates per owner, and spotting over- and under-allocated
  technicians before scheduling new project work.
when_to_use: >-
  When reviewing team capacity, billable utilization, or who can take a
  new project. Use when: moovila utilization, billable utilization,
  technician capacity, resource planning, who is overloaded, labor type
  targets, project team workload, or "who has room for another project".
---

# Moovila Resource Utilization

## Overview

Moovila calls the people who do project work users (resources). Each
user has a labor type, and each labor type carries utilization targets.
Comparing logged time against those targets, and open task load against
capacity, tells a service manager who is stretched and who has room.

All tools used here are read tier. No Moovila tool is admin-gated in
Conduit. `hourlyCost` and labor type `fullyBurdenedCost` are internal
cost data; keep them out of anything shared beyond management.

## Anti-triggers

- **Whether time was billed correctly** - use
  [time-reconciliation](../time-reconciliation/SKILL.md).
- **Project schedule risk** - use
  [project-health](../project-health/SKILL.md).

## The roster

1. `moovila_users_list`, paging to the end. Keep `active` true.
2. `moovila_labor_types_list` (one call, whole table). Index by `id`.
3. Join each user's `resourceTypeID` to its labor type for `name`,
   `workTargetBillable`, `workTargetTask` and `workTargetMeetings`.

Users with no `resourceTypeID` have no target; list them separately
rather than assuming a default.

Do not use `moovila_resource_types_list`; Moovila has deprecated it in
favor of the labor type tools.

## Logged utilization for a period

1. `moovila_time_entries_list` without `lastChangedDate` (or with the
   period start only if the tenant confirms it does not pre-book time; see
   [api-patterns](../api-patterns/SKILL.md)); page to the end and keep
   entries whose `startTime` is in the period.
2. Group by `user.id`. Sum `totalHours` and `billableHours`.
3. Billable utilization = `billableHours` / available hours. Ask the user
   for available hours per week (commonly 40); Moovila's API does not
   expose working calendars.
4. Compare with `workTargetBillable`. Check the scale across the whole
   labor type table, not one row: if every target is between 0 and 1
   treat them as fractions, and if any is above 1 treat them as
   percentages. If the table only holds 0 and 1, ask the user which
   scale the tenant uses before comparing.

## Forward load

1. `moovila_tasks_list`, paging to the end. Keep tasks with `isDeleted`
   false, `percentageComplete` under 100, and a `dueDate` that is either
   already past (overdue work still needs doing) or in the next 2-4 weeks.
   Count open tasks with no `dueDate` separately and say their timing is
   unknown.
2. Group by `ownerUser.id`. Remaining effort per task is
   `workEstimate` x (1 - `percentageComplete` / 100).
3. Compare remaining effort with each owner's available project hours in
   the window.

## Report shape

```
Technician   Labor type        Logged  Billable  Util   Target  Open tasks  Est. remaining
J. Ruiz      Senior Engineer   152.0   128.0     80%    75%     9           46 h
M. Chen      Project Coord.     98.0    40.0     25%    50%     3            8 h
```

Flag anyone more than 10 points under target (capacity) or with
remaining effort above their available hours (overloaded).

## Gotchas

- Only project time logged in Moovila appears here. Service-desk time in
  the PSA is invisible, so low Moovila utilization is not proof of idle
  time. Say so in the report.
- Inactive users can still own open tasks. Report those tasks; they need
  reassigning.
- `workEstimate` units follow the tenant's settings (usually hours).
  Confirm with the user if values look like minutes or days.
