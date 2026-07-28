---
name: "Atera API Patterns"
description: >
  Atera REST API fundamentals: X-API-KEY header authentication, OData-style
  pagination, the 700 requests/minute rate limit, endpoint conventions, and
  error handling.
when_to_use: >-
  When authenticating to or calling the Atera REST API. Use when: atera api,
  atera authentication, api key atera, atera pagination, api rate limit,
  atera rest api, api error atera, or odata pagination.
---

# Atera API Patterns

## Overview

The Atera REST API (v3) provides access to all major entities in the RMM/PSA platform. This skill covers authentication, pagination, rate limiting, error handling, and performance optimization patterns.

## Authentication

### X-API-KEY Header Authentication

Atera uses a simple API key authentication via the `X-API-KEY` header:

```http
GET /api/v3/tickets
X-API-KEY: YOUR_API_KEY
Content-Type: application/json
Accept: application/json
```

**Required Headers:**

| Header | Value | Description |
|--------|-------|-------------|
| `X-API-KEY` | `{your_api_key}` | API key from Atera portal |
| `Content-Type` | `application/json` | For POST/PUT requests |
| `Accept` | `application/json` | Optional, for explicit format |

### Obtaining API Key

1. Log into Atera portal
2. Navigate to **Admin** > **API**
3. Generate or copy your API key
4. Store securely (treat as a password)

### Environment Variable Setup

```bash
export ATERA_API_KEY="your-api-key-here"
```

## Base URL

All API requests use the following base URL. Atera requires HTTPS; plain HTTP is rejected.

```
https://app.atera.com/api/v3
```

## Pagination

### OData-Style Pagination

Atera uses OData-style pagination with `page` and `itemsInPage` parameters:

```http
GET /api/v3/tickets?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

**Pagination Parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | int | 1 | - | Page number (1-indexed) |
| `itemsInPage` | int | 20 | 50 | Items per page |

### Response Structure

```json
{
  "items": [...],
  "totalItems": 2847,
  "page": 1,
  "itemsInPage": 50,
  "totalPages": 57
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `items` | array | Array of entities |
| `totalItems` | int | Total count across all pages |
| `page` | int | Current page number |
| `itemsInPage` | int | Items in current page |
| `totalPages` | int | Total number of pages |

### Pagination Best Practices

1. **Use maximum page size** - 50 items reduces API calls
2. **Add delays between pages** - Avoid hitting rate limits
3. **Cache total counts** - Don't re-fetch unnecessarily
4. **Implement retry logic** - Handle transient failures

See [references/examples.md](references/examples.md) for a working page-walking implementation.

## Rate Limiting

### Rate Limit: 700 Requests per Minute

Atera enforces a rate limit of **700 requests per minute** per API key.

### Rate Limit Headers

Atera may return rate limit information in response headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Seconds until reset |

### Rate Limit Response

When rate limited (HTTP 429):

```json
{
  "Message": "Rate limit exceeded. Please wait before making more requests."
}
```

See [references/examples.md](references/examples.md) for exponential-backoff retry and a sliding-window throttler.

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created successfully |
| 400 | Bad Request | Check request format/values |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "Message": "Error description here",
  "ErrorCode": "SPECIFIC_ERROR_CODE"
}
```

See [references/examples.md](references/examples.md) for a request wrapper that maps these statuses to actionable errors.

## CRUD Operations

Atera does not use `PUT`. **Updates are a `POST` to the entity's ID URL** — the same verb as create, distinguished only by whether the URL carries an ID:

```http
POST /api/v3/tickets          # create
POST /api/v3/tickets/54321    # update
DELETE /api/v3/tickets/54321  # delete
```

Write responses return an `ActionID` alongside the entity ID rather than the full entity, so re-read the record if you need its post-write state.

See [references/api.md](references/api.md) for the complete endpoint catalog and full request/response shapes.

## Performance Optimization

- **Batch operations** - group related requests, with a delay between batches
- **Cache reference data** - customers, contacts, and contracts change slowly
- **Parallelize independent reads** - but count them against the 700/min budget

See [references/examples.md](references/examples.md) for batching, caching, and parallel-fetch implementations.

## Related Skills

- [Atera Tickets](../tickets/SKILL.md) - Ticket management
- [Atera Agents](../agents/SKILL.md) - Agent management
- [Atera Customers](../customers/SKILL.md) - Customer management
- [Atera Alerts](../alerts/SKILL.md) - Alert management
- [Atera Devices](../devices/SKILL.md) - Device monitors
