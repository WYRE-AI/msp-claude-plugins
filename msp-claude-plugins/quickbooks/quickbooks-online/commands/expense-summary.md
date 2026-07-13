---
description: Summarize expenses by client, vendor, or date range in QuickBooks Online
argument-hint: "[from] [to] [customer] [vendor] [group_by]"
arguments: [from, to, customer, vendor, group_by]
---

# QuickBooks Online Expense Summary

Summarize expenses by client, vendor, or date range to track per-client costs and overall spending.

## Prerequisites

- Valid QBO OAuth2 token (`QBO_ACCESS_TOKEN`)
- Company ID configured (`QBO_REALM_ID`)
- User must have expense and purchase read permissions

## Steps

1. **Parse parameters**
   - Set date range (default: current month)
   - Set customer/vendor filter
   - Set grouping mode

2. **Fetch expense data**
   - Query Purchase entities in date range
   - Query Bill entities in date range
   - Include line-level customer allocations

3. **Aggregate results**
   - Group by customer, vendor, or expense category
   - Calculate totals per group
   - Identify billable vs non-billable

4. **Format and display**
   - Summary table by chosen grouping
   - Totals and breakdown
   - Profitability context where applicable

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string | No | 1st of month | Start date (YYYY-MM-DD) |
| to | string | No | today | End date (YYYY-MM-DD) |
| customer | string | No | - | Filter to specific customer |
| vendor | string | No | - | Filter to specific vendor |
| group_by | string | No | customer | Group by: customer, vendor, category |

## Examples

### Current Month by Customer

```
/expense-summary
```

### Specific Date Range

```
/expense-summary --from 2026-01-01 --to 2026-01-31
```

### Single Customer Expenses

```
/expense-summary --customer "Acme Corp"
```

### By Vendor

```
/expense-summary --group_by vendor --from 2026-01-01 --to 2026-01-31
```

### Specific Vendor

```
/expense-summary --vendor "Microsoft" --from 2026-01-01 --to 2026-01-31
```

### By Category

```
/expense-summary --group_by category
```

## API Calls

### Fetch Purchases in Date Range

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT%20*%20FROM%20Purchase%20WHERE%20TxnDate%20%3E%3D%20'2026-02-01'%20AND%20TxnDate%20%3C%3D%20'2026-02-23'%20ORDERBY%20TxnDate%20DESC&minorversion=73"
```

### Fetch Bills in Date Range

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT%20*%20FROM%20Bill%20WHERE%20TxnDate%20%3E%3D%20'2026-02-01'%20AND%20TxnDate%20%3C%3D%20'2026-02-23'%20ORDERBY%20TxnDate%20DESC&minorversion=73"
```

### Fetch P&L by Customer (Alternative)

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/reports/ProfitAndLoss?start_date=2026-02-01&end_date=2026-02-23&summarize_column_by=Customers&minorversion=73"
```

### Fetch Expenses by Vendor Report

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/reports/ExpensesByVendor?start_date=2026-02-01&end_date=2026-02-23&minorversion=73"
```

## Output

### By Customer (Default)

```
Expense Summary - By Customer
================================================================
Period: 2026-02-01 to 2026-02-23

+---------------------------+-----------+-----------+------------+---------+
| Customer                  | Billable  | Non-Bill  | Total      | % Total |
+---------------------------+-----------+-----------+------------+---------+
| Acme Corporation          | $1,250.00 | $0.00     | $1,250.00  | 32.1%   |
| TechStart Inc             | $820.00   | $0.00     | $820.00    | 21.1%   |
| Global Widgets LLC        | $650.00   | $0.00     | $650.00    | 16.7%   |
| Metro Dental Group        | $450.00   | $100.00   | $550.00    | 14.1%   |
| (Unallocated)             | $0.00     | $625.00   | $625.00    | 16.0%   |
+---------------------------+-----------+-----------+------------+---------+
| TOTAL                     | $3,170.00 | $725.00   | $3,895.00  | 100%    |
+---------------------------+-----------+-----------+------------+---------+

Billable expense recovery:
  Billable:     $3,170.00 (81.4%)
  Non-billable: $725.00 (18.6%)
  Unallocated:  $625.00 (16.0%)

Quick Actions:
  - View by vendor: /expense-summary --group_by vendor
  - View customer detail: /expense-summary --customer "Acme Corp"
  - Compare to revenue: /get-balance
================================================================
```

### Single Customer Detail

```
/expense-summary --customer "Acme Corp"

Expense Detail - Acme Corporation
================================================================
Period: 2026-02-01 to 2026-02-23

+------------+----------------------+---------------------------------+-----------+----------+
| Date       | Vendor               | Description                     | Amount    | Billable |
+------------+----------------------+---------------------------------+-----------+----------+
| 2026-02-15 | Microsoft            | M365 Business Premium - 30 seats| $450.00   | Yes      |
| 2026-02-15 | SentinelOne          | Endpoint Protection - 30 seats  | $120.00   | Yes      |
| 2026-02-15 | Datto                | Cloud Backup - 500GB            | $80.00    | Yes      |
| 2026-02-10 | Amazon Web Services  | Azure AD Connect hosting        | $45.00    | Yes      |
| 2026-02-08 | Cabling Plus LLC     | Network cabling - conference rm | $555.00   | Yes      |
+------------+----------------------+---------------------------------+-----------+----------+
| TOTAL                                                               | $1,250.00 |          |
+------------+----------------------+---------------------------------+-----------+----------+

Breakdown:
  Software Licenses:   $570.00 (45.6%)
  Cloud Services:      $125.00 (10.0%)
  Subcontractors:      $555.00 (44.4%)

Billable: $1,250.00 (100.0%)

Profitability Context:
  Revenue (Feb):   $2,850.00 (from invoices)
  Costs (Feb):     $1,250.00
  Gross Profit:    $1,600.00
  Margin:          56.1%
================================================================
```

