---
name: "SuperOps API Patterns"
description: >
  SuperOps.ai GraphQL API fundamentals: Bearer token plus CustomerSubDomain header auth,
  region-specific endpoints, request/variable structure, cursor pagination, the 800 req/min
  rate limit, filter operators, UTC date handling, error codes, and null-reset semantics.
when_to_use: >-
  When working with authentication, query building, mutations, pagination, rate limiting, and
  error handling in the SuperOps.ai GraphQL API. Use when: superops api, superops graphql,
  superops authentication, graphql query, graphql mutation, superops pagination, api rate limit
  superops, superops bearer token, or api error superops.
---

# SuperOps.ai API Patterns

## Overview

SuperOps.ai uses a GraphQL API for all integrations. Unlike REST APIs, GraphQL allows you to request exactly the data you need in a single request. This skill covers authentication, query patterns, mutations, pagination, rate limiting, and error handling.

## Authentication

SuperOps.ai uses Bearer token authentication plus a subdomain header. You need:

1. **API Token** - Generated from your profile settings
2. **Customer Subdomain** - Your SuperOps.ai subdomain

### Required Headers

```http
POST /msp
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN
CustomerSubDomain: yourcompany
```

The `CustomerSubDomain` header is non-standard and mandatory — omitting it returns an
authentication failure even with a valid token.

### Generating an API Token

1. Log in to SuperOps.ai
2. Click settings icon > "My Profile"
3. Navigate to "API token" tab
4. Click "Generate token"
5. Copy and securely store the token

**Note:** You can only have one active API token. Regenerating creates a new token and invalidates the old one.

### Environment Variables

```bash
export SUPEROPS_API_KEY="your-api-token"
export SUPEROPS_SUBDOMAIN="yourcompany"
export SUPEROPS_REGION="us"  # or "eu"
```

## API Endpoints

Endpoints are region-specific; using the wrong region fails auth rather than redirecting.

| Platform | Region | Endpoint |
|----------|--------|----------|
| MSP | US | `https://api.superops.ai/msp` |
| MSP | EU | `https://euapi.superops.ai/msp` |
| IT | US | `https://api.superops.ai/it` |
| IT | EU | `https://euapi.superops.ai/it` |

## GraphQL Request Format

### Basic Structure

```json
{
  "query": "query or mutation string",
  "variables": {
    "variableName": "value"
  }
}
```

Nearly every list query takes a single `input` argument of type `ListInfoInput!`, and
mutations take a single `input` of a per-entity input type.

### Query Example

```graphql
query getClientList($input: ListInfoInput!) {
  getClientList(input: $input) {
    clients {
      accountId
      name
      status
    }
    listInfo {
      totalCount
      hasNextPage
      endCursor
    }
  }
}
```

Variables:
```json
{
  "input": {
    "first": 50,
    "filter": {
      "status": "Active"
    }
  }
}
```

### Mutation Example

```graphql
mutation createTicket($input: CreateTicketInput!) {
  createTicket(input: $input) {
    ticketId
    ticketNumber
    subject
    status
  }
}
```

Variables:
```json
{
  "input": {
    "subject": "Issue with email",
    "client": {
      "accountId": "client-uuid"
    },
    "priority": "HIGH"
  }
}
```

## Cursor-Based Pagination

### Pagination Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `first` | Int | Number of items to return (max 500) |
| `after` | String | Cursor for next page |
| `before` | String | Cursor for previous page |
| `last` | Int | Number of items from end |

### Pagination Pattern

Every list result carries a `listInfo` object with `totalCount`, `hasNextPage`,
`hasPreviousPage`, `startCursor`, and `endCursor` (see
[references/examples.md](references/examples.md) for a full response body).

Request `listInfo { hasNextPage endCursor }`, then pass `endCursor` as `after` on the next
call. Loop while `hasNextPage` is true.

First page:
```json
{
  "input": {
    "first": 100
  }
}
```

Next page:
```json
{
  "input": {
    "first": 100,
    "after": "YXJyYXljb25uZWN0aW9uOjk5"
  }
}
```

See [references/examples.md](references/examples.md) for a complete fetch-all-pages
implementation.

## Rate Limiting

- **Limit:** 800 requests per minute
- **Scope:** Per API token
- **Reset:** Rolling 60-second window

### Rate Limit Headers

