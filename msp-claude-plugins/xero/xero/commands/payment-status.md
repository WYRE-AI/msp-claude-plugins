---
description: Check payment status and outstanding balances for a client in Xero
argument-hint: "<contact_name> [include_paid] [days_back]"
arguments: [contact_name, include_paid, days_back]
---

# Check Payment Status

Check payment status and outstanding balances for a managed services client in Xero.

## Prerequisites

- Valid Xero OAuth2 credentials configured (`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`)
- Xero tenant ID configured (`XERO_TENANT_ID`)
- OAuth scopes `accounting.contacts.read` and `accounting.transactions.read` granted

## Steps

1. **Authenticate with Xero**

   ```bash
   ACCESS_TOKEN=$(curl -s -X POST https://identity.xero.com/connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -u "${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}" \
     -d "grant_type=client_credentials&scope=accounting.contacts.read accounting.transactions.read" \
     | jq -r '.access_token')
   ```

2. **Find the contact**

   ```bash
   CONTACT=$(curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=Name.Contains(%22${CONTACT_NAME}%22)" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "xero-tenant-id: ${XERO_TENANT_ID}" \
     -H "Accept: application/json")

   CONTACT_ID=$(echo $CONTACT | jq -r '.Contacts[0].ContactID')
   CONTACT_DISPLAY=$(echo $CONTACT | jq -r '.Contacts[0].Name')
   ```

3. **Fetch outstanding invoices**

   ```bash
   # Outstanding invoices (unpaid)
   curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Contact.ContactID==guid(%22${CONTACT_ID}%22)&&Type==%22ACCREC%22&&Status==%22AUTHORISED%22" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "xero-tenant-id: ${XERO_TENANT_ID}" \
     -H "Accept: application/json"
   ```

4. **Fetch recent payments**

   ```bash
   curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments?where=Invoice.Contact.ContactID==guid(%22${CONTACT_ID}%22)&&PaymentType==%22ACCRECPAYMENT%22" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "xero-tenant-id: ${XERO_TENANT_ID}" \
     -H "Accept: application/json"
   ```

5. **Calculate aging and compile results**

6. **Format and return summary**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| contact_name | string | Yes | - | Client name (partial match) |
| include_paid | boolean | No | false | Include paid invoices |
| days_back | integer | No | 90 | Days of history to show |

## Examples

### Basic Payment Check

```
/payment-status "Acme Corp"
```

### Include Paid Invoices

```
/payment-status "Acme Corp" --include_paid true
```

### Extended History

```
/payment-status "Acme Corp" --days_back 365
```

## Output

### Client with Outstanding Balance

```
Payment Status: Acme Corp
================================================================

Summary:
  Total Outstanding: $5,000.00
  Total Overdue:     $2,500.00
  Last Payment:      2026-02-15 ($2,500.00)

Outstanding Invoices:
+----------+-----------------------------------+------------+------------+-----------+--------+
| Invoice# | Description                       | Date       | Due Date   | Amount    | Status |
+----------+-----------------------------------+------------+------------+-----------+--------+
| INV-0042 | Managed Services - March 2026     | 2026-03-01 | 2026-03-31 | $2,500.00 | Due    |
| INV-0038 | Managed Services - February 2026  | 2026-02-01 | 2026-02-28 | $2,500.00 | OVERDUE (23 days) |
+----------+-----------------------------------+------------+------------+-----------+--------+

Recent Payments (last 90 days):
+------------+----------+-------------+--------------------+
| Date       | Invoice# | Amount      | Reference          |
+------------+----------+-------------+--------------------+
| 2026-02-15 | INV-0034 | $2,500.00   | EFT-2026-0215      |
| 2026-01-12 | INV-0030 | $2,500.00   | EFT-2026-0112      |
+------------+----------+-------------+--------------------+

Aging Summary:
  Current (not yet due):  $2,500.00
  1-30 days overdue:      $2,500.00
  31-60 days overdue:     $0.00
  61-90 days overdue:     $0.00
  90+ days overdue:       $0.00

Payment Pattern:
  Average days to pay: 15 days
  Typical payment: Monthly EFT
  Payment rating: Good (usually within terms)

Actions:
  - Send reminder for INV-0038 (23 days overdue)
  - Create next invoice: /create-invoice "Acme Corp" ...
================================================================
```

### Client Fully Paid

