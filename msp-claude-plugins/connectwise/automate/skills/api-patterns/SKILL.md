---
name: "ConnectWise Automate API Patterns"
description: >
  ConnectWise Automate REST API fundamentals: integrator and user+2FA authentication,
  token lifecycle, pagination, OData-style filtering, rate limiting, and error
  handling patterns for API integration.
when_to_use: >-
  When working with authentication methods, token management, pagination, filtering with OData
  syntax, rate limiting, and error handling in the ConnectWise Automate REST API. Use when:
  automate api, automate authentication, automate token, automate query, automate pagination,
  automate filter, automate odata, api rate limit, labtech api, or cwa api.
---

# ConnectWise Automate API Patterns

## Overview

The ConnectWise Automate REST API v1 provides programmatic access to computers, clients, scripts, monitors, alerts, and more. This skill covers authentication, token management, pagination, filtering, error handling, and performance optimization patterns.

## Anti-triggers

"ConnectWise" is an umbrella brand over three products with three
unrelated APIs. Loading the wrong one produces auth failures that read
like permission problems:

- **ConnectWise PSA (Manage)** — hosted at
  `api-*.myconnectwise.net/{codebase}/apis/3.0/`, authenticated with
  public/private key plus a `clientId` header, and filtered with plural
  `conditions=`. An Automate bearer token will not authenticate against
  it. Use `connectwise-psa-api-patterns`.
- **ConnectWise CPQ (Sell/Quosal)** — its own host and credential set
  again; use `connectwise-cpq-api-patterns`.

## Key Concepts

### API Base URL

```
https://{automate-server}/cwa/api/v1/
```

Replace `{automate-server}` with your Automate server hostname.

### Authentication Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| **Integrator** | Server-to-server credentials | API integrations, automation |
| **User + 2FA** | User credentials with optional MFA | User-context operations |

### Authentication Flow

```
┌─────────────┐     1. POST /APICredentials     ┌─────────────────────┐
│   Client    │ ─────────────────────────────>  │  Automate Server    │
│             │     (username + password)       │                     │
│             │ <─────────────────────────────  │                     │
└─────────────┘     2. Access Token + Expiry    └─────────────────────┘
       │
       │  3. API Request with Authorization Header
       ▼
┌───────────────────────────────────────────────────────────────────┐
│  GET /cwa/api/v1/Computers                                        │
│  Authorization: Bearer <access_token>                             │
└───────────────────────────────────────────────────────────────────┘
```

### Token Lifecycle

- **Token Expiry:** Typically 4 hours (configurable on server)
- **Refresh Strategy:** Request new token before expiry
- **Storage:** Cache token securely, reuse until near expiry

## Field Reference

### Environment Variables

```bash
# Integrator credentials (recommended for automation)
export CONNECTWISE_AUTOMATE_SERVER="automate.example.com"
export CONNECTWISE_AUTOMATE_USERNAME="integrator-username"
export CONNECTWISE_AUTOMATE_PASSWORD="integrator-password"

# User credentials with optional 2FA
export CONNECTWISE_AUTOMATE_SERVER="automate.example.com"
export CONNECTWISE_AUTOMATE_USER="username"
export CONNECTWISE_AUTOMATE_PASS="password"
export CONNECTWISE_AUTOMATE_2FA="optional-2fa-key"
```

### Token Response Fields

```typescript
interface TokenResponse {
  AccessToken: string;          // Bearer token for API requests
  TokenType: string;            // "Bearer"
  ExpiresIn: number;            // Seconds until expiry
  RefreshToken: string;         // Token for refresh (if enabled)
  UserID: number;               // Authenticated user ID
  Username: string;             // Authenticated username
}
```

## API Patterns

### Token Acquisition - Integrator

```http
POST /cwa/api/v1/APICredentials
Content-Type: application/json

{
  "Username": "{integrator-username}",
  "Password": "{integrator-password}"
}
```

**Response:**
```json
{
  "AccessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "TokenType": "Bearer",
  "ExpiresIn": 14400,
  "UserID": 1,
  "Username": "integrator"
}
```

### Token Acquisition - User with 2FA

```http
POST /cwa/api/v1/APICredentials
Content-Type: application/json

{
  "Username": "{username}",
  "Password": "{password}",
  "TwoFactorCode": "{6-digit-code}"
}
```

### Request Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer {token}` | Required for all API requests |
| `Content-Type` | `application/json` | Required for POST/PUT/PATCH |
| `Accept` | `application/json` | Response format |

### Token Refresh

```http
POST /cwa/api/v1/APICredentials/Refresh
Content-Type: application/json

{
  "RefreshToken": "{refresh-token}"
}
```

## Pagination

ConnectWise Automate uses offset-based pagination with lowercase `page`/`pageSize`
query parameters (max `pageSize` is 1000):

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Page number (1-based) |
| `pageSize` | integer | 50 | 1000 | Items per page |

```http
GET /cwa/api/v1/Computers?page=1&pageSize=100
Authorization: Bearer {token}
```

Track pagination via response headers rather than assuming page count:

| Header | Description |
|--------|-------------|
| `X-Total-Count` | Total number of items |
| `X-Page` | Current page number |
| `X-Page-Size` | Items per page |
| `X-Total-Pages` | Total number of pages |

