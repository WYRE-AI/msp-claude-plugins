---
name: "Microsoft 365 API Patterns"
description: >
  Microsoft Graph fundamentals shared by every M365 skill: Entra token scopes and
  the per-request Bearer model, OData query operators and filter syntax,
  @odata.nextLink pagination, delta queries for incremental sync, 429 throttling
  and retry behavior, JSON batching, and the common Graph error codes.
when_to_use: >-
  When constructing Microsoft Graph requests or debugging Graph errors. Use when: microsoft graph api, graph
  api patterns, m365 api, graph odata, graph pagination, graph throttling, graph batch, graph
  filter syntax, m365 api error, or graph delta query.
---

# Microsoft Graph API Patterns

## Overview

Microsoft Graph is the unified REST API surface for all M365 services (users, mail, calendar, Teams, OneDrive, security). All M365 MCP tools ultimately make Graph calls. Understanding Graph's OData query syntax, pagination model, throttling behavior, and auth patterns is essential for building reliable M365 workflows.

## Anti-triggers

This skill teaches you to compose Graph calls by hand. Two neighbouring
plugins cover the same tenant with almost identical vocabulary, and
choosing the wrong one is the most common routing mistake in the
Microsoft estate:

- **A read-only question about one tenant** — "how many users", "who
  has no MFA registered", "which licences are unassigned". The Graph
  Enterprise MCP answers these from a vetted query catalogue, so nobody
  hand-writes a `$filter`; use the `microsoft-graph` plugin's
  `microsoft-graph-querying` skill. Hand-writing a Graph URL when that
  server is connected is the exact error pattern it exists to prevent.
- **Anything spanning more than one customer tenant** — fleet-wide
  standards, BPA drift, GDAP, or a packaged action such as offboard /
  reset MFA / revoke sessions. Use the `cipp` plugin, which carries the
  multi-tenant scope and per-tenant audit trail this plugin does not.
- **A tenant that authenticates but returns nothing** — that is an app
  registration and admin-consent problem, not a query-syntax problem;
  use `microsoft-graph-connection`.

The short rule: **ask one tenant → `microsoft-graph`; change one tenant
→ this plugin; do either across the fleet → `cipp`.**

## Authentication

### Token Scope for MSP Operations

The Softeria MS-365 MCP server (`--org-mode`) accepts a Bearer token per request via the `Authorization` header. The token must be obtained from Microsoft Entra using the `common` endpoint (multi-tenant) with the following scopes:

| Scope | Purpose |
|-------|---------|
| `https://graph.microsoft.com/.default` | All Graph permissions granted to app |
| `openid` | ID token for tenant ID extraction |
| `profile` | User profile claims |
| `offline_access` | Refresh token for session persistence |

### Base URL

All Graph API calls use:
```
https://graph.microsoft.com/v1.0/
```

Beta features (preview, subject to change):
```
https://graph.microsoft.com/beta/
```

## OData Query Parameters

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `$select` | Return only specified fields | `$select=id,displayName,email` |
| `$filter` | Filter results | `$filter=accountEnabled eq true` |
| `$search` | Full-text search (mailboxes, users) | `$search="displayName:Smith"` |
| `$orderby` | Sort results | `$orderby=displayName asc` |
| `$top` | Limit results per page | `$top=100` |
| `$skip` | Skip N results | `$skip=100` |
| `$count` | Include total count | `$count=true` |
| `$expand` | Include related entities | `$expand=manager` |

### Filter Syntax

```
eq        equal             $filter=accountEnabled eq true
ne        not equal         $filter=jobTitle ne 'Manager'
gt/lt     greater/less      $filter=createdDateTime gt 2024-01-01T00:00:00Z
ge/le     >=, <=            same but inclusive
and/or    logical           $filter=dept eq 'IT' and accountEnabled eq true
not       negation          $filter=not startsWith(mail,'test')
startsWith prefix match     $filter=startsWith(displayName,'J')
endsWith  suffix match      $filter=endsWith(mail,'@contoso.com')
contains  substring         $filter=contains(jobTitle,'Manager')
any/all   collection ops    $filter=assignedLicenses/any(x:x/skuId eq '<guid>')
```

