---
description: View outstanding balances across all MSP clients in QuickBooks Online
argument-hint: "[customer] [overdue_only] [sort] [limit]"
arguments: [customer, overdue_only, sort, limit]
---

# Get QuickBooks Online Balances

View outstanding balances across all MSP clients, with optional filtering for overdue accounts and specific customers.

## Prerequisites

- Valid QBO OAuth2 token (`QBO_ACCESS_TOKEN`)
- Company ID configured (`QBO_REALM_ID`)
- User must have customer and invoice read permissions

## Steps

1. **Parse parameters**
   - Set customer filter (if provided)
   - Set overdue filter
   - Set sort order and limit

2. **Fetch customer balances**
   - Query customers with Balance > 0
   - Include sub-customer balances (BalanceWithJobs)

3. **Fetch overdue details (if needed)**
   - Query invoices past due date with remaining balance
   - Calculate days overdue per invoice

4. **Format and display**
   - Show balance summary table
   - Include aging breakdown
   - Provide totals and quick actions

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| customer | string | No | - | Filter to a specific customer |
| overdue_only | boolean | No | false | Only show overdue balances |
| sort | string | No | balance | Sort: balance, name, or overdue |
| limit | number | No | 50 | Max customers to display |

## Examples

### All Outstanding Balances

```
/get-balance
```

### Single Customer Balance

```
/get-balance --customer "Acme Corp"
```

### Overdue Only

```
/get-balance --overdue_only true
```

### Sorted by Name

```
/get-balance --sort name
```

## API Calls

### Fetch All Customers with Balance

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT%20Id%2C%20DisplayName%2C%20Balance%2C%20BalanceWithJobs%20FROM%20Customer%20WHERE%20Balance%20%3E%20'0'%20ORDERBY%20Balance%20DESC&minorversion=73"
```

### Fetch A/R Aging Report

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/reports/AgedReceivables?date_macro=Today&minorversion=73"
```

### Fetch Overdue Invoices

```bash
TODAY=$(date +%Y-%m-%d)
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT%20*%20FROM%20Invoice%20WHERE%20DueDate%20%3C%20'$TODAY'%20AND%20Balance%20%3E%20'0'%20ORDERBY%20DueDate%20ASC&minorversion=73"
```

### Fetch Single Customer Balance

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT%20*%20FROM%20Customer%20WHERE%20DisplayName%20LIKE%20'%25Acme%25'%20AND%20Balance%20%3E%20'0'&minorversion=73"
```

## Output

### All Balances (Default)

```
Outstanding Balances - All MSP Clients
================================================================
As of: 2026-02-23

+---------------------------+-----------+---------+----------+----------+---------+
| Customer                  | Balance   | Current | 1-30     | 31-60    | 61-90   | 91+     |
+---------------------------+-----------+---------+----------+----------+---------+
| Acme Corporation          | $5,200.00 | $2,500  | $2,700   | $0       | $0      | $0      |
| TechStart Inc             | $3,800.00 | $0      | $1,500   | $2,300   | $0      | $0      |
| Global Widgets LLC        | $2,100.00 | $0      | $0       | $0       | $2,100  | $0      |
| Metro Dental Group        | $1,500.00 | $1,500  | $0       | $0       | $0      | $0      |
| Pinnacle Partners         | $950.00   | $0      | $0       | $0       | $0      | $950    |
+---------------------------+-----------+---------+----------+----------+---------+

Summary:
  Total Outstanding:    $13,550.00
  Current:              $4,000.00
  1-30 Days:            $4,200.00
  31-60 Days:           $2,300.00
  61-90 Days:           $2,100.00
  91+ Days:             $950.00
  Clients with Balance: 5

================================================================

Attention Required:
  - Global Widgets LLC: $2,100.00 overdue 61-90 days
  - Pinnacle Partners: $950.00 overdue 91+ days

Quick Actions:
  - View overdue only: /get-balance --overdue_only true
  - Search customer: /search-customers "Acme"
  - Create invoice: /create-invoice --customer "Acme Corporation"
