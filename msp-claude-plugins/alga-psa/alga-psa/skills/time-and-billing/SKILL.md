---
name: "Alga PSA Time and Billing"
description: >
  Alga PSA time and billing reads: time sheet approval states and the
  backlog waiting for a manager, time entries by technician, work item type,
  service and billable flag, technician schedules, invoice status (draft,
  sent, overdue, paid ...) with date-range filters, invoice line items, and
  the service catalog. Read-only: approvals and invoice actions stay in Alga.
when_to_use: >-
  When checking Alga PSA time sheets, technician hours, billable versus
  non-billable time, or invoice status before a billing run or month end.
  Use when: alga time sheets, alga approvals, alga timesheet backlog, alga
  billable hours, alga utilization, alga overdue invoices, alga draft
  invoices, alga month end.
---

# Alga PSA Time and Billing

## Overview

Before a billing run, a service manager checks that time is submitted and approved, that
billable work is flagged billable, and that invoices are not sitting in draft or going
overdue. These are all reads; none is admin-gated in Conduit. Approving a time sheet,
requesting changes, finalising or sending an invoice is not possible through this
connector. List what needs doing and who should do it.

## Key Concepts

| Concept | Values |
|---|---|
| Time sheet `approval_status` | `DRAFT`, `SUBMITTED`, `APPROVED`, `CHANGES_REQUESTED` |
| Time entry `work_item_type` | ticket, project_task, non_billable_category, ad_hoc, interaction, co_managed |
| Invoice `status` | draft, sent, paid, overdue, cancelled, pending, prepayment, partially_applied |

## Common Workflows

### Time sheet approval backlog

1. `alga_time_sheets_list` with `approval_status` SUBMITTED, sorted by `submitted_at`
   ascending: these wait on a manager.
   `{"approval_status": "SUBMITTED", "sort": "submitted_at", "order": "asc", "limit": 100, "page": 1}`
2. Repeat with DRAFT for sheets not yet submitted and CHANGES_REQUESTED for sheets sent
   back. Narrow to one period with `period_id`.
3. Map `user_id` to names with `alga_users_list`, and to managers with `alga_teams_list`
   (each team has a manager) so each item has an owner.
4. Report per technician: period, state, age. Flag anything submitted more than a few
   days ago.

### Hours by technician

1. `alga_time_entries_list` with `user_id`, `date_from` and `date_to` (`YYYY-MM-DD`).
   Page to the end. If a page request fails, report the hours as incomplete rather than
   presenting the technician totals as complete.
2. Split by `is_billable` and by `work_item_type`. A high share of `ad_hoc` or
   `non_billable_category` time is worth a conversation.
3. For a whole team, loop over its members from `alga_teams_list`, at most 4 calls at a
   time.
4. `alga_time_entries_get` for the detail on any single entry that looks wrong.

### Billable work logged as non-billable

`alga_time_entries_list` with `is_billable` false and `work_item_type` ticket for the
period. Check each ticket's client and contract (see
[client-review](../client-review/SKILL.md)) and list entries that look billable. A
person changes the flag in Alga.

### Invoice health

- **Overdue**: `alga_invoices_list` with `status` overdue, sorted by `due_date`
  ascending. Group by client.
- **Stuck in draft**: `status` draft with `invoice_date_to` a week or more ago.
- **Due soon**: `status` sent with `due_date_from` / `due_date_to` covering the next 14
  days.
- Drill in with `alga_invoices_get` and `alga_invoices_items_list`; map line items to
  services with `alga_services_list`.

### Who is booked when

`alga_schedules_list` with `user_id` and `start_date` / `end_date` shows scheduled work,
useful next to logged time when hours look low.

## Gotchas

- Time entry `date_from` / `date_to` and invoice date filters are `YYYY-MM-DD`; the
  `start_time_*` / `end_time_*` filters are UTC timestamps.
- A key whose user can't read every time sheet sees only some entries. If totals look
  low, check the role before drawing conclusions.
- `alga_time_entries_list` has no client filter. Go through tickets or work items to
  attribute time to a client.
- Confirm how your instance stores invoice amounts before adding them up.
- Invoices and time are sensitive. Share per-technician hours only with the people who
  manage them.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md)
- [client-review](../client-review/SKILL.md)
