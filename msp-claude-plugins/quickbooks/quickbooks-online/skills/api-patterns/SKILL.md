---
name: "QuickBooks Online API Patterns"
description: >
  QuickBooks Online API fundamentals: OAuth2 authentication and token
  lifecycle, REST structure and base URLs, the Intuit query language,
  pagination, minor version headers, SyncToken optimistic locking,
  rate limits, webhooks, and the Fault error object format.
when_to_use: >-
  When authenticating to or calling the QuickBooks Online API directly or through
  MCP tools. Use when: quickbooks api, qbo api, quickbooks
  query, quickbooks authentication, quickbooks oauth, intuit api, quickbooks rate limit,
  quickbooks pagination, quickbooks endpoint, or qbo request.
---

# QuickBooks Online API Patterns

## Overview

The QuickBooks Online (QBO) API is a RESTful JSON API that provides access to customers, invoices, payments, purchases, bills, vendors, accounts, items, estimates, credit memos, and financial reports. This skill covers OAuth2 authentication, the Intuit query language, pagination, error handling, and performance optimization patterns for MSP accounting workflows.

## Anti-triggers

- **Xero's request model** — the other accounting platform here also uses
  OAuth2 and also has a tenant/realm concept, but its query syntax,
  pagination, and concurrency control are entirely different. Use
  `xero-api-patterns`. QBO's SyncToken optimistic locking in particular
  has no Xero equivalent, so a pattern copied across will fail in a way
  that reads like a permissions error.
- **QuickBooks tools missing from the client entirely, or a 401 before any
  call succeeds** — the OAuth grant lives at the gateway, not in client
  config; use `shared-wyre-gateway-troubleshooting`.
- **Which realm am I writing to** — production and sandbox are selected by
  the gateway connection, not by a parameter on the call. Verify before
  any write; the request shapes are identical either way.

## Authentication

### OAuth2 Flow

QuickBooks Online uses OAuth2 for authentication. All API requests require a valid Bearer token in the Authorization header:

```http
GET /v3/company/1234567890/customer/1
Authorization: Bearer eyJlbmMiOiJBMTI4Q0JDLUhT...
Accept: application/json
Content-Type: application/json
```

