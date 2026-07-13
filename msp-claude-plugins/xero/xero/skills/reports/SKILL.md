---
name: "Xero Reports"
description: >
  Use this skill when working with Xero financial reports - Profit and Loss,
  Balance Sheet, Aged Receivables, Aged Payables, Trial Balance, and other
  management reports. Covers report parameters, date ranges, tracking
  categories, and interpreting results for MSP financial operations.
when_to_use: >-
  When working with profit and Loss, Balance Sheet, Aged Receivables, Aged Payables, Trial
  Balance, and other management reports in Xero financial reports. Use when: xero report, xero
  profit and loss, xero p&l, xero balance sheet, xero aged receivables, xero aged payables, xero
  trial balance, xero financial report, xero reporting, or msp financial report.
---

# Xero Financial Reports

## Overview

Xero provides a comprehensive set of financial reports through the API. For MSPs, these reports are essential for tracking profitability by service line, monitoring client payment behavior, managing cash flow, and producing financial statements for stakeholders. The Reports API returns structured data that can be programmatically analyzed.

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

All Xero reports follow a consistent structure:

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

### Profit and Loss Report

```bash
# Current month P&L
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss?fromDate=2026-03-01&toDate=2026-03-31" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Year-to-date P&L
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss?fromDate=2026-01-01&toDate=2026-03-31" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# P&L with tracking category filter
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss?fromDate=2026-03-01&toDate=2026-03-31&trackingCategoryID=${TRACKING_ID}&trackingOptionID=${OPTION_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# P&L with monthly periods
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss?fromDate=2026-01-01&toDate=2026-03-31&periods=3&timeframe=MONTH" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**P&L Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `fromDate` | string | Start date (YYYY-MM-DD) |
| `toDate` | string | End date (YYYY-MM-DD) |
| `periods` | integer | Number of comparison periods |
| `timeframe` | string | MONTH, QUARTER, or YEAR |
| `trackingCategoryID` | string | Filter by tracking category |
| `trackingOptionID` | string | Filter by tracking option |
| `standardLayout` | boolean | Use standard layout (true/false) |
| `paymentsOnly` | boolean | Cash basis (true) or accrual (false) |

### Balance Sheet Report

```bash
# Balance Sheet as of today
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/BalanceSheet?date=2026-03-31" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Balance Sheet with comparison periods
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/BalanceSheet?date=2026-03-31&periods=3&timeframe=MONTH" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**Balance Sheet Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Report date (YYYY-MM-DD) |
| `periods` | integer | Number of comparison periods |
| `timeframe` | string | MONTH, QUARTER, or YEAR |
| `trackingCategoryID` | string | Filter by tracking category |
| `standardLayout` | boolean | Use standard layout |
| `paymentsOnly` | boolean | Cash basis reporting |

### Aged Receivables Report

```bash
# Aged Receivables as of today
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/AgedReceivablesByContact?date=2026-03-31" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Aged Receivables for a specific contact
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/AgedReceivablesByContact?date=2026-03-31&contactID=${CONTACT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Aged Receivables with custom aging periods
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/AgedReceivablesByContact?date=2026-03-31&fromDate=2025-01-01&toDate=2026-03-31" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**Aged Receivables Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Report date (YYYY-MM-DD) |
| `contactID` | string | Filter to specific contact |
| `fromDate` | string | Start of aging period |
| `toDate` | string | End of aging period |

### Aged Payables Report

```bash
# Aged Payables as of today
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/AgedPayablesByContact?date=2026-03-31" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

### Trial Balance Report

