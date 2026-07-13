---
name: "Xero Invoices"
description: >
  Use this skill when working with Xero invoices - creating, searching,
  updating, voiding, and managing sales invoices (ACCREC) and supplier
  bills (ACCPAY). Covers invoice lifecycle, line items, tax handling,
  recurring managed services billing, and MSP invoice workflows.
when_to_use: >-
  When creating, searching, updating, voiding, and managing sales invoices (ACCREC) and supplier
  bills (ACCPAY). Use when: xero invoice, xero bill, xero billing, xero accrec, xero accpay,
  create invoice, sales invoice, managed services invoice, monthly billing, or invoice management.
---

# Xero Invoices Management

## Overview

Invoices are the core transaction entity in Xero for billing and accounts payable. For MSPs, invoices represent two primary flows: sales invoices (ACCREC) for billing managed services clients, and supplier bills (ACCPAY) for vendor costs like software licenses, hardware purchases, and ISP charges.

## Core Concepts

### Invoice Types

| Type | Code | Description | MSP Use Case |
|------|------|-------------|-------------|
| Sales Invoice | `ACCREC` | Accounts Receivable - you bill a customer | Monthly managed services, project work |
| Supplier Bill | `ACCPAY` | Accounts Payable - a vendor bills you | Software licenses, hardware, ISP bills |

### Invoice Status Lifecycle

```
DRAFT --> SUBMITTED --> AUTHORISED --> PAID
                                  \--> VOIDED
                                  \--> DELETED (draft only)
```

| Status | Description | Editable | Can Pay |
|--------|-------------|----------|---------|
| `DRAFT` | Created but not submitted | Yes | No |
| `SUBMITTED` | Submitted for approval | Limited | No |
| `AUTHORISED` | Approved and sent to client | No | Yes |
| `PAID` | Fully paid | No | N/A |
| `VOIDED` | Cancelled/voided | No | No |
| `DELETED` | Removed (draft only) | N/A | N/A |

### Invoice Numbering

Xero auto-generates sequential invoice numbers (e.g., INV-0001, INV-0002) or you can set custom numbers using the `InvoiceNumber` field. MSPs often use prefixes like `MS-` for managed services or `PJ-` for project invoices.

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `InvoiceID` | string (UUID) | System | Auto-generated unique identifier |
| `InvoiceNumber` | string | No | Invoice number (auto-generated if blank) |
| `Type` | string | Yes | ACCREC (sales) or ACCPAY (bill) |
| `Contact` | object | Yes | Contact object with ContactID |
| `Date` | string | No | Invoice date (YYYY-MM-DDT00:00:00) |
| `DueDate` | string | No | Payment due date |
| `Status` | string | No | DRAFT, SUBMITTED, AUTHORISED, PAID, VOIDED |
| `LineAmountTypes` | string | No | Exclusive, Inclusive, or NoTax |
| `Reference` | string | No | Reference text (e.g., PO number) |
| `Url` | string | No | URL link for the invoice |
| `CurrencyCode` | string | No | Currency code (e.g., USD, AUD) |
| `BrandingThemeID` | string | No | Invoice template/theme ID |

### Line Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Description` | string | Yes | Line item description |
| `Quantity` | decimal | No | Quantity (default 1) |
| `UnitAmount` | decimal | Yes* | Price per unit |
| `AccountCode` | string | Yes* | GL account code |
| `TaxType` | string | No | Tax type code |
| `ItemCode` | string | No | Inventory item code |
| `LineAmount` | decimal | No | Total line amount (calculated) |
| `DiscountRate` | decimal | No | Discount percentage |
| `Tracking` | array | No | Tracking category assignments |

*Required for AUTHORISED status.

### Financial Summary Fields (Read-Only)

| Field | Type | Description |
|-------|------|-------------|
| `SubTotal` | decimal | Sum of line items before tax |
| `TotalTax` | decimal | Total tax amount |
| `Total` | decimal | Total including tax |
| `AmountDue` | decimal | Remaining unpaid amount |
| `AmountPaid` | decimal | Amount already paid |
| `AmountCredited` | decimal | Amount from credit notes |
| `HasAttachments` | boolean | Whether attachments exist |
| `Payments` | array | Associated payment records |

## API Patterns

### List Invoices

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**With Filters:**

