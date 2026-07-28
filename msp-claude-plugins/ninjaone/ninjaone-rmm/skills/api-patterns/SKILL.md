---
name: "NinjaOne API Patterns"
description: >
  NinjaOne Public API fundamentals shared by every other NinjaOne skill: regional
  base URLs, OAuth 2.0 client-credentials auth and scopes, request shapes,
  cursor-based pagination, rate-limit headers and 429 handling, HTTP status codes
  and error response format, and webhook configuration.
when_to_use: >-
  When authenticating to or calling the NinjaOne API, or handling its pagination, rate
  limits, and errors. Use when: ninjaone api, ninjarmm api, ninja authentication, ninja
  oauth, ninja rate limit, or ninja pagination.
---

# NinjaOne API Patterns

## Overview

The NinjaOne Public API uses OAuth 2.0 for authentication and provides RESTful endpoints for all platform operations.

## Regional Endpoints

| Region | Base URL |
|--------|----------|
| United States | `https://app.ninjarmm.com` |
| European Union | `https://eu.ninjarmm.com` |
| Oceania | `https://oc.ninjarmm.com` |

Use the base URL matching your NinjaOne instance region.

## Authentication

### OAuth 2.0 Flow

NinjaOne uses OAuth 2.0 with the following scopes:
- `monitoring` - Read monitoring data
- `management` - Manage devices and organizations
- `control` - Remote control capabilities

### Getting Access Token

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&scope=monitoring management control
```

Response:
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "monitoring management control"
}
```

### Using the Token

Include in all API requests:
```http
GET /api/v2/organizations
Authorization: Bearer eyJ...
```

### Token Refresh

Tokens expire after the `expires_in` period. Request a new token before expiration.

## Creating API Credentials

1. Navigate to **Administration > Apps > API**
2. Click **Add** to create new API credentials
3. Enter a name for the integration
4. Select required scopes
5. Copy Client ID and Client Secret
6. Store credentials securely

## Making Requests

### Standard GET Request

```http
GET /api/v2/organizations
Authorization: Bearer {token}
Accept: application/json
```

### POST with Body

```http
POST /api/v2/organizations
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json

{
  "name": "New Organization",
  "description": "Description here"
}
```

### PATCH for Updates

```http
PATCH /api/v2/device/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "displayName": "Updated Name"
}
```

## Pagination

NinjaOne uses cursor-based pagination:

### Request

```http
GET /api/v2/organizations?pageSize=50
```

### Response

```json
{
  "results": [...],
  "pageInfo": {
    "hasNextPage": true,
    "endCursor": "abc123xyz"
  }
}
```

### Next Page

```http
GET /api/v2/organizations?pageSize=50&after=abc123xyz
```

### Pagination Pattern

```javascript
let cursor = null;
let allResults = [];

do {
  const url = cursor
    ? `/api/v2/organizations?pageSize=100&after=${cursor}`
    : '/api/v2/organizations?pageSize=100';

  const response = await fetch(url, { headers });
  const data = await response.json();

  allResults = allResults.concat(data.results);
  cursor = data.pageInfo.hasNextPage ? data.pageInfo.endCursor : null;

} while (cursor);
```

## Rate Limiting

NinjaOne implements rate limiting to ensure API stability:

### Headers

Watch for these response headers:
- `X-RateLimit-Limit` - Max requests per window
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Window reset time

### 429 Response

When rate limited:
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests",
  "retry_after": 60
}
```

### Best Practices

1. **Implement exponential backoff** - Wait longer after each retry
2. **Respect Retry-After** - Don't retry before indicated time
3. **Cache when possible** - Reduce unnecessary requests
4. **Batch operations** - Combine multiple operations when API allows

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Resource created successfully |
| 204 | No Content | Success, no body |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Refresh token |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify resource exists |
| 409 | Conflict | Resource conflict |
| 422 | Validation Error | Check field values |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "error": "validation_error",
  "message": "Invalid field value",
  "details": {
    "field": "name",
    "issue": "Required field missing"
  }
}
```

### Error Handling Pattern

```javascript
async function makeRequest(url, options) {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || 60;
    await sleep(retryAfter * 1000);
    return makeRequest(url, options);
  }

  if (response.status === 401) {
    await refreshToken();
    return makeRequest(url, options);
  }

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.message, response.status);
  }

  return response.json();
}
```

## Webhooks

### Configure Webhook

```http
PUT /api/v2/webhook
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["ALERT_TRIGGERED", "DEVICE_OFFLINE"]
}
```

### Remove Webhook

```http
DELETE /api/v2/webhook
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `ALERT_TRIGGERED` | New alert created |
| `ALERT_CLEARED` | Alert resolved |
| `DEVICE_ONLINE` | Device connected |
| `DEVICE_OFFLINE` | Device disconnected |

## Best Practices

1. **Use appropriate scopes** - Request the minimum needed (`monitoring`, `management`, `control`)

## Related Skills

- [Devices](../devices/SKILL.md) - Device endpoints
- [Organizations](../organizations/SKILL.md) - Organization endpoints
- [Alerts](../alerts/SKILL.md) - Alert endpoints
- [Tickets](../tickets/SKILL.md) - Ticketing endpoints
