---
name: "HaloPSA API Patterns"
description: >
  Use this skill when working with the HaloPSA REST API - OAuth 2.0 Client Credentials
  authentication, tenant-aware URLs, query building, pagination, rate limiting, and
  error handling. Covers token acquisition, request patterns, retry strategies, and
  best practices for HaloPSA API integration.
when_to_use: >-
  When working with OAuth 2.0 Client Credentials authentication, tenant-aware URLs, query
  building, pagination, rate limiting, and error handling in the HaloPSA REST API. Use when:
  halopsa api, halopsa authentication, halopsa oauth, halopsa token, halopsa query, halopsa
  pagination, halopsa rate limit, halopsa rest, or halo api.
---

# HaloPSA API Patterns

## Overview

The HaloPSA REST API provides access to all PSA entities including tickets, clients, assets, contracts, and more. This skill covers OAuth 2.0 Client Credentials authentication, tenant configuration, query patterns, pagination, and error handling.

## Authentication

### OAuth 2.0 Client Credentials Flow

HaloPSA uses OAuth 2.0 Client Credentials flow for API authentication. This is different from basic API key authentication - you must obtain an access token before making API requests.

### Server URLs

HaloPSA has two server URLs:

| Server | Purpose | Example |
|--------|---------|---------|
| **Authorization Server** | Token endpoint | `https://yourcompany.halopsa.com/auth` |
| **Resource Server** | API endpoints | `https://yourcompany.halopsa.com/api` |

Find these in **Configuration > Integrations > HaloPSA API > API Details**.

### Token Acquisition

**Token Endpoint:**
```
POST https://{base_url}/auth/token?tenant={tenant_name}
```

**Request:**
```bash
curl -X POST "https://yourcompany.halopsa.com/auth/token?tenant=yourcompany" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=all"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "all"
}
```

### Token Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `grant_type` | Yes | Must be `client_credentials` |
| `client_id` | Yes | Application Client ID |
| `client_secret` | Yes | Application Client Secret |
| `scope` | Yes | Permissions scope (use `all` or specific scopes) |
| `tenant` | Conditional | Required for cloud-hosted instances (query parameter) |

### Environment Configuration

```bash
# Required environment variables
export HALOPSA_CLIENT_ID="your-client-id"
export HALOPSA_CLIENT_SECRET="your-client-secret"
export HALOPSA_BASE_URL="https://yourcompany.halopsa.com"
export HALOPSA_TENANT="yourcompany"  # Leave empty for self-hosted
```

### Token Management

```javascript
class HaloPSAAuth {
  constructor(clientId, clientSecret, baseUrl, tenant) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = baseUrl;
    this.tenant = tenant;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiry > Date.now() + 300000) {
      return this.accessToken;
    }

    const tokenUrl = this.tenant
      ? `${this.baseUrl}/auth/token?tenant=${this.tenant}`
      : `${this.baseUrl}/auth/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'all'
      })
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.accessToken;
  }
}
```

## API Request Structure

### Making Authenticated Requests

```http
GET /api/Tickets
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Base URL Structure

| Instance Type | URL Pattern |
|---------------|-------------|
| Cloud-hosted | `https://{company}.halopsa.com/api` |
| Self-hosted | `https://{your-server}/api` |

### Common Endpoints

| Resource | Endpoint | Methods |
|----------|----------|---------|
| Tickets | `/api/Tickets` | GET, POST |
| Clients | `/api/Client` | GET, POST |
| Assets | `/api/Asset` | GET, POST |
| Contracts | `/api/ClientContract` | GET, POST |
| Users | `/api/Users` | GET, POST |
| Actions | `/api/Actions` | GET, POST |
| Sites | `/api/Site` | GET, POST |

## Query Parameters

### Filtering Results

HaloPSA uses query parameters for filtering:

```http
GET /api/Tickets?client_id=123&status_id=1&tickettype_id=5
```

### Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `client_id` | int | Filter by client |
| `status_id` | int | Filter by status |
| `tickettype_id` | int | Filter by ticket type |
| `agent_id` | int | Filter by assigned agent |
| `search` | string | Text search |
| `order` | string | Sort field |
| `orderdesc` | bool | Sort descending |

### Date Filtering

```http
GET /api/Tickets?dateoccurred_start=2024-01-01&dateoccurred_end=2024-01-31
```

## Pagination

### Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page_no` | int | 1 | Page number (1-based) |
| `page_size` | int | 50 | Results per page |
| `count` | int | - | Total count (in response) |

### Paginated Request

```http
GET /api/Tickets?page_no=1&page_size=100
```

### Response Structure

```json
{
  "record_count": 523,
  "tickets": [
    { "id": 1, "summary": "..." },
    { "id": 2, "summary": "..." }
  ]
}
```

### Pagination Pattern

