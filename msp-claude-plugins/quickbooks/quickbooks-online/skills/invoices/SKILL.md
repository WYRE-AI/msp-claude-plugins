---
name: "QuickBooks Online Invoices"
description: >
  Use this skill when working with QuickBooks Online invoices -
  creating, sending, voiding, and managing invoices for MSP clients.
  Covers line items, service items, recurring invoices, payment terms,
  email delivery, invoice numbering, and MSP billing patterns like
  monthly managed services and project-based billing.
when_to_use: >-
  When creating, sending, voiding, and managing invoices for MSP clients. Use when: quickbooks
  invoice, qbo invoice, quickbooks billing, qbo billing, create invoice, send invoice, invoice
  management, managed services invoice, monthly billing, or recurring invoice.
---

# QuickBooks Online Invoice Management

## Overview

Invoices are the primary billing mechanism in QuickBooks Online. For MSPs, invoices typically represent monthly managed services fees, project work, hardware procurement, or ad-hoc support. QBO supports line items with service/product references, automatic tax calculation, email delivery, payment links, and integration with online payment processing. Invoices track due dates via payment terms and automatically contribute to the customer's outstanding balance.

## Key Concepts

### Invoice Lifecycle

| Status | Description | Balance Impact |
|--------|-------------|----------------|
| Draft | Not yet sent | Adds to balance |
| Sent | Emailed to customer | Adds to balance |
| Partially Paid | Some payment applied | Reduced balance |
| Paid | Fully paid | Zero balance |
| Voided | Cancelled | Removed from balance |
| Overdue | Past due date | Adds to balance (flagged) |

### Line Items

Each invoice contains one or more line items. Line items reference Items (products/services) from the QBO Items list:

| Line Type | Description | MSP Example |
|-----------|-------------|-------------|
| `SalesItemLineDetail` | Standard product/service line | Monthly IT services |
| `GroupLineDetail` | Grouped bundle of items | Managed services bundle |
| `DescriptionOnlyLine` | Text-only description line | Section headers |
| `DiscountLineDetail` | Discount applied | Multi-year contract discount |
| `SubTotalLineDetail` | Running subtotal | Subtotal before tax |

### MSP Invoice Types

| Type | Frequency | Description |
|------|-----------|-------------|
| Recurring Monthly | Monthly | Managed services, monitoring, backup |
| Project-Based | One-time | Network upgrade, migration, deployment |
| Time & Materials | As incurred | Break-fix support, consulting hours |
| Hardware | One-time | Equipment procurement and markup |

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `DocNumber` | string | No | Invoice number (auto-generated if blank) |
| `TxnDate` | date | No | Invoice date (default: today) |
| `DueDate` | date | No | Payment due date (calculated from terms) |
| `CustomerRef.value` | string | Yes | Customer ID |
| `Line` | array | Yes | Array of line items |
| `TotalAmt` | decimal | Read-only | Total invoice amount |
| `Balance` | decimal | Read-only | Remaining unpaid balance |
| `SyncToken` | string | Required for updates | Optimistic locking token |

### Billing Fields

| Field | Type | Description |
|-------|------|-------------|
| `SalesTermRef.value` | string | Payment terms ID |
| `BillEmail.Address` | string | Email to send invoice to |
| `BillAddr` | object | Billing address |
| `ShipAddr` | object | Shipping address |
| `CustomerMemo.value` | string | Memo visible to customer |
| `PrivateNote` | string | Internal note (not visible to customer) |
| `EmailStatus` | string | "NotSet", "NeedToSend", "EmailSent" |

### Line Item Fields (SalesItemLineDetail)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Line.Amount` | decimal | Yes | Line total (Qty x Rate) |
| `Line.Description` | string | No | Line item description |
| `Line.DetailType` | string | Yes | "SalesItemLineDetail" |
| `Line.SalesItemLineDetail.ItemRef.value` | string | Yes | Item ID |
| `Line.SalesItemLineDetail.Qty` | decimal | No | Quantity |
| `Line.SalesItemLineDetail.UnitPrice` | decimal | No | Unit price |
| `Line.SalesItemLineDetail.ServiceDate` | date | No | Service date |

### Tax Fields

| Field | Type | Description |
|-------|------|-------------|
| `TxnTaxDetail.TotalTax` | decimal | Total tax amount |
| `TxnTaxDetail.TxnTaxCodeRef.value` | string | Tax code ID |
| `GlobalTaxCalculation` | string | "TaxExcluded", "TaxInclusive", "NotApplicable" |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `MetaData.CreateTime` | datetime | Creation timestamp |
| `MetaData.LastUpdatedTime` | datetime | Last update timestamp |

## API Patterns

### Query Invoices

```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Invoice WHERE CustomerRef = '123' AND Balance > '0'&minorversion=73
Authorization: Bearer {access_token}
Accept: application/json
```

**Common Queries:**

