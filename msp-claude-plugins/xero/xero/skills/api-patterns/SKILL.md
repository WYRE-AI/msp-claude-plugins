---
name: "Xero API Patterns"
description: >
  Xero Accounting API fundamentals: OAuth2 Custom Connection (client credentials)
  auth and scopes, the xero-tenant-id header, where-clause filter syntax,
  page-based pagination, rate limits, the two date formats, validation-error
  shape, and batch operations.
when_to_use: >-
  When authenticating to the Xero API, building queries, or debugging its pagination,
  rate limiting, or errors. Use when: xero api, xero query, xero filter,
  xero pagination, xero rate limit, xero authentication, xero oauth, xero rest, xero endpoint,
  xero request, or xero token.
---

# Xero API Patterns

## Overview

The Xero API is a RESTful JSON API covering contacts, invoices, payments, accounts, bank transactions, credit notes, and reports. This skill covers the mechanics that aren't guessable from the resource names: OAuth2 Custom Connections, query building, pagination, error handling, and rate-limit behavior.

## Authentication

Xero uses OAuth2 **Custom Connections** for machine-to-machine access — a plain `client_credentials` grant against `https://identity.xero.com/connect/token`, authenticated with HTTP Basic (`CLIENT_ID:CLIENT_SECRET`). Access tokens last **1800 seconds (30 minutes)**; there is no refresh token in this flow, you simply request a new one.

```bash
curl -s -X POST https://identity.xero.com/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}" \
  -d "grant_type=client_credentials&scope=accounting.transactions accounting.contacts accounting.reports.read accounting.settings"
```

Scopes are space-delimited and split read vs read/write (`accounting.transactions` vs `accounting.transactions.read`, same pattern for `.contacts` and `.settings`; reports are read-only via `accounting.reports.read`).

### Required Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer {access_token}` | OAuth2 access token |
| `xero-tenant-id` | Your tenant ID | Target Xero organization |
| `Content-Type` | `application/json` | JSON content type |
| `Accept` | `application/json` | JSON response format |

### Base URL Pattern

```
https://api.xero.com/api.xro/2.0/{resource}
```

For example `/Contacts`, `/Invoices`, `/Payments`, `/Accounts`.

See [references/auth.md](references/auth.md) for the full token request/response, the scope table, environment variables, and a caching token-manager implementation.

## Filtering

Xero filters with a `where` query parameter carrying OData-style expressions. The value must be URL-encoded.

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equals | `Name=="Acme"` |
| `!=` | Not equals | `Status!="DELETED"` |
| `>` | Greater than | `AmountDue>0` |
| `<` | Less than | `AmountDue<100` |
| `>=` | Greater or equal | `Total>=1000` |
| `<=` | Less or equal | `Total<=5000` |
| `&&` | AND | `Type=="ACCREC"&&Status=="PAID"` |
| `\|\|` | OR | `Status=="DRAFT"\|\|Status=="SUBMITTED"` |
| `.StartsWith()` | Starts with | `Name.StartsWith("Acme")` |
| `.EndsWith()` | Ends with | `Name.EndsWith("Corp")` |
| `.Contains()` | Contains | `Name.Contains("tech")` |

Two non-obvious wrappers: GUID comparisons need `guid("...")` (`Contact.ContactID==guid("abc-123")`) and date comparisons need `DateTime(y,m,d)` (`Date>=DateTime(2026,3,1)`).

Sort with `order=Date DESC`. For incremental sync, send an `If-Modified-Since: 2026-02-01T00:00:00` header instead of a date filter — it returns only records changed since that timestamp.

## Pagination

Pagination is page-based via `?page=N` (1-based), with a **fixed** 100 results per page — there is no page-size parameter. There is also no total count or next-page link: you know you have reached the last page when a page returns fewer than 100 items.

`/Accounts` and all `/Reports/*` endpoints are not paginated and return their full result set.

See [references/api.md](references/api.md) for the pagination loop implementation, request/response shapes, the per-endpoint pagination table, batch operations, and the complete endpoint reference.

## Rate Limiting

| Metric | Limit |
|--------|-------|
| Requests per minute | 60 |
| Requests per day | 5,000 |

Exceeding either returns HTTP 429 with a `Retry-After` header (seconds) and an `X-Rate-Limit-Problem` header identifying which limit was hit. Honour `Retry-After` rather than using a fixed backoff, and add jitter when multiple workers share credentials.

## Date Formats

Requests take `YYYY-MM-DDT00:00:00`:

```json
{
  "Date": "2026-03-01T00:00:00",
  "DueDate": "2026-03-31T00:00:00"
}
```

Responses may instead return Microsoft JSON dates — `"/Date(1772524800000+0000)/"`. Parse both:

```javascript
function parseXeroDate(dateString) {
  if (dateString.startsWith('/Date(')) {
    const timestamp = parseInt(dateString.match(/\d+/)[0], 10);
    return new Date(timestamp);
  }
  return new Date(dateString);
}
```

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response — still check `HasErrors` |
| 400 | Bad Request | Check request format and required fields |
| 401 | Unauthorized | Refresh access token |
| 403 | Forbidden | Check tenant ID and scopes |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Wait `Retry-After` seconds and retry |
| 500 | Server Error | Retry with exponential backoff |

Validation failures do **not** produce a 4xx. Xero returns HTTP 200 with `HasErrors: true` and a `ValidationErrors` array on the individual resource, so every write response must be inspected per item.

See [references/errors.md](references/errors.md) for the full validation-error payload, a response-checking helper, and a retry implementation covering 429 and 5xx.

## Batch Operations

Any create/update endpoint accepts a collection wrapper (`{"Invoices": [...]}`) to submit multiple resources in one request — the primary way to stay inside the 60/minute limit during monthly billing runs. Always add `?summarizeErrors=false`, otherwise a single bad item collapses the whole response into one aggregate error and you cannot tell which item failed.

## Gotchas

- **Missing `xero-tenant-id` returns 403, not 400** - The error reads like a permissions problem when the header is simply absent.
- **Tokens are per-connection, not per-tenant** - The same token can address multiple organizations; the tenant header selects which one.
- **Unencoded `where` clauses fail silently or 400** - `&&`, `"`, and `>` all need encoding; a partially-encoded clause can be parsed as a truncated filter and return the wrong set.
- **No total count** - Nothing in the response tells you how many pages remain; the fewer-than-100 heuristic is the only signal.
- **Cache access tokens** - Requesting a new token per call wastes the 30-minute lifetime and counts against rate limits.

## Related Skills

- [Xero Contacts](../contacts/SKILL.md) - Contact management
- [Xero Invoices](../invoices/SKILL.md) - Invoice management
- [Xero Payments](../payments/SKILL.md) - Payment tracking
- [Xero Accounts](../accounts/SKILL.md) - Chart of accounts
- [Xero Reports](../reports/SKILL.md) - Financial reporting
