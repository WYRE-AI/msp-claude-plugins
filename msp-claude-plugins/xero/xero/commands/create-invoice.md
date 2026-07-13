---
description: Create a sales invoice for a managed services client in Xero
argument-hint: "<contact_name> <description> <amount> [account_code] [due_days] [reference] [status]"
arguments: [contact_name, description, amount, account_code, due_days, reference, status]
---

# Create Xero Invoice

Create a sales invoice (ACCREC) for a managed services client in Xero.

## Prerequisites

- Valid Xero OAuth2 credentials configured (`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`)
- Xero tenant ID configured (`XERO_TENANT_ID`)
- OAuth scope `accounting.transactions` granted
- Contact must already exist in Xero

## Steps

1. **Authenticate with Xero**
   - Obtain OAuth2 access token using client credentials

   ```bash
   ACCESS_TOKEN=$(curl -s -X POST https://identity.xero.com/connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -u "${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}" \
     -d "grant_type=client_credentials&scope=accounting.transactions accounting.contacts" \
     | jq -r '.access_token')
   ```

2. **Find the contact**
   - Search for the contact by name to get the ContactID

   ```bash
   CONTACT=$(curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=Name.Contains(%22${CONTACT_NAME}%22)" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "xero-tenant-id: ${XERO_TENANT_ID}" \
     -H "Accept: application/json")

   CONTACT_ID=$(echo $CONTACT | jq -r '.Contacts[0].ContactID')
   ```

3. **Calculate dates**
   - Set invoice date to today
   - Set due date based on due_days parameter

   ```bash
   INVOICE_DATE=$(date +%Y-%m-%dT00:00:00)
   DUE_DATE=$(date -v +${DUE_DAYS}d +%Y-%m-%dT00:00:00)
   ```

4. **Create the invoice**

   ```bash
   curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "xero-tenant-id: ${XERO_TENANT_ID}" \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     -d '{
       "Type": "ACCREC",
       "Contact": {
         "ContactID": "'${CONTACT_ID}'"
       },
       "Date": "'${INVOICE_DATE}'",
       "DueDate": "'${DUE_DATE}'",
       "LineAmountTypes": "Exclusive",
       "Reference": "'${REFERENCE}'",
       "LineItems": [
         {
           "Description": "'${DESCRIPTION}'",
           "Quantity": 1,
           "UnitAmount": '${AMOUNT}',
           "AccountCode": "'${ACCOUNT_CODE}'"
         }
       ],
       "Status": "'${STATUS}'"
     }'
   ```

5. **Verify the result**
   - Check for validation errors
   - Confirm invoice number and total

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| contact_name | string | Yes | - | Client name (partial match supported) |
| description | string | Yes | - | Line item description |
| amount | decimal | Yes | - | Invoice amount |
| account_code | string | No | 200 | GL account code |
| due_days | integer | No | 30 | Days until due |
| reference | string | No | - | Reference text |
| status | string | No | DRAFT | DRAFT or AUTHORISED |

## Examples

### Basic Monthly Invoice

```
/create-invoice "Acme Corp" --description "Monthly Managed Services - March 2026" --amount 2500.00
```

### Invoice with Custom Terms

```
/create-invoice "TechStart Inc" --description "Monthly Managed Services - March 2026" --amount 1800.00 --due_days 14 --reference "PO-2026-0042"
```

### Authorized Invoice (Ready to Send)

```
/create-invoice "Acme Corp" --description "Project: Network Upgrade Phase 1" --amount 7500.00 --account_code 210 --status AUTHORISED
```

### Software License Invoice

```
/create-invoice "Acme Corp" --description "Microsoft 365 Business Premium (25 licenses) - March 2026" --amount 550.00 --account_code 230
```

## Output

### Success

```
Invoice created successfully

Invoice Details:
================================================================
Invoice Number: INV-0042
Contact:        Acme Corp
Date:           2026-03-01
Due Date:       2026-03-31
Status:         DRAFT

Line Items:
  1. Monthly Managed Services - March 2026
     Qty: 1 x $2,500.00 = $2,500.00 (Account: 200)

Subtotal:       $2,500.00
Tax:            $0.00
Total:          $2,500.00

Reference:      March 2026 Managed Services

Next steps:
  - Review in Xero: https://go.xero.com/...
  - Authorize: /create-invoice ... --status AUTHORISED
  - Check payment: /payment-status "Acme Corp"
================================================================
```

### Validation Error

```
Error creating invoice

Validation Errors:
  - Account code '999' is not a valid code for this document.

Suggestions:
  - Check available account codes in Xero
  - Common MSP codes: 200 (Managed Services), 210 (Projects), 220 (Hardware)
  - Use default account code: --account_code 200
```

### Contact Not Found

```
Error: No contact found matching "Xyz Company"

Suggestions:
  - Check spelling of the company name
  - Try a partial match: /search-contacts "Xyz"
  - Create the contact first in Xero
```

## Error Handling

### Authentication Failed

```
Error: OAuth2 token request failed

Possible causes:
  - Invalid XERO_CLIENT_ID or XERO_CLIENT_SECRET
  - Custom Connection not authorized
  - Expired credentials

Resolution:
  - Verify credentials in Xero Developer Portal
  - Re-authorize the Custom Connection
```

### Rate Limited

```
Error: Rate limit exceeded (429)

Resolution:
  - Wait 60 seconds and retry
  - Reduce request frequency
  - Check daily limit (5,000 per day)
```

### Invalid Account Code

```
Error: Account code '999' is not valid

Resolution:
  - List valid codes: GET /api.xro/2.0/Accounts?where=Class=="REVENUE"
  - Common MSP revenue codes:
    200 - Managed Services Revenue
    210 - Project Revenue
    220 - Hardware Sales
    230 - Software License Revenue
```

## Common Account Codes for MSPs

| Code | Name | Use For |
|------|------|---------|
| 200 | Managed Services Revenue | Monthly recurring contracts |
| 210 | Project Revenue | One-time project work |
| 220 | Hardware Sales | Hardware procurement |
| 230 | Software License Revenue | M365, security tools |
| 240 | Cloud Services Revenue | Azure, AWS resale |
| 250 | Consulting Revenue | Advisory services |

## Related Commands

- `/search-contacts` - Find a contact before creating an invoice
- `/payment-status` - Check payment status after invoice is sent
- `/reconciliation-summary` - Verify all clients have been billed
