---
name: "ConnectWise Automate API Patterns"
description: >
  Use this skill when working with the ConnectWise Automate REST API - authentication
  methods, token management, pagination, filtering with OData syntax, rate limiting,
  and error handling. Covers both integrator and user authentication, request patterns,
  and best practices for API integration.
when_to_use: >-
  When working with authentication methods, token management, pagination, filtering with OData
  syntax, rate limiting, and error handling in the ConnectWise Automate REST API. Use when:
  automate api, automate authentication, automate token, automate query, automate pagination,
  automate filter, automate odata, api rate limit, labtech api, or cwa api.
---

# ConnectWise Automate API Patterns

## Overview

The ConnectWise Automate REST API v1 provides programmatic access to computers, clients, scripts, monitors, alerts, and more. This skill covers authentication, token management, pagination, filtering, error handling, and performance optimization patterns.

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

ConnectWise Automate uses offset-based pagination:

### Pagination Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Page number (1-based) |
| `pageSize` | integer | 50 | 1000 | Items per page |

### Pagination Request

```http
GET /cwa/api/v1/Computers?page=1&pageSize=100
Authorization: Bearer {token}
```

### Pagination Response Headers

| Header | Description |
|--------|-------------|
| `X-Total-Count` | Total number of items |
| `X-Page` | Current page number |
| `X-Page-Size` | Items per page |
| `X-Total-Pages` | Total number of pages |

### Efficient Pagination Pattern

```javascript
async function fetchAllComputers(token, baseUrl) {
  const allComputers = [];
  let page = 1;
  const pageSize = 250;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetch(
      `${baseUrl}/Computers?page=${page}&pageSize=${pageSize}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Get pagination info from headers
    totalPages = parseInt(response.headers.get('X-Total-Pages') || '1');

    const computers = await response.json();
    allComputers.push(...computers);

    page++;

    // Respect rate limits
    if (page <= totalPages) {
      await sleep(100);
    }
  }

  return allComputers;
}
```

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

ConnectWise Automate enforces rate limits to protect server resources.

### Rate Limit Details

| Limit Type | Typical Threshold | Consequence |
|------------|-------------------|-------------|
| Requests per minute | ~60 | HTTP 429 response |
| Concurrent requests | ~10 | Request queuing |
| Daily requests | Varies | May require config change |

### Rate Limit Headers

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests per window |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Seconds until reset |
| `Retry-After` | Seconds to wait (on 429) |

### Rate Limit Handling

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      console.log(`Rate limited. Waiting ${retryAfter}s...`);
      await sleep(retryAfter * 1000);
      continue;
    }

    if (!response.ok && response.status >= 500) {
      // Server error - retry with backoff
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await sleep(delay);
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created |
| 204 | No Content | Success, no body |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Refresh token |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Retry with backoff |
| 503 | Unavailable | Server maintenance |

### Error Response Format

```json
{
  "error": {
    "code": "BadRequest",
    "message": "Invalid filter syntax in condition parameter",
    "details": {
      "field": "condition",
      "value": "Status == 'Online'"
    }
  }
}
```

### Error Handling Pattern

```javascript
class AutomateAPIError extends Error {
  constructor(response, data) {
    super(data?.error?.message || `API Error: ${response.status}`);
    this.status = response.status;
    this.code = data?.error?.code;
    this.details = data?.error?.details;
  }
}

async function handleApiResponse(response) {
  if (response.ok) {
    // Handle empty response
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  const data = await response.json().catch(() => ({}));

  switch (response.status) {
    case 401:
      throw new AutomateAPIError(response, {
        error: {
          code: 'Unauthorized',
          message: 'Token expired or invalid. Re-authenticate.'
        }
      });

    case 403:
      throw new AutomateAPIError(response, {
        error: {
          code: 'Forbidden',
          message: 'Permission denied. Check user rights.'
        }
      });

    case 404:
      throw new AutomateAPIError(response, {
        error: {
          code: 'NotFound',
          message: 'Resource not found.'
        }
      });

    case 429:
      throw new AutomateAPIError(response, {
        error: {
          code: 'RateLimited',
          message: 'Too many requests. Implement backoff.'
        }
      });

    default:
      throw new AutomateAPIError(response, data);
  }
}
```

## Complete API Client

```javascript
class ConnectWiseAutomateClient {
  constructor(server, username, password) {
    this.baseUrl = `https://${server}/cwa/api/v1`;
    this.username = username;
    this.password = password;
    this.token = null;
    this.tokenExpiry = 0;
  }

  async authenticate() {
    const response = await fetch(`${this.baseUrl}/APICredentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Username: this.username,
        Password: this.password
      })
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    this.token = data.AccessToken;
    this.tokenExpiry = Date.now() + (data.ExpiresIn * 1000);

    return this.token;
  }

  async ensureToken() {
    // Refresh token 5 minutes before expiry
    if (!this.token || Date.now() > this.tokenExpiry - 300000) {
      await this.authenticate();
    }
    return this.token;
  }

  async request(endpoint, options = {}) {
    const token = await this.ensureToken();

    const response = await requestWithRetry(
      `${this.baseUrl}${endpoint}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      }
    );

    return handleApiResponse(response);
  }

  // Convenience methods
  async getComputers(condition = null) {
    let url = '/Computers?pageSize=250';
    if (condition) {
      url += `&condition=${encodeURIComponent(condition)}`;
    }
    return this.request(url);
  }

  async getComputer(id) {
    return this.request(`/Computers/${id}`);
  }

  async getClients(condition = null) {
    let url = '/Clients?pageSize=250';
    if (condition) {
      url += `&condition=${encodeURIComponent(condition)}`;
    }
    return this.request(url);
  }

  async getAlerts(condition = null) {
    let url = '/Alerts?pageSize=100';
    if (condition) {
      url += `&condition=${encodeURIComponent(condition)}`;
    }
    return this.request(url);
  }

  async runScript(computerId, scriptId, params = {}) {
    return this.request(
      `/Computers/${computerId}/Scripts/${scriptId}/Execute`,
      {
        method: 'POST',
        body: JSON.stringify({ Parameters: params })
      }
    );
  }
}
```

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
10. **Test in sandbox** - Validate queries before production

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
