---
name: "HaloPSA Invoices"
description: >-
  HaloPSA invoices as a read-only MCP surface: listing by client or date range,
  filtering by payment and send status, retrieving line-item detail on a single
  invoice, and the reporting and reconciliation workflows built on them.
when_to_use: >-
  When an MSP finance task needs HaloPSA invoice data — tracking billing, chasing unpaid
  invoices, or reconciling client accounts.
  Use when: halopsa invoice, halopsa billing invoice, list invoices halopsa, unpaid invoices
  halopsa, halopsa invoice status, invoice search halopsa, halopsa finance, halopsa invoice
  details, or paid invoices halopsa.
---

# HaloPSA Invoices

## Overview

HaloPSA invoices represent bills generated for client work and contracts. Use these tools to view invoice status, track payment, and pull invoice data for reporting or reconciliation. Invoices are read-only via MCP; creation and dispatch happen through the HaloPSA UI or billing workflows.

## Anti-triggers

This surface is read-only. There is no tool here that raises, edits,
sends, or credits an invoice — a request to do any of those cannot be
satisfied by this skill.

- **Raising, sending, or crediting an invoice** — no MCP tool exists;
  route the operator to the HaloPSA UI rather than improvising a write.
- **Payments, ledgers, and reconciliation in the accounting system** —
  the invoice of record for the books lives there; use `xero-invoices`
  and `xero-payments`.
- **Why an invoice says what it says** — recurring charges, prepaid-hour
  deduction, and billing frequency are configured on the agreement; use
  `halopsa-contracts`.
- **The billable time behind a line** — time entries are logged as ticket
  actions; use `halopsa-tickets`.

## API Patterns

### List Invoices

Tool: `halopsa_invoices_list`

Key parameters:
- `client_id` — Filter invoices by client ID
- `status` — Filter by invoice status (e.g., "draft", "sent", "paid" — values are instance-specific)
- `sent` — Filter by sent status (`true` = sent, `false` = unsent)
- `paid` — Filter by paid status (`true` = paid, `false` = outstanding)
- `invoice_date_start` — Date range start (format: `YYYY-MM-DD`)
- `invoice_date_end` — Date range end (format: `YYYY-MM-DD`)
- `limit` — Maximum results (default: 50)

Response includes:
- `record_count` — Total matching invoices
- `invoices` — Array of invoice records with ID, client, amount, dates, and status

### Get Invoice Details

Tool: `halopsa_invoices_get`

Parameters:
- `invoice_id` (required) — The invoice's numeric ID

Returns the full invoice record including line items, totals, tax, payment history, and associated tickets/contracts.

## Common Workflows

### Find All Unpaid Invoices for a Client

1. Find the client ID using `halopsa_clients_search` or `halopsa_clients_list`
2. Call `halopsa_invoices_list` with `client_id` and `paid: false`
3. Review outstanding invoices and amounts

### Monthly Invoice Report

1. Call `halopsa_invoices_list` with `invoice_date_start` and `invoice_date_end` for the month
2. Filter or group by client, status, or amount
3. Export totals for finance reporting

### Chase Unsent Invoices

1. Call `halopsa_invoices_list` with `sent: false`
2. Review draft invoices not yet dispatched to clients
3. Use HaloPSA UI to review and send

### Invoice Detail Lookup

1. Call `halopsa_invoices_list` to locate the invoice by client/date
2. Note the invoice `id`
3. Call `halopsa_invoices_get` with that ID for full line-item detail

## Notes

- Invoice status values are instance-specific; check your HaloPSA configuration for valid status strings
- Line item detail is only available via `halopsa_invoices_get` — the list endpoint returns summary data
- Invoices are read-only via MCP; to create, edit, or send invoices, use the HaloPSA web interface
- To find a client's ID for filtering, use the `clients` skill with `halopsa_clients_search`
