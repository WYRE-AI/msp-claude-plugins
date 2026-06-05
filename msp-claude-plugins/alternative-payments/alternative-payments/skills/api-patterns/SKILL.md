---
name: "Alternative Payments API Patterns"
description: >
  Use this skill when working with the Alternative Payments API - OAuth2
  client-credentials authentication, REST structure, cursor pagination,
  rate limiting (5 req/sec), error handling, and the read + safe-write
  capability posture. Covers token minting, bearer auth, idempotency, and
  the deliberate exclusion of direct payment creation.
when_to_use: "When working with authentication, pagination, rate limiting, error handling, or endpoint structure in the Alternative Payments API"
triggers:
  - alternative payments api
  - alternativepayments
  - alternative payments auth
  - alternative payments oauth
  - alternative payments token
  - alternative payments rate limit
  - alternative payments pagination
  - alternative payments webhook
  - alternative payments endpoint
---

# Alternative Payments API Patterns

## Overview

The [Alternative Payments](https://www.alternativepayments.io/) API is a RESTful JSON
API for B2B payments: customers, invoices, hosted payment requests, transactions,
payouts, and webhooks. This skill covers OAuth2 client-credentials authentication,
pagination, rate limiting, and error handling.

The WYRE integration exposes a **read + safe-write** surface. It deliberately does
**not** implement direct payment creation (`POST /payments`), which would charge a
card or bank account. Money movement is out of scope.

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://public-api.alternativepayments.io` |
| Demo | `https://public-api.demo.alternativepayments.io` |

## Authentication

Alternative Payments uses **OAuth 2.0 client-credentials**. Generate an API key
(`client_id` / `client_secret`) in the Partner Dashboard, then exchange it for a
short-lived bearer token.

**Token request** (HTTP Basic auth, form-encoded body):

```bash
curl -s -X POST https://public-api.alternativepayments.io/oauth/token \
  -u "${AP_CLIENT_ID}:${AP_CLIENT_SECRET}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"
```

**Token response:**

```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "payments:read payments:write"
}
```

Send the token on every API request:

```
Authorization: Bearer <access_token>
```

Cache the token and refresh it shortly before `expires_in` elapses (a 60-second
margin avoids races). On a `401`, invalidate the cached token and re-authenticate
once — tokens can be revoked server-side before their nominal expiry.

### Gateway header convention

When connecting through the WYRE MCP Gateway, you do not send a bearer token. The
gateway forwards your credentials as headers and the MCP server mints the token
internally:

| Gateway header | Value |
|----------------|-------|
| `X-Alternative-Payments-Client-Id` | OAuth client id |
| `X-Alternative-Payments-Client-Secret` | OAuth client secret |
| `X-Alternative-Payments-Environment` | `production` or `demo` (optional) |

### Scopes

| Scope | Grants |
|-------|--------|
| `payments:read` | List/get customers, invoices, transactions, payouts, webhooks |
| `payments:write` | Create customers/invoices/payment requests/webhooks; archive; delete webhooks |

## Rate Limiting

| Metric | Limit |
|--------|-------|
| Requests per second | 5 (per API key) |

On `429`, back off and retry — respect the `Retry-After` header when present.
A token-bucket limiter at 5/s keeps requests under the cap proactively.

```javascript
async function requestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '1', 10);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }
    if (res.status >= 500 && attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 2 ** attempt * 1000));
      continue;
    }
    return res;
  }
  throw new Error('Max retries exceeded');
}
```

## Pagination

List endpoints are **cursor-paginated**. Pass `limit` and `after` (a cursor);
responses carry the items in `data` plus a `next_cursor` / `has_more` indicator.

```bash
curl -s "https://public-api.alternativepayments.io/customers?limit=100&after=cursor_abc" \
  -H "Authorization: Bearer ${TOKEN}"
```

```javascript
async function fetchAll(path, token) {
  const items = [];
  let after;
  do {
    const url = new URL(`https://public-api.alternativepayments.io${path}`);
    url.searchParams.set('limit', '100');
    if (after) url.searchParams.set('after', after);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    items.push(...(body.data ?? []));
    after = body.has_more ? body.next_cursor : undefined;
  } while (after);
  return items;
}
```

## Idempotency

`POST /payments` (not exposed by this integration) requires an `idempotency_key`.
For the create operations that ARE exposed (customers, invoices, payment requests,
webhooks), supply a stable key where the API accepts one to make retries safe.

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 200 / 201 | Success | Process response |
| 204 | Success, no body | Treat as success (e.g. archive/delete) |
| 400 / 422 | Validation error | Inspect the `errors` array; fix the request |
| 401 | Unauthorized | Refresh token, retry once |
| 403 | Forbidden | Check scope/permissions |
| 404 | Not found | Resource does not exist |
| 429 | Rate limited | Back off (`Retry-After`), retry |
| 5xx | Server error | Retry with exponential backoff |

Read the response body as text first, then `JSON.parse` — never call `.json()` and
`.text()` on the same response (the body can only be read once).

## Endpoint Reference

| Resource | Method · Path | Notes |
|----------|---------------|-------|
| Customers | `GET /customers` · `POST /customers` | List / create |
| | `GET /customers/{id}` · `DELETE /customers/{id}` | Get / archive |
| | `GET /customers/{id}/users` · `POST /customers/{id}/users` | List / add users |
| Invoices | `GET /invoices` · `POST /invoices` | List / create with line items |
| | `GET /invoices/{id}` · `DELETE /invoices/{id}` | Get / archive |
| | `GET /invoices/{id}/payment-link` | Hosted payment link |
| | `GET /invoices/{id}/pdf-link` | Signed PDF download |
| Payment requests | `POST /payments/request` · `GET /payments/request/{id}` | Create hosted link / get status |
| Transactions | `GET /payments` · `GET /payments/{id}` | List / get (read-only) |
| Payouts | `GET /payouts` · `GET /payouts/{id}` | List / get |
| | `GET /payouts/{id}/transactions` | Transactions in a payout |
| Webhooks | `GET /webhooks` · `POST /webhooks` | List / subscribe |
| | `DELETE /webhooks/{id}` · `GET /webhooks/events` · `POST /webhooks/retry` | Unsubscribe / events / retry |

> Excluded by design: `POST /payments` (direct charge), the Web-SDK
> `POST /v1/checkout-auth/init`, and the `/address/*` Google Places utilities.

## Best Practices

1. **Cache the bearer token** — don't mint one per request; refresh 60s before expiry.
2. **Stay under 5 req/sec** — use a token-bucket limiter, not reactive 429 handling alone.
3. **Paginate with cursors** — loop on `has_more` / `next_cursor`.
4. **Prefer hosted payment requests** over direct charges — they let the customer pay without the integration moving money.
5. **Treat archive/delete as destructive** — confirm before archiving customers/invoices or deleting webhook subscriptions.
6. **Read bodies as text then parse** — avoids "body already read" errors.

## Related Skills

- [Alternative Payments Customers](../customers/SKILL.md)
- [Alternative Payments Invoicing](../invoicing/SKILL.md)
- [Alternative Payments Payments & Payouts](../payments/SKILL.md)