```

### Single Customer

```
/get-balance --customer "Acme Corp"

Outstanding Balance - Acme Corporation
================================================================
As of: 2026-02-23

Customer:        Acme Corporation
Total Balance:   $5,200.00

Open Invoices:
+----------+------------+------------+-----------+---------+--------+
| Invoice  | Date       | Due Date   | Total     | Balance | Status |
+----------+------------+------------+-----------+---------+--------+
| INV-1042 | 2026-02-01 | 2026-03-03 | $2,500.00 | $2,500  | Current|
| INV-1038 | 2026-01-01 | 2026-01-31 | $2,700.00 | $2,700  | 1-30   |
+----------+------------+------------+-----------+---------+--------+

Sub-Customer Breakdown:
  Acme Corp:Managed Services    $2,500.00
  Acme Corp:Project Work        $2,700.00
  Acme Corp:Hardware            $0.00

Payment Terms: Net 30
Last Payment:  2025-12-28 - $2,500.00 (CHK-10501)

Quick Actions:
  - Create invoice: /create-invoice --customer "Acme Corporation"
  - Search customer: /search-customers "Acme"
================================================================
```

### Overdue Only

```
/get-balance --overdue_only true

Overdue Balances - MSP Clients
================================================================
As of: 2026-02-23

+---------------------------+-----------+------+----------+----------+---------+
| Customer                  | Overdue   | 1-30 | 31-60    | 61-90    | 91+     |
+---------------------------+-----------+------+----------+----------+---------+
| Acme Corporation          | $2,700.00 | $2,700| $0      | $0       | $0      |
| TechStart Inc             | $3,800.00 | $1,500| $2,300  | $0       | $0      |
| Global Widgets LLC        | $2,100.00 | $0   | $0       | $2,100   | $0      |
| Pinnacle Partners         | $950.00   | $0   | $0       | $0       | $950    |
+---------------------------+-----------+------+----------+----------+---------+

Summary:
  Total Overdue:        $9,550.00
  Clients Overdue:      4
  Most Overdue:         Pinnacle Partners (91+ days)

Action Items:
  1. Pinnacle Partners - $950 overdue 91+ days (escalate)
  2. Global Widgets LLC - $2,100 overdue 61-90 days (follow up)
  3. TechStart Inc - $3,800 overdue 31-60 days (reminder)
  4. Acme Corporation - $2,700 overdue 1-30 days (monitor)
================================================================
```

### No Outstanding Balances

```
No outstanding balances found.

All MSP client accounts are current. No action required.

Quick Actions:
  - View all customers: /search-customers ""
  - Create invoice: /create-invoice --customer "Customer Name"
```

## Sort Options

| Value | Description |
|-------|-------------|
| balance | Sort by total balance descending (default) |
| name | Sort alphabetically by customer name |
| overdue | Sort by oldest overdue amount |

## Error Handling

### Customer Not Found

```
No customer matching "XYZ Corp" found.

Suggestions:
  - Check spelling of the customer name
  - Try a partial match: /search-customers "XYZ"
  - View all balances: /get-balance
```

### No Overdue Balances

```
No overdue balances found.

All outstanding invoices are within payment terms.

Current outstanding: $4,000.00 across 2 clients (all current)

Quick Actions:
  - View all balances: /get-balance
```

### API Error

```
Error fetching balance data from QuickBooks Online

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

### Weekly Collections Review

Review all overdue balances for the collections meeting:
```
/get-balance --overdue_only true --sort overdue
```

### Client Account Check

Before a client call, check their current balance:
```
/get-balance --customer "Acme Corp"
```

### Monthly Financial Review

View all outstanding balances sorted by amount:
```
/get-balance --sort balance
```

### Identify At-Risk Accounts

Find clients with severely overdue balances:
```
/get-balance --overdue_only true --sort overdue
```

## Related Commands

- `/search-customers` - Find customer details
- `/create-invoice` - Create a new invoice
- `/expense-summary` - View expenses to compare against revenue