```http
X-RateLimit-Limit: 800
X-RateLimit-Remaining: 742
X-RateLimit-Reset: 1708012345
```

### Rate Limit Response (HTTP 429)

```json
{
  "errors": [
    {
      "message": "Rate limit exceeded. Please retry after 30 seconds.",
      "extensions": {
        "code": "RATE_LIMITED",
        "retryAfter": 30
      }
    }
  ]
}
```

Honor `extensions.retryAfter` and add jitter. See
[references/examples.md](references/examples.md) for a retry-with-backoff implementation.

## Query Filtering

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `{ "status": "Active" }` |
| `ne` | Not equals | `{ "status": { "ne": "Closed" } }` |
| `in` | In array | `{ "status": ["Open", "In Progress"] }` |
| `contains` | Contains substring | `{ "name": { "contains": "Acme" } }` |
| `startsWith` | Starts with | `{ "name": { "startsWith": "A" } }` |
| `gt` | Greater than | `{ "createdTime": { "gt": "2024-01-01" } }` |
| `gte` | Greater than or equal | `{ "priority": { "gte": "HIGH" } }` |
| `lt` | Less than | `{ "createdTime": { "lt": "2024-02-01" } }` |
| `lte` | Less than or equal | `{ "count": { "lte": 10 } }` |

Equality is implicit — `{ "status": "Active" }` is the `eq` form; a bare array is the
`in` form.

### Complex Filter Example

```json
{
  "input": {
    "filter": {
      "and": [
        { "status": ["Open", "In Progress"] },
        { "priority": { "in": ["Critical", "High"] } },
        {
          "or": [
            { "client": { "accountId": "client-1" } },
            { "client": { "accountId": "client-2" } }
          ]
        }
      ]
    }
  }
}
```

### Ordering Results

```json
{
  "input": {
    "orderBy": {
      "field": "createdTime",
      "direction": "DESC"
    }
  }
}
```

## Date/Time Handling

All dates and times must be in **UTC** with **ISO 8601** format:

```
2024-02-15T10:30:00Z
```

### Date Range Queries

```json
{
  "filter": {
    "createdTime": {
      "gte": "2024-02-01T00:00:00Z",
      "lte": "2024-02-29T23:59:59Z"
    }
  }
}
```

## Error Handling

### Errors return HTTP 200

GraphQL errors arrive in an `errors` array with `data: null` — check `response.errors`
rather than relying on the HTTP status.

```json
{
  "data": null,
  "errors": [
    {
      "message": "Client not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["getClient"],
      "extensions": {
        "code": "NOT_FOUND",
        "field": "accountId"
      }
    }
  ]
}
```

| Code | Description | Resolution |
|------|-------------|------------|
| `UNAUTHENTICATED` | Invalid/missing token | Check API token |
| `FORBIDDEN` | Insufficient permissions | Check user role |
| `NOT_FOUND` | Entity doesn't exist | Verify ID |
| `BAD_REQUEST` | Invalid input | Check query/variables |
| `RATE_LIMITED` | Too many requests | Implement backoff |
| `INTERNAL_ERROR` | Server error | Retry with backoff |

See [references/examples.md](references/examples.md) for an error-dispatch wrapper.

### Null resets a field

- Empty values are represented as `null`
- Passing `null` as input can **reset** a field
- Use `undefined` (don't include field) to leave unchanged

```javascript
// This will CLEAR the assignee
{ "assignee": null }

// This will leave assignee unchanged
{ /* assignee field omitted */ }
```

## Request Best Practices

1. **Request only needed fields** - GraphQL returns exactly what you ask for; over-selecting costs latency
2. **Use variables** - Reusable queries and no injection of raw values into query strings
3. **Batch related queries** - One request with aliases beats several round-trips against the rate limit
4. **Cache reference data** - Client and technician lists change rarely; a short TTL cache saves quota

See [references/examples.md](references/examples.md) for worked good/avoid examples of
each and a complete GraphQL client implementation.

## Related Skills

- [SuperOps.ai Tickets](../tickets/SKILL.md) - Ticket operations
- [SuperOps.ai Assets](../assets/SKILL.md) - Asset queries
- [SuperOps.ai Clients](../clients/SKILL.md) - Client management
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Alert operations
- [SuperOps.ai Runbooks](../runbooks/SKILL.md) - Script execution
