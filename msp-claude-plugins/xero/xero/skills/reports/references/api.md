# Xero Reports API Reference

Complete request catalog and parameter tables for the Xero Reports endpoints.

## Profit and Loss Report

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

## Balance Sheet Report

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

## Aged Receivables Report

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

## Aged Payables Report

```bash
# Aged Payables as of today
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/AgedPayablesByContact?date=2026-03-31" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

## Trial Balance Report

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

## Bank Summary Report

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/BankSummary?fromDate=2026-03-01&toDate=2026-03-31" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

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
