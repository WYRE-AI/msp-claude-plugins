---
name: "Alternative Payments Payments & Payouts"
description: >
  Use this skill when reading Alternative Payments transactions and payouts -
  listing and filtering transactions by type, status, customer, invoice, and
  payment method; retrieving a single transaction; and listing or retrieving
  payouts and the transactions that compose them for reconciliation. This is a
  read-only surface - there is no create-payment or direct-charge operation.
when_to_use: "When listing or filtering transactions, retrieving a transaction, or listing and reconciling payouts and the transactions inside them"
triggers:
  - alternative payments transaction
  - list transactions
  - transaction status
  - alternative payments payout
  - list payouts
  - payout transactions
  - reconcile payout
  - failed payment
  - declined transaction
  - alternativepayments payout
---

# Alternative Payments Payments & Payouts

## Overview

This skill covers the **read-only** money-visibility surface in Alternative
Payments: transactions (individual payment records) and payouts (settled batches
of funds deposited to your account). It is used for reporting and
reconciliation — matching transactions to invoices and customers, and tracing
which transactions make up a given payout.

There is **no create-payment tool here.** This integration never charges a card
or moves money (`POST /payments`, the direct charge, is excluded by design). To
collect from a customer, generate a hosted payment link or payment request — see
[Alternative Payments Invoicing](../invoicing/SKILL.md).

## Core Concepts

### Transactions

A transaction is a single payment event against an invoice or payment request.
Note that the transactions resource lives at `GET /payments` — but only the
read (list/get) verbs are exposed.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Transaction identifier |
| `type` | string | Transaction type (e.g. `payment`, `refund`) |
| `status` | string | `succeeded`, `pending`, `failed`, `declined` |
| `amount` | number | Transaction amount |
| `currency` | string | ISO currency code |
| `customer_id` | string | Customer the transaction belongs to |
| `invoice_id` | string | Invoice the transaction settled (if any) |
| `payment_method` | string | `card` or `standard_ach` |
| `payout_id` | string | Payout this transaction settled into (if settled) |
| `created_at` | datetime | When the transaction occurred |

### Payouts

A payout is a batch of funds Alternative Payments deposits to your bank account.
Each payout aggregates many settled transactions — reconciling a payout means
listing its transactions and matching them back to invoices and customers.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Payout identifier |
| `amount` | number | Total payout amount deposited |
| `currency` | string | ISO currency code |
| `status` | string | `pending`, `paid`, `failed` |
| `arrival_date` | datetime | Expected/actual deposit date |
| `created_at` | datetime | When the payout was created |

## API Patterns

All requests carry a bearer token (`Authorization: Bearer <token>`). See
[Alternative Payments API Patterns](../api-patterns/SKILL.md) for the OAuth2 token
flow, the 5 req/sec rate limit, and cursor pagination.

### List Transactions (with Filters)

`GET /payments` lists transactions. Supported filters:

| Filter | Values / Format | Purpose |
|--------|-----------------|---------|
| `type` | e.g. `payment`, `refund` | Filter by transaction type |
| `status` | `succeeded`, `pending`, `failed`, `declined` | Filter by outcome |
| `customer_id` | customer id | Transactions for one customer |
| `invoice_id` | invoice id | Transactions settling one invoice |
| `payment_method` | `card` or `standard_ach` | Filter by method |
| `created_at_start` | `YYYY-MM-DD` | Start of date range |
| `created_at_end` | `YYYY-MM-DD` | End of date range |
| `cursor` | cursor string | Pagination (with `limit`) |

```bash
# Failed and declined card transactions in June 2026
curl -s "https://public-api.alternativepayments.io/payments?status=failed&payment_method=card&created_at_start=2026-06-01&created_at_end=2026-06-30&limit=100" \
  -H "Authorization: Bearer ${TOKEN}"

# All transactions for one customer
curl -s "https://public-api.alternativepayments.io/payments?customer_id=${CUSTOMER_ID}&limit=100" \
  -H "Authorization: Bearer ${TOKEN}"

# Transactions that settled a specific invoice
curl -s "https://public-api.alternativepayments.io/payments?invoice_id=${INVOICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

Responses are cursor-paginated — items in `data[]`, with `next_cursor` /
`has_more`. Pass `cursor=<next_cursor>` to fetch the next page.

### Get a Single Transaction

```bash
curl -s "https://public-api.alternativepayments.io/payments/${TRANSACTION_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

