---
name: "Moovila Project Health"
description: >
  Portfolio-level project health for MSP project delivery in Moovila:
  building the active-project list per customer, finding overdue and
  stalled tasks, milestones at risk, blocked work waiting on
  predecessors, projects past their due or forecast date, and producing a
  weekly project status report or a per-customer project review for a QBR.
when_to_use: >-
  When reviewing the state of open projects, preparing a weekly project
  meeting, or summarizing a customer's projects. Use when: moovila project
  status, overdue tasks, at-risk projects, late milestones, project
  portfolio review, onboarding project status, customer project update,
  or "which projects are behind".
---

# Moovila Project Health

## Overview

MSP project work in Moovila is mostly onboarding, migrations, hardware
refreshes and security rollouts, each tied to a customer. A project
manager's recurring question is "what is late, what is about to be late,
and who owns it". Moovila's own `rpaxScore` and `forecastDate` help, but
the reliable signal comes from task dates and completion.

All tools used here are read tier. No Moovila tool is admin-gated in
Conduit, and nothing here can change a project or task.

## Anti-triggers

- **Budget overruns and margin** - use
  [project-profitability](../project-profitability/SKILL.md). Health here
  is schedule and progress, not money.
- **Technician workload** - use
  [resource-utilization](../resource-utilization/SKILL.md).

## Building the active portfolio

1. Page through `moovila_projects_list` (keep `limit` at 20; project
   records are large).
2. Drop records where `isTemplate`, `isDeleted`, `isComplete` or
   `isInactive` is true.
3. Group by `organization.name` (fall back to `customer.name` if the
   tenant leaves `organization` empty).

For a single customer, there is no server-side filter: list, then filter
on the organization name. Match case-insensitively and confirm with the
user when more than one organization name is a close match.

## Overdue and at-risk work

For each active project, pull its tasks with
`moovila_tasks_list_for_project` (`projectID`), or for a whole-portfolio
sweep page through `moovila_tasks_list` once and group by `projectID`,
which is far fewer calls.

Ignore tasks with `isDeleted` true. Then classify each open task
(`percentageComplete` below 100 and no `completionDate`):

| Flag | Rule |
|------|------|
| Overdue | `dueDate` before today |
| Due soon | `dueDate` within the next 7 days and `percentageComplete` under 50 |
| Blocked | `hasPredecessors` true and `predecessorsComplete` false, with a `dueDate` inside 14 days |
| Unowned | no `ownerUser` |
| Late milestone | `isMilestone` true and overdue; always report these first |

At project level, flag:

- `dueDate` in the past while `isComplete` is false.
- `forecastDate` later than `dueDate` (Moovila already predicts a slip).
- Three or more overdue tasks, or any late milestone.

Use `moovila_phases_list` (or `moovila_phases_get` per `phaseID`) when the
report should name the phase a late task sits in. Phases carry only a
name and parent; they have no dates of their own.

## Stalled projects

A project with open tasks but no task or time entry changed recently is
stalled. Find it with `lastChangedDate`:

1. `moovila_tasks_list` with `lastChangedDate` set 14 days back.
2. `moovila_time_entries_list` with the same `lastChangedDate`.
3. Any active project whose ID appears in neither result has had no task
   edits and no time logged for two weeks.

## Report shape

Weekly status, grouped by customer:

```
Customer - Project (owner)          Due        Status      Flags
Acme - M365 migration (J. Ruiz)    2026-11-20  In Progress  2 overdue, 1 late milestone
```

Then, per flagged project, the overdue and blocked tasks with owner and
days late. End with the stalled-project list and any unowned tasks. For a
customer-facing QBR, drop owner names and internal status codes, and
describe progress as completed versus remaining milestones.

## Gotchas

- `status` and `stage` names are tenant-configured. Report the `name` as
  given; do not infer lateness from a status name.
- A task at 100 percent with no `completionDate` is effectively done;
  do not flag it.
- `rpaxScore` is Moovila's own risk score. Quote it if present, but base
  flags on dates so the report can be checked.
- `lastChangedDate` is a change time, not a due date. Do not use it to
  find tasks due in a window.
