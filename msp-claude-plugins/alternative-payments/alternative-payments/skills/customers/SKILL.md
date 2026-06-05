---
name: "Alternative Payments Customers"
description: >
  Use this skill when working with Alternative Payments customers and their
  users - listing, retrieving, and creating customers, adding users to a
  customer, and archiving customers. Covers customer fields, the customer/user
  relationship, MSP client onboarding, and the destructive archive operation
  that requires confirmation.
when_to_use: "When listing, retrieving, creating, or archiving Alternative Payments customers, or managing the users attached to a customer"
triggers:
  - alternative payments customer
  - create customer
  - list customers
  - archive customer
  - customer users
  - add customer user
  - ap customer
  - customer onboarding
  - customer lookup
  - alternativepayments customer
---

# Alternative Payments Customers Management

## Overview

Customers are the foundational entity in Alternative Payments — every invoice,
payment request, transaction, and payout traces back to a customer. For MSPs, a
customer is typically a managed services client (a business you bill on a
recurring or project basis). Each customer can have one or more **users** —
the individual contacts at that business who receive invoices and pay them.

This skill covers the read + safe-write customer surface: listing, retrieving,
and creating customers, adding users, and archiving (a destructive operation).
There is no direct money-movement operation here.

## Core Concepts

### Customers and Users

| Entity | Description | MSP Example |
|--------|-------------|-------------|
| Customer | A business you bill | "Acme Corp" |
| User | A contact at that business | "billing@acme.com" |

A customer is created first; users are then attached under
`/customers/{id}/users`. Invoices and payment requests reference the customer.

### Customer Status

| Status | Description |
|--------|-------------|
| `active` | Normal, billable customer (default) |
| `archived` | Hidden from default lists; preserved for history |

Archiving is performed with `DELETE /customers/{id}` — it does **not** hard-delete
the record. Treat it as destructive and confirm before running it.

## Field Reference

### Customer Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | System | Auto-generated unique identifier |
| `name` | string | Yes | Business/company name |
| `email` | string | No | Primary billing email |
| `phone` | string | No | Primary phone number |
| `external_id` | string | No | Your PSA/internal reference for cross-linking |
| `address` | object | No | Billing address (line1, city, region, postal_code, country) |
| `status` | string | Read-only | `active` or `archived` |
| `created_at` | datetime | Read-only | Creation timestamp |

### User Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | System | Auto-generated unique identifier |
| `first_name` | string | Yes | User first name |
| `last_name` | string | Yes | User last name |
| `email` | string | Yes | User email address |
| `phone` | string | No | User phone number |

## API Patterns

All requests carry a bearer token (`Authorization: Bearer <token>`). See
[Alternative Payments API Patterns](../api-patterns/SKILL.md) for the OAuth2
client-credentials token flow, the 5 req/sec rate limit, and cursor pagination.

### List Customers

```bash
curl -s "https://public-api.alternativepayments.io/customers?limit=100" \
  -H "Authorization: Bearer ${TOKEN}"
```

Responses are cursor-paginated — items are in `data[]` with a `next_cursor` /
`has_more` indicator. Pass `after=<cursor>` to fetch the next page.

```bash
curl -s "https://public-api.alternativepayments.io/customers?limit=100&after=cursor_abc" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Get a Single Customer

```bash
curl -s "https://public-api.alternativepayments.io/customers/${CUSTOMER_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Create a Customer

```bash
curl -s -X POST "https://public-api.alternativepayments.io/customers" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "email": "billing@acme.com",
    "phone": "+1-217-555-0123",
    "external_id": "MSP-ACME-001",
    "address": {
      "line1": "123 Main Street",
      "city": "Springfield",
      "region": "IL",
      "postal_code": "62704",
      "country": "US"
    }
  }'
```

### List a Customer's Users

```bash
curl -s "https://public-api.alternativepayments.io/customers/${CUSTOMER_ID}/users?limit=100" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Add a User to a Customer

```bash
curl -s -X POST "https://public-api.alternativepayments.io/customers/${CUSTOMER_ID}/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jordan",
    "last_name": "Lee",
    "email": "jordan.lee@acme.com",
    "phone": "+1-217-555-0144"
  }'
```

### Archive a Customer (Destructive — Confirm First)

`DELETE /customers/{id}` archives the customer. **Always confirm with the user
before running it**, and verify there are no outstanding invoices first.

```bash
curl -s -X DELETE "https://public-api.alternativepayments.io/customers/${CUSTOMER_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

A `204 No Content` indicates success.

### JavaScript Example

```javascript
async function createCustomer(token, customer) {
  const res = await fetch('https://public-api.alternativepayments.io/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(customer)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Create customer failed (${res.status}): ${text}`);
  return JSON.parse(text);
}
```

## Common Workflows

### MSP Client Onboarding

1. **Create the customer** with company name, billing email, and your PSA id in `external_id`
2. **Add billing users** so invoices reach the right contacts
3. **Create the first invoice** (see [Invoicing](../invoicing/SKILL.md))

```javascript
async function onboardClient(token, client) {
  const customer = await createCustomer(token, {
    name: client.companyName,
    email: client.billingEmail,
    external_id: client.psaId
  });

  for (const u of client.contacts) {
    await fetch(
      `https://public-api.alternativepayments.io/customers/${customer.id}/users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(u)
      }
    );
  }
  return customer;
}
```

### Client Offboarding

1. **Verify no outstanding invoices** (see [Payments & Payouts](../payments/SKILL.md))
2. **Confirm with the operator** — archiving is destructive
3. **Archive** with `DELETE /customers/{id}`

### Cross-Reference with a PSA

Store your PSA/internal client id in `external_id`, then filter or match on it
when reconciling Alternative Payments activity against your billing system.

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 201 | Customer/user created | Process response |
| 204 | Archived | Treat as success |
| 400 / 422 | Validation error | Inspect the `errors` array; fix the request |
| 401 | Unauthorized | Refresh token, retry once |
| 404 | Customer not found | Verify the customer id |
| 429 | Rate limited | Back off (`Retry-After`), retry |

## Best Practices

1. **Set `external_id`** — map to your PSA client id for clean reconciliation.
2. **Add at least one user** — invoices and payment links need a recipient.
3. **Confirm before archiving** — `DELETE` is destructive; check for open invoices first.
4. **Paginate with cursors** — loop on `has_more` / `next_cursor` for large lists.
5. **Stay under 5 req/sec** — batch onboarding loops should pace their requests.
6. **Read bodies as text then parse** — avoids "body already read" errors.

## Endpoint Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/customers` | GET | List customers (cursor-paginated) |
| `/customers` | POST | Create a customer |
| `/customers/{id}` | GET | Get a single customer |
| `/customers/{id}` | DELETE | Archive a customer (destructive) |
| `/customers/{id}/users` | GET | List a customer's users |
| `/customers/{id}/users` | POST | Add a user to a customer |

## Related Skills

- [Alternative Payments API Patterns](../api-patterns/SKILL.md) - Auth, pagination, rate limits
- [Alternative Payments Invoicing](../invoicing/SKILL.md) - Invoices and hosted payment requests
- [Alternative Payments Payments & Payouts](../payments/SKILL.md) - Read-only transactions and payouts