```
Payment Status: TechStart Inc
================================================================

Summary:
  Total Outstanding: $0.00
  Total Overdue:     $0.00
  Last Payment:      2026-03-01 ($1,800.00)

No outstanding invoices.

Recent Payments (last 90 days):
+------------+----------+-------------+--------------------+
| Date       | Invoice# | Amount      | Reference          |
+------------+----------+-------------+--------------------+
| 2026-03-01 | INV-0041 | $1,800.00   | ACH-030126         |
| 2026-02-01 | INV-0037 | $1,800.00   | ACH-020126         |
| 2026-01-02 | INV-0033 | $1,800.00   | ACH-010226         |
+------------+----------+-------------+--------------------+

Payment Pattern:
  Average days to pay: 1 day
  Typical payment: Monthly ACH (auto-pay)
  Payment rating: Excellent

Actions:
  - Create next invoice: /create-invoice "TechStart Inc" ...
================================================================
```

### Client with Severely Overdue Balance

```
Payment Status: Problem Client LLC
================================================================

Summary:
  Total Outstanding: $7,500.00
  Total Overdue:     $7,500.00
  Last Payment:      2025-11-15 ($2,500.00)

WARNING: No payment received in 100+ days

Outstanding Invoices:
+----------+-----------------------------------+------------+------------+-----------+--------+
| Invoice# | Description                       | Date       | Due Date   | Amount    | Status |
+----------+-----------------------------------+------------+------------+-----------+--------+
| INV-0040 | Managed Services - March 2026     | 2026-03-01 | 2026-03-31 | $2,500.00 | Due    |
| INV-0036 | Managed Services - February 2026  | 2026-02-01 | 2026-02-28 | $2,500.00 | OVERDUE (23 days) |
| INV-0032 | Managed Services - January 2026   | 2026-01-01 | 2026-01-31 | $2,500.00 | OVERDUE (53 days) |
+----------+-----------------------------------+------------+------------+-----------+--------+

Aging Summary:
  Current (not yet due):  $0.00
  1-30 days overdue:      $2,500.00
  31-60 days overdue:     $2,500.00
  61-90 days overdue:     $0.00
  90+ days overdue:       $2,500.00

Payment Pattern:
  Average days to pay: N/A (no recent payments)
  Payment rating: CRITICAL - Escalate immediately

RECOMMENDED ACTIONS:
  1. Escalate to account manager immediately
  2. Review service agreement terms
  3. Consider service suspension policy
  4. Send formal past-due notice
================================================================
```

## Error Handling

### Contact Not Found

```
Error: No contact found matching "Xyz Company"

Suggestions:
  - Check spelling of the company name
  - Try a partial match: /search-contacts "Xyz"
  - Search all statuses: /search-contacts "Xyz" --status all
```

### Authentication Failed

```
Error: OAuth2 token request failed

Possible causes:
  - Invalid XERO_CLIENT_ID or XERO_CLIENT_SECRET
  - Custom Connection not authorized

Resolution:
  - Verify credentials in Xero Developer Portal
  - Re-authorize the Custom Connection
```

### Multiple Contacts Found

```
Multiple contacts found matching "Acme"

+----+------------------------+------------+
| #  | Name                   | Account #  |
+----+------------------------+------------+
| 1  | Acme Corp              | ACME001    |
| 2  | Acme East Division     | ACME002    |
+----+------------------------+------------+

Please be more specific:
  /payment-status "Acme Corp"
  /payment-status "Acme East Division"
```

### Rate Limited

```
Error: Rate limit exceeded (429)

Resolution:
  - Wait 60 seconds and retry
  - This command makes 2-3 API calls; ensure rate budget is available
```

## Use Cases

### Monthly AR Review

Check all client payment statuses during monthly review:

```
/payment-status "Acme Corp"
/payment-status "TechStart Inc"
/payment-status "GlobalHealth"
```

### Pre-Billing Verification

Before generating next month's invoices, check current status:

```
/payment-status "Acme Corp"
# If outstanding balance exists, follow up before billing again
```

### Overdue Collections

Identify clients needing collection follow-up:

```
/payment-status "Problem Client" --days_back 180
```

### Client Health Check

Review payment history as part of client relationship review:

```
/payment-status "Acme Corp" --include_paid true --days_back 365
```

## Related Commands

- `/search-contacts` - Find a contact before checking payment status
- `/create-invoice` - Create a new invoice for the client
- `/reconciliation-summary` - Verify all clients have been billed
