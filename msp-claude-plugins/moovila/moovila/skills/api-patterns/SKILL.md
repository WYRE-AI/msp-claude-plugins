---
name: "Moovila API Patterns"
description: >
  The Moovila tool surface as exposed through Conduit: the 19 read-only
  report tools and their tiers, the bring-your-own-client OAuth connection
  and the X-Moovila-Access-Token header Conduit injects, offset/limit
  paging with the 100-record cap and truncation notes, lastChangedDate
  incremental pulls, GUID validation, the record shapes (Project,
  ProjectBudget, Task, TimeEntry, User, labor type), and the error
  vocabulary.
when_to_use: >-
  When calling any Moovila tool, paging through a Moovila list, or
  diagnosing a Moovila connection failure. Use when: moovila api, moovila
  mcp, moovila tools, moovila auth, moovila 401, moovila pagination,
  moovila offset, lastChangedDate, or "can Claude change anything in
  Moovila".
---

# Moovila Tools & API Patterns

## Overview

Moovila is a project management platform built around PSA-connected
project delivery: projects belong to a customer organization, break into
phases and tasks, carry budget lines, and accumulate time entries from
users (resources). This plugin reaches Moovila's Public API report
endpoints through the WYRE Conduit gateway, which fronts the `moovila-mcp`
server.

Everything is read-only. Moovila's published Public API spec has 19
endpoints and every one is a `GET`, so no tool in this plugin can create,
change, or delete anything in Moovila. When a user asks Claude to update a
task, log time, or close a project, say plainly that the connection cannot
do it and point them to the Moovila UI.

## Tool surface: 19 tools, all read tier

No Moovila tool is admin-gated in Conduit. All 19 are read tier, so any
Conduit user granted the Moovila connection can call any of them.

