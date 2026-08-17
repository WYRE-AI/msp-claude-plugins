---
name: "Syncro Invoices"
description: >
  Syncro MSP invoices: invoice fields, line items, payment processing, and
  billing workflows.
when_to_use: >-
  When creating, managing, or tracking Syncro invoices and payments. Use
  when: syncro invoice, syncro billing, syncro payment, invoice management
  syncro, line item syncro, syncro accounting, customer billing syncro,
  payment processing syncro, or invoice search syncro.
---

# Syncro MSP Invoice Management

## Overview

Syncro invoices are the core of your billing workflow. Invoices can be created manually, generated from tickets, or produced automatically from recurring contracts. This skill covers invoice creation, line item management, payment processing, and billing workflows.

## Anti-triggers

- **The invoice in the accounting system** — Syncro usually sits
  upstream of QuickBooks or Xero and the same invoice exists in both.
  Raising or editing it on the ledger side is
  `qbo-invoices` or `xero-invoices`; doing it in the wrong
  place produces two versions of one document.
- **Recording the payment against the ledger** — Syncro marks its own
  invoice paid; the accounting entry is `qbo-payments` or
  `xero-payments`.
- **The unbilled work behind an invoice** — ticket timers and time
  entries are `syncro-tickets`.

## Key Concepts

### Invoice

A billing document sent to customers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Unique identifier |
| `number` | string | System | Invoice number |
| `customer_id` | integer | Yes | Billing customer |
| `date` | date | Yes | Invoice date |
| `due_date` | date | No | Payment due date |
| `status` | string | Yes | Invoice status |
| `subtotal` | decimal | System | Sum of line items |
| `tax` | decimal | System | Calculated tax |
| `total` | decimal | System | Final amount due |
| `balance` | decimal | System | Remaining balance |
| `notes` | text | No | Invoice notes |
| `terms` | text | No | Payment terms |

### Invoice Status Values

| Status | Description |
|--------|-------------|
| **Draft** | Not yet sent to customer |
| **Sent** | Emailed to customer |
| **Viewed** | Customer has viewed |
| **Partial** | Partially paid |
| **Paid** | Fully paid |
| **Void** | Cancelled/voided |

### Line Item

Individual billable items on an invoice.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Unique identifier |
| `invoice_id` | integer | Yes | Parent invoice |
| `product_id` | integer | No | Product/service reference |
| `name` | string | Yes | Item description |
| `quantity` | decimal | Yes | Quantity |
| `price` | decimal | Yes | Unit price |
| `taxable` | boolean | No | Subject to tax |
| `total` | decimal | System | Line total |

### Payment

Payment received against an invoice.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Unique identifier |
| `invoice_id` | integer | Yes | Associated invoice |
| `amount` | decimal | Yes | Payment amount |
| `payment_method` | string | No | How payment was made |
| `reference` | string | No | Check/transaction number |
| `date` | date | Yes | Payment date |
| `notes` | text | No | Payment notes |

## API Patterns

### Creating an Invoice

