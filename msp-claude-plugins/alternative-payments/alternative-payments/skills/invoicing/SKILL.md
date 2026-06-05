---
name: "Alternative Payments Invoicing"
description: >
  Use this skill when working with Alternative Payments invoices and hosted
  payment requests - listing, retrieving, and creating invoices with line items,
  fetching a hosted payment link or PDF link, archiving an invoice, and creating
  or retrieving hosted payment requests. Hosted links let the customer choose to
  pay; the integration never moves money on the customer's behalf.
when_to_use: "When creating, listing, retrieving, or archiving Alternative Payments invoices, or generating hosted payment links and payment requests"
triggers:
  - alternative payments invoice
  - create invoice
  - list invoices
  - archive invoice
  - payment link
  - payment request
  - hosted payment link
  - invoice pdf
  - line items
  - alternativepayments invoice
---

# Alternative Payments Invoicing

## Overview

Invoices are the billing records in Alternative Payments. Each invoice belongs to
a customer, carries one or more line items, and has a due date. Once an invoice
exists you can fetch a **hosted payment link** (a URL the customer visits to pay)
and a **PDF link** (a signed download of the invoice document).

Separately, **payment requests** are standalone hosted payment links that are not
tied to a stored invoice — useful for ad-hoc charges and follow-ups.

The key posture: hosted payment links and payment requests let the **customer**
choose to pay. Generating a link does **not** charge a card or move money — it
simply produces a URL. This integration never executes a direct charge. See
[Alternative Payments API Patterns](../api-patterns/SKILL.md) for why
`POST /payments` (direct charge) is excluded by design.

## Core Concepts

### Invoice Status

| Status | Description | Payable |
|--------|-------------|---------|
| `open` | Issued and awaiting payment | Yes |
| `paid` | Fully paid | No |
| `overdue` | Past `due_date` and still unpaid | Yes |
| `archived` | Removed from default lists (destructive) | No |

Archiving uses `DELETE /invoices/{id}` and is destructive — confirm before running.

### Hosted Links vs. Direct Charges

| Mechanism | What it does | Money movement |
|-----------|--------------|----------------|
| Payment link (`GET /invoices/{id}/payment-link`) | URL for an existing invoice | Customer pays — not the integration |
| Payment request (`POST /payments/request`) | Standalone hosted link | Customer pays — not the integration |
| Direct charge (`POST /payments`) | Charges a card/bank | **Not exposed** |

## Field Reference

### Invoice Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | System | Auto-generated unique identifier |
| `customer_id` | string | Yes | Customer the invoice belongs to |
| `currency` | string | Yes | ISO currency code (e.g. `USD`) |
| `due_date` | string | Yes | Payment due date (`YYYY-MM-DD`) |
| `line_items` | array | Yes | One or more line items (see below) |
| `reference` | string | No | Reference text (PO number, billing period) |
| `status` | string | Read-only | `open`, `paid`, `overdue`, `archived` |
| `amount_due` | number | Read-only | Remaining unpaid amount |
| `created_at` | datetime | Read-only | Creation timestamp |

### Line Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | Yes | Line item description |
| `quantity` | number | Yes | Quantity |
| `unit_amount` | number | Yes | Price per unit |

### Payment Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Amount to request |
| `currency` | string | Yes | ISO currency code (e.g. `USD`) |
| `redirect_url` | string | Yes | Where to send the customer after paying |
| `reference_id` | string | No | Your reference for reconciliation |

## API Patterns

All requests carry a bearer token (`Authorization: Bearer <token>`). See
[Alternative Payments API Patterns](../api-patterns/SKILL.md) for the OAuth2 token
flow, the 5 req/sec rate limit, and cursor pagination.

### List Invoices

```bash
curl -s "https://public-api.alternativepayments.io/invoices?limit=100" \
  -H "Authorization: Bearer ${TOKEN}"
```

Responses are cursor-paginated — items in `data[]`, with `next_cursor` / `has_more`.
Pass `after=<cursor>` for the next page.

### Get a Single Invoice

```bash
curl -s "https://public-api.alternativepayments.io/invoices/${INVOICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Create an Invoice

Required: `customer_id`, `currency`, `due_date`, and a non-empty `line_items[]`.

```bash
curl -s -X POST "https://public-api.alternativepayments.io/invoices" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "'${CUSTOMER_ID}'",
    "currency": "USD",
    "due_date": "2026-07-05",
    "reference": "June 2026 Managed Services",
    "line_items": [
      {
        "description": "Monthly Managed Services - Acme Corp (25 endpoints)",
        "quantity": 1,
        "unit_amount": 2500.00
      },
      {
        "description": "Microsoft 365 Business Premium (25 users)",
        "quantity": 25,
        "unit_amount": 22.00
      }
    ]
  }'
