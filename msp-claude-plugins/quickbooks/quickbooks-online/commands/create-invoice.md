---
description: Create an invoice for a client's managed services in QuickBooks Online
argument-hint: "<customer> <line> <amount> [qty] [item] [date] [send] [memo]"
arguments: [customer, line, amount, qty, item, date, send, memo]
---

# Create QuickBooks Online Invoice

Create an invoice for a managed services client in QuickBooks Online.

## Prerequisites

- Valid QBO OAuth2 token (`QBO_ACCESS_TOKEN`)
- Company ID configured (`QBO_REALM_ID`)
- Customer must exist in QuickBooks Online
- At least one service Item must exist in QBO

## Steps

1. **Resolve customer**
   - Search for customer by name or ID
   - Verify customer is active
   - Retrieve billing email and payment terms

2. **Resolve service item**
   - Look up Item by name or ID (if provided)
   - Use default managed services item if not specified

3. **Build invoice**
   - Set CustomerRef, TxnDate, line items
   - Apply customer's default payment terms
   - Set billing email for delivery

4. **Create invoice via API**
   - POST to `/v3/company/{realmId}/invoice`
   - Validate response

5. **Send invoice (optional)**
   - If `--send` is true, send via email
   - POST to `/v3/company/{realmId}/invoice/{id}/send`

6. **Display results**
   - Show invoice number, total, due date
   - Provide link to view in QBO

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| customer | string | Yes | - | Customer name or QBO ID |
| line | string | Yes | - | Line item description |
| amount | number | Yes | - | Line item amount ($) |
| qty | number | No | 1 | Quantity |
| item | string | No | - | Service item name or ID |
| date | string | No | today | Invoice date (YYYY-MM-DD) |
| send | boolean | No | false | Email invoice after creation |
| memo | string | No | - | Customer-visible memo |

## Examples

### Basic Monthly Invoice

```
/create-invoice --customer "Acme Corp" --line "Monthly Managed IT Services - February 2026" --amount 2500
```

### Invoice with Multiple Details

```
/create-invoice --customer "Acme Corp" --line "Monthly Managed IT Services" --amount 2500 --date 2026-02-01 --memo "Thank you for your business." --send true
```

### Hardware Invoice

```
/create-invoice --customer "TechStart Inc" --line "Dell OptiPlex 7020 Workstation" --amount 1200 --qty 5 --item "Hardware"
```

### Per-Seat Service Invoice

```
/create-invoice --customer "Acme Corp" --line "Email Security Filtering" --amount 4.00 --qty 50 --item "Email Security"
```

## API Calls

### Step 1: Find Customer

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT%20*%20FROM%20Customer%20WHERE%20DisplayName%20LIKE%20'%25Acme%25'&minorversion=73"
```

### Step 2: Find Service Item (optional)

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT%20*%20FROM%20Item%20WHERE%20Name%20LIKE%20'%25Managed%25'&minorversion=73"
```

### Step 3: Create Invoice

```bash
curl -s -X POST \
  -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/invoice?minorversion=73" \
  -d '{
    "CustomerRef": { "value": "123" },
    "TxnDate": "2026-02-01",
    "BillEmail": { "Address": "billing@acmecorp.com" },
    "Line": [{
      "Amount": 2500.00,
      "Description": "Monthly Managed IT Services - February 2026",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "1" },
        "Qty": 1,
        "UnitPrice": 2500.00,
        "ServiceDate": "2026-02-01"
      }
    }],
    "CustomerMemo": { "value": "Thank you for your business." }
  }'
```

### Step 4: Send Invoice (if --send true)

```bash
curl -s -X POST \
  -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/invoice/456/send?sendTo=billing@acmecorp.com&minorversion=73"
```

## Output

### Success

```
Invoice created successfully.

Invoice: INV-1042
================================================================
Customer:    Acme Corporation
Date:        2026-02-01
Due Date:    2026-03-03 (Net 30)

Line Items:
  Monthly Managed IT Services - February 2026
    1 x $2,500.00 = $2,500.00

Subtotal:    $2,500.00
Tax:         $0.00
Total:       $2,500.00

Status:      Created
Email:       Sent to billing@acmecorp.com
================================================================

Quick Actions:
  - View in QBO: https://app.qbo.intuit.com/...
  - Send invoice: /create-invoice ... --send true
  - Get balance: /get-balance --customer "Acme Corp"
```

### Multiple Line Items

```
Invoice: INV-1043
================================================================
Customer:    Acme Corporation
Date:        2026-02-01
Due Date:    2026-03-03 (Net 30)

Line Items:
  Monthly Managed IT Services - February 2026
    1 x $2,500.00 = $2,500.00
  Cloud Backup Service - 500GB
    1 x $150.00   = $150.00
  Email Security Filtering - 50 mailboxes
    50 x $4.00    = $200.00

Subtotal:    $2,850.00
Tax:         $0.00
Total:       $2,850.00
================================================================
```

## Error Handling

### Customer Not Found

```
Error: Customer not found.

No customer matching "XYZ Corp" was found.

Suggestions:
  - Check spelling of the customer name
  - Search for existing customers: /search-customers "XYZ"
  - Create the customer in QBO first

Example:
  /search-customers "XYZ"
```

### Item Not Found

```
Error: Service item not found.

No item matching "Backup Service" was found.

Suggestions:
  - Check the item name in QuickBooks Online
  - Create the item in QBO Items list
  - Omit --item to use the default service item
```

### Authentication Error

```
Error: Authentication failed.

Your QuickBooks Online access token has expired.

Resolution:
  1. Refresh the token using QBO_REFRESH_TOKEN
  2. Update QBO_ACCESS_TOKEN environment variable
  3. Retry the command
```

### Duplicate Invoice

```
Warning: Similar invoice may already exist.

An invoice for Acme Corporation dated 2026-02-01 for $2,500.00 already exists (INV-1040).

Options:
  - Proceed anyway (invoices are not deduplicated in QBO)
  - Review existing invoice first
  - Change the date or amount
```

## Related Commands

- `/search-customers` - Find customers before invoicing
- `/get-balance` - View outstanding balances after invoicing
- `/expense-summary` - Review costs before setting invoice amounts