### By Vendor

```
/expense-summary --group_by vendor

Expense Summary - By Vendor
================================================================
Period: 2026-02-01 to 2026-02-23

+---------------------------+-----------+-------+---------------------------+
| Vendor                    | Total     | Count | Top Category              |
+---------------------------+-----------+-------+---------------------------+
| Microsoft                 | $1,350.00 | 3     | Software Licenses         |
| SentinelOne               | $360.00   | 3     | Software Licenses         |
| Datto                     | $240.00   | 3     | Cloud Services            |
| Amazon Web Services       | $580.00   | 5     | Cloud Services            |
| Cabling Plus LLC          | $555.00   | 1     | Subcontractor             |
| Office Supplies Depot     | $125.00   | 2     | Office Supplies           |
| (Other)                   | $285.00   | 4     | Various                   |
+---------------------------+-----------+-------+---------------------------+
| TOTAL                     | $3,895.00 | 21    |                           |
+---------------------------+-----------+-------+---------------------------+

Top 3 vendors by spend: Microsoft, AWS, Cabling Plus LLC
================================================================
```

### By Category

```
/expense-summary --group_by category

Expense Summary - By Category
================================================================
Period: 2026-02-01 to 2026-02-23

+---------------------------+-----------+-------+---------+
| Category                  | Total     | Count | % Total |
+---------------------------+-----------+-------+---------+
| Software Licenses         | $1,710.00 | 6     | 43.9%   |
| Cloud Services            | $820.00   | 8     | 21.1%   |
| Subcontractors            | $555.00   | 1     | 14.2%   |
| Office Supplies           | $125.00   | 2     | 3.2%    |
| Telecom                   | $400.00   | 3     | 10.3%   |
| Training                  | $285.00   | 1     | 7.3%    |
+---------------------------+-----------+-------+---------+
| TOTAL                     | $3,895.00 | 21    | 100%    |
+---------------------------+-----------+-------+---------+

Client-allocated: $3,170.00 (81.4%)
Overhead:         $725.00 (18.6%)
================================================================
```

### No Expenses Found

```
No expenses found for the specified criteria.

Period: 2026-02-01 to 2026-02-23
Filters: customer = "XYZ Corp"

Suggestions:
  - Check if expenses are allocated to this customer
  - Try a broader date range
  - Verify the customer name: /search-customers "XYZ"
  - Remove the customer filter: /expense-summary --from 2026-02-01 --to 2026-02-23
```

## Group By Options

| Value | Description |
|-------|-------------|
| customer | Group by allocated customer (default) |
| vendor | Group by vendor/payee |
| category | Group by expense account/category |

## Error Handling

### Invalid Date Range

```
Invalid date range: start date must be before end date.

Provided: from 2026-03-01, to 2026-02-01

Fix: Ensure --from is earlier than --to

Example:
  /expense-summary --from 2026-02-01 --to 2026-03-01
```

### Customer Not Found

```
No customer matching "XYZ Corp" found.

Suggestions:
  - Check spelling: /search-customers "XYZ"
  - Remove filter to see all expenses: /expense-summary
```

### API Error

```
Error fetching expense data from QuickBooks Online

Possible causes:
  - Expired access token (check QBO_ACCESS_TOKEN)
  - Invalid realm ID (check QBO_REALM_ID)
  - Network connectivity issue

Resolution:
  1. Refresh the access token
  2. Verify environment variables
  3. Retry the command
```

## Use Cases

### Monthly Cost Review

Review all expenses for the past month:
```
/expense-summary --from 2026-01-01 --to 2026-01-31
```

### Client Profitability Check

Compare costs against revenue for a specific client:
```
/expense-summary --customer "Acme Corp"
```
Then compare with: `/get-balance --customer "Acme Corp"`

### Vendor Spend Analysis

Identify top vendors to negotiate better rates:
```
/expense-summary --group_by vendor --from 2025-01-01 --to 2025-12-31
```

### License Cost Allocation

Verify all software licenses are allocated to clients:
```
/expense-summary --group_by customer
```
Check the "Unallocated" row for costs not assigned to clients.

### Pre-Invoice Verification

Before invoicing, check what costs were incurred for a client:
```
/expense-summary --customer "Acme Corp" --from 2026-02-01 --to 2026-02-28
```

## Related Commands

- `/get-balance` - View revenue side (outstanding invoices)
- `/create-invoice` - Invoice clients for billable expenses
- `/search-customers` - Find customer records
