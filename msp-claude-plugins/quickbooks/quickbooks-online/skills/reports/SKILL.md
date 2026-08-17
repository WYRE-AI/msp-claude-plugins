---
name: "QuickBooks Online Reports"
description: >
  QuickBooks Online financial reporting: the report catalog (Profit & Loss,
  Balance Sheet, A/R and A/P Aging, General Ledger, Customer Sales, Cash Flow,
  Tax Summary), report parameters, date macros, column customization, the
  nested row response structure, and MSP analysis patterns like client
  profitability and aged receivables for collections.
when_to_use: >-
  When generating or parsing QuickBooks Online financial reports.
  Use when: quickbooks report, qbo report, profit and
  loss, balance sheet, accounts receivable aging, accounts payable aging, general ledger,
  financial report, p&l report, ar aging, ap aging, aged receivables, or client profitability.
---

# QuickBooks Online Reports

## Overview

QuickBooks Online provides a comprehensive set of financial reports accessible via the API. For MSPs, the most critical reports are Accounts Receivable Aging (tracking which clients owe money and how overdue), Profit & Loss (measuring overall and per-client profitability), Balance Sheet (financial position), and Accounts Payable Aging (tracking vendor obligations). Reports are read-only API calls that return structured data suitable for dashboards, alerts, and automated analysis.

## Anti-triggers

- **A specific transaction** — reports are aggregates with their own
  nested row structure and their own rounding. Pulling one invoice,
  payment, or bill out of a report is the wrong path; use
  `qbo-invoices`, `qbo-payments`, or `qbo-expenses`.
- **The books are in Xero, not QuickBooks** — use `xero-reports`. Both
  produce "P&L" and "aged receivables" under those exact names.
- **Margin on resold cloud licences** — the cost side sits with the
  distributor and the revenue side in QBO; reconciling them is
  `shared-skills-billing-reconciliation`, not a single report.
- **Service-delivery metrics** — ticket volume, SLA attainment, and
  utilisation are PSA reporting, not accounting; use the PSA's skills.

## Key Concepts

### Report Categories

| Category | Reports | MSP Relevance |
|----------|---------|---------------|
| **Profit & Loss** | ProfitAndLoss, ProfitAndLossDetail | Revenue and expense by period |
| **Balance Sheet** | BalanceSheet, BalanceSheetDetail | Financial position snapshot |
| **A/R Aging** | AgedReceivables, AgedReceivableDetail | Client collections tracking |
| **A/P Aging** | AgedPayables, AgedPayableDetail | Vendor payment obligations |
| **General Ledger** | GeneralLedger, GeneralLedgerDetail | Transaction-level audit trail |
| **Sales** | CustomerSales, CustomerIncome, ItemSales | Revenue by customer/item |
| **Expenses** | ExpensesByVendor | Cost tracking by vendor |
| **Tax** | TaxSummary | Sales tax obligations |
| **Cash Flow** | CashFlow | Cash inflows and outflows |

All reports are served from `/v3/company/{realmId}/reports/{ReportName}`. See [references/api.md](references/api.md) for the complete endpoint catalog with per-report request examples.

### Report Parameters

All reports support common parameters for filtering and customization:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `start_date` | Period start | `2026-01-01` |
| `end_date` | Period end | `2026-01-31` |
| `accounting_method` | Accrual or Cash | `Accrual` |
| `date_macro` | Preset period | `Last Month`, `This Fiscal Year` |
| `summarize_column_by` | Column grouping | `Month`, `Quarter`, `Year`, `Customers` |
| `customer` | Filter by customer ID | `123` |
| `department` | Filter by department | `1` |

### Date Macros

| Macro | Description |
|-------|-------------|
| `Today` | Current day |
| `This Week` | Current week |
| `This Month` | Current month |
| `This Fiscal Quarter` | Current fiscal quarter |
| `This Fiscal Year` | Current fiscal year |
| `Last Month` | Previous month |
| `Last Fiscal Quarter` | Previous quarter |
| `Last Fiscal Year` | Previous fiscal year |
| `This Fiscal Year-to-date` | Year to date |