```http
POST /api/v1/invoices
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

```json
{
  "customer_id": 12345,
  "date": "2024-02-15",
  "due_date": "2024-03-15",
  "notes": "Thank you for your business!",
  "line_items": [
    {
      "name": "Managed Services - February 2024",
      "quantity": 1,
      "price": 500.00,
      "taxable": true
    },
    {
      "name": "On-site support - 2 hours",
      "quantity": 2,
      "price": 125.00,
      "taxable": true
    }
  ]
}
```

### Searching Invoices

**Invoices for a customer:**
```http
GET /api/v1/invoices?customer_id=12345
```

**Unpaid invoices:**
```http
GET /api/v1/invoices?status=sent
```

**Date range:**
```http
GET /api/v1/invoices?date_from=2024-01-01&date_to=2024-01-31
```

**Paginated listing:**
```http
GET /api/v1/invoices?page=1
```

### Getting Invoice Details

```http
GET /api/v1/invoices/{id}
```

**Response includes:**
- Invoice header information
- Line items
- Payment history
- Customer details

### Updating an Invoice

```http
PUT /api/v1/invoices/{id}
Content-Type: application/json
```

```json
{
  "notes": "Updated payment terms",
  "due_date": "2024-03-30"
}
```

### Adding Line Items

```http
POST /api/v1/invoices/{id}/line_items
Content-Type: application/json
```

```json
{
  "name": "Additional support hours",
  "quantity": 1.5,
  "price": 125.00,
  "taxable": true
}
```

### Sending an Invoice

```http
POST /api/v1/invoices/{id}/email
Content-Type: application/json
```

```json
{
  "to": "billing@acme.example.com",
  "cc": "manager@acme.example.com",
  "subject": "Invoice #1042 from MSP Company",
  "message": "Please find attached your invoice for services rendered."
}
```

### Recording a Payment

```http
POST /api/v1/invoices/{id}/payments
Content-Type: application/json
```

```json
{
  "amount": 750.00,
  "payment_method": "Credit Card",
  "reference": "TXN-12345",
  "date": "2024-02-20",
  "notes": "Paid via online portal"
}
```

### Voiding an Invoice

```http
PUT /api/v1/invoices/{id}
Content-Type: application/json
```

```json
{
  "status": "void"
}
```

## Common Workflows

### Invoice Creation from Ticket

1. **Review ticket time entries**
   - Verify hours are accurate
   - Check billing rates

2. **Create invoice**
   - Associate with customer
   - Set appropriate dates

3. **Add line items**
   - Import from ticket
   - Add any additional charges

4. **Review and send**
   - Check totals
   - Email to customer

### Recurring Invoice Workflow

1. **Set up contract**
   - Define billing frequency
   - Set amount and services

2. **Auto-generate invoices**
   - System creates drafts
   - Review before sending

3. **Send and track**
   - Email to customer
   - Monitor payment status

### Payment Collection

1. **Monitor aging**
   - Review unpaid invoices
   - Identify overdue accounts

2. **Send reminders**
   - Automated or manual
   - Escalate as needed

3. **Record payments**
   - Enter when received
   - Update invoice status

4. **Reconcile**
   - Match to bank deposits
   - Handle partial payments

### Month-End Billing

1. **Review open tickets**
   - Ensure time is entered
   - Close billable tickets

2. **Generate invoices**
   - Create for all customers
   - Include contract charges

3. **Review drafts**
   - Check accuracy
   - Verify line items

4. **Send batch**
   - Email all invoices
   - Log for records

## Response Examples

### Invoice Object

```json
{
  "invoice": {
    "id": 5678,
    "number": "INV-2024-0042",
    "customer_id": 12345,
    "date": "2024-02-15",
    "due_date": "2024-03-15",
    "status": "sent",
    "subtotal": 750.00,
    "tax": 56.25,
    "total": 806.25,
    "balance": 806.25,
    "notes": "Thank you for your business!",
    "created_at": "2024-02-15T10:00:00Z",
    "line_items": [
      {
        "id": 1001,
        "name": "Managed Services - February 2024",
        "quantity": 1,
        "price": 500.00,
        "taxable": true,
        "total": 500.00
      },
      {
        "id": 1002,
        "name": "On-site support - 2 hours",
        "quantity": 2,
        "price": 125.00,
        "taxable": true,
        "total": 250.00
      }
    ]
  }
}
```

### Payment Object

```json
{
  "payment": {
    "id": 789,
    "invoice_id": 5678,
    "amount": 806.25,
    "payment_method": "Credit Card",
    "reference": "TXN-12345",
    "date": "2024-02-20",
    "notes": "Paid via online portal",
    "created_at": "2024-02-20T14:30:00Z"
  }
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid parameters | Check field values |
| 401 | Unauthorized | Verify API key |
| 404 | Invoice not found | Confirm invoice ID |
| 422 | Validation failed | Check required fields |
| 429 | Rate limited | Wait and retry |

### Validation Errors

**"customer_id is required"** - Invoice must have a customer

**"date is required"** - Invoice must have a date

**"Cannot modify paid invoice"** - Void instead of editing

**"Payment exceeds balance"** - Check payment amount

## Best Practices

1. **Review before sending** - Check all line items for accuracy
2. **Set due dates** - Clear expectations for payment
3. **Use descriptive line items** - Customers understand charges
4. **Track partial payments** - Record as received
5. **Follow up promptly** - Address overdue invoices quickly
6. **Maintain documentation** - Keep payment references
7. **Reconcile regularly** - Match to bank records
8. **Use templates** - Consistent professional appearance

## Accounting Integration

Syncro integrates with popular accounting software:

- **QuickBooks Online** - Sync invoices and payments
- **Xero** - Two-way synchronization
- **QuickBooks Desktop** - Export capabilities

## Related Skills

- [Syncro Customers](../customers/SKILL.md) - Customer billing info
- [Syncro Tickets](../tickets/SKILL.md) - Time tracking for billing
- [Syncro API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
