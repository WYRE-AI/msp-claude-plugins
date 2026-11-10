---
name: "Alga PSA Client Review"
description: >
  Building a per-client account picture from Alga PSA for a QBR, renewal or
  health check: client record, locations and contacts, ticket volume and
  open backlog over a period, time spent, invoices and payment state,
  contracts, assets, and active projects. Covers which Alga filters exist per
  record type (contracts have no client filter) and how to keep internal
  notes out of client-facing output.
when_to_use: >-
  When preparing a QBR, account review, renewal conversation or client
  health check from Alga PSA data. Use when: alga qbr, alga client review,
  alga account health, client summary alga, how much work did we do for
  client alga, alga client report.
---

# Alga PSA Client Review

## Overview

An account manager wants one page on a client: what we did, what is still open, what we
billed and whether they pay on time. Everything here is a read; no tool is admin-gated
in Conduit. For a long multi-section review, hand off to the
`alga-client-review-analyst` agent.

## Common Workflows

### 1. Identify the client

`alga_clients_list` with `search` (add `is_inactive` false to skip old accounts), then
`alga_clients_get` for the record. If several clients match, list them and ask which one.
Pull `alga_clients_locations_list` and `alga_clients_contacts_list` for the sites and
people on the account.

### 2. Service activity for the period

- **Opened in period**: `alga_tickets_list` with `client_id`, `entered_from` and
  `entered_to` (UTC timestamps). Use `fields` to keep rows small and page to the end.
- **Closed in period**: same, with `closed_from` / `closed_to`.
- **Still open**: `client_id` with `is_open` true, sorted by `entered_at` ascending to
  surface the oldest first.
- Break the opened tickets down by `priority_name` and `status_name`, and note repeat
  themes from titles (password resets, printer, VPN). Themes are the QBR talking points.

### 3. Time spent

Time entries are filtered by user and work item, not by client. Two practical routes:

- For a small ticket set, call `alga_tickets_time_entries_list` for every ticket that
  was open at any point in the period (the union of the opened, closed and still-open
  pulls above), keep only the entries dated inside the period, and sum. Respect the
  4-calls-at-once limit per connection.
- For a broad view, `alga_time_entries_list` with `date_from` / `date_to` and
  `work_item_type` ticket, then keep only entries whose work item is one of this
  client's tickets.

Report billable and non-billable hours separately (`is_billable`).

### 4. Billing

- `alga_invoices_list` with `client_id` and an `invoice_date_from` / `invoice_date_to`
  window for what was billed.
- Same with `status` overdue for anything outstanding; `alga_invoices_get` and
  `alga_invoices_items_list` when you need the lines.
- `alga_contracts_list` has **no client filter**: filter rows by `owner_client_id` (or
  `owner_client_name`) yourself. Use `is_active` true for current agreements.

### 5. Environment and projects

- `alga_assets_list` with `client_id` for the managed estate; group by `asset_type` and
  `status`.
- `alga_projects_list` with `client_id` for active and recent projects; see
  [project-status](../project-status/SKILL.md) to go deeper.

### 6. Write the summary

Sections: account snapshot (sites, key contacts, active contracts), service activity
(opened, closed, open backlog, top themes), effort (hours, billable split), billing
(invoiced in period, overdue), estate (asset counts), projects, and recommendations.
State the period and anything you could not read (for example a 403 on invoices).

## Gotchas

- Ticket date filters are UTC timestamps; invoice and time-entry date filters are
  `YYYY-MM-DD`. Mixing them up fails validation.
- Internal notes (`is_internal` true on comments) and internal-audience knowledge
  articles are for staff. Leave them out of anything the client will see.
- Counts are only as complete as the key's role. If invoices or time come back 403,
  say so rather than reporting zero.
- Confirm how your Alga instance stores invoice amounts (for example on one invoice in
  the Alga UI) before publishing totals.
- Nothing can be changed from here. Follow-ups such as "chase the overdue invoice" go in
  the recommendations for a person to action.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md)
- [ticket-triage](../ticket-triage/SKILL.md)
- [time-and-billing](../time-and-billing/SKILL.md)
- [project-status](../project-status/SKILL.md)
