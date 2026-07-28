# QuickBooks Online Report Parsing and Workflow Examples

## Row Structure

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

## Recursive Row Parser

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

## MSP Monthly Financial Review

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

## Client Profitability Dashboard

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

## A/R Aging Collections Alert

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

## Monthly Revenue Trend

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

## Cash Flow Forecast

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

## Error Recovery Pattern

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
