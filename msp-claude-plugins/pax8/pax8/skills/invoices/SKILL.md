---
name: "Pax8 Invoices"
description: >
  Pax8 invoices and billing: invoice retrieval, invoice line items, usage-based billing
  summaries, the MSP billing cycle, and reconciling Pax8 costs against client charges.
when_to_use: >-
  When retrieving invoices, analyzing billing data, reviewing usage summaries, or
  reconciling Pax8 costs with client charges. Use when: pax8 invoice, pax8 billing, pax8
  cost, pax8 charge, pax8 usage, billing reconciliation, invoice items, pax8 payment,
  cost analysis, billing report, or usage summary.
---

# Pax8 Invoices & Billing

## Overview

Invoices in Pax8 represent the MSP's cost for cloud subscriptions procured through the marketplace. Pax8 generates invoices on a regular billing cycle, detailing the charges for each subscription across all client companies. MSPs use invoice data to reconcile their costs against what they charge their clients, ensuring profitability and catching billing discrepancies.

## Anti-triggers

- **An invoice the MSP sends to a client** — a Pax8 invoice is money the
  MSP *owes*, in the opposite direction to everything in the accounting
  and PSA plugins. Client-facing invoices are `quickbooks-invoices`,
  `xero-invoices`, `autotask-billing`, or `halopsa-invoices`. Getting the
  direction wrong inverts every margin calculation.
- **The equivalent cost from the other CSP marketplace** — use
  `sherweb-billing`.
- **Comparing the two sides to find unbilled subscriptions** — that is the
  cross-vendor reconciliation itself, not a Pax8 lookup; use
  `shared-billing-reconciliation`.
