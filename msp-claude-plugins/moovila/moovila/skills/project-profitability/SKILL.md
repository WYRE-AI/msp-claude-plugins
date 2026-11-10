---
name: "Moovila Project Profitability"
description: >
  Budget versus actual for MSP projects in Moovila: reading project
  budget lines (total, allocated, unallocated, percentage committed),
  task-level totalBudget/totalActual/remainingBudget, labor cost from time
  entries at pay rate or labor type fully burdened cost, revenue from
  billable hours at bill rate or projectValue, and rolling these up to a
  per-project and per-customer margin view.
when_to_use: >-
  When reviewing whether projects are on budget or profitable, preparing
  a project post-mortem, or comparing fixed-fee projects across
  customers. Use when: moovila budget, project over budget, project
  margin, project profitability, budget burn, fixed fee project review,
  cost overrun, or "which projects lost money".
---

# Moovila Project Profitability

## Overview

For an MSP, projects are where margin quietly leaks: fixed-fee
onboardings that run long, migrations where labor exceeds the quote.
Moovila holds both sides of the calculation. Budget lines say what was
planned; tasks and time entries say what was spent.

All tools used here are read tier. No Moovila tool is admin-gated in
Conduit. Cost and rate data (`payRate`, `hourlyCost`,
`fullyBurdenedCost`) is visible to anyone granted the Moovila connection,
so treat the output as internal and keep it out of customer-facing
reports.

## Anti-triggers

- **Schedule and lateness** - use
  [project-health](../project-health/SKILL.md).
- **Whether individual time entries were billed correctly** - use
  [time-reconciliation](../time-reconciliation/SKILL.md).

## The three sources of numbers

| Source | Tool | What it gives |
|--------|------|---------------|
| Budget lines | `moovila_project_budgets_get` (one project) or `moovila_project_budgets_list` (all) | `totalBudgetAmount`, `allocatedCost`, `unallocatedCost`, `percentageCommitted`, by `category` and `costCode` |
| Task rollups | `moovila_tasks_list_for_project` or `moovila_tasks_list` | `totalBudget`, `totalActual`, `remainingBudget`, `workEstimate`, `laborActualSummary` per task |
| Time entries | `moovila_time_entries_list` | `totalHours`, `billableHours`, `payRate`, `billRate` per entry |

Prefer task rollups for "is this project over budget": Moovila computes
`totalActual` against `totalBudget` per task, so a sum across the
project's tasks is the project's burn. Use budget lines to explain where
the budget sits (labor versus hardware versus subcontract) and time
entries when you need labor cost and revenue the rollups do not carry.

## Per-project review

1. `moovila_projects_get` for the project header: `organization`,
   `projectValue`, `revenueType`, `dueDate`, `isComplete`.
2. `moovila_project_budgets_get` for its budget lines. Sum
   `totalBudgetAmount`; note lines with high `unallocatedCost` (budget not
   yet assigned to work).
3. `moovila_tasks_list_for_project`, paging to the end. Drop `isDeleted`
   tasks. Sum `totalBudget`, `totalActual`, `remainingBudget`.
4. Burn = sum(`totalActual`) / sum(`totalBudget`). Compare it with
   completion: average `percentageComplete` weighted by `totalBudget`.
   Burn well ahead of completion means an overrun is coming even if the
   project is not yet over.
5. For labor cost, page `moovila_time_entries_list` with a
   `lastChangedDate` at or before the project start, keep entries whose
   `projectID` matches, and sum `totalHours` x `payRate`. Where `payRate`
   is empty, resolve the user's `resourceTypeID` via
   `moovila_labor_types_list` and use `fullyBurdenedCost`.
6. Revenue: for fixed-fee projects use `projectValue`; for time and
   materials, sum `billableHours` x `billRate`.
7. Margin = revenue minus costs. Time entries carry labor only, so add
   hardware and subcontract actuals when you can identify them without
   counting labor twice. If you cannot, call the result labor-only
   margin, not total profit.

## Cross-customer roll-up

For "which projects are losing money" across the portfolio, avoid one call
per project:

1. Page `moovila_projects_list` once; keep active and recently completed
   projects, excluding `isTemplate` and `isDeleted`.
2. Page `moovila_tasks_list` once and group by `projectID`.
3. Page `moovila_project_budgets_list` once and group by `projectID`.
4. Compute burn and completion per project, then group by
   `organization.name` (fall back to `customer.name` when the tenant
   leaves `organization` empty).

Over budget is not the same as losing money: a fixed-fee project can
overrun its budget and still make a margin. For "which projects are
losing money", rank by margin (revenue minus actual cost, as in steps 5-7
above), lowest first, and say whether it is labor-only. For "which
projects are over budget", rank by overrun amount (sum `totalActual` minus
sum `totalBudget`), not by percentage, so a large overrun on a big project
outranks a small one on a tiny project.

## Report shape

```
Customer  Project            Budget    Actual   Burn  Complete  Flag
Acme      Server refresh     12,000    13,450   112%  85%       Over budget
Globex    M365 onboarding     6,500     4,100    63%  40%       Burning ahead of progress
```

Follow with the top three overruns, the task or budget category that drove
each, and the owner from `ownerUser`.

## Gotchas

- Budget and actual units follow the `budgetMethod` on each line (hours
  versus currency). Do not add an hours line to a currency line; group by
  method first.
- `projectValue` can be empty on time and materials projects. Say so
  instead of reporting zero revenue.
- Time adjustments (`timeEntryType` 2) can be negative. Include them, or
  labor cost is overstated.
- Moovila may already push actuals to the PSA. A project that looks
  over budget here can be under a PSA change order; ask before calling it
  a loss.
