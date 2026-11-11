---
description: Review one Moovila project or one customer's projects for schedule, budget, and time issues
argument-hint: "[customer or project name]"
arguments: [target]
---

# Moovila Project Review

Review a single project, or every active project for one customer, and
report what is late, what is over budget, and which time entries need
fixing before invoicing.

## Arguments

- `target` (optional) - a customer (organization) name or a project name.
  With no target, review every active project.

## Prerequisites

- Moovila connected in Conduit (Connections → Moovila)
- Tools: `moovila_projects_list`, `moovila_tasks_list_for_project`,
  `moovila_project_budgets_get`, `moovila_time_entries_list`
- All of these are read tier; none is admin-gated in Conduit

## Steps

1. **Find the projects**

   Page `moovila_projects_list` and drop templates, deleted and inactive
   projects, and completed ones (`isComplete`) unless the user asked for
   completed projects. Match `target` against `organization.name` first
   (or `customer.name` when the tenant leaves `organization` empty), then
   project `name`. When the target names one customer, review every active
   project for that customer. Ask only when the target matches more than
   one customer, or more than one project name for a project-level target.

2. **Tasks**

   For each project, page `moovila_tasks_list_for_project` with its
   `projectID`. Flag overdue tasks, late milestones and blocked tasks
   (predecessors incomplete, due within 14 days).

3. **Budget**

   Call `moovila_project_budgets_get` for each project. Compare summed
   task `totalActual` with `totalBudget`, and burn with completion.

4. **Time**

   Page `moovila_time_entries_list` without `lastChangedDate` (it is a
   change time, so it can drop an entry created before the month with a
   `startTime` inside it; use a bound only if the tenant confirms one is
   safe), keep entries for these projects whose `startTime` is in the
   current month, and flag
   billable entries with no rate or billing code and entries with no
   task.

5. **Summarize**

   One table per project: due date, completion, burn, flag count. Then
   the flagged tasks and time entries with owner and date, and one
   recommended next action per project.

## Examples

```
/moovila:project-review
/moovila:project-review Acme
/moovila:project-review "M365 migration"
```

## Related

- Agent: `project-portfolio-reviewer` for the full cross-customer review
