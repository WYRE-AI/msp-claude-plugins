# QuickBooks Online Report Endpoints

## Profit & Loss (Income Statement)

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

## Balance Sheet

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

## Accounts Receivable Aging

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

## Accounts Payable Aging

Shows outstanding vendor balances.

```http
GET /v3/company/{realmId}/reports/AgedPayables?date_macro=Today&minorversion=73
```

**Detail level:**
```http
GET /v3/company/{realmId}/reports/AgedPayableDetail?date_macro=Today&minorversion=73
```

## General Ledger

Transaction-level detail for all accounts.

```http
GET /v3/company/{realmId}/reports/GeneralLedger?start_date=2026-01-01&end_date=2026-01-31&minorversion=73
```

**For a specific account:**
```http
GET /v3/company/{realmId}/reports/GeneralLedger?start_date=2026-01-01&end_date=2026-01-31&account=35&minorversion=73
```

## Customer Sales Summary

Revenue by customer.

```http
GET /v3/company/{realmId}/reports/CustomerSales?start_date=2026-01-01&end_date=2026-01-31&minorversion=73
```

## Customer Income

Income detail by customer.

```http
GET /v3/company/{realmId}/reports/CustomerIncome?start_date=2026-01-01&end_date=2026-01-31&minorversion=73
```

## Cash Flow Statement

```http
GET /v3/company/{realmId}/reports/CashFlow?start_date=2026-01-01&end_date=2026-01-31&minorversion=73
```

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