```sql
-- Unpaid invoices for a customer
SELECT * FROM Invoice WHERE CustomerRef = '123' AND Balance > '0'

-- All invoices in a date range
SELECT * FROM Invoice WHERE TxnDate >= '2026-01-01' AND TxnDate <= '2026-01-31' ORDERBY TxnDate DESC

-- Overdue invoices (past due date with balance)
SELECT * FROM Invoice WHERE DueDate < '2026-02-23' AND Balance > '0' ORDERBY DueDate ASC

-- Recent invoices
SELECT * FROM Invoice ORDERBY TxnDate DESC MAXRESULTS 25

-- Invoices by doc number
SELECT * FROM Invoice WHERE DocNumber = 'INV-1042'
```

### Get Single Invoice

```http
GET /v3/company/{realmId}/invoice/456?minorversion=73
Authorization: Bearer {access_token}
```

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/invoice/456?minorversion=73"
```

### Create Invoice

```http
POST /v3/company/{realmId}/invoice?minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Monthly Managed Services Invoice:**

```json
{
  "CustomerRef": {
    "value": "123"
  },
  "TxnDate": "2026-02-01",
  "SalesTermRef": {
    "value": "3"
  },
  "BillEmail": {
    "Address": "billing@acmecorp.com"
  },
  "EmailStatus": "NeedToSend",
  "Line": [
    {
      "Amount": 2500.00,
      "Description": "Monthly Managed IT Services - February 2026\nIncludes: 24/7 monitoring, patch management, help desk support (unlimited)",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "1" },
        "Qty": 1,
        "UnitPrice": 2500.00,
        "ServiceDate": "2026-02-01"
      }
    },
    {
      "Amount": 150.00,
      "Description": "Cloud Backup Service - 500GB - February 2026",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "2" },
        "Qty": 1,
        "UnitPrice": 150.00,
        "ServiceDate": "2026-02-01"
      }
    },
    {
      "Amount": 200.00,
      "Description": "Email Security Filtering - 50 mailboxes - February 2026",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "3" },
        "Qty": 50,
        "UnitPrice": 4.00,
        "ServiceDate": "2026-02-01"
      }
    }
  ],
  "CustomerMemo": {
    "value": "Thank you for choosing our managed IT services."
  },
  "PrivateNote": "Monthly recurring invoice - auto-generated"
}
```

```bash
curl -s -X POST \
  -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/invoice?minorversion=73" \
  -d '{
    "CustomerRef": { "value": "123" },
    "Line": [{
      "Amount": 2500.00,
      "Description": "Monthly Managed IT Services - February 2026",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "1" },
        "Qty": 1,
        "UnitPrice": 2500.00
      }
    }]
  }'
```

### Send Invoice via Email

```http
POST /v3/company/{realmId}/invoice/456/send?minorversion=73
Authorization: Bearer {access_token}
```

```bash
curl -s -X POST \
  -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/invoice/456/send?sendTo=billing@acmecorp.com&minorversion=73"
```

### Update Invoice (Sparse)

```json
{
  "Id": "456",
  "SyncToken": "3",
  "sparse": true,
  "CustomerMemo": {
    "value": "Payment is now overdue. Please remit immediately."
  }
}
```

### Void Invoice

```http
POST /v3/company/{realmId}/invoice?operation=void&minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "Id": "456",
  "SyncToken": "3"
}
```

### Delete Invoice

```http
POST /v3/company/{realmId}/invoice?operation=delete&minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "Id": "456",
  "SyncToken": "3"
}
```

### Get Invoice as PDF

```http
GET /v3/company/{realmId}/invoice/456/pdf?minorversion=73
Authorization: Bearer {access_token}
Accept: application/pdf
```

## Common Workflows

### Monthly MSP Billing Cycle

```javascript
async function generateMonthlyInvoices(billingMonth) {
  // Fetch all active MSP clients
  const customers = await qboQuery(
    "SELECT * FROM Customer WHERE Active = true AND Balance >= '0'"
  );
  const clients = customers.QueryResponse.Customer || [];

  const results = { created: [], errors: [] };

  for (const client of clients) {
    try {
      // Build line items from client's service agreement
      const lines = await buildServiceLines(client.Id, billingMonth);
      if (lines.length === 0) continue;

      const invoice = await createInvoice({
        CustomerRef: { value: client.Id },
        TxnDate: billingMonth + '-01',
        BillEmail: { Address: client.PrimaryEmailAddr?.Address },
        EmailStatus: 'NeedToSend',
        Line: lines,
        CustomerMemo: {
          value: `Services for ${billingMonth}. Thank you for your business.`
        }
      });

      results.created.push({
        customer: client.DisplayName,
        invoiceId: invoice.Id,
        total: invoice.TotalAmt
      });
    } catch (error) {
      results.errors.push({
        customer: client.DisplayName,
        error: error.message
      });
    }
  }

  return results;
}
```

### Project Invoice

