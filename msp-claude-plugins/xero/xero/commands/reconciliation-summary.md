---
description: Verify all MSP clients have been billed for the current period and summarize reconciliation status
argument-hint: "[period] [contact_group] [account_code] [min_amount]"
arguments: [period, contact_group, account_code, min_amount]
---

# Reconciliation Summary

Verify all MSP clients have been billed for a given period and produce a reconciliation summary. This command helps MSPs ensure no client has been missed during monthly billing runs.

## Prerequisites

- Valid Xero OAuth2 credentials configured (`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`)
- Xero tenant ID configured (`XERO_TENANT_ID`)
- OAuth scopes `accounting.contacts.read`, `accounting.transactions.read`, and `accounting.reports.read` granted

## Steps

1. **Authenticate with Xero**

   ```bash
   ACCESS_TOKEN=$(curl -s -X POST https://identity.xero.com/connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -u "${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}" \
     -d "grant_type=client_credentials&scope=accounting.contacts.read accounting.transactions.read accounting.reports.read" \
     | jq -r '.access_token')
   ```

2. **Fetch all active customers**

   ```bash
   curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=ContactStatus==%22ACTIVE%22&&IsCustomer==true&page=1" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "xero-tenant-id: ${XERO_TENANT_ID}" \
     -H "Accept: application/json"
   ```

3. **Fetch invoices for the billing period**

   ```bash
   # Get all sales invoices for the period
   YEAR=$(echo ${PERIOD} | cut -d- -f1)
   MONTH=$(echo ${PERIOD} | cut -d- -f2)

   curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Type==%22ACCREC%22&&Date>=DateTime(${YEAR},${MONTH},1)&&Date<=DateTime(${YEAR},${MONTH},28)&&Status!=%22DELETED%22&&Status!=%22VOIDED%22&page=1" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "xero-tenant-id: ${XERO_TENANT_ID}" \
     -H "Accept: application/json"
   ```

4. **Cross-reference customers against invoices**
   - Identify customers with no invoice for the period
   - Identify customers with invoices
   - Flag any anomalies (unusual amounts, missing line items)

5. **Fetch Aged Receivables for context**

   ```bash
   curl -s -X GET "https://api.xero.com/api.xro/2.0/Reports/AgedReceivablesByContact?date=${YEAR}-${MONTH}-28" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "xero-tenant-id: ${XERO_TENANT_ID}" \
     -H "Accept: application/json"
   ```

6. **Compile and format reconciliation report**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period | string | No | Current month | Billing period (YYYY-MM) |
| contact_group | string | No | - | Filter by contact group name |
| account_code | string | No | - | Filter by revenue account code |
| min_amount | decimal | No | - | Minimum expected invoice amount |

## Examples

### Current Month Reconciliation

```
/reconciliation-summary
```

### Specific Period

```
/reconciliation-summary --period "2026-03"
```

### Managed Services Only

```
/reconciliation-summary --period "2026-03" --account_code 200
```

### Flag Small Invoices

```
/reconciliation-summary --period "2026-03" --min_amount 500
```

## Output

### Complete Reconciliation Report

