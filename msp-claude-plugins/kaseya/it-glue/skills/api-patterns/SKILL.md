---
name: "IT Glue API Patterns"
description: >
  IT Glue REST API fundamentals: JSON:API request/response structure,
  x-api-key authentication across regional endpoints (US/EU/AU), filter and
  sort syntax, pagination, sideloading with includes, rate limits, CRUD
  operations, and error handling.
when_to_use: >-
  When authenticating to or querying the IT Glue REST API directly, or building
  integrations against it. Use when: it glue api, it glue query, json api, it glue filter, it glue
  pagination, api rate limit, it glue authentication, it glue rest, it glue sideload, or it glue
  include.
---

# IT Glue API Patterns

## Overview

The IT Glue API follows the JSON:API specification, providing access to organizations, configurations (assets), contacts, passwords, documents, and flexible assets. This skill covers authentication, query building, pagination, error handling, and performance optimization patterns.

## Authentication

IT Glue uses API key authentication via the `x-api-key` header:

```http
GET /organizations
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

**Required Headers:**
| Header | Value | Description |
|--------|-------|-------------|
| `x-api-key` | Your API key | Authentication token |
| `Content-Type` | `application/vnd.api+json` | JSON:API content type |

```bash
export IT_GLUE_API_KEY="ITG.your-api-key-here"
export IT_GLUE_REGION="us"  # us, eu, or au
```

IT Glue operates in multiple regions with separate base URLs — using the wrong one for a customer's account returns 401s that look like a bad key:

| Region | Base URL |
|--------|----------|
| US | `https://api.itglue.com` |
| EU | `https://api.eu.itglue.com` |
| AU | `https://api.au.itglue.com` |

## JSON:API Structure

Requests and responses follow JSON:API conventions:

```json
{
  "data": {
    "type": "organizations",
    "attributes": {
      "name": "Acme Corporation",
      "organization-type-id": 12345,
      "organization-status-id": 1
    }
  }
}
```

| Term | Description |
|------|-------------|
| `data` | Primary resource or array of resources |
| `attributes` | Resource properties |
| `relationships` | Links to related resources |
| `included` | Sideloaded related resources |
| `meta` | Pagination and metadata |

Field names in `attributes` are kebab-case (`organization-type-id`), not camelCase — this trips up integrations ported from other APIs.

## API Patterns

### Filtering

```http
GET /organizations?filter[name]=Acme
GET /organizations?filter[organization-status-id]=1
GET /configurations?filter[organization-id]=123456
```

Filters are per-endpoint (not every field is filterable). See [references/api.md](references/api.md) for the common filter parameter table, multi-filter combining, and PSA-ID cross-platform lookups.

### Sorting

```http
GET /organizations?sort=name
GET /organizations?sort=-created-at
GET /configurations?sort=name,-updated-at
```

No prefix sorts ascending; `-` prefix sorts descending. See [references/api.md](references/api.md) for common sort fields per endpoint.

### Pagination

```http
GET /organizations?page[size]=50&page[number]=1
```

| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `page[size]` | Items per page | 50 | 1000 |
| `page[number]` | Page number (1-based) | 1 | - |

Check `meta['next-page']` (not `total-pages`) to decide whether to keep paging — it's `null` on the last page. See [references/examples.md](references/examples.md) for a full fetch-all-pages pattern and [references/api.md](references/api.md) for the response metadata shape.

### Sideloading with Includes

Retrieve related resources in a single request instead of N+1 calls:

```http
GET /configurations/123?include=organization,configuration-interfaces
GET /organizations/456?include=configurations,contacts,passwords
```

See [references/api.md](references/api.md) for the available includes per endpoint and an example response shape.

### CRUD and Nested Resources

Standard verbs: `POST` to create, `GET` to read, `PATCH` to update (partial — only send changed attributes), `DELETE` to remove (not all resource types support it). Resources can also be created/listed scoped to a parent organization via `/organizations/:id/relationships/:type`. See [references/api.md](references/api.md) for full request/response examples of each operation.

## Rate Limiting

| Metric | Limit |
|--------|-------|
| Requests per 5 minutes | 3000 |
| Burst limit | ~100 requests/second |

```http
X-RateLimit-Limit: 3000
X-RateLimit-Remaining: 2847
X-RateLimit-Reset: 1708012800
```

A 429 response includes a `Retry-After` header — respect it rather than a fixed backoff, and add jitter to avoid thundering-herd retries across concurrent jobs. See [references/examples.md](references/examples.md) for a retry-with-backoff implementation.

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Resource created successfully |
| 204 | No Content | Delete successful |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify API key (and region — see Authentication) |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |

Validation errors (422) report the failing attribute in `error.source.pointer` (e.g. `/data/attributes/name`) — parse it to point users at the exact field. See [references/errors.md](references/errors.md) for the full error response shape and a handling pattern.

## Best Practices

1. **Use the correct regional endpoint** - Matching US/EU/AU wrong silently produces 401s
2. **Include related data** - Use `include` to avoid N+1 queries
3. **Paginate large results** - Use `page[size]` up to 1000
4. **Implement retry logic** - Respect `Retry-After` for 429s and use backoff with jitter
5. **Cache reference data** - Organization types, configuration types rarely change
6. **Filter and sort server-side** - Narrow and order results via query params, not client-side

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Organization management
- [IT Glue Configurations](../configurations/SKILL.md) - Asset management
- [IT Glue Passwords](../passwords/SKILL.md) - Secure credential storage
- [IT Glue Documents](../documents/SKILL.md) - Documentation management