```javascript
async function createProjectInvoice(customerId, projectDetails) {
  const lines = projectDetails.tasks.map(task => ({
    Amount: task.hours * task.rate,
    Description: `${task.description}\n${task.hours} hours @ $${task.rate}/hr`,
    DetailType: 'SalesItemLineDetail',
    SalesItemLineDetail: {
      ItemRef: { value: task.itemId },
      Qty: task.hours,
      UnitPrice: task.rate,
      ServiceDate: task.date
    }
  }));

  return await createInvoice({
    CustomerRef: { value: customerId },
    Line: lines,
    CustomerMemo: {
      value: `Project: ${projectDetails.name}\nWork completed ${projectDetails.startDate} - ${projectDetails.endDate}`
    },
    PrivateNote: `PSA Ticket: ${projectDetails.ticketNumber}`
  });
}
```

### Batch Send Unsent Invoices

```javascript
async function sendUnsentInvoices() {
  const unsent = await qboQuery(
    "SELECT * FROM Invoice WHERE EmailStatus = 'NeedToSend' AND Balance > '0'"
  );
  const invoices = unsent.QueryResponse.Invoice || [];

  for (const invoice of invoices) {
    const email = invoice.BillEmail?.Address;
    if (email) {
      await sendInvoice(invoice.Id, email);
    }
  }

  return { sent: invoices.length };
}
```

### Overdue Invoice Follow-Up

```javascript
async function getOverdueInvoices() {
  const today = new Date().toISOString().split('T')[0];
  const result = await qboQuery(
    `SELECT * FROM Invoice WHERE DueDate < '${today}' AND Balance > '0' ORDERBY DueDate ASC`
  );
  const invoices = result.QueryResponse.Invoice || [];

  return invoices.map(inv => ({
    invoiceNumber: inv.DocNumber,
    customer: inv.CustomerRef.name,
    amount: inv.TotalAmt,
    balance: inv.Balance,
    dueDate: inv.DueDate,
    daysOverdue: Math.floor((Date.now() - new Date(inv.DueDate)) / 86400000)
  }));
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 6000 | Business Validation | Check line item amounts and required fields |
| 6140 | Duplicate DocNumber | Use a different invoice number or let QBO auto-assign |
| 610 | Object Not Found | Verify CustomerRef, ItemRef, or Invoice ID |
| 5010 | Stale Object | Re-fetch SyncToken and retry |
| 2050 | Invalid Reference | Check CustomerRef, ItemRef, SalesTermRef values |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| CustomerRef required | Missing customer | Add CustomerRef.value to request |
| Line required | No line items | Add at least one Line item |
| Invalid ItemRef | Bad item ID | Query Items for valid IDs |
| Amount mismatch | Qty x UnitPrice != Amount | Ensure Amount = Qty * UnitPrice |

### Error Recovery Pattern

```javascript
async function safeCreateInvoice(data) {
  try {
    return await createInvoice(data);
  } catch (error) {
    const fault = error.Fault;
    if (!fault) throw error;

    const errorCode = fault.Error?.[0]?.code;

    if (errorCode === '6140') {
      // Duplicate DocNumber -- remove and let QBO auto-assign
      delete data.DocNumber;
      return await createInvoice(data);
    }

    if (errorCode === '610') {
      // Invalid reference -- log details for debugging
      console.log('Invalid reference. Verify CustomerRef and ItemRef values.');
      console.log('Detail:', fault.Error[0].Detail);
    }

    throw error;
  }
}
```

## Best Practices

1. **Use service items** - Create Items for each MSP service (monitoring, backup, help desk)
2. **Include service dates** - Set ServiceDate on line items for accurate revenue recognition
3. **Set EmailStatus** - Use "NeedToSend" for automatic email queuing
4. **Include descriptions** - Detailed line descriptions help clients understand charges
5. **Use payment terms** - Set SalesTermRef to calculate due dates automatically
6. **Track by sub-customer** - Invoice sub-customers for per-service-line reporting
7. **Add CustomerMemo** - Include helpful notes visible on the invoice
8. **Use PrivateNote** - Store internal references (PSA ticket numbers, project codes)
9. **Void instead of delete** - Voiding preserves audit trail
10. **Batch monthly invoicing** - Generate all monthly invoices in a single workflow

## Endpoint Reference

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create | POST | `/v3/company/{realmId}/invoice` |
| Read | GET | `/v3/company/{realmId}/invoice/{id}` |
| Update | POST | `/v3/company/{realmId}/invoice` |
| Delete | POST | `/v3/company/{realmId}/invoice?operation=delete` |
| Void | POST | `/v3/company/{realmId}/invoice?operation=void` |
| Send | POST | `/v3/company/{realmId}/invoice/{id}/send` |
| PDF | GET | `/v3/company/{realmId}/invoice/{id}/pdf` |
| Query | GET | `/v3/company/{realmId}/query?query=...` |

## Related Skills

- [QBO Customers](../customers/SKILL.md) - Customer management
- [QBO Payments](../payments/SKILL.md) - Payment application to invoices
- [QBO Reports](../reports/SKILL.md) - A/R Aging and revenue reports
- [QBO API Patterns](../api-patterns/SKILL.md) - API reference
