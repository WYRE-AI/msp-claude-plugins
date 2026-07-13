---
description: >-
  Use this skill when working with Autotask billing — retrieving billing items, checking approval
  levels, and searching invoices. Essential for MSP finance teams and account managers reconciling
  billable work, approving charges, and exporting data for invoicing. Use when: autotask billing,
  autotask invoice, billing item autotask, billing approval, autotask billing item, autotask
  invoices, invoice search autotask, billable items autotask, or billing approval level.
---

# Autotask Billing

## Overview

Autotask billing tools give MSPs visibility into billable items, approval workflows, and invoices generated from time entries, charges, and contracts. Finance teams use these tools to review, approve, and export billing data.

## API Patterns

### Get a Billing Item

Retrieve a single billing item by ID.

Tool: `autotask_get_billing_item`

Key fields returned:
- `id` — Billing item ID
- `ticketID` / `projectID` — Source entity
- `resourceID` — Who performed the work
- `billingItemType` — Type (time entry, expense, charge, etc.)
- `approvalStatus` — Current approval state
- `amount` — Billable amount

### Search Billing Items

Tool: `autotask_search_billing_items`

Key parameters:
- `companyId` — Filter by client company
- `invoiceId` — Filter by invoice
- `approvalStatus` — Filter by approval state
- `startDate` / `endDate` — Date range filter
- `page` / `pageSize` — Pagination (default 25, max 200)

### Search Billing Approval Levels

Tool: `autotask_search_billing_item_approval_levels`

Returns the configured approval workflow steps for billing items in your Autotask instance. Approval levels are instance-specific.

### Search Invoices

Tool: `autotask_search_invoices`

Key parameters:
- `companyId` — Filter by client company
- `startDate` / `endDate` — Invoice date range
- `page` / `pageSize` — Pagination

## Common Workflows

### Month-End Billing Review

1. Use `autotask_search_billing_items` filtered by date range and company
2. Review items with pending approval status
3. Check associated tickets/projects for context
4. Export approved items for invoice generation

### Invoice Reconciliation

1. Use `autotask_search_invoices` to find invoices for a client
2. Cross-reference with `autotask_search_billing_items` filtered by invoice ID
3. Verify all expected charges appear
4. Identify any missing or duplicate items

### Approval Workflow Inspection

1. Use `autotask_search_billing_item_approval_levels` to understand configured steps
2. Use `autotask_search_billing_items` filtered by `approvalStatus` to find items pending each step

## Notes

- Billing item types are instance-specific picklist values; use `autotask_get_field_info` with entity `BillingItems` to retrieve valid values for your instance
- Approval workflows vary per Autotask configuration — consult your instance settings
- Invoices are typically generated from approved billing items; unapproved items will not appear on invoices
- This area is read-only via MCP; creating or posting invoices must be done through the Autotask UI or billing integrations