### List Payouts

```bash
curl -s "https://public-api.alternativepayments.io/payouts?limit=100" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Get a Single Payout

```bash
curl -s "https://public-api.alternativepayments.io/payouts/${PAYOUT_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

### List a Payout's Transactions (Reconciliation)

```bash
curl -s "https://public-api.alternativepayments.io/payouts/${PAYOUT_ID}/transactions?limit=100" \
  -H "Authorization: Bearer ${TOKEN}"
```

### JavaScript Example — Reconcile a Payout

```javascript
async function reconcilePayout(token, payoutId) {
  const base = 'https://public-api.alternativepayments.io';
  const headers = { 'Authorization': `Bearer ${token}` };

  const payout = JSON.parse(
    await (await fetch(`${base}/payouts/${payoutId}`, { headers })).text()
  );

  // Pull every transaction in the payout (cursor pagination).
  const txns = [];
  let cursor;
  do {
    const url = new URL(`${base}/payouts/${payoutId}/transactions`);
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('cursor', cursor);
    const body = JSON.parse(await (await fetch(url, { headers })).text());
    txns.push(...(body.data ?? []));
    cursor = body.has_more ? body.next_cursor : undefined;
  } while (cursor);

  const sum = txns.reduce((t, x) => t + x.amount, 0);
  return {
    payout,
    transactionCount: txns.length,
    transactionTotal: sum,
    reconciles: Math.abs(sum - payout.amount) < 0.01,
    transactions: txns
  };
}
```

## Common Workflows

### Match Transactions to Invoices

List transactions with `status=succeeded`, group by `invoice_id`, and confirm
each open invoice has a matching settled transaction. Invoices with no
`succeeded` transaction are still outstanding.

### Surface Failed and Declined Payments

Filter with `status=failed` (and `status=declined`) over a recent date range to
build a follow-up list. For each, the linked `customer_id` / `invoice_id` tells
you who to contact — then generate a fresh hosted payment link from the
[Invoicing](../invoicing/SKILL.md) skill.

### Reconcile a Payout

List a payout's transactions, sum their amounts, and confirm the total matches
the payout amount. Trace each transaction back to its invoice and customer so
the deposit can be tied to specific receivables.

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process `data[]` / object |
| 401 | Unauthorized | Refresh token, retry once |
| 404 | Transaction / payout not found | Verify the id |
| 429 | Rate limited | Back off (`Retry-After`), retry |

## Best Practices

1. **Treat this surface as read-only** — there is no create-payment tool; collect via hosted links.
2. **Filter server-side** — use `status`, `customer_id`, `invoice_id`, and date filters rather than fetching everything.
3. **Paginate with cursors** — loop on `has_more` / `next_cursor` (pass `cursor=`).
4. **Reconcile by summing** — a payout's transaction amounts should equal the payout total.
5. **Stay under 5 req/sec** — pace reconciliation loops over large payouts.
6. **Read bodies as text then parse** — avoids "body already read" errors.

## Endpoint Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/payments` | GET | List transactions (filterable, cursor-paginated) |
| `/payments/{id}` | GET | Get a single transaction |
| `/payouts` | GET | List payouts (cursor-paginated) |
| `/payouts/{id}` | GET | Get a single payout |
| `/payouts/{id}/transactions` | GET | List the transactions in a payout |

> Excluded by design: `POST /payments` (direct charge). Money movement is out of scope.

## Related Skills

- [Alternative Payments API Patterns](../api-patterns/SKILL.md) - Auth, pagination, rate limits
- [Alternative Payments Customers](../customers/SKILL.md) - Customers and their users
- [Alternative Payments Invoicing](../invoicing/SKILL.md) - Invoices and hosted payment requests