```

### Get a Hosted Payment Link

Returns a URL the customer visits to pay the invoice. No charge occurs until the
customer completes payment.

```bash
curl -s "https://public-api.alternativepayments.io/invoices/${INVOICE_ID}/payment-link" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Get a Signed PDF Link

```bash
curl -s "https://public-api.alternativepayments.io/invoices/${INVOICE_ID}/pdf-link" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Archive an Invoice (Destructive — Confirm First)

`DELETE /invoices/{id}` archives the invoice. **Confirm with the operator before
running it.**

```bash
curl -s -X DELETE "https://public-api.alternativepayments.io/invoices/${INVOICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

A `204 No Content` indicates success.

### Create a Hosted Payment Request

A standalone hosted link, not tied to a stored invoice. Required: `amount`,
`currency`, `redirect_url`. The response includes a hosted URL — the customer
chooses to pay; the integration does not charge them.

```bash
curl -s -X POST "https://public-api.alternativepayments.io/payments/request" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2500.00,
    "currency": "USD",
    "redirect_url": "https://portal.example-msp.com/thanks",
    "reference_id": "MS-2026-06-ACME"
  }'
```

### Get a Payment Request

```bash
curl -s "https://public-api.alternativepayments.io/payments/request/${REQUEST_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

### JavaScript Example

```javascript
async function createInvoiceWithLink(token, invoice) {
  const base = 'https://public-api.alternativepayments.io';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const createRes = await fetch(`${base}/invoices`, {
    method: 'POST', headers, body: JSON.stringify(invoice)
  });
  const createText = await createRes.text();
  if (!createRes.ok) throw new Error(`Create invoice failed (${createRes.status}): ${createText}`);
  const created = JSON.parse(createText);

  // Fetch a hosted link the customer can use to pay — no charge happens here.
  const linkRes = await fetch(`${base}/invoices/${created.id}/payment-link`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const link = JSON.parse(await linkRes.text());
  return { invoice: created, paymentLink: link };
}
```

## Common Workflows

### Monthly MSP Billing Cycle

1. **Create invoices** for each managed services customer with their line items
2. **Generate hosted payment links** and email them to the customer's users
3. **Track payment** via read-only transactions (see [Payments & Payouts](../payments/SKILL.md))
4. **Follow up** on `overdue` invoices with a fresh payment link

### Ad-hoc Charge Follow-up

When chasing an outstanding balance that isn't a formal invoice, create a
payment request with the amount, currency, and a `redirect_url`, then send the
hosted link. The customer pays at their discretion.

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 201 | Invoice / payment request created | Process response |
| 204 | Archived | Treat as success |
| 400 / 422 | Validation error | Inspect the `errors` array; fix the request |
| 401 | Unauthorized | Refresh token, retry once |
| 404 | Invoice / request not found | Verify the id |
| 429 | Rate limited | Back off (`Retry-After`), retry |

Common validation causes: empty `line_items[]`, missing `due_date`, an unknown
`customer_id`, or a missing `redirect_url` on a payment request.

## Best Practices

1. **Always include line items** — `line_items[]` must be non-empty.
2. **Use clear references** — include the billing period and service in `reference`.
3. **Send hosted links, not charges** — let the customer pay via the payment link.
4. **Set a `reference_id` on payment requests** — makes reconciliation clean.
5. **Confirm before archiving** — `DELETE` is destructive.
6. **Read bodies as text then parse** — avoids "body already read" errors.

## Endpoint Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/invoices` | GET | List invoices (cursor-paginated) |
| `/invoices` | POST | Create an invoice with line items |
| `/invoices/{id}` | GET | Get a single invoice |
| `/invoices/{id}` | DELETE | Archive an invoice (destructive) |
| `/invoices/{id}/payment-link` | GET | Hosted payment link for the invoice |
| `/invoices/{id}/pdf-link` | GET | Signed PDF download link |
| `/payments/request` | POST | Create a hosted payment request |
| `/payments/request/{id}` | GET | Get a payment request |

## Related Skills

- [Alternative Payments API Patterns](../api-patterns/SKILL.md) - Auth, pagination, rate limits
- [Alternative Payments Customers](../customers/SKILL.md) - Customers and their users
- [Alternative Payments Payments & Payouts](../payments/SKILL.md) - Read-only transactions and payouts
