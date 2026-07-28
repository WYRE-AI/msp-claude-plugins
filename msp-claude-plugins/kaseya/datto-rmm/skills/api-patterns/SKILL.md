---
name: "Datto RMM API Patterns"
description: >
  Datto RMM REST API v2 fundamentals: OAuth 2.0 client-credentials-style
  authentication, the 6 regional platforms (Pinotage, Merlot, Concord,
  Vidal, Zinfandel, Syrah), token lifecycle, cursor-based pagination,
  rate limiting, Unix-millisecond timestamps, and error handling.
when_to_use: >-
  When working with authentication, OAuth 2.0 flow, platform selection, pagination, rate limiting,
  and error handling in the Datto RMM API. Use when: datto api, rmm api, datto authentication, rmm
  query, datto pagination, api rate limit, datto platform, datto oauth, or rmm token.
---

# Datto RMM API Patterns

## Overview

The Datto RMM REST API v2 provides programmatic access to device management, alerts, sites, jobs, and audit data. This skill covers authentication, platform selection, pagination, error handling, and performance optimization patterns.

## Key Concepts

### Platforms

Datto RMM operates across 6 regional platforms. You must use the correct base URL for your account:

| Platform | Region | API Base URL |
|----------|--------|--------------|
| **pinotage** | US/Canada | `https://pinotage-api.centrastage.net` |
| **merlot** | US/Canada | `https://merlot-api.centrastage.net` |
| **concord** | EU | `https://concord-api.centrastage.net` |
| **vidal** | EU | `https://vidal-api.centrastage.net` |
| **zinfandel** | APAC | `https://zinfandel-api.centrastage.net` |
| **syrah** | UK | `https://syrah-api.centrastage.net` |

### Authentication Flow

Datto RMM uses OAuth 2.0 client credentials flow:

```
┌─────────────┐     1. POST /auth/oauth/token     ┌─────────────────┐
│   Client    │ ──────────────────────────────>   │  Datto RMM API  │
│             │     (API Key + Secret)            │                 │
│             │ <────────────────────────────────  │                 │
└─────────────┘     2. Access Token (100h TTL)    └─────────────────┘
       │
       │  3. API Request with Bearer Token
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  GET /api/v2/devices                                            │
│  Authorization: Bearer <access_token>                           │
└─────────────────────────────────────────────────────────────────┘
```

### Token Lifecycle

- **Token Expiry:** 100 hours (approximately 4 days)
- **Refresh Strategy:** Request new token before expiry
- **Storage:** Cache token securely, reuse until near expiry

## Field Reference

### OAuth Token Request

```http
POST https://{platform}-api.centrastage.net/auth/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&username={API_KEY}&password={API_SECRET}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 360000
}
```

### API Request Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer {token}` | OAuth 2.0 access token |
| `Content-Type` | `application/json` | Required for POST/PUT/PATCH |
| `Accept` | `application/json` | Response format |

### Environment Variables

```bash
export DATTO_API_KEY="your-api-key"
export DATTO_API_SECRET="your-api-secret"
export DATTO_PLATFORM="merlot"  # pinotage, merlot, concord, vidal, zinfandel, syrah
```

## API Patterns

### Token Acquisition