| Domain | List | Get one |
|--------|------|---------|
| Projects | `moovila_projects_list` | `moovila_projects_get` (`projectID`) |
| Budgets | `moovila_project_budgets_list` | `moovila_project_budgets_get` (`projectID`, returns all of that project's budget lines) |
| Phases | `moovila_phases_list` | `moovila_phases_get` (`phaseID`) |
| Tasks | `moovila_tasks_list`, `moovila_tasks_list_for_project` (`projectID` required) | `moovila_tasks_get` (`taskID`) |
| Time entries | `moovila_time_entries_list` | `moovila_time_entries_get` (`timeEntryID`) |
| Users | `moovila_users_list` | `moovila_users_get` (`userID`) |
| Products | `moovila_products_list` | `moovila_products_get` (`productID`) |
| Labor types | `moovila_labor_types_list` | `moovila_labor_types_get` (`laborTypeID`) |
| Resource types (deprecated) | `moovila_resource_types_list` | `moovila_resource_types_get` (`resourceTypeID`) |

`moovila_resource_types_list` and `moovila_resource_types_get` are
deprecated by Moovila and due to be removed. Use the labor type tools
instead; they return the same record shape.

None of the list tools take a customer, owner, status, or date-range
filter. The only server-side narrowing is `lastChangedDate` (projects,
budgets, phases, tasks, time entries) and `projectID` on
`moovila_tasks_list_for_project`. Every other filter is applied by Claude
after the page comes back.

## Connection and authentication

Moovila uses OAuth 2.0 authorization code with refresh tokens, against an
App Registration the MSP creates in its own Moovila tenant. There is no
shared WYRE Moovila app.

1. In Moovila, open **App Registration** (needs the **Integrations
   Manager** permission and a plan that includes the API).
2. Create an app for Conduit. Use Conduit's callback URL as the redirect
   URL and tick the project, task, user, time entry and lookup table read
   permissions.
3. In Conduit, open **Connections → Moovila**, paste the Client ID and
   Client Secret Moovila showed you, then sign in to Moovila to approve.

Conduit keeps the client secret and refresh token. On each call it sends
only the short-lived access token to the sidecar as the
`X-Moovila-Access-Token` header; the sidecar forwards it upstream as a
Bearer token. The plugin ships no `.mcp.json` (Claude Code reaches Conduit
through `wyre-gateway` at `https://conduit.wyre.ai/v1/mcp`), and no
credential lives on the technician's machine.

Moovila's help center says scopes are not enforced against the API, so the
token can read everything the consenting Moovila user can see. Consent
with a dedicated, least-privileged Moovila user, not an owner account.

## Paging

Every list tool except the two lookup-table lists pages with `offset` +
`limit`.

- `limit` defaults to 20 and accepts 1-100. A value over 100 is rejected,
  not silently capped.
- Each call fetches exactly one page. For the next page, pass
  `offset` + the number of records returned.
- Output is capped at 60,000 characters. A page over the cap is cut on a
  record boundary and ends with a note giving how many records were shown
  and the offset to resume from. Resume from that offset, not from
  `offset + limit`.
- A page with fewer records than `limit`, and no truncation note, is the
  last page. A full page is never proof of the end.
- `moovila_labor_types_list` and `moovila_resource_types_list` return the
  whole table in one call and take no paging arguments.

Project records are about 2 KB each, so a `limit` of 100 on
`moovila_projects_list` usually triggers truncation. Keep the default of
20 for projects and tasks; time entries and users are smaller and page
well at 50-100.

## Incremental pulls with lastChangedDate

`lastChangedDate` returns only records changed since a point in time. It
must be an ISO 8601 date-time with `Z` or a UTC offset, for example
`2026-10-01T00:00:00Z`. A zone-less value is rejected. Whether the bound
is inclusive has not been verified against a live tenant, so when exact
edges matter, step back a minute and de-duplicate on `id`.

It filters on change time, not on business date. A time entry worked in
September but edited in October appears in an October pull. To report on
a period, pull with a `lastChangedDate` at or before the period start and
filter on `startTime` (time entries) or `dueDate` (tasks) yourself.

## IDs and lookups

Every ID is a GUID and is validated before any request is sent; a
non-GUID returns a validation error without calling Moovila.

Nested references come back as `{ id, name }` objects, so most reports
need no second lookup: `organization`, `customer`, `ownerUser`, `stage`,
`status` on projects; `ownerUser`, `status`, `costCode`, `billingCode` on
tasks; `user`, `status`, `costCode`, `billingCode` on time entries. The
exception is `resourceTypeID` on users, tasks, time entries and budget
lines: resolve it against `moovila_labor_types_list`, which returns the
labor type's `name`, `defaultBillingRate`, `fullyBurdenedCost`, and the
`workTargetBillable` utilization target.

## Fields that matter

| Record | Key fields |
|--------|-----------|
| Project | `name`, `organization`, `customer`, `ownerUser`, `stage`, `status`, `isComplete`, `isInactive`, `isTemplate`, `isDeleted`, `startDate`, `dueDate`, `forecastDate`, `projectValue`, `revenueType`, `rpaxScore` |
| ProjectBudget | `projectID`, `category`, `costCode`, `budgetMethod`, `qty`, `unitCost`, `totalBudgetAmount`, `allocatedCost`, `unallocatedCost`, `percentageCommitted`, `resourceTypeID` |
| Task | `projectID`, `phaseID`, `name`, `status`, `priority`, `ownerUser`, `startDate`, `dueDate`, `completionDate`, `isMilestone`, `percentageComplete`, `workEstimate`, `totalBudget`, `totalActual`, `remainingBudget`, `predecessorsComplete`, `isDeleted` |
| TimeEntry | `projectID`, `taskID`, `user`, `status`, `startTime`, `endTime`, `totalHours`, `billableHours`, `billable`, `billRate`, `payRate`, `billingCode`, `costCode`, `timeEntryType` (1 = time entry, 2 = time adjustment), `notes` |
| User | `displayName`, `emailAddress`, `active`, `jobTitle`, `supervisor`, `resourceTypeID`, `hourlyCost` |
| Labor type | `name`, `category`, `isActive`, `defaultBillingRate`, `fullyBurdenedCost`, `workTargetBillable`, `workTargetTask`, `workTargetMeetings` |

Status and stage names are tenant-configured. Read the `name` on the
object rather than assuming a fixed set of codes.

Fields such as `prevailingWageID`, `excludePrevailingWage`,
`supervisorNotes`, `startDistanceToProject`, `endDistanceToProject` and
`totalBreakTime` are only populated for Moovila Smart Construction
tenants. Empty values on an MSP tenant are expected.

## Errors

| Status | Meaning | What to do |
|--------|---------|-----------|
| 400 | Bad request | Check the arguments, especially `lastChangedDate` format |
| 401 | Access token invalid or expired | Retry once; if it persists, reconnect Moovila in Conduit (token refresh has not yet been verified against a live tenant) |
| 403 | The consenting Moovila user cannot read this data | Widen that user's access in Moovila, or reconnect as a user who can see it |
| 404 | Resource not found | Re-list to confirm the ID; it may belong to a deleted record |
| 429 | Rate limited | If the error says "Retry after N s", wait that long; otherwise back off. Retry once |
| 5xx | Moovila server error | Retry later; do not loop |

Moovila documents no rate limits. Keep cross-customer sweeps to one page at
a time and avoid fanning out `_get` calls per record when the list already
carries the fields you need.

## Gotchas

- **Templates and deleted records come back in lists.** Exclude projects
  with `isTemplate` or `isDeleted` true, and tasks with `isDeleted` true,
  before counting anything.
- **`organization` versus `customer` on projects.** Both are `{ id, name }`
  references. MSP tenants typically populate `organization` with the
  client; check which one a tenant uses on the first page before grouping
  by it.
- **Time adjustments are rows too.** `timeEntryType` 2 marks an
  adjustment, which can carry negative hours. Include adjustments in
  totals; do not treat them as duplicate entries.
- **`moovila_tasks_list_for_project` requires `projectID`.** For tasks
  across every project, use `moovila_tasks_list`.

## Related Skills

- [project-health](../project-health/SKILL.md) - Portfolio status, overdue tasks, and at-risk projects
- [project-profitability](../project-profitability/SKILL.md) - Budget versus actual by project and customer
- [time-reconciliation](../time-reconciliation/SKILL.md) - Billable time review and PSA reconciliation
- [resource-utilization](../resource-utilization/SKILL.md) - Per-technician utilization against labor type targets
