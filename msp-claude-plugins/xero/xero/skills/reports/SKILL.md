---
name: "Xero Reports"
description: >
  Xero Reports API: Profit and Loss, Balance Sheet, Aged Receivables and
  Payables, Trial Balance, Bank Summary and other management reports. Covers
  report parameters, date ranges, tracking-category filtering, the shared
  Rows/Cells response shape, and parsing results for MSP financial operations.
when_to_use: >-
  When generating, filtering, or parsing a Xero financial report. Use when: xero report, xero
  profit and loss, xero p&l, xero balance sheet, xero aged receivables, xero aged payables, xero
  trial balance, xero financial report, xero reporting, or msp financial report.
---

# Xero Financial Reports

## Overview

Xero exposes its financial reports through the API as structured, programmatically parseable data. For MSPs, these reports drive profitability tracking by service line, client payment-behavior monitoring, cash flow management, and financial statements for stakeholders.

## Anti-triggers

- **Individual transactions rather than aggregates** — reports return
  summarized rows with no drill-through; the underlying records are
  `xero-invoices` and `xero-payments`.
- **The GL structure a report groups by** — use `xero-accounts`.
- **The same reports in QuickBooks** — use `quickbooks-online-reports`.

## Core Concepts

### Available Reports

| Report | Endpoint | Description |
|--------|----------|-------------|
| Profit and Loss | `/Reports/ProfitAndLoss` | Revenue, expenses, and net profit |
| Balance Sheet | `/Reports/BalanceSheet` | Assets, liabilities, and equity |
| Aged Receivables | `/Reports/AgedReceivablesByContact` | Outstanding customer invoices by age |
| Aged Payables | `/Reports/AgedPayablesByContact` | Outstanding supplier bills by age |
| Trial Balance | `/Reports/TrialBalance` | All account balances at a point in time |
| Bank Summary | `/Reports/BankSummary` | Summary of bank account activity |
| Budget Summary | `/Reports/BudgetSummary` | Budget vs actual comparison |
| Executive Summary | `/Reports/ExecutiveSummary` | High-level financial overview |

### Report Response Structure

All Xero reports share one nested `Rows`/`Cells` shape. Values arrive as strings and must be parsed to numbers:

```json
{
  "Reports": [
    {
      "ReportID": "ProfitAndLoss",
      "ReportName": "Profit and Loss",
      "ReportType": "ProfitAndLoss",
      "ReportDate": "23 February 2026",
      "UpdatedDateUTC": "/Date(1772006400000)/",
      "Rows": [
        {
          "RowType": "Header",
          "Cells": [
            { "Value": "" },
            { "Value": "1 Mar 2026 to 31 Mar 2026" }
          ]
        },
        {
          "RowType": "Section",
          "Title": "Revenue",
          "Rows": [
            {
              "RowType": "Row",
              "Cells": [
                { "Value": "Managed Services Revenue", "Attributes": [{ "Value": "acc-id-200" }] },
                { "Value": "45000.00", "Attributes": [{ "Value": "acc-id-200" }] }
              ]
            }
          ]
        },
        {
          "RowType": "SummaryRow",
          "Cells": [
            { "Value": "Total Revenue" },
            { "Value": "67500.00" }
          ]
        }
      ]
    }
  ]
}
```

### Row Types

| RowType | Description |
|---------|-------------|
| `Header` | Column headers |
| `Section` | Group of related rows (e.g., Revenue, Expenses) |
| `Row` | Individual data row (account or contact) |
| `SummaryRow` | Total/subtotal row |

## API Patterns

Reports are GET-only and take their parameters in the query string. Period reports (P&L, Bank Summary) use `fromDate`/`toDate`; point-in-time reports (Balance Sheet, Aged Receivables/Payables, Trial Balance) use a single `date`. All dates are `YYYY-MM-DD`.

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss?fromDate=2026-03-01&toDate=2026-03-31" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

Parameters worth knowing across reports:

| Parameter | Applies to | Description |
|-----------|-----------|-------------|
| `periods` + `timeframe` | P&L, Balance Sheet | Adds comparison columns (MONTH, QUARTER, YEAR) |
| `trackingCategoryID` / `trackingOptionID` | P&L, Balance Sheet | Filter to a service line or department |
| `paymentsOnly` | P&L, Balance Sheet, Trial Balance | `true` = cash basis, `false` = accrual |
| `contactID` | Aged Receivables/Payables | Restrict the report to one contact |

See [references/api.md](references/api.md) for the full request catalog, per-report parameter tables, and the complete endpoint reference.

## Common Workflows

### MSP Monthly Financial Review

Fetch P&L, Balance Sheet, Aged Receivables, and Aged Payables for the closing month in parallel, then parse each into a summary. Reports are independent requests, so parallelizing is safe and materially faster.

### Revenue and Margin Analysis

Walk the P&L `Rows` tree, matching `Section` titles (`Revenue`/`Income`, `Less Cost of Sales`/`Direct Costs`) and reading the `SummaryRow` totals. Section titles vary by chart-of-accounts layout — match on more than one candidate title.

### Overdue Client Review

Parse the Aged Receivables sections into per-contact aging buckets (current, 30, 60, 90, older) and sort by total overdue. Cells are positional, so index by column order rather than by name.

### Year-over-Year Comparison

Request the same P&L period for the current and prior year, then compare parsed revenue totals.

See [references/examples.md](references/examples.md) for working JavaScript implementations of each workflow.

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid date format | Use YYYY-MM-DD format |
| 400 | fromDate must be before toDate | Swap date parameters |
| 400 | Invalid tracking category | Verify trackingCategoryID exists |
| 401 | Unauthorized | Refresh access token |
| 403 | Insufficient scope | Ensure `accounting.reports.read` scope |
| 404 | Report not found | Check report endpoint name |

### Report Parsing Errors

| Issue | Cause | Fix |
|-------|-------|-----|
| Empty rows | No data for period | Verify date range has transactions |
| Missing sections | No revenue or expenses | Normal for new organizations |
| Null cell values | Account has no balance | Default to 0 when parsing |

## Gotchas

- **Reports are expensive** - Cache results keyed on the report name plus its parameters; repeated identical requests burn rate limit for identical data.
- **Always specify dates explicitly** - Omitting `fromDate`/`toDate` or `date` yields Xero's default period, which is rarely the one you meant.
- **Parse defensively** - Cells can be absent or empty strings; coerce to 0 rather than assuming a numeric value.
- **Tracking categories are the MSP lever** - Filtering P&L by tracking category is the only way to get per-service-line profitability out of the standard reports.
- **Cash vs accrual changes the answer** - `paymentsOnly=true` reports cash movements only; use it for cash flow analysis, not for revenue recognition.

## Related Skills

- [Xero Invoices](../invoices/SKILL.md) - Invoice data feeding reports
- [Xero Payments](../payments/SKILL.md) - Payment data in reports
- [Xero Accounts](../accounts/SKILL.md) - Account structure for P&L and Balance Sheet
- [Xero Contacts](../contacts/SKILL.md) - Contact-level report filtering
- [Xero API Patterns](../api-patterns/SKILL.md) - API reference
