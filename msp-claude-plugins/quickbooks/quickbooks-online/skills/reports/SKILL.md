---
name: "QuickBooks Online Reports"
description: >
  Use this skill when working with QuickBooks Online reports -
  generating Profit & Loss, Balance Sheet, Accounts Receivable Aging,
  Accounts Payable Aging, General Ledger, and other financial reports.
  Covers report parameters, date ranges, column customization, and
  MSP-specific financial analysis patterns like client profitability
  and aged receivables for collections.
when_to_use: >-
  When generating Profit & Loss, Balance Sheet, Accounts Receivable Aging, Accounts Payable Aging,
  General Ledger, and other financial reports. Use when: quickbooks report, qbo report, profit and
  loss, balance sheet, accounts receivable aging, accounts payable aging, general ledger,
  financial report, p&l report, ar aging, ap aging, aged receivables, or client profitability.
---

# QuickBooks Online Reports

## Overview

QuickBooks Online provides a comprehensive set of financial reports accessible via the API. For MSPs, the most critical reports are Accounts Receivable Aging (tracking which clients owe money and how overdue), Profit & Loss (measuring overall and per-client profitability), Balance Sheet (financial position), and Accounts Payable Aging (tracking vendor obligations). Reports are read-only API calls that return structured data suitable for dashboards, alerts, and automated analysis.

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

## Report Types

### Profit & Loss (Income Statement)

Shows revenue and expenses over a period.

```http
GET /v3/company/{realmId}/reports/ProfitAndLoss?start_date=2026-01-01&end_date=2026-01-31&accounting_method=Accrual&minorversion=73
Authorization: Bearer {access_token}
Accept: application/json
```

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/reports/ProfitAndLoss?start_date=2026-01-01&end_date=2026-01-31&accounting_method=Accrual&minorversion=73"
```

**By month:**
```http
GET /v3/company/{realmId}/reports/ProfitAndLoss?start_date=2026-01-01&end_date=2026-06-30&summarize_column_by=Month&minorversion=73
```

**By customer (MSP client profitability):**
```http
GET /v3/company/{realmId}/reports/ProfitAndLoss?start_date=2026-01-01&end_date=2026-01-31&summarize_column_by=Customers&minorversion=73
```

**Filtered to a single customer:**
```http
GET /v3/company/{realmId}/reports/ProfitAndLoss?start_date=2026-01-01&end_date=2026-01-31&customer=123&minorversion=73
```

### Balance Sheet

Shows assets, liabilities, and equity at a point in time.

```http
GET /v3/company/{realmId}/reports/BalanceSheet?date_macro=Today&minorversion=73
Authorization: Bearer {access_token}
```

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/reports/BalanceSheet?date_macro=Today&minorversion=73"
```

**Comparison by quarter:**
```http
GET /v3/company/{realmId}/reports/BalanceSheet?start_date=2025-01-01&end_date=2026-01-31&summarize_column_by=Quarter&minorversion=73
```

### Accounts Receivable Aging

Shows outstanding customer balances grouped by aging period. Critical for MSP collections.

