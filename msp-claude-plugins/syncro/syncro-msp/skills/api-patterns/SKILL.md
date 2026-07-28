---
name: "Syncro API Patterns"
description: >
  Syncro MSP REST API fundamentals: API key setup and authentication,
  request and response patterns, pagination, rate limiting, and error
  handling.
when_to_use: >-
  When authenticating to or calling the Syncro MSP API. Use when: syncro
  api, syncro authentication, syncro api key, syncro pagination, syncro rate
  limit, api error syncro, syncro rest api, or syncro integration.
---

# Syncro MSP API Patterns

## Overview

The Syncro MSP API provides access to tickets, customers, assets, invoices, and more. This skill covers authentication, pagination, rate limiting, error handling, and best practices for API integration.

## Authentication

### API Key Authentication

Syncro uses Bearer token authentication with API keys:

```http
GET /api/v1/tickets
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Getting Your API Key

1. Log into your Syncro MSP account
2. Go to **Admin > API Tokens** (or User Profile)
3. Generate a new API token
4. Copy and securely store the token

### Environment Variables

```bash
export SYNCRO_API_KEY="your-api-key-here"
export SYNCRO_SUBDOMAIN="your-subdomain"  # e.g., "acme" for acme.syncromsp.com
```

### Base URL Format

The API base URL uses your subdomain — requests to the wrong subdomain
authenticate against a different tenant, so verify it matches the account you
intend to hit:

```
https://{subdomain}.syncromsp.com/api/v1/
```

**Example:**
```
https://acme.syncromsp.com/api/v1/tickets
```

## Pagination

### Page-Based Pagination

Syncro uses page-based pagination:

```http
GET /api/v1/tickets?page=1
GET /api/v1/tickets?page=2
GET /api/v1/tickets?page=3
```

### Pagination Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number (1-based) | 1 |

There is no page-size parameter — `per_page` is fixed at 25 by the server and
reported back in `meta`, so a large result set always costs `total_pages`
requests.

### Response Metadata

Responses include pagination information. Note the collection is keyed by
resource name (`tickets`, `customers`, ...), not a generic `data` key:

```json
{
  "tickets": [...],
  "meta": {
    "total_entries": 156,
    "total_pages": 7,
    "page": 1,
    "per_page": 25
  }
}
```

See [references/examples.md](references/examples.md) for a working page-walking implementation.

## Rate Limiting

### Rate Limit Policy

Syncro enforces a rate limit of **180 requests per minute** per IP address.
Because the limit is per-IP rather than per-key, separate integrations sharing
an egress address contend for the same budget.

### Rate Limit Response

When rate limited, you receive:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
```

```json
{
  "error": "Rate limit exceeded. Please wait before making more requests."
}
```

At 180 req/min, a ~350ms delay between calls keeps a single-threaded client
safely under the ceiling.

See [references/examples.md](references/examples.md) for retry-with-backoff and throttled batch-processing implementations.

## Common Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `page` | Page number | `page=2` |
| `query` | Search term | `query=email` |
| `customer_id` | Filter by customer | `customer_id=123` |
| `date_from` | Start date | `date_from=2024-01-01` |
| `date_to` | End date | `date_to=2024-01-31` |
| `mine` | Current user only | `mine=true` |
| `status` | Status filter | `status=open` |

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Resource created |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable | Validation failed |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Retry with backoff |

### Error Response Format

Validation failures (422) return a per-field `errors` array in addition to the
top-level `error` string — read the array, not just the string, to know which
field was rejected:

```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "customer_id",
      "message": "is required"
    }
  ]
}
```

See [references/examples.md](references/examples.md) for a request wrapper that maps these statuses to actionable errors.

## Request Patterns and Endpoints

Syncro follows conventional REST verbs: `GET` to read, `POST` to create, `PUT`
to update, `DELETE` to remove. Sub-resource actions are `POST` to a named path
(e.g. `/tickets/{id}/comment`, `/invoices/{id}/email`).

See [references/api.md](references/api.md) for the complete endpoint catalog, request shapes, and cURL examples.

## Best Practices

1. **Cache reference data** - Reduce API calls for static lookups
2. **Paginate large requests** - Don't fetch unbounded result sets
3. **Log API calls** - Enable debugging and audit trails when the per-IP rate
   limit is shared across integrations

## Related Skills

- [Syncro Tickets](../tickets/SKILL.md) - Ticket management
- [Syncro Customers](../customers/SKILL.md) - Customer management
- [Syncro Assets](../assets/SKILL.md) - Asset management
- [Syncro Invoices](../invoices/SKILL.md) - Invoice management