See [references/examples.md](references/examples.md) for a complete
`fetchAllComputers` pagination loop that reads `X-Total-Pages` and paces requests to
respect rate limits.

## Filtering with OData

ConnectWise Automate supports OData-style filtering with the `condition` parameter.

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equal | `Status = 'Online'` |
| `!=` | Not equal | `Status != 'Offline'` |
| `>` | Greater than | `ComputerID > 100` |
| `<` | Less than | `TotalMemory < 4096` |
| `>=` | Greater or equal | `Severity >= 3` |
| `<=` | Less or equal | `DiskFreePercent <= 10` |
| `contains` | String contains | `Name contains 'DC'` |
| `startswith` | String starts with | `Name startswith 'ACME'` |
| `endswith` | String ends with | `Name endswith '01'` |
| `in` | Value in list | `Status in ('Online','Offline')` |

### Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `and` | Logical AND | `Status = 'Online' and ClientID = 100` |
| `or` | Logical OR | `Status = 'Offline' or Status = 'Unknown'` |
| `not` | Logical NOT | `not (Status = 'Offline')` |

### Filter Examples

```http
# Computers that are online
GET /cwa/api/v1/Computers?condition=Status = 'Online'

# Computers for a specific client
GET /cwa/api/v1/Computers?condition=ClientID = 100

# Windows servers that are online
GET /cwa/api/v1/Computers?condition=OS contains 'Server' and Status = 'Online'

# Computers with names starting with "ACME"
GET /cwa/api/v1/Computers?condition=Name startswith 'ACME'

# Alerts with severity 3 or higher
GET /cwa/api/v1/Alerts?condition=Severity >= 3

# Active alerts for a client
GET /cwa/api/v1/Alerts?condition=ClientID = 100 and Status in ('New','Active')

# Offline computers with recent contact
GET /cwa/api/v1/Computers?condition=Status = 'Offline' and LastContact >= '2024-02-14'
```

### URL Encoding

Always URL-encode the condition parameter:

```javascript
const condition = "Status = 'Online' and ClientID = 100";
const url = `/Computers?condition=${encodeURIComponent(condition)}`;
```

## Rate Limiting

ConnectWise Automate enforces rate limits to protect server resources (~60 requests
per minute, ~10 concurrent; daily limits vary by config). Exceeding them returns
HTTP 429.

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests per window |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Seconds until reset |
| `Retry-After` | Seconds to wait (on 429) |

On a 429, read `Retry-After` and wait before retrying; on a 5xx, retry with
exponential backoff. See [references/examples.md](references/examples.md) for a
`requestWithRetry` implementation.

## Error Handling

Common statuses: 401 (token expired - re-authenticate), 403 (permission denied), 404
(not found), 429 (rate limited - see Rate Limiting above), 500/503 (retry with
backoff). Error responses are shaped as `{ "error": { "code", "message", "details" } }`.

See [references/errors.md](references/errors.md) for the complete HTTP status code
table, error response format, and a reusable `AutomateAPIError`/`handleApiResponse`
error-handling pattern.

## Complete API Client

A full `ConnectWiseAutomateClient` class that combines token caching, retry-with-backoff,
and pagination-aware request methods (`getComputers`, `getClients`, `getAlerts`,
`runScript`) is available in [references/examples.md](references/examples.md).

## Best Practices

1. **Cache tokens** - Reuse tokens until near expiry
2. **Use integrator credentials** - More reliable for automation
3. **Implement rate limiting** - Stay under ~60 req/min
4. **Use pagination** - Always handle multiple pages
5. **Filter at API level** - Use `condition` parameter, not client-side filtering
6. **Handle errors gracefully** - Implement retry with backoff
7. **URL-encode conditions** - Prevent syntax errors
8. **Log API calls** - Enable debugging and audit trails
9. **Validate inputs** - Check data before sending

## Common Query Patterns

### Get All Online Computers for Client

```javascript
const computers = await client.getComputers(
  "ClientID = 100 and Status = 'Online'"
);
```

### Get Critical Alerts

```javascript
const alerts = await client.getAlerts(
  "Severity >= 3 and Status in ('New','Active')"
);
```

### Search Computers by Name

```javascript
const computers = await client.getComputers(
  "Name contains 'DC'"
);
```

### Get Recently Offline Computers

```javascript
const yesterday = new Date(Date.now() - 86400000).toISOString();
const computers = await client.getComputers(
  `Status = 'Offline' and LastContact >= '${yesterday}'`
);
```

### Batch Operations with Rate Limiting

```javascript
async function batchProcess(items, processor, { batchSize = 10, delayMs = 1000 }) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(item => processor(item).catch(e => ({ error: e.message })))
    );
    results.push(...batchResults);

    // Respect rate limits between batches
    if (i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }

  return results;
}
```

## Related Skills

- [ConnectWise Automate Computers](../computers/SKILL.md) - Computer management
- [ConnectWise Automate Clients](../clients/SKILL.md) - Client management
- [ConnectWise Automate Scripts](../scripts/SKILL.md) - Script execution
- [ConnectWise Automate Monitors](../monitors/SKILL.md) - Monitor management
- [ConnectWise Automate Alerts](../alerts/SKILL.md) - Alert management