```bash
# Trial Balance as of end of quarter
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/TrialBalance?date=2026-03-31" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Trial Balance with payments only (cash basis)
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/TrialBalance?date=2026-03-31&paymentsOnly=true" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**Trial Balance Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Report date (YYYY-MM-DD) |
| `paymentsOnly` | boolean | Cash basis (true) or accrual (false) |

### Bank Summary Report

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/BankSummary?fromDate=2026-03-01&toDate=2026-03-31" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

## Common Workflows

### MSP Monthly Financial Review

```javascript
async function monthlyFinancialReview(month) {
  const fromDate = `${month}-01`;
  const lastDay = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
  const toDate = `${month}-${lastDay}`;

  const token = await auth.getToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'xero-tenant-id': process.env.XERO_TENANT_ID,
    'Accept': 'application/json'
  };

  // Fetch all reports in parallel
  const [pnl, balanceSheet, agedReceivables, agedPayables] = await Promise.all([
    fetch(`https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss?fromDate=${fromDate}&toDate=${toDate}`, { headers }),
    fetch(`https://api.xero.com/api.xro/2.0/Reports/BalanceSheet?date=${toDate}`, { headers }),
    fetch(`https://api.xero.com/api.xro/2.0/Reports/AgedReceivablesByContact?date=${toDate}`, { headers }),
    fetch(`https://api.xero.com/api.xro/2.0/Reports/AgedPayablesByContact?date=${toDate}`, { headers })
  ]);

  return {
    profitAndLoss: await pnl.json(),
    balanceSheet: await balanceSheet.json(),
    agedReceivables: await agedReceivables.json(),
    agedPayables: await agedPayables.json()
  };
}
```

### Parse P&L for Revenue Breakdown

```javascript
function parseRevenueFromPnL(reportData) {
  const report = reportData.Reports[0];
  const revenue = { total: 0, accounts: [] };

  for (const row of report.Rows) {
    if (row.RowType === 'Section' && row.Title === 'Revenue') {
      for (const subRow of row.Rows || []) {
        if (subRow.RowType === 'Row') {
          const name = subRow.Cells[0]?.Value;
          const amount = parseFloat(subRow.Cells[1]?.Value) || 0;
          revenue.accounts.push({ name, amount });
          revenue.total += amount;
        }
        if (subRow.RowType === 'SummaryRow') {
          revenue.total = parseFloat(subRow.Cells[1]?.Value) || revenue.total;
        }
      }
    }
  }

  return revenue;
}
```

### Parse Aged Receivables for Overdue Clients

```javascript
function parseAgedReceivables(reportData) {
  const report = reportData.Reports[0];
  const clients = [];

  for (const row of report.Rows) {
    if (row.RowType === 'Section') {
      for (const subRow of row.Rows || []) {
        if (subRow.RowType === 'Row') {
          const cells = subRow.Cells;
          const client = {
            name: cells[0]?.Value,
            current: parseFloat(cells[1]?.Value) || 0,
            thirtyDays: parseFloat(cells[2]?.Value) || 0,
            sixtyDays: parseFloat(cells[3]?.Value) || 0,
            ninetyDays: parseFloat(cells[4]?.Value) || 0,
            older: parseFloat(cells[5]?.Value) || 0,
            total: parseFloat(cells[6]?.Value) || 0
          };

          client.totalOverdue = client.thirtyDays + client.sixtyDays +
            client.ninetyDays + client.older;

          if (client.total > 0) {
            clients.push(client);
          }
        }
      }
    }
  }

  return clients.sort((a, b) => b.totalOverdue - a.totalOverdue);
}
```

### Gross Margin Calculation

```javascript
function calculateGrossMargin(reportData) {
  const report = reportData.Reports[0];
  let totalRevenue = 0;
  let totalCOGS = 0;

  for (const row of report.Rows) {
    if (row.RowType === 'Section') {
      if (row.Title === 'Revenue' || row.Title === 'Income') {
        for (const subRow of row.Rows || []) {
          if (subRow.RowType === 'SummaryRow') {
            totalRevenue = parseFloat(subRow.Cells[1]?.Value) || 0;
          }
        }
      }
      if (row.Title === 'Less Cost of Sales' || row.Title === 'Direct Costs') {
        for (const subRow of row.Rows || []) {
          if (subRow.RowType === 'SummaryRow') {
            totalCOGS = parseFloat(subRow.Cells[1]?.Value) || 0;
          }
        }
      }
    }
  }

  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;

  return {
    revenue: totalRevenue,
    costOfSales: totalCOGS,
    grossProfit,
    grossMarginPercent: grossMargin.toFixed(1)
  };
}
```

### Year-over-Year Comparison

```javascript
async function yearOverYearComparison(month) {
  const year = parseInt(month.split('-')[0]);
  const mon = month.split('-')[1];

  const currentFrom = `${year}-${mon}-01`;
  const currentTo = `${year}-${mon}-28`;
  const priorFrom = `${year - 1}-${mon}-01`;
  const priorTo = `${year - 1}-${mon}-28`;

  const [current, prior] = await Promise.all([
    fetchReport('ProfitAndLoss', { fromDate: currentFrom, toDate: currentTo }),
    fetchReport('ProfitAndLoss', { fromDate: priorFrom, toDate: priorTo })
  ]);

  const currentRevenue = parseRevenueFromPnL(current);
  const priorRevenue = parseRevenueFromPnL(prior);

  const growth = priorRevenue.total > 0
    ? ((currentRevenue.total - priorRevenue.total) / priorRevenue.total * 100)
    : 0;

  return {
    currentPeriod: `${year}-${mon}`,
    priorPeriod: `${year - 1}-${mon}`,
    currentRevenue: currentRevenue.total,
    priorRevenue: priorRevenue.total,
    growthPercent: growth.toFixed(1)
  };
}
```

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

## Endpoint Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Reports/ProfitAndLoss` | GET | Profit and Loss statement |
| `/Reports/BalanceSheet` | GET | Balance Sheet |
| `/Reports/AgedReceivablesByContact` | GET | Aged Receivables by contact |
| `/Reports/AgedPayablesByContact` | GET | Aged Payables by contact |
| `/Reports/TrialBalance` | GET | Trial Balance |
| `/Reports/BankSummary` | GET | Bank account summary |
| `/Reports/BudgetSummary` | GET | Budget vs actual |
| `/Reports/ExecutiveSummary` | GET | Executive overview |
| `/Reports/TenNinetyNine` | GET | 1099 report (US) |

## Best Practices

1. **Cache report data** - Reports are expensive; cache results for the same parameters
2. **Use date ranges** - Always specify fromDate and toDate explicitly
3. **Parse defensively** - Handle null/missing cell values gracefully
4. **Fetch in parallel** - Request multiple reports simultaneously to save time
5. **Use tracking categories** - Filter P&L by service line for MSP insights
6. **Compare periods** - Use the `periods` parameter for trend analysis
7. **Monitor aged receivables** - Set up alerts for clients over 60 days overdue
8. **Review gross margin** - Track managed services margin monthly
9. **Use cash basis when needed** - Set `paymentsOnly=true` for cash flow analysis
10. **Document report schedules** - Standardize which reports run when (monthly, quarterly)

## Related Skills

- [Xero Invoices](../invoices/SKILL.md) - Invoice data feeding reports
- [Xero Payments](../payments/SKILL.md) - Payment data in reports
- [Xero Accounts](../accounts/SKILL.md) - Account structure for P&L and Balance Sheet
- [Xero Contacts](../contacts/SKILL.md) - Contact-level report filtering
- [Xero API Patterns](../api-patterns/SKILL.md) - API reference
