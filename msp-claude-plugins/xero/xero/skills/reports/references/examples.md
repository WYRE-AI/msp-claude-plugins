# Xero Report Workflow Examples

Worked JavaScript examples for fetching and parsing Xero reports.

## MSP Monthly Financial Review

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

## Parse P&L for Revenue Breakdown

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

## Parse Aged Receivables for Overdue Clients

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

## Gross Margin Calculation

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

## Year-over-Year Comparison

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