```bash
# Sales invoices only
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Type==%22ACCREC%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Outstanding invoices
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Type==%22ACCREC%22&&AmountDue>0" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Invoices for a specific contact
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Contact.ContactID==guid(%22${CONTACT_ID}%22)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Invoices by date range
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Date>=DateTime(2026,3,1)&&Date<=DateTime(2026,3,31)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Overdue invoices
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Type==%22ACCREC%22&&Status==%22AUTHORISED%22&&DueDate<DateTime(2026,2,23)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

### Get Single Invoice

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices/${INVOICE_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

### Create Sales Invoice (ACCREC)

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Type": "ACCREC",
    "Contact": {
      "ContactID": "'${CONTACT_ID}'"
    },
    "Date": "2026-03-01T00:00:00",
    "DueDate": "2026-03-31T00:00:00",
    "LineAmountTypes": "Exclusive",
    "Reference": "March 2026 Managed Services",
    "LineItems": [
      {
        "Description": "Monthly Managed Services - Acme Corp (25 endpoints)",
        "Quantity": 1,
        "UnitAmount": 2500.00,
        "AccountCode": "200",
        "TaxType": "OUTPUT"
      },
      {
        "Description": "Microsoft 365 Business Premium Licenses (25 users)",
        "Quantity": 25,
        "UnitAmount": 22.00,
        "AccountCode": "200",
        "TaxType": "OUTPUT"
      },
      {
        "Description": "Backup & Disaster Recovery - 500GB",
        "Quantity": 1,
        "UnitAmount": 350.00,
        "AccountCode": "200",
        "TaxType": "OUTPUT"
      }
    ],
    "Status": "DRAFT"
  }'
```

### Create Supplier Bill (ACCPAY)

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Type": "ACCPAY",
    "Contact": {
      "ContactID": "'${VENDOR_CONTACT_ID}'"
    },
    "Date": "2026-03-01T00:00:00",
    "DueDate": "2026-03-31T00:00:00",
    "InvoiceNumber": "VENDOR-INV-2026-03",
    "Reference": "Monthly software licenses",
    "LineAmountTypes": "Exclusive",
    "LineItems": [
      {
        "Description": "RMM Platform - 150 endpoints",
        "Quantity": 150,
        "UnitAmount": 3.50,
        "AccountCode": "400",
        "TaxType": "INPUT"
      }
    ],
    "Status": "DRAFT"
  }'
```

### Update Invoice

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices/${INVOICE_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "InvoiceID": "'${INVOICE_ID}'",
    "Reference": "Updated reference",
    "Status": "AUTHORISED"
  }'
```

### Void Invoice

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices/${INVOICE_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "InvoiceID": "'${INVOICE_ID}'",
    "Status": "VOIDED"
  }'
```

### Batch Create Invoices

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices?summarizeErrors=false" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Invoices": [
      {
        "Type": "ACCREC",
        "Contact": { "ContactID": "abc-123" },
        "Date": "2026-03-01T00:00:00",
        "DueDate": "2026-03-31T00:00:00",
        "LineItems": [{ "Description": "Managed Services - March 2026", "Quantity": 1, "UnitAmount": 2500.00, "AccountCode": "200" }]
      },
      {
        "Type": "ACCREC",
        "Contact": { "ContactID": "def-456" },
        "Date": "2026-03-01T00:00:00",
        "DueDate": "2026-03-31T00:00:00",
        "LineItems": [{ "Description": "Managed Services - March 2026", "Quantity": 1, "UnitAmount": 1800.00, "AccountCode": "200" }]
      }
    ]
  }'
```

## Common Workflows

### Monthly MSP Billing Cycle

The typical MSP monthly billing workflow:

1. **Generate invoices** for all managed services clients (1st of the month)
2. **Review drafts** for accuracy
3. **Authorize invoices** to finalize
4. **Email invoices** to clients
5. **Track payments** as they arrive
6. **Follow up** on overdue invoices

```javascript
async function generateMonthlyInvoices(clients, billingMonth) {
  const invoices = clients.map(client => ({
    Type: 'ACCREC',
    Contact: { ContactID: client.xeroContactId },
    Date: `${billingMonth}-01T00:00:00`,
    DueDate: `${billingMonth}-28T00:00:00`,
    Reference: `${billingMonth} Managed Services`,
    LineAmountTypes: 'Exclusive',
    LineItems: client.services.map(service => ({
      Description: `${service.name} - ${billingMonth}`,
      Quantity: service.quantity,
      UnitAmount: service.unitPrice,
      AccountCode: service.accountCode || '200'
    })),
    Status: 'DRAFT'
  }));

  const token = await auth.getToken();
  const response = await fetch(
    'https://api.xero.com/api.xro/2.0/Invoices?summarizeErrors=false',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'xero-tenant-id': process.env.XERO_TENANT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Invoices: invoices })
    }
  );

  return await response.json();
}
```

### Invoice with Tracking Categories

Use tracking categories for department or project reporting:

```json
{
  "Type": "ACCREC",
  "Contact": { "ContactID": "abc-123" },
  "LineItems": [
    {
      "Description": "Managed Services - March 2026",
      "Quantity": 1,
      "UnitAmount": 2500.00,
      "AccountCode": "200",
      "Tracking": [
        {
          "Name": "Department",
          "Option": "Managed Services"
        },
        {
          "Name": "Region",
          "Option": "East"
        }
      ]
    }
  ]
}
```

### Credit Note for Service Adjustment

When a client needs a partial credit:

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/CreditNotes" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Type": "ACCRECCREDIT",
    "Contact": { "ContactID": "'${CONTACT_ID}'" },
    "Date": "2026-03-15T00:00:00",
    "LineItems": [
      {
        "Description": "Service credit - 3 day outage adjustment",
        "Quantity": 1,
        "UnitAmount": 250.00,
        "AccountCode": "200"
      }
    ],
    "Status": "AUTHORISED"
  }'
```

### Find Unbilled Clients

```javascript
async function findUnbilledClients(billingMonth) {
  const allContacts = await fetchActiveCustomers();
  const invoices = await fetchInvoicesByDateRange(
    `${billingMonth}-01`,
    `${billingMonth}-28`
  );

  const billedContactIds = new Set(
    invoices
      .filter(inv => inv.Type === 'ACCREC')
      .map(inv => inv.Contact.ContactID)
  );

  return allContacts.filter(
    contact => !billedContactIds.has(contact.ContactID)
  );
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Account code is not valid | Verify AccountCode exists in chart of accounts |
| 400 | A Contact is required | Provide Contact with valid ContactID |
| 400 | At least one line item is required | Add LineItems array with entries |
| 400 | Invoice number already used | Use unique InvoiceNumber or omit for auto |
| 400 | Cannot void a paid invoice | Reverse payment first, then void |
| 401 | Unauthorized | Refresh access token |
| 404 | Invoice not found | Verify InvoiceID |

### Validation Errors

Xero returns validation errors inline with the invoice object:

```json
{
  "Invoices": [
    {
      "InvoiceID": "00000000-0000-0000-0000-000000000000",
      "HasErrors": true,
      "ValidationErrors": [
        { "Message": "Account code '999' is not a valid code for this document." }
      ]
    }
  ]
}
```

### Error Recovery Pattern

```javascript
async function safeCreateInvoice(invoiceData) {
  const result = await createInvoice(invoiceData);
  const invoice = result.Invoices?.[0];

  if (invoice?.HasErrors) {
    const errors = invoice.ValidationErrors.map(e => e.Message);
    console.error('Invoice validation failed:', errors);

    // Common recovery: invalid account code
    if (errors.some(e => e.includes('Account code'))) {
      console.log('Check chart of accounts for valid codes.');
    }

    // Common recovery: duplicate invoice number
    if (errors.some(e => e.includes('already used'))) {
      delete invoiceData.InvoiceNumber;
      return await createInvoice(invoiceData);
    }

    throw new Error(`Validation errors: ${errors.join('; ')}`);
  }

  return invoice;
}
```

## Endpoint Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Invoices` | GET | List invoices (paginated, filterable) |
| `/Invoices` | POST | Create or update invoices (single or batch) |
| `/Invoices/{InvoiceID}` | GET | Get single invoice with full detail |
| `/Invoices/{InvoiceID}` | POST | Update an invoice |
| `/Invoices/{InvoiceID}/Attachments` | GET | List invoice attachments |
| `/Invoices/{InvoiceID}/Attachments/{FileName}` | PUT | Upload attachment |
| `/Invoices/{InvoiceID}/OnlineInvoice` | GET | Get online invoice URL |
| `/Invoices/{InvoiceID}/Email` | POST | Email invoice to contact |

## Best Practices

1. **Use DRAFT status initially** - Review before authorizing to prevent errors
2. **Batch create monthly invoices** - Use batch endpoint to reduce API calls
3. **Set meaningful references** - Include month/year and service description
4. **Use consistent account codes** - Map MSP service categories to GL accounts
5. **Include line item detail** - Break out services, licenses, and add-ons separately
6. **Track by department** - Use tracking categories for service line reporting
7. **Void instead of delete** - Maintain audit trail for authorized invoices
8. **Use summarizeErrors=false** - Get per-invoice error details in batch operations
9. **Verify contacts exist** - Check ContactID before creating invoices
10. **Automate recurring billing** - Build monthly generation scripts for consistency

## Related Skills

- [Xero Contacts](../contacts/SKILL.md) - Managing invoice recipients
- [Xero Payments](../payments/SKILL.md) - Recording payments against invoices
- [Xero Accounts](../accounts/SKILL.md) - GL account codes for line items
- [Xero Reports](../reports/SKILL.md) - Financial reporting on invoices
- [Xero API Patterns](../api-patterns/SKILL.md) - API reference