```javascript
async function getAccessToken(platform, apiKey, apiSecret) {
  const response = await fetch(
    `https://${platform}-api.centrastage.net/auth/oauth/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: apiKey,
        password: apiSecret
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };
}
```

### Pagination

Datto RMM uses cursor-based pagination with `nextPageUrl`:

**Request:**
```http
GET /api/v2/devices?max=250
Authorization: Bearer {token}
```

**Response:**
```json
{
  "devices": [...],
  "pageDetails": {
    "count": 250,
    "nextPageUrl": "/api/v2/devices?max=250&page=xyz123",
    "prevPageUrl": null
  }
}
```

**Pagination Constants:**
| Parameter | Max Value | Default |
|-----------|-----------|---------|
| `max` | 250 | 50 |

**Efficient Pagination Pattern:**

```javascript
async function fetchAllDevices(token, platform) {
  const allDevices = [];
  let url = `/api/v2/devices?max=250`;

  while (url) {
    const response = await fetch(
      `https://${platform}-api.centrastage.net${url}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const data = await response.json();
    allDevices.push(...data.devices);

    // Get next page URL from response
    url = data.pageDetails?.nextPageUrl || null;
  }

  return allDevices;
}
```

### Rate Limiting

Datto RMM enforces strict rate limits:

| Limit Type | Threshold | Consequence |
|------------|-----------|-------------|
| Requests per minute | 600 | HTTP 429 |
| Sustained high volume | - | IP blocking (1 hour) |

**Rate Limit Headers:**
| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests per window |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Seconds until reset |

**Retry Strategy:**

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        console.log(`Rate limited. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
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

### Timestamp Handling

Datto RMM uses **Unix milliseconds** for all timestamps:

```javascript
// Convert ISO date to Datto timestamp
const dattoTimestamp = new Date('2024-02-15T10:00:00Z').getTime();
// Result: 1707991200000

// Convert Datto timestamp to Date
const jsDate = new Date(1707991200000);
// Result: 2024-02-15T10:00:00.000Z

// Calculate timestamp for "last 24 hours"
const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
```

**Timestamp Query Example:**

```http
GET /api/v2/alerts/open?since=1707991200000
```

## Workflows

See [references/examples.md](references/examples.md) for a complete `DattoRMMClient` class that ties together token caching, retry, and requests.

### Site-Scoped Queries

Many endpoints support site-level filtering:

```http
# Get devices for a specific site
GET /api/v2/site/{siteUid}/devices

# Get alerts for a specific site
GET /api/v2/site/{siteUid}/alerts/open

# Get resolved alerts for a site
GET /api/v2/site/{siteUid}/alerts/resolved
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created successfully |
| 400 | Bad Request | Check request format/parameters |
| 401 | Unauthorized | Refresh token and retry |
| 403 | Forbidden | Check API permissions |
| 404 | Not Found | Entity doesn't exist |
| 429 | Rate Limited | Wait and retry with backoff |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "errorCode": "INVALID_PARAMETER",
  "message": "The device UID is not valid",
  "details": {
    "field": "deviceUid",
    "value": "invalid-uid"
  }
}
```

See [references/errors.md](references/errors.md) for the full `DattoAPIError` class and status-code-to-message mapping pattern.

## Best Practices

1. **Cache tokens** - Reuse tokens until near expiry (100 hours)
2. **Use correct platform** - Verify your account's platform before making requests
3. **Respect rate limits** - Stay under 600 req/min to avoid IP blocking
4. **Use pagination** - Always handle `nextPageUrl` for large result sets
5. **Handle timestamps** - Datto uses Unix milliseconds, not seconds
6. **Implement retry logic** - Use exponential backoff for transient errors
7. **Cache reference data** - Sites and account info change infrequently
8. **Scope queries to sites** - Use site-level endpoints when possible
9. **Monitor rate limit headers** - Track remaining requests proactively

## Common Query Patterns

### Filter by Time Range

```javascript
// Alerts in last 24 hours
const since = Date.now() - (24 * 60 * 60 * 1000);
const url = `/api/v2/alerts/open?since=${since}`;
```

### Device Lookups

```javascript
// By hostname (requires fetching all and filtering)
const devices = await client.getDevices();
const device = devices.find(d =>
  d.hostname.toLowerCase() === hostname.toLowerCase()
);

// By UID (direct lookup)
const device = await client.getDevice(deviceUid);
```

Batch processing with rate-limit-friendly delays is shown in [references/examples.md](references/examples.md).

## Related Skills

- [Datto RMM Devices](../devices/SKILL.md) - Device management
- [Datto RMM Alerts](../alerts/SKILL.md) - Alert handling
- [Datto RMM Sites](../sites/SKILL.md) - Site management
- [Datto RMM Jobs](../jobs/SKILL.md) - Job execution
