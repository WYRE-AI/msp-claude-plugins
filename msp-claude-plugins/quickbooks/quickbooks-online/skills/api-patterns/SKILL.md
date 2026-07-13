---
name: "QuickBooks Online API Patterns"
description: >
  Use this skill when working with the QuickBooks Online API - OAuth2
  authentication, REST structure, Intuit query language, pagination,
  rate limiting, error handling, minor version headers, and best
  practices. Covers base URL patterns, sandbox vs production, and
  the Fault error object format.
when_to_use: >-
  When working with OAuth2 authentication, REST structure, Intuit query language, pagination, rate
  limiting, error handling, minor version headers. Use when: quickbooks api, qbo api, quickbooks
  query, quickbooks authentication, quickbooks oauth, intuit api, quickbooks rate limit,
  quickbooks pagination, quickbooks endpoint, or qbo request.
---

# QuickBooks Online API Patterns

## Overview

The QuickBooks Online (QBO) API is a RESTful JSON API that provides access to customers, invoices, payments, purchases, bills, vendors, accounts, items, estimates, credit memos, and financial reports. This skill covers OAuth2 authentication, the Intuit query language, pagination, error handling, and performance optimization patterns for MSP accounting workflows.

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

### Environment Variables

```bash
export QBO_CLIENT_ID="your-client-id"
export QBO_CLIENT_SECRET="your-client-secret"
export QBO_REALM_ID="your-company-id"
export QBO_ACCESS_TOKEN="your-access-token"
export QBO_REFRESH_TOKEN="your-refresh-token"
export QBO_ENVIRONMENT="production"  # or "sandbox"
```

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

### Token Refresh Flow

```javascript
const OAuthClient = require('intuit-oauth');

const oauthClient = new OAuthClient({
  clientId: process.env.QBO_CLIENT_ID,
  clientSecret: process.env.QBO_CLIENT_SECRET,
  environment: process.env.QBO_ENVIRONMENT || 'production',
  redirectUri: 'http://localhost:3000/callback'
});

async function refreshAccessToken() {
  oauthClient.setToken({
    access_token: process.env.QBO_ACCESS_TOKEN,
    refresh_token: process.env.QBO_REFRESH_TOKEN,
    token_type: 'bearer'
  });

  const authResponse = await oauthClient.refresh();
  const newTokens = authResponse.getJson();

  // Store new tokens securely
  process.env.QBO_ACCESS_TOKEN = newTokens.access_token;
  process.env.QBO_REFRESH_TOKEN = newTokens.refresh_token;

  return newTokens;
}
```

### Using node-quickbooks SDK

The `node-quickbooks` SDK (61k weekly downloads) simplifies authentication and API calls:

```javascript
const QuickBooks = require('node-quickbooks');

const qbo = new QuickBooks(
  process.env.QBO_CLIENT_ID,
  process.env.QBO_CLIENT_SECRET,
  process.env.QBO_ACCESS_TOKEN,
  false, // no token secret (OAuth2)
  process.env.QBO_REALM_ID,
  process.env.QBO_ENVIRONMENT === 'sandbox',
  true,  // enable debug
  null,  // minor version (null = latest)
  '2.0', // OAuth version
  process.env.QBO_REFRESH_TOKEN
);
```

## Intuit Query Language

QuickBooks Online uses a SQL-like query language for searching and filtering entities. Queries are sent via GET request to the `/query` endpoint.

### Query Syntax

```
SELECT * FROM EntityName WHERE condition [AND condition] [ORDERBY field [ASC|DESC]] [STARTPOSITION n] [MAXRESULTS n]
```

### Query Examples

**Find customers by name:**
```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Customer WHERE DisplayName LIKE '%Acme%'&minorversion=73
```

**Find unpaid invoices for a customer:**
```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Invoice WHERE CustomerRef = '123' AND Balance > '0'&minorversion=73
```

**Find recent invoices:**
```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Invoice WHERE TxnDate > '2026-01-01' ORDERBY TxnDate DESC&minorversion=73
```

**Find active items:**
```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Item WHERE Active = true&minorversion=73
```

**Count customers:**
```http
GET /v3/company/{realmId}/query?query=SELECT COUNT(*) FROM Customer&minorversion=73
```

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

**Pagination Details:**

