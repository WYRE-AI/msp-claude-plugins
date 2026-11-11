---
name: "SuperOps API Patterns"
description: >
  SuperOps.ai GraphQL API fundamentals: Bearer token plus CustomerSubDomain header auth,
  region-specific endpoints, request/variable structure, offset (page/pageSize) pagination, the 800 req/min
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

### Environment Variables (direct API calls only)

Inside Conduit the SuperOps connection holds the token and subdomain, and nothing reads environment variables. These exports are only for calling SuperOps directly, as in `references/examples.md`.

```bash
export SUPEROPS_API_TOKEN="your-api-token"
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

Through Conduit, the typed `superops_*` tools build these requests for you. The
GraphQL below is what `superops_custom_query` and `superops_custom_mutation`
(admin tier) send for anything without a typed tool. Every document validates
against `schema/superops.graphql` in
[superops-mcp](https://github.com/WYRE-AI/superops-mcp).

### Query Example

```graphql
query getClientList($input: ListInfoInput!) {
  getClientList(input: $input) {
    clients {
      accountId
      name
      stage
      status
    }
    listInfo {
      page
      pageSize
      totalCount
      hasMore
    }
  }
}
```

Variables:
```json
{
  "input": {
    "page": 1,
    "pageSize": 50,
    "condition": { "attribute": "stage", "operator": "includes", "value": ["Active"] },
    "sort": [{ "attribute": "name", "order": "ASC" }]
  }
}
```

### Mutation Example

```graphql
mutation createTicket($input: CreateTicketInput!) {
  createTicket(input: $input) {
    ticketId
    displayId
    subject
    status
  }
}
```

Variables (`source` is required):
```json
{
  "input": {
    "subject": "Issue with email",
    "client": { "accountId": "<account id>" },
    "source": "INTEGRATION",
    "priority": "High"
  }
}
```

The typed tool `superops_tickets_create` sends exactly this request.

## Offset Pagination

`ListInfoInput` pages by offset. It has no cursors, and no `first`, `after`,
`hasNextPage` or `endCursor`.

| Input field | Type | Description |
|-------------|------|-------------|
| `page` | Int | 1-based page number |
| `pageSize` | Int | Rows per page. The Conduit tools cap it at 100 |
| `condition` | RuleConditionInput | Filter. See below |
| `sort` | [SortInput] | `{ attribute, order: ASC \| DESC }` |

Every list result carries `listInfo { page pageSize totalCount hasMore }`.
Increment `page` while `hasMore` is `true`. SuperOps returns `null`, never
`false`, on the last page, so treat any falsy value as the end, or page against
`totalCount`.

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

`ListInfoInput` has no `filter` or `orderBy`. A filter is a `condition`
(`RuleConditionInput`), which is either a leaf or a branch:

- leaf: `{ "attribute": "...", "operator": "...", "value": ... }`
- branch: `{ "joinOperator": "AND" | "OR", "operands": [ ...conditions ] }`

### Operators

These are verified live in superops-mcp (`src/utils/conditions.ts`):

| Operator | Value | Notes |
|----------|-------|-------|
| `is`, `isNot` | string | Whole-value match, case-insensitive |
| `contains`, `notContains` | string | Substring match |
| `startsWith`, `endsWith` | string | |
| `includes`, `notIncludes` | array | Matches any or none of the listed values |

`equals` and `in` are rejected with a 500. No range operator (`gt`, `gte`, `lt`,
`lte`) is documented.

### Complex Filter Example

```json
{
  "input": {
    "condition": {
      "joinOperator": "AND",
      "operands": [
        { "attribute": "status", "operator": "includes", "value": ["Open", "On Hold"] },
        { "attribute": "priority", "operator": "includes", "value": ["Critical", "High"] },
        { "attribute": "client", "operator": "includes", "value": ["<account id 1>", "<account id 2>"] }
      ]
    }
  }
}
```

**`joinOperator` must be uppercase.** SuperOps treats `"and"`, or any other
unrecognised value, as `OR` and reports no error, so the filter returns a
superset.

Three mistakes make a filter return zero rows without an error:

- a value outside the field's real set
- a JSON column filtered by its bare name instead of a path into it (`software`
  matches nothing, `software.name` works)
- `includes` on a fragment, because `includes` matches a whole value. Use
  `contains` for substrings

### Ordering Results

```json
{
  "input": {
    "sort": [{ "attribute": "createdTime", "order": "DESC" }]
  }
}
```

## Date/Time Handling

Timestamps are `String` fields in UTC ISO 8601, such as
`2024-02-15T10:30:00Z`. No date-range operator is documented. For a time window,
sort on `createdTime` `DESC`, page until rows fall before the window starts, and
filter the rows yourself.

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
// This will CLEAR the assigned technician
{ "technician": null }

// This will leave the technician unchanged
{ /* technician field omitted */ }
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