```
Reconciliation Summary: March 2026
================================================================

Billing Status:
  Active Customers:     18
  Invoiced This Period: 16
  NOT Invoiced:         2
  Billing Completion:   88.9%

Revenue Summary:
  Total Invoiced:       $52,400.00
  Total Outstanding:    $28,600.00
  Total Collected:      $23,800.00

Billed Clients:
+------------------------+----------+----------+-----------+-----------+--------+
| Client                 | Invoice# | Date     | Amount    | Paid      | Status |
+------------------------+----------+----------+-----------+-----------+--------+
| Acme Corp              | INV-0042 | 03/01/26 | $2,500.00 | $0.00     | Due    |
| TechStart Inc          | INV-0043 | 03/01/26 | $1,800.00 | $1,800.00 | PAID   |
| GlobalHealth Systems   | INV-0044 | 03/01/26 | $4,200.00 | $0.00     | Due    |
| Metro Law Group        | INV-0045 | 03/01/26 | $3,500.00 | $0.00     | Due    |
| Springfield Schools    | INV-0046 | 03/01/26 | $6,800.00 | $6,800.00 | PAID   |
| Harbor Financial       | INV-0047 | 03/01/26 | $2,200.00 | $0.00     | Due    |
| ... (10 more)          | ...      | ...      | ...       | ...       | ...    |
+------------------------+----------+----------+-----------+-----------+--------+

NOT INVOICED (ACTION REQUIRED):
+------------------------+------------+-------------------------------------------+
| Client                 | Account #  | Notes                                     |
+------------------------+------------+-------------------------------------------+
| NewCo Industries       | NEW001     | New client - verify billing start date    |
| Parkside Medical       | PARK001    | Check if contract is active               |
+------------------------+------------+-------------------------------------------+

Aged Receivables Summary:
  Current:              $28,600.00
  1-30 days overdue:    $4,800.00
  31-60 days overdue:   $2,500.00
  61-90 days overdue:   $0.00
  90+ days overdue:     $2,500.00
  Total Outstanding:    $38,400.00

Clients with Overdue Balances:
+------------------------+----------+-----------+-----------------------------+
| Client                 | Overdue  | Days      | Oldest Invoice              |
+------------------------+----------+-----------+-----------------------------+
| Problem Client LLC     | $2,500.00| 90+ days  | INV-0020 (2025-12-01)       |
| Acme East Division     | $1,200.00| 23 days   | INV-0038 (2026-02-01)       |
| Harbor Financial       | $3,600.00| 45 days   | INV-0035 (2026-01-15)       |
+------------------------+----------+-----------+-----------------------------+

Month-over-Month Comparison:
  February 2026: $51,200.00 (18 clients)
  March 2026:    $52,400.00 (16 clients billed so far)
  Change:        +$1,200.00 (+2.3%) [2 clients still unbilled]

Actions Required:
  1. Create invoices for 2 unbilled clients
  2. Follow up on 3 clients with overdue balances
  3. Escalate Problem Client LLC (90+ days overdue)

Quick Commands:
  /create-invoice "NewCo Industries" --description "Managed Services - March 2026" --amount ...
  /create-invoice "Parkside Medical" --description "Managed Services - March 2026" --amount ...
  /payment-status "Problem Client LLC"
================================================================
```

### All Clients Billed

```
Reconciliation Summary: March 2026
================================================================

Billing Status:
  Active Customers:     18
  Invoiced This Period: 18
  NOT Invoiced:         0
  Billing Completion:   100%

All active clients have been invoiced for March 2026.

Revenue Summary:
  Total Invoiced:       $54,600.00
  Total Outstanding:    $30,800.00
  Total Collected:      $23,800.00
  Collection Rate:      43.6%

No action required for billing. Review overdue balances separately.
================================================================
```

## Error Handling

### Authentication Failed

```
Error: OAuth2 token request failed

Resolution:
  - Verify XERO_CLIENT_ID and XERO_CLIENT_SECRET
  - Re-authorize the Custom Connection in Xero Developer Portal
```

### No Active Customers

```
Warning: No active customers found in Xero

Possible causes:
  - No contacts with IsCustomer=true
  - All contacts are archived
  - Wrong tenant ID

Resolution:
  - Verify XERO_TENANT_ID is correct
  - Check that contacts exist with customer invoices
```

### Rate Limited

```
Error: Rate limit exceeded (429)

This command makes multiple API calls (contacts, invoices, reports).
Wait 60 seconds and retry. Consider running during off-peak hours
for large client bases.
```

### Invalid Period

```
Error: Invalid period format "March 2026"

Expected format: YYYY-MM (e.g., "2026-03")

Example:
  /reconciliation-summary --period "2026-03"
```

## API Calls Made

This command makes the following API calls:

| Call | Endpoint | Purpose |
|------|----------|---------|
| 1 | `POST /connect/token` | Authenticate |
| 2+ | `GET /Contacts?page=N` | Fetch active customers (paginated) |
| 3+ | `GET /Invoices?page=N` | Fetch period invoices (paginated) |
| 4 | `GET /Reports/AgedReceivablesByContact` | Aged receivables context |

For an MSP with 20 clients, this typically requires 4-5 API calls (well within the 60/minute limit).

## Use Cases

### End-of-Month Billing Verification

Run after generating monthly invoices to confirm completeness:

```
# After batch invoice creation
/reconciliation-summary --period "2026-03"
```

### Monthly Financial Review

Part of the monthly close process:

```
/reconciliation-summary --period "2026-03"
# Review unbilled clients and overdue balances
# Take action on flagged items
```

### Quarterly Business Review

Review billing patterns across the quarter:

```
/reconciliation-summary --period "2026-01"
/reconciliation-summary --period "2026-02"
/reconciliation-summary --period "2026-03"
```

### New Client Verification

After onboarding new clients, verify they are included in billing:

```
/reconciliation-summary --period "2026-03" --min_amount 500
```

## Related Commands

- `/create-invoice` - Create invoices for unbilled clients
- `/payment-status` - Check payment status for specific clients
- `/search-contacts` - Find and verify client contact details
