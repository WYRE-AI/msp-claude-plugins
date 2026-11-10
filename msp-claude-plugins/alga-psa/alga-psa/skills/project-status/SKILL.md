---
name: "Alga PSA Project Status"
description: >
  Reading Alga PSA projects for status reporting: projects by client,
  status or search; phases; tasks per project or phase; the ordered task
  status columns (project_status_mapping_id) a project or phase uses; and
  time logged against project tasks. Covers that the project status filter
  takes a status UUID, not a name. Read-only.
when_to_use: >-
  When reporting on Alga PSA project progress, finding overdue or stuck
  project tasks, or preparing a project status update for a client. Use
  when: alga projects, alga project status, alga project tasks, alga
  phases, alga onboarding project, alga project report.
---

# Alga PSA Project Status

## Overview

MSPs run onboarding, migrations and hardware refreshes as Alga projects. A project lead
wants to know which phases are done, which tasks are stuck, and what to tell the client.
Every tool here is a read and none is admin-gated in Conduit; moving tasks, changing
status or reassigning happens in Alga.

## Key Concepts

- **Project** → **phases** → **tasks**. Phases and tasks are not paginated: one call
  returns them all.
- **Task status columns**: `alga_projects_task_status_mappings_list` returns the status
  columns a project uses, in board order, each with its `project_status_mapping_id`.
  With `phase_id` you get the phase's own columns, or the project's when the phase has
  none. Use it to turn a task's mapping ID into a readable status and to know which
  column is last (done).
- **Project status** (the project as a whole) is a separate status list:
  `alga_statuses_list` with `type` project.

## Common Workflows

### Status report for one project

1. Find it: `alga_projects_list` with `client_id` or `search`, then `alga_projects_get`.
2. `alga_projects_phases_list` with the `project_id`.
3. `alga_projects_task_status_mappings_list` with the `project_id` and each phase's
   `phase_id` to get that phase's column order and names (a phase without its own
   columns returns the project's).
4. `alga_projects_tasks_list` with the `project_id` (add `phase_id` for one phase).
   Bucket tasks by status column.
5. Per phase: tasks done vs total, tasks in progress, and tasks past their due date that
   are not in the final column. `alga_projects_tasks_get` for detail on a blocker.
6. Optional effort view: `alga_time_entries_list` with `work_item_type` project_task and
   the task's `work_item_id`.
7. Write it up: overall state, per-phase progress, blockers with owners, next
   milestones. Keep internal remarks out of a client-facing version.

### Portfolio view

1. `alga_statuses_list` with `type` project to get the status IDs.
2. `alga_projects_list` with `status` set to the in-progress status ID (a UUID), sorted
   by `end_date`. Page to the end.
3. Flag projects whose `end_date` has passed, then drill into the worst few with the
   single-project workflow.

## Gotchas

- The `status` filter on `alga_projects_list` must be a status UUID from
  `alga_statuses_list`. A status name is rejected.
- Phase task lists can be large. If a result comes back truncated, filter by `phase_id`
  instead of pulling the whole project.
- Task status meaning comes from the mapping list, not from the task row alone; fetch
  the mappings before labelling tasks.
- Owners are user IDs. Resolve them with `alga_users_get` or `alga_users_list`.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md)
- [client-review](../client-review/SKILL.md)
