---
name: "QuickBooks Online Invoices"
description: >
  QuickBooks Online Invoice entity: invoice lifecycle and statuses, line item
  detail types, service items, payment terms, email delivery and PDF retrieval,
  invoice numbering, void vs delete semantics, query syntax, error codes, and
  MSP billing patterns such as monthly managed services, project, and
  time-and-materials invoicing.
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

### Key Fields

`CustomerRef.value` and `Line` are the only required fields on create. `TotalAmt`
and `Balance` are read-only. `SyncToken` is required on every update, void, and
delete. `EmailStatus` ("NotSet", "NeedToSend", "EmailSent") drives email queuing,
and `SalesTermRef.value` drives automatic `DueDate` calculation.

See [references/fields.md](references/fields.md) for the complete field reference.

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

### Create Invoice

```http
POST /v3/company/{realmId}/invoice?minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

Minimal body — one line item, QBO assigns `DocNumber` and computes `TotalAmt`:

```json
{
  "CustomerRef": { "value": "123" },
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
  }]
}
```

See [references/examples.md](references/examples.md) for the full multi-line
managed-services request body and curl equivalents.

### Send Invoice via Email

```http
POST /v3/company/{realmId}/invoice/456/send?sendTo=billing@acmecorp.com&minorversion=73
Content-Type: application/octet-stream
Authorization: Bearer {access_token}
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

- **Amount must equal Qty x UnitPrice.** QBO rejects the line otherwise rather
  than recalculating it.
- **6140 Duplicate DocNumber.** Drop `DocNumber` from the payload and let QBO
  auto-assign rather than guessing the next number.
- **5010 Stale Object.** `SyncToken` is per-record and increments on every write;
  re-fetch the invoice and retry with the fresh token.
- **610 Object Not Found** on create usually means a bad `ItemRef` or
  `CustomerRef`, not a bad invoice ID — the message does not say which.

See [references/errors.md](references/errors.md) for the full error-code and
validation tables plus a recovery pattern.

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

See [references/api.md](references/api.md) for the complete endpoint reference.

## Related Skills

- [QBO Customers](../customers/SKILL.md) - Customer management
- [QBO Payments](../payments/SKILL.md) - Payment application to invoices
- [QBO Reports](../reports/SKILL.md) - A/R Aging and revenue reports
- [QBO API Patterns](../api-patterns/SKILL.md) - API reference