**Required Headers:**

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer {access_token}` | OAuth2 access token |
| `Accept` | `application/json` | Response format |
| `Content-Type` | `application/json` | Request body format |

### Base URL Pattern

All API endpoints follow the pattern:

```
https://{base}/v3/company/{realmId}/{resource}
```

**Production:**
```
https://quickbooks.api.intuit.com/v3/company/1234567890/invoice
```

**Sandbox:**
```
https://sandbox-quickbooks.api.intuit.com/v3/company/1234567890/invoice
```

The `realmId` (Company ID) is a unique numeric identifier for each QuickBooks company. It is required in every API URL.

### Minor Version Header

QuickBooks Online uses a `minorversion` query parameter to control API behavior. Always specify the latest minor version to access current features:

```http
GET /v3/company/1234567890/customer/1?minorversion=73
Authorization: Bearer {access_token}
```

If omitted, the API defaults to the earliest supported minor version, which may lack newer fields or features.

### Token Lifecycle

| Token | Lifetime | Refresh Method |
|-------|----------|----------------|
| Access Token | 60 minutes | Use refresh token |
| Refresh Token | 100 days | Re-authorize if expired |

See [references/auth.md](references/auth.md) for environment variables, the token refresh implementation, and node-quickbooks SDK setup.

## Intuit Query Language

QuickBooks Online uses a SQL-like query language for searching and filtering entities. Queries are sent via GET request to the `/query` endpoint, and the query parameter value must be URL-encoded.

### Query Syntax

```
SELECT * FROM EntityName WHERE condition [AND condition] [ORDERBY field [ASC|DESC]] [STARTPOSITION n] [MAXRESULTS n]
```

```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Invoice WHERE CustomerRef = '123' AND Balance > '0'&minorversion=73
```

Note that numeric comparison values are quoted as strings (`Balance > '0'`).

### Query Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `CustomerRef = '123'` |
| `!=` | Not equals | `Balance != '0'` |
| `<` | Less than | `Balance < '1000'` |
| `>` | Greater than | `Balance > '0'` |
| `<=` | Less than or equal | `TxnDate <= '2026-01-31'` |
| `>=` | Greater than or equal | `TxnDate >= '2026-01-01'` |
| `LIKE` | Pattern match (% wildcard) | `DisplayName LIKE '%Acme%'` |
| `IN` | Set membership | `Id IN ('1', '2', '3')` |
| `AND` | Logical AND | `Active = true AND Balance > '0'` |

### Query Pagination

Use `STARTPOSITION` and `MAXRESULTS` for pagination:

```sql
SELECT * FROM Customer STARTPOSITION 1 MAXRESULTS 100
SELECT * FROM Customer STARTPOSITION 101 MAXRESULTS 100
SELECT * FROM Customer STARTPOSITION 201 MAXRESULTS 100
```

| Parameter | Description | Default | Maximum |
|-----------|-------------|---------|---------|
| `STARTPOSITION` | 1-based offset | 1 | - |
| `MAXRESULTS` | Results per page | 100 | 1000 |

See [references/api.md](references/api.md) for more query examples and a full pagination loop implementation.

## CRUD Operations

| Operation | Method | Notes |
|-----------|--------|-------|
| Create | POST `/{resource}` | No `Id` in body |
| Read | GET `/{resource}/{id}` | Or use `/query` for collections |
| Update | POST `/{resource}` | POST, not PUT; requires `Id` + `SyncToken` |
| Sparse update | POST `/{resource}` | Add `"sparse": true` to update only supplied fields |
| Delete | POST `/{resource}?operation=delete` | Not supported by all entities |

Most entities support deactivation (set `Active: false`) instead of hard delete.

### SyncToken (Optimistic Locking)

Every entity has a `SyncToken` field that must be included in update requests. This prevents concurrent modification conflicts:

```json
{
  "Id": "123",
  "SyncToken": "2",
  "DisplayName": "Acme Corporation - Updated"
}
```

If the `SyncToken` does not match the current value on the server, the update returns a `5010` stale object error.

See [references/api.md](references/api.md) for the full request/response formats and complete CRUD examples.

## Rate Limiting

| Metric | Limit |
|--------|-------|
| Requests per minute | 500 |
| Concurrent requests | 40 |
| Requests per second per user | 10 |

When rate limited, QBO returns HTTP 429 with a `THROTTLE` fault (code `3001`). Honor the `Retry-After` header and add jitter before retrying. See [references/api.md](references/api.md) for a retry implementation that also handles 401 token refresh.

## Error Handling

QBO returns errors in a structured `Fault` object with a `type` (`AuthenticationFault`, `AuthorizationFault`, `ValidationFault`, `THROTTLE`) and an `Error` array carrying `Message`, `Detail`, and a numeric `code`. Route on `Fault.type` first, then the error `code`.

Most frequently hit codes:

| Code | Type | Resolution |
|------|------|------------|
| 610 | ValidationFault | Check entity ID or referenced objects |
| 6240 | ValidationFault | Duplicate name — use a unique DisplayName |
| 5010 | ValidationFault | Stale object — re-fetch SyncToken and retry |
| 3001 | THROTTLE | Implement backoff |
| 3200 | AuthenticationFault | Refresh access token |

See [references/errors.md](references/errors.md) for the complete HTTP status table, Fault object samples, and an error dispatch implementation.

## Webhooks

QuickBooks Online supports webhooks for real-time notifications when entities change. The payload carries a `realmId` plus a `dataChangeEvent.entities` array of `{ name, id, operation, lastUpdated }`. Configure webhooks in the Intuit Developer Portal under your app's settings.

See [references/api.md](references/api.md) for a full webhook payload example.

## Best Practices

1. **Always include `minorversion`** - Specify the latest version (73) in every request; omitting it silently falls back to the oldest supported version
2. **Use the query endpoint** - Batch lookups with queries instead of individual GETs
3. **Include SyncToken on updates** - Required for all update operations, or you get a 5010 stale object error
4. **Use sparse updates** - Without `sparse: true`, omitted fields are cleared
5. **Encode query strings** - URL-encode the query parameter value
6. **Cache reference data** - Items, accounts, and tax codes change infrequently
7. **Monitor token expiry** - Access tokens expire after 60 minutes; refresh proactively

## Related Skills

- [QBO Customers](../customers/SKILL.md) - Customer management
- [QBO Invoices](../invoices/SKILL.md) - Invoice management
- [QBO Payments](../payments/SKILL.md) - Payment processing
- [QBO Expenses](../expenses/SKILL.md) - Expense tracking
- [QBO Reports](../reports/SKILL.md) - Financial reporting