| Parameter | Description | Default | Maximum |
|-----------|-------------|---------|---------|
| `STARTPOSITION` | 1-based offset | 1 | - |
| `MAXRESULTS` | Results per page | 100 | 1000 |

### Iterating All Results

```javascript
async function queryAll(entityName, whereClause = '') {
  const allResults = [];
  let startPosition = 1;
  const maxResults = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = `SELECT * FROM ${entityName}`;
    if (whereClause) query += ` WHERE ${whereClause}`;
    query += ` STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;

    const response = await fetch(
      `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=73`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
    );

    const data = await response.json();
    const entities = data.QueryResponse[entityName] || [];
    allResults.push(...entities);

    hasMore = entities.length === maxResults;
    startPosition += maxResults;
  }

  return allResults;
}
```

## Request Format

### Standard JSON Request

QuickBooks Online uses standard JSON for request and response bodies:

```json
{
  "DisplayName": "Acme Corporation",
  "PrimaryPhone": {
    "FreeFormNumber": "555-123-4567"
  },
  "PrimaryEmailAddr": {
    "Address": "billing@acmecorp.com"
  }
}
```

### Response Format

**Single Resource (Read/Create/Update):**
```json
{
  "Customer": {
    "Id": "123",
    "DisplayName": "Acme Corporation",
    "Balance": 5000.00,
    "SyncToken": "2",
    "MetaData": {
      "CreateTime": "2025-06-15T10:30:00-07:00",
      "LastUpdatedTime": "2026-01-20T14:22:00-07:00"
    }
  },
  "time": "2026-02-23T10:00:00.000-07:00"
}
```

**Query Response (Collection):**
```json
{
  "QueryResponse": {
    "Customer": [
      { "Id": "1", "DisplayName": "Acme Corporation", "Balance": 5000.00 },
      { "Id": "2", "DisplayName": "TechStart Inc", "Balance": 1200.00 }
    ],
    "startPosition": 1,
    "maxResults": 2,
    "totalCount": 2
  },
  "time": "2026-02-23T10:00:00.000-07:00"
}
```

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

## CRUD Operations

### Create (POST)

```http
POST /v3/company/{realmId}/customer?minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "DisplayName": "New MSP Client LLC",
  "CompanyName": "New MSP Client LLC",
  "PrimaryPhone": { "FreeFormNumber": "555-867-5309" },
  "PrimaryEmailAddr": { "Address": "billing@newclient.com" }
}
```

### Read (GET)

**Single resource by ID:**
```http
GET /v3/company/{realmId}/customer/123?minorversion=73
Authorization: Bearer {access_token}
```

**Query for collection:**
```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Customer WHERE Active = true&minorversion=73
Authorization: Bearer {access_token}
```

### Update (POST with full object)

QuickBooks Online uses POST (not PUT) for updates. You must include `Id` and `SyncToken`, plus the `sparse` flag for partial updates:

**Full update:**
```http
POST /v3/company/{realmId}/customer?minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "Id": "123",
  "SyncToken": "2",
  "DisplayName": "Acme Corporation - Updated",
  "CompanyName": "Acme Corporation",
  "PrimaryPhone": { "FreeFormNumber": "555-123-9999" }
}
```

**Sparse update (partial):**
```json
{
  "Id": "123",
  "SyncToken": "2",
  "sparse": true,
  "PrimaryPhone": { "FreeFormNumber": "555-123-9999" }
}
```

### Delete (POST)

Not all entities support delete. For those that do, use the delete operation:

```http
POST /v3/company/{realmId}/customer?operation=delete&minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "Id": "123",
  "SyncToken": "2"
}
```

Most entities support deactivation (set `Active: false`) instead of hard delete.

## Rate Limiting

### Rate Limit Details

| Metric | Limit |
|--------|-------|
| Requests per minute | 500 |
| Concurrent requests | 40 |
| Requests per second per user | 10 |

### Rate Limit Response

When rate limited, QBO returns HTTP 429:

```json
{
  "Fault": {
    "Error": [
      {
        "Message": "Request throttled",
        "Detail": "Rate limit reached. Please retry later.",
        "code": "3001"
      }
    ],
    "type": "THROTTLE"
  },
  "time": "2026-02-23T10:00:00.000-07:00"
}
```

### Retry Strategy

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        const jitter = Math.random() * 5000;
        await new Promise(r => setTimeout(r, retryAfter * 1000 + jitter));
        continue;
      }

      if (response.status === 401) {
        // Token may have expired -- attempt refresh
        await refreshAccessToken();
        options.headers.Authorization = `Bearer ${process.env.QBO_ACCESS_TOKEN}`;
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 401 | Unauthorized | Refresh access token |
| 403 | Forbidden | Check OAuth scopes |
| 404 | Not Found | Check realmId and entity ID |
| 429 | Rate Limited | Back off and retry |
| 400 | Bad Request | Check request format |
| 500 | Server Error | Retry with backoff |
| 503 | Service Unavailable | Retry with backoff |

### Fault Object Format

QBO returns errors in a structured `Fault` object:

```json
{
  "Fault": {
    "Error": [
      {
        "Message": "Object Not Found",
        "Detail": "Object Not Found : Something you're trying to use has been made inactive. Check the fields with accounts, customers, items, vendors or employees.",
        "code": "610",
        "element": ""
      }
    ],
    "type": "ValidationFault"
  },
  "time": "2026-02-23T10:00:00.000-07:00"
}
```

### Common Error Codes

| Code | Type | Message | Resolution |
|------|------|---------|------------|
| 610 | ValidationFault | Object Not Found | Check entity ID or referenced objects |
| 6240 | ValidationFault | Duplicate Name | Use a unique DisplayName |
| 5010 | ValidationFault | Stale Object | Re-fetch SyncToken and retry |
| 3001 | THROTTLE | Request throttled | Implement backoff |
| 3200 | AuthenticationFault | Auth failed | Refresh access token |

### Error Handling Pattern

```javascript
function handleQboError(response, body) {
  if (!body.Fault) return;

  const fault = body.Fault;
  const errors = fault.Error || [];
  const firstError = errors[0] || {};

  switch (fault.type) {
    case 'AuthenticationFault':
      console.log('Authentication failed. Refresh your access token.');
      break;
    case 'AuthorizationFault':
      console.log('Insufficient permissions. Check OAuth scopes.');
      break;
    case 'ValidationFault':
      if (firstError.code === '5010') {
        console.log('Stale object. Re-fetch the entity and retry with updated SyncToken.');
      } else if (firstError.code === '6240') {
        console.log('Duplicate name. Use a unique DisplayName.');
      } else {
        console.log(`Validation error: ${firstError.Message} - ${firstError.Detail}`);
      }
      break;
    case 'THROTTLE':
      console.log('Rate limited. Wait before retrying.');
      break;
    default:
      console.log(`Unknown error: ${JSON.stringify(fault)}`);
  }
}
```

## Webhooks

QuickBooks Online supports webhooks for real-time notifications when entities change:

```json
{
  "eventNotifications": [
    {
      "realmId": "1234567890",
      "dataChangeEvent": {
        "entities": [
          {
            "name": "Invoice",
            "id": "456",
            "operation": "Create",
            "lastUpdated": "2026-02-23T10:00:00.000-07:00"
          }
        ]
      }
    }
  ]
}
```

Configure webhooks in the Intuit Developer Portal under your app's settings.

## Best Practices

1. **Always include `minorversion`** - Specify the latest version (73) in every request
2. **Use the query endpoint** - Batch lookups with queries instead of individual GETs
3. **Implement token refresh** - Automatically refresh tokens before they expire
4. **Include SyncToken on updates** - Required for all update operations
5. **Use sparse updates** - Set `sparse: true` to update only changed fields
6. **Handle rate limits** - Stay under 500 requests/minute with exponential backoff
7. **Encode query strings** - URL-encode the query parameter value
8. **Cache reference data** - Items, accounts, and tax codes change infrequently
9. **Use sandbox for testing** - Test against sandbox before production
10. **Monitor token expiry** - Access tokens expire after 60 minutes; refresh proactively

## Related Skills

- [QBO Customers](../customers/SKILL.md) - Customer management
- [QBO Invoices](../invoices/SKILL.md) - Invoice management
- [QBO Payments](../payments/SKILL.md) - Payment processing
- [QBO Expenses](../expenses/SKILL.md) - Expense tracking
- [QBO Reports](../reports/SKILL.md) - Financial reporting