**Summary (by customer):**
```http
GET /v3/company/{realmId}/reports/AgedReceivables?date_macro=Today&minorversion=73
Authorization: Bearer {access_token}
```

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/reports/AgedReceivables?date_macro=Today&minorversion=73"
```

**Detail (individual invoices):**
```http
GET /v3/company/{realmId}/reports/AgedReceivableDetail?date_macro=Today&minorversion=73
```

**For a specific customer:**
```http
GET /v3/company/{realmId}/reports/AgedReceivableDetail?date_macro=Today&customer=123&minorversion=73
```

**Aging periods in the response:**

| Column | Description |
|--------|-------------|
| Current | Not yet due |
| 1-30 | 1-30 days past due |
| 31-60 | 31-60 days past due |
| 61-90 | 61-90 days past due |
| 91 and over | 91+ days past due |

### Accounts Payable Aging

Shows outstanding vendor balances.

```http
GET /v3/company/{realmId}/reports/AgedPayables?date_macro=Today&minorversion=73
```

**Detail level:**
```http
GET /v3/company/{realmId}/reports/AgedPayableDetail?date_macro=Today&minorversion=73
```

### General Ledger

Transaction-level detail for all accounts.

```http
GET /v3/company/{realmId}/reports/GeneralLedger?start_date=2026-01-01&end_date=2026-01-31&minorversion=73
```

**For a specific account:**
```http
GET /v3/company/{realmId}/reports/GeneralLedger?start_date=2026-01-01&end_date=2026-01-31&account=35&minorversion=73
```

### Customer Sales Summary

Revenue by customer.

```http
GET /v3/company/{realmId}/reports/CustomerSales?start_date=2026-01-01&end_date=2026-01-31&minorversion=73
```

### Customer Income

Income detail by customer.

```http
GET /v3/company/{realmId}/reports/CustomerIncome?start_date=2026-01-01&end_date=2026-01-31&minorversion=73
```

### Cash Flow Statement

```http
GET /v3/company/{realmId}/reports/CashFlow?start_date=2026-01-01&end_date=2026-01-31&minorversion=73
```

## Parsing Report Data

### Row Structure

Report rows are nested and can contain groups (sections) and data rows:

```json
{
  "Row": [
    {
      "Header": { "ColData": [{ "value": "Income" }] },
      "Rows": {
        "Row": [
          {
            "ColData": [
              { "value": "Managed Services Revenue", "id": "1" },
              { "value": "25000.00" }
            ]
          },
          {
            "ColData": [
              { "value": "Project Revenue", "id": "2" },
              { "value": "8500.00" }
            ]
          }
        ]
      },
      "Summary": { "ColData": [{ "value": "Total Income" }, { "value": "33500.00" }] },
      "type": "Section",
      "group": "Income"
    }
  ]
}
```

### Recursive Row Parser

```javascript
function parseReportRows(rows, depth = 0) {
  const results = [];

  for (const row of rows || []) {
    if (row.type === 'Section') {
      // Section with header, nested rows, and summary
      const sectionName = row.Header?.ColData?.[0]?.value || '';
      const children = parseReportRows(row.Rows?.Row, depth + 1);
      const summary = row.Summary?.ColData?.map(c => c.value);

      results.push({
        type: 'section',
        name: sectionName,
        children,
        summary,
        depth
      });
    } else if (row.ColData) {
      // Data row
      const values = row.ColData.map(c => c.value);
      results.push({
        type: 'data',
        values,
        depth
      });
    }
  }

  return results;
}
```

## Common Workflows

### MSP Monthly Financial Review

```javascript
async function monthlyFinancialReview(month) {
  const startDate = `${month}-01`;
  const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1) - 1)
    .toISOString().split('T')[0];

  // Fetch all key reports in parallel
  const [pnl, arAging, apAging, customerSales] = await Promise.all([
    fetchReport('ProfitAndLoss', { start_date: startDate, end_date: endDate }),
    fetchReport('AgedReceivables', { date_macro: 'Today' }),
    fetchReport('AgedPayables', { date_macro: 'Today' }),
    fetchReport('CustomerSales', { start_date: startDate, end_date: endDate })
  ]);

  return {
    period: month,
    profitAndLoss: parsePnl(pnl),
    accountsReceivable: parseAging(arAging),
    accountsPayable: parseAging(apAging),
    revenueByClient: parseCustomerSales(customerSales)
  };
}
```

### Client Profitability Dashboard

```javascript
async function clientProfitabilityReport(startDate, endDate) {
  // P&L summarized by customer
  const report = await fetchReport('ProfitAndLoss', {
    start_date: startDate,
    end_date: endDate,
    summarize_column_by: 'Customers'
  });

  const parsed = parseReportRows(report.Rows?.Row);

  // Extract income and expense sections
  const income = parsed.find(r => r.name === 'Income');
  const expenses = parsed.find(r => r.name === 'Expenses');
  const netIncome = parsed.find(r => r.name === 'Net Income');

  return {
    period: `${startDate} to ${endDate}`,
    columns: report.Columns.Column.map(c => c.ColTitle),
    income: income?.summary,
    expenses: expenses?.summary,
    netIncome: netIncome?.summary
  };
}
```

### A/R Aging Collections Alert

```javascript
async function collectionsAlert(thresholdDays = 60, thresholdAmount = 1000) {
  const report = await fetchReport('AgedReceivableDetail', { date_macro: 'Today' });
  const rows = parseReportRows(report.Rows?.Row);

  const alerts = [];

  for (const section of rows) {
    if (section.type !== 'section') continue;

    // Check 61-90 and 91+ columns
    for (const child of section.children || []) {
      if (child.type === 'data') {
        const amount = parseFloat(child.values[child.values.length - 1]) || 0;
        const daysOverdue = parseInt(child.values[3]) || 0;

        if (daysOverdue >= thresholdDays && amount >= thresholdAmount) {
          alerts.push({
            customer: section.name,
            invoiceNumber: child.values[1],
            amount,
            daysOverdue
          });
        }
      }
    }
  }

  return alerts.sort((a, b) => b.daysOverdue - a.daysOverdue);
}
```

### Monthly Revenue Trend

```javascript
async function revenueTrend(months = 12) {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(new Date().setMonth(new Date().getMonth() - months))
    .toISOString().split('T')[0];

  const report = await fetchReport('ProfitAndLoss', {
    start_date: startDate,
    end_date: endDate,
    summarize_column_by: 'Month'
  });

  const parsed = parseReportRows(report.Rows?.Row);
  const incomeSection = parsed.find(r => r.name === 'Income');

  return {
    period: `${startDate} to ${endDate}`,
    columns: report.Columns.Column.map(c => c.ColTitle).filter(c => c),
    monthlyRevenue: incomeSection?.summary?.slice(1) // Skip label column
  };
}
```

### Cash Flow Forecast

```javascript
async function cashFlowSnapshot() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [arAging, apAging, balanceSheet] = await Promise.all([
    fetchReport('AgedReceivables', { date_macro: 'Today' }),
    fetchReport('AgedPayables', { date_macro: 'Today' }),
    fetchReport('BalanceSheet', { date_macro: 'Today' })
  ]);

  return {
    date: today,
    receivables: parseAgingTotals(arAging),
    payables: parseAgingTotals(apAging),
    netCashPosition: parseBalanceSheetCash(balanceSheet)
  };
}
```

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

### Error Recovery Pattern

```javascript
async function safeFetchReport(reportName, params) {
  try {
    return await fetchReport(reportName, params);
  } catch (error) {
    const fault = error.Fault;
    if (!fault) throw error;

    if (fault.type === 'AuthenticationFault') {
      await refreshAccessToken();
      return await fetchReport(reportName, params);
    }

    if (fault.type === 'THROTTLE') {
      await new Promise(r => setTimeout(r, 60000));
      return await fetchReport(reportName, params);
    }

    throw error;
  }
}
```

## Best Practices

1. **Use date macros** - Prefer `date_macro` for standard periods (less error-prone than manual dates)
2. **Specify accounting method** - Always set `accounting_method` explicitly for consistency
3. **Summarize by column** - Use `summarize_column_by=Month` for trend analysis
4. **Cache reports** - Reports are read-only; cache results for dashboards
5. **Filter by customer** - Use the `customer` parameter for client-specific reports
6. **Parse recursively** - Report rows are nested; use recursive parsing
7. **Include minor version** - Always add `minorversion=73` for latest report features
8. **Run reports in parallel** - Fetch multiple reports concurrently for dashboards
9. **Monitor A/R aging** - Set up automated alerts for overdue accounts
10. **Track trends** - Compare P&L by month to spot revenue changes early

## Endpoint Reference

| Report | Endpoint |
|--------|----------|
| Profit & Loss | `/v3/company/{realmId}/reports/ProfitAndLoss` |
| Profit & Loss Detail | `/v3/company/{realmId}/reports/ProfitAndLossDetail` |
| Balance Sheet | `/v3/company/{realmId}/reports/BalanceSheet` |
| Balance Sheet Detail | `/v3/company/{realmId}/reports/BalanceSheetDetail` |
| A/R Aging Summary | `/v3/company/{realmId}/reports/AgedReceivables` |
| A/R Aging Detail | `/v3/company/{realmId}/reports/AgedReceivableDetail` |
| A/P Aging Summary | `/v3/company/{realmId}/reports/AgedPayables` |
| A/P Aging Detail | `/v3/company/{realmId}/reports/AgedPayableDetail` |
| General Ledger | `/v3/company/{realmId}/reports/GeneralLedger` |
| Customer Sales | `/v3/company/{realmId}/reports/CustomerSales` |
| Customer Income | `/v3/company/{realmId}/reports/CustomerIncome` |
| Cash Flow | `/v3/company/{realmId}/reports/CashFlow` |
| Tax Summary | `/v3/company/{realmId}/reports/TaxSummary` |

## Related Skills

- [QBO Customers](../customers/SKILL.md) - Customer data for report filtering
- [QBO Invoices](../invoices/SKILL.md) - Invoice data behind A/R aging
- [QBO Payments](../payments/SKILL.md) - Payment data behind cash flow
- [QBO Expenses](../expenses/SKILL.md) - Expense data behind P&L
- [QBO API Patterns](../api-patterns/SKILL.md) - API reference