- **What is provisioned rather than what was charged** — use
  `pax8-subscriptions`. A cancelled subscription can still appear on the
  current invoice, and a new one may not appear yet.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pax8-list-invoices` | List and filter invoices | `page`, `size`, `sort`, `status` (unpaid/paid/void/carried/nothing due), `invoiceDate`, `invoiceDateRangeStart`, `invoiceDateRangeEnd`, `dueDate`, `total`, `balance`, `carriedBalance`, `companyId` |
| `pax8-get-invoice-by-uuid` | Get a single invoice | `uuid` (required) |
| `pax8-get-usage-summary` | Get usage summary for a subscription | `subscriptionId` (required), `page`, `size`, `sort`, `resourceGroup`, `companyId` |
| `pax8-get-detailed-usage-summary` | Get detailed usage data | `usageSummaryId` (required), `usageDate`, `page`, `size` |

### List Invoices

Call `pax8-list-invoices` with optional parameters:

- **Filter by status:** Set `status` to `unpaid`, `paid`, `void`, `carried`, or `nothing due`
- **Filter by company:** Set `companyId` to a company UUID
- **Filter by date range:** Set `invoiceDateRangeStart` and `invoiceDateRangeEnd`
- **Filter by specific date:** Set `invoiceDate`
- **Paginate:** Set `page` (0-based) and `size` (up to 200)

**Example: List unpaid invoices:**
- `pax8-list-invoices` with `status=unpaid`, `size=200`

**Example: List invoices for a company:**
- `pax8-list-invoices` with `companyId=a1b2c3d4-...`, `size=200`

**Example: List invoices in a date range:**
- `pax8-list-invoices` with `invoiceDateRangeStart=2026-01-01`, `invoiceDateRangeEnd=2026-01-31`

### Get a Single Invoice

Call `pax8-get-invoice-by-uuid` with the `uuid` parameter.

### Get Usage Summaries

Call `pax8-get-usage-summary` with `subscriptionId` (required). Optionally filter by `resourceGroup` or `companyId`.

### Get Detailed Usage

Call `pax8-get-detailed-usage-summary` with `usageSummaryId` (required). Optionally filter by `usageDate`.

## Key Concepts

### Billing Model

Pax8 operates as a distributor between vendors and MSPs:

```
Vendor (Microsoft, etc.) --> Pax8 (Distributor) --> MSP (Partner) --> End Client
```

- **Pax8 invoices the MSP** for all subscriptions across all clients
- **MSP invoices each client** at their own markup/margin
- **Reconciliation** ensures the MSP is charging clients correctly for what Pax8 bills

### Invoice Structure

| Level | Description |
|-------|-------------|
| Invoice | A billing statement for a billing period |
| Invoice Item | A line item for a specific subscription charge |
| Usage Summary | Consumption details for usage-based products (e.g., Azure) |

### Invoice Statuses

| Status | Description |
|--------|-------------|
| `unpaid` | Invoice issued, payment not yet received |
| `paid` | Invoice has been paid |
| `void` | Invoice has been voided/cancelled |
| `carried` | Balance carried forward |
| `nothing due` | No payment required |

### Billing Reconciliation

The core MSP workflow for invoices:

1. **Retrieve Pax8 invoices** using `pax8-list-invoices`
2. **Get invoice details** using `pax8-get-invoice-by-uuid`
3. **Break down by client** using the `companyId` on invoice items
4. **Compare against PSA billing** to ensure clients are being charged correctly
5. **Identify discrepancies** where Pax8 charges do not match client billing
6. **Adjust** client invoices or subscription quantities as needed

## Field Reference

### Invoice Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Invoice unique identifier |
| `invoiceDate` | date | Date the invoice was issued |
| `dueDate` | date | Payment due date |
| `status` | string | Invoice status (unpaid, paid, etc.) |
| `total` | decimal | Total invoice amount |
| `balance` | decimal | Remaining unpaid balance |
| `carriedBalance` | decimal | Balance carried from previous period |
| `currency` | string | Currency code (e.g., "USD") |
| `companyId` | UUID | Company associated with the invoice |
| `partnerName` | string | MSP partner name |

### Usage Summary Fields

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | UUID | Associated subscription |
| `resourceGroup` | string | Resource group name |
| `quantity` | decimal | Usage quantity |
| `unitOfMeasure` | string | Unit of measurement |
| `currentCharges` | decimal | Charges for this period |
| `date` | date | Usage reporting date |

## Common Workflows

### Monthly Billing Reconciliation

1. Call `pax8-list-invoices` with `invoiceDateRangeStart` and `invoiceDateRangeEnd` for the current month
2. For each invoice, call `pax8-get-invoice-by-uuid` to get full details
3. Group charges by company using the `companyId` field
4. For each company, look up the company name using `pax8-get-company-by-uuid`
5. Compare Pax8 charges against what you bill each client in your PSA

### Cost-per-Client Report

1. Call `pax8-list-invoices` with `sort` by date to get the most recent invoice
2. Get the invoice details with `pax8-get-invoice-by-uuid`
3. Break down the invoice by company and product
4. Calculate per-client totals for reporting

### Margin Analysis

1. Get invoice details to see what Pax8 charges you (your cost)
2. For each product on the invoice, call `pax8-get-product-pricing-by-uuid` to get the `suggestedRetailPrice`
3. Calculate margin: `(suggestedRetailPrice - partnerBuyPrice) / suggestedRetailPrice * 100`
4. Identify products or clients where margins are thin

### Invoice Trend Analysis

1. Call `pax8-list-invoices` with a wide date range (e.g., last 6 months)
2. Group invoices by month using the `invoiceDate` field
3. Calculate monthly totals to identify spending trends
4. Flag months with significant increases for investigation

### Unpaid Invoice Alert

1. Call `pax8-list-invoices` with `status=unpaid`
2. Check the `dueDate` on each invoice to identify overdue payments
3. Calculate total unpaid balance across all invoices
4. Prioritize invoices by balance and overdue status

### Usage Analysis for Consumption Products

For usage-based products like Azure:

1. Find the subscription using `pax8-list-subscriptions` with `companyId` and `productId`
2. Call `pax8-get-usage-summary` with the `subscriptionId`
3. Review usage by resource group to identify cost drivers
4. For detailed breakdown, call `pax8-get-detailed-usage-summary` with the `usageSummaryId`

## Response Examples

**Invoice:**

```json
{
  "id": "i1n2v3o4-i5c6-7890-abcd-ef1234567890",
  "invoiceDate": "2026-02-01",
  "dueDate": "2026-03-03",
  "status": "Unpaid",
  "total": 4527.50,
  "balance": 4527.50,
  "currency": "USD",
  "partnerName": "Acme MSP"
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Invoice not found | Invalid UUID | Verify the invoice UUID with `pax8-list-invoices` |
| Invalid status filter | Wrong status value | Use `unpaid`, `paid`, `void`, `carried`, or `nothing due` |
| Invalid date format | Wrong date string | Use `YYYY-MM-DD` format for date parameters |
| Usage summary not found | Invalid subscription or no usage data | Verify the subscription UUID; not all products have usage data |

## Best Practices

1. **Reconcile monthly** - Compare Pax8 invoices to client billing every billing cycle
2. **Break down by client** - Use `companyId` to attribute costs per company
3. **Track margins** - Compare partner buy price to what you charge clients
4. **Monitor trends** - Track month-over-month billing changes
5. **Watch for prorated charges** - Mid-cycle subscription changes create prorated line items
6. **Usage-based products** - Azure and similar products have variable billing; monitor usage summaries regularly
7. **Use date range filters** - Filter by `invoiceDateRangeStart`/`invoiceDateRangeEnd` to scope queries
8. **Automate alerts** - Set up notifications for unpaid invoices using `status=unpaid` filter
9. **Cross-reference with PSA** - Match Pax8 invoice data to PSA agreement line items

## Related Skills

- [Pax8 API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [Pax8 Subscriptions](../subscriptions/SKILL.md) - Subscription details for invoice items
- [Pax8 Companies](../companies/SKILL.md) - Company attribution for billing
- [Pax8 Products](../products/SKILL.md) - Product pricing for margin analysis
- [Pax8 Orders](../orders/SKILL.md) - Order-to-invoice tracking