### Report Response Structure

All reports return a common structure:

```json
{
  "Header": {
    "ReportName": "ProfitAndLoss",
    "DateMacro": "Last Month",
    "StartPeriod": "2026-01-01",
    "EndPeriod": "2026-01-31",
    "Currency": "USD",
    "Option": [
      { "Name": "AccountingMethod", "Value": "Accrual" }
    ]
  },
  "Columns": {
    "Column": [
      { "ColTitle": "", "ColType": "Account" },
      { "ColTitle": "Total", "ColType": "Money" }
    ]
  },
  "Rows": {
    "Row": [...]
  }
}
```

### A/R Aging Buckets

| Column | Description |
|--------|-------------|
| Current | Not yet due |
| 1-30 | 1-30 days past due |
| 31-60 | 31-60 days past due |
| 61-90 | 61-90 days past due |
| 91 and over | 91+ days past due |

## Parsing Report Data

`Rows.Row` is a recursive tree, not a flat list. A row is either a `type: "Section"` node — carrying `Header.ColData` (the section label), a nested `Rows.Row` array, and a `Summary.ColData` totals row — or a leaf data row carrying only `ColData`. Any parser must recurse into `Rows.Row` and handle both shapes; the totals you usually want live on `Summary`, not on the child data rows.

See [references/examples.md](references/examples.md) for the nested row JSON and a recursive parser implementation.

## Common Workflows

### MSP Monthly Financial Review

Fetch ProfitAndLoss, AgedReceivables, AgedPayables, and CustomerSales concurrently for the target month, then parse each into a single summary object.

### Client Profitability Dashboard

Run ProfitAndLoss with `summarize_column_by=Customers`. Each customer becomes a column; read `Columns.Column[].ColTitle` for client names and pull the `Income`, `Expenses`, and `Net Income` section summaries.

### A/R Aging Collections Alert

Run AgedReceivableDetail with `date_macro=Today`, walk the customer sections, and flag invoices past a days-overdue and amount threshold.

### Monthly Revenue Trend

Run ProfitAndLoss over a multi-month range with `summarize_column_by=Month`, then read the `Income` section summary across columns.

### Cash Flow Snapshot

Fetch AgedReceivables, AgedPayables, and BalanceSheet concurrently to combine receivable inflows, payable obligations, and current cash position.

See [references/examples.md](references/examples.md) for working implementations of each workflow.

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid report parameter | Check date format and parameter names |
| 401 | Auth Failed | Refresh access token |
| 3000 | Report not available | Check report name spelling |
| 3001 | Throttled | Wait and retry |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Invalid date range | start_date > end_date | Fix date order |
| Unknown parameter | Misspelled parameter | Check API documentation |
| Invalid accounting method | Bad method value | Use "Accrual" or "Cash" |
| Invalid date macro | Unrecognized macro | Use supported macro values |

See [references/examples.md](references/examples.md) for a retry-and-refresh error recovery wrapper.

## Best Practices

1. **Use date macros** - Prefer `date_macro` for standard periods (less error-prone than manual dates)
2. **Specify accounting method** - Always set `accounting_method` explicitly; the company default otherwise decides whether Accrual or Cash numbers come back
3. **Summarize by column** - Use `summarize_column_by=Month` for trend analysis
4. **Cache reports** - Reports are read-only; cache results for dashboards
5. **Filter by customer** - Use the `customer` parameter for client-specific reports
6. **Parse recursively** - Report rows are nested; use recursive parsing
7. **Include minor version** - Always add `minorversion=73` for latest report features
8. **Run reports in parallel** - Fetch multiple reports concurrently for dashboards
9. **Monitor A/R aging** - Set up automated alerts for overdue accounts

## Related Skills

- [QBO Customers](../customers/SKILL.md) - Customer data for report filtering
- [QBO Invoices](../invoices/SKILL.md) - Invoice data behind A/R aging
- [QBO Payments](../payments/SKILL.md) - Payment data behind cash flow
- [QBO Expenses](../expenses/SKILL.md) - Expense data behind P&L
- [QBO API Patterns](../api-patterns/SKILL.md) - API reference