```javascript
async function fetchAllTickets(filters = {}) {
  const allTickets = [];
  let pageNo = 1;
  const pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      ...filters,
      page_no: pageNo,
      page_size: pageSize
    });

    const response = await fetch(`${baseUrl}/api/Tickets?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    allTickets.push(...data.tickets);

    hasMore = data.tickets.length === pageSize;
    pageNo++;
  }

  return allTickets;
}
```

## Rate Limiting

### Rate Limit Behavior

HaloPSA implements rate limiting to protect the API. When rate limited:

- HTTP Status: `429 Too Many Requests`
- Retry-After header may be present

### Rate Limit Response

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please retry after 60 seconds.",
  "retry_after": 60
}
```

### Retry Strategy

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
        const jitter = Math.random() * 5000;
        console.log(`Rate limited. Waiting ${retryAfter}s + jitter`);
        await sleep(retryAfter * 1000 + jitter);
        continue;
      }

      if (response.status === 401) {
        // Token expired, refresh and retry
        await refreshToken();
        options.headers['Authorization'] = `Bearer ${accessToken}`;
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff with jitter
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await sleep(delay);
    }
  }
}
```

### Batch Processing

```javascript
async function batchProcess(items, batchSize = 25, delayMs = 2000) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);

    // Delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }

  return results;
}
```

## CRUD Operations

### Create (POST)

```http
POST /api/Tickets
Authorization: Bearer {token}
Content-Type: application/json

[
  {
    "summary": "New ticket summary",
    "details": "Detailed description",
    "client_id": 123,
    "tickettype_id": 1,
    "status_id": 1,
    "priority_id": 2
  }
]
```

**Note:** HaloPSA expects an array for POST operations, even for single items.

### Read (GET)

**Single entity:**
```http
GET /api/Tickets/54321
```

**List with filters:**
```http
GET /api/Tickets?client_id=123&status_id=1
```

### Update (POST with ID)

```http
POST /api/Tickets
Authorization: Bearer {token}
Content-Type: application/json

[
  {
    "id": 54321,
    "summary": "Updated summary",
    "status_id": 2
  }
]
```

**Note:** Include the `id` field to update an existing record.

### Delete (DELETE)

```http
DELETE /api/Tickets/54321
```

**Note:** Not all entities support deletion. Check entity documentation.

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created |
| 400 | Bad Request | Check request format/values |
| 401 | Unauthorized | Refresh token or check credentials |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "error": "validation_error",
  "message": "Invalid field value",
  "details": [
    {
      "field": "status_id",
      "message": "Status ID 999 does not exist"
    }
  ]
}
```

### Error Handling Pattern

```javascript
function handleApiError(response, data) {
  switch (response.status) {
    case 400:
      console.log('Validation Error:', data.message);
      if (data.details) {
        data.details.forEach(d => {
          console.log(`  Field: ${d.field} - ${d.message}`);
        });
      }
      break;

    case 401:
      console.log('Authentication failed - refreshing token');
      return refreshToken().then(() => retryRequest());

    case 403:
      console.log('Permission denied. Check API application permissions.');
      break;

    case 404:
      console.log('Resource not found');
      break;

    case 429:
      const retryAfter = response.headers.get('Retry-After') || 60;
      console.log(`Rate limited. Retry after ${retryAfter} seconds`);
      break;

    default:
      console.log('API Error:', data);
  }
}
```

## Scopes and Permissions

### Available Scopes

When creating an API application, configure these permissions:

| Scope | Description |
|-------|-------------|
| `all` | Full access to all entities |
| `read:tickets` | Read ticket data |
| `edit:tickets` | Create/update tickets |
| `read:customers` | Read client data |
| `edit:customers` | Create/update clients |
| `read:assets` | Read asset data |
| `edit:assets` | Create/update assets |

### Minimum Recommended Permissions

For typical MSP operations:
- View Customers
- View Support Tickets
- Add Time Entries
- Create Support Tickets
- View Assets

## Best Practices

1. **Cache access tokens** - Tokens are valid for the `expires_in` duration
2. **Use tenant parameter** - Required for cloud-hosted instances
3. **Implement retry logic** - Handle rate limits and transient errors
4. **Batch operations** - Group related requests with delays
5. **Use specific scopes** - Request only needed permissions
6. **Handle token expiry** - Refresh before expiration
7. **Log API calls** - Enable debugging and audit trails
8. **Validate before sending** - Check required fields client-side
9. **Use pagination** - Never fetch unbounded result sets
10. **Monitor rate limits** - Track and respect limits

## Common Issues

### "Invalid grant" Error

**Cause:** Client credentials are incorrect or application is disabled.

**Fix:**
1. Verify Client ID and Secret
2. Check application is active in HaloPSA
3. Ensure permissions are configured

### "Tenant not found" Error

**Cause:** Incorrect or missing tenant parameter.

**Fix:**
1. For cloud-hosted: Use company name from URL
2. For self-hosted: Leave tenant empty

### 401 After Successful Token

**Cause:** Token used with wrong server URL.

**Fix:** Ensure Resource Server URL is correct (`/api` path).

## Related Skills

- [HaloPSA Tickets](../tickets/SKILL.md) - Ticket management
- [HaloPSA Clients](../clients/SKILL.md) - Client management
- [HaloPSA Assets](../assets/SKILL.md) - Asset tracking
- [HaloPSA Contracts](../contracts/SKILL.md) - Contract management