### Advanced Queries (Require `ConsistencyLevel: eventual`)

Some filters require the `ConsistencyLevel: eventual` header and `$count=true`:

```http
GET /v1.0/users?$filter=assignedLicenses/$count eq 0&$count=true&ConsistencyLevel: eventual
```

## Pagination

Graph uses server-side pagination. Always check for `@odata.nextLink` in responses.

### Standard Pagination Loop

```
1. Make initial request with $top=100
2. If response contains @odata.nextLink → follow it
3. Repeat until no @odata.nextLink
```

**Response with more pages:**
```json
{
  "@odata.context": "...",
  "@odata.nextLink": "https://graph.microsoft.com/v1.0/users?$skiptoken=abc123",
  "value": [...]
}
```

**Response — last page:**
```json
{
  "@odata.context": "...",
  "value": [...]
}
```

The Softeria MCP server handles pagination automatically for supported operations.

## Delta Queries (Incremental Sync)

Delta queries return only changed items since the last sync — ideal for regular polling.

### Initial Delta Request

```http
GET /v1.0/users/delta?$select=id,displayName,userPrincipalName,accountEnabled
```

Response includes a `@odata.deltaLink` after the last page — store this.

### Subsequent Delta Requests

```http
GET {deltaLink}
```

Returns only users added, modified, or deleted since the delta token was issued. Deleted users have `"@removed": { "reason": "deleted" }` in the response.

## Throttling and Retry

Graph throttles requests at both per-app and per-tenant levels. Throttled responses return `429 Too Many Requests`.

### Retry-After Header

Always check the `Retry-After` header on 429:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 15
```

Wait the specified seconds before retrying.

### Graph Throttle Limits (Approximate)

| Resource | Limit |
|----------|-------|
| Per app per tenant | 10,000 req/10 min |
| Per user | 3,000 req/10 min |
| Mail search | 10 concurrent |
| Reports | 1 req/15 min per report |

### Best Practices

1. Use `$select` to request only needed fields (reduces payload + throttle pressure)
2. Use `$filter` server-side rather than fetching all and filtering in code
3. Use delta queries for sync operations instead of polling all items
4. Batch unrelated requests (see below) to reduce round-trips

## Batch Requests

Combine up to 20 independent Graph calls into one HTTP request:

```http
POST /v1.0/$batch
Content-Type: application/json

{
  "requests": [
    {
      "id": "1",
      "method": "GET",
      "url": "/users/user1@contoso.com?$select=displayName,accountEnabled"
    },
    {
      "id": "2",
      "method": "GET",
      "url": "/users/user2@contoso.com?$select=displayName,accountEnabled"
    }
  ]
}
```

**Response:**
```json
{
  "responses": [
    { "id": "1", "status": 200, "body": { "displayName": "Alice", "accountEnabled": true } },
    { "id": "2", "status": 200, "body": { "displayName": "Bob", "accountEnabled": false } }
  ]
}
```

Use for fetching details on multiple known user IDs simultaneously.

## Common Error Codes

| HTTP | Code | Meaning | Fix |
|------|------|---------|-----|
| 400 | `Request_BadRequest` | Malformed OData filter | Check filter syntax |
| 401 | `InvalidAuthenticationToken` | Token expired or malformed | Re-authenticate |
| 403 | `Authorization_RequestDenied` | Missing Graph permission | Add scope, re-consent |
| 404 | `Request_ResourceNotFound` | Object doesn't exist | Check GUID/UPN |
| 429 | `ActivityLimitReached` | Throttled | Wait Retry-After seconds |
| 500 | `ServiceInternalServerError` | Graph outage | Retry with backoff |
| 503 | `ServiceUnavailable` | Transient | Retry with backoff |

## Useful Graph Explorer

For testing queries interactively: `https://developer.microsoft.com/graph/graph-explorer`

Log in with a test M365 account to explore API responses before writing code.

## Related Skills

- [M365 Users](../users/SKILL.md) - User query examples
- [M365 Security](../security/SKILL.md) - Audit log query patterns
- [M365 Mailboxes](../mailboxes/SKILL.md) - Search and KQL syntax
