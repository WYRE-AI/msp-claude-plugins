---
name: "Checkpoint Avanan API Patterns"
description: >
  Checkpoint Harmony Email & Collaboration (Avanan) API fundamentals:
  OAuth2 client-credentials authentication, regional base URLs, request
  and pagination patterns, rate limiting, error handling, and performance
  optimization for the Harmony Email API.
when_to_use: >-
  When authenticating to or calling the Checkpoint Harmony Email API directly
  or through MCP tools. Use when: checkpoint api, avanan api, checkpoint
  authentication, checkpoint oauth, avanan oauth, checkpoint rate limit,
  checkpoint pagination, avanan api error, checkpoint rest api, or infinity
  portal api.
---

# Checkpoint Harmony Email API Patterns

## Overview

The Checkpoint Harmony Email & Collaboration (Avanan) API provides programmatic access to email security operations including quarantine management, threat detection, policy configuration, and incident management. This skill covers authentication, request patterns, pagination, rate limiting, error handling, and performance optimization.

## Authentication

### OAuth2 Client Credentials Flow

Checkpoint Harmony Email uses OAuth2 client credentials for API authentication:

**Step 1: Obtain Access Token**

```http
POST https://cloudinfra-gw.portal.checkpoint.com/auth/external
Content-Type: application/json

{
  "clientId": "YOUR_CLIENT_ID",
  "accessKey": "YOUR_CLIENT_SECRET"
}
```

**Response:**
```json
{
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 3600,
    "csrfToken": "abc123..."
  }
}
```

**Step 2: Use Token in Subsequent Requests**

```http
GET https://cloudinfra-gw.portal.checkpoint.com/app/hec-api/v1.0/quarantine
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json
```

### Token Management

| Field | Description |
|-------|-------------|
| `token` | JWT bearer token for API requests |
| `expiresIn` | Token lifetime in seconds (typically 3600 = 1 hour) |
| `csrfToken` | CSRF token for state-changing operations |

Refresh the token proactively — 5 minutes before `expiresIn` elapses — rather than waiting for a 401. See [references/client-examples.md](references/client-examples.md) for a token-refresh client implementation.

### Environment Variables

```bash
export CHECKPOINT_CLIENT_ID="your-client-id"
export CHECKPOINT_CLIENT_SECRET="your-client-secret"
export CHECKPOINT_AVANAN_MCP_URL="https://checkpoint-avanan-mcp.wyre.workers.dev/mcp"
```

## Base URLs

### API Gateway

| Environment | Base URL |
|-------------|----------|
| **Production (US)** | `https://cloudinfra-gw.portal.checkpoint.com` |
| **Production (EU)** | `https://cloudinfra-gw-eu.portal.checkpoint.com` |
| **Production (AP)** | `https://cloudinfra-gw-ap.portal.checkpoint.com` |

### API Paths

| Service | Path Prefix | Description |
|---------|-------------|-------------|
| **Authentication** | `/auth/external` | OAuth2 token endpoint |
| **Email Security** | `/app/hec-api/v1.0` | Harmony Email & Collaboration API |
| **Quarantine** | `/app/hec-api/v1.0/quarantine` | Quarantine operations |
| **Threats** | `/app/hec-api/v1.0/threats` | Threat detection data |
| **Policies** | `/app/hec-api/v1.0/policies` | Policy management |
| **Incidents** | `/app/hec-api/v1.0/incidents` | Incident management |

### Region Detection

The API region depends on where the tenant was provisioned. Use the portal URL to determine the correct API gateway:

| Portal URL | API Gateway |
|-----------|-------------|
| `portal.checkpoint.com` | `cloudinfra-gw.portal.checkpoint.com` |
| `portal.checkpoint.com` (EU data) | `cloudinfra-gw-eu.portal.checkpoint.com` |
| `portal.checkpoint.com` (AP data) | `cloudinfra-gw-ap.portal.checkpoint.com` |

## Request Patterns

### Standard GET Request

```http
GET /app/hec-api/v1.0/quarantine?startDate=2024-02-01&endDate=2024-02-15&limit=50
Authorization: Bearer <token>
Content-Type: application/json
```

### Standard POST Request

```http
POST /app/hec-api/v1.0/quarantine/release
Authorization: Bearer <token>
Content-Type: application/json

{
  "entityIds": ["qe-abc123", "qe-def456"],
  "releaseToRecipients": true,
  "addToAllowList": false
}
```

### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `startDate` | string (ISO 8601) | Start of date range filter | Required for list operations |
| `endDate` | string (ISO 8601) | End of date range filter | Required for list operations |
| `limit` | int | Maximum results per page | 50 |
| `offset` | int | Number of results to skip | 0 |
| `sortBy` | string | Field to sort by | `detectedDate` |
| `sortOrder` | string | ASC or DESC | DESC |

## Pagination

### Offset-Based Pagination

```http
GET /app/hec-api/v1.0/threats?startDate=2024-02-01&endDate=2024-02-15&limit=50&offset=0
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 237,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

Loop on `pagination.hasMore`, incrementing `offset` by `limit` each pass, until the API reports no more pages. See [references/client-examples.md](references/client-examples.md) for a full pagination helper.

### Pagination Limits

| Parameter | Maximum | Notes |
|-----------|---------|-------|
| `limit` | 200 | Results per page |
| Date range | 90 days | Maximum date range per query |
| Total results | 10,000 | Maximum results per query (paginate within this) |

## Rate Limiting

### Rate Limit Thresholds

| Limit Type | Value | Scope |
|-----------|-------|-------|
| **Requests per minute** | 60 | Per API key |
| **Requests per hour** | 1,000 | Per API key |
| **Concurrent requests** | 5 | Per API key |
| **Bulk operations per request** | 100 | Per batch operation |

### Rate Limit Response

When rate limited, the API returns HTTP 429:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1708012800
```

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Retry after 30 seconds."
  }
}
```

### Rate Limit Headers

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Remaining requests in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Retry-After` | Seconds to wait before retrying (on 429) |

### Retry Strategy

On 429, wait `Retry-After` seconds plus jitter before retrying. On 401, refresh the token and retry once. On other failures, use exponential backoff with jitter. See [references/client-examples.md](references/client-examples.md) for a full retry-wrapper implementation.

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created successfully |
| 204 | No Content | Operation succeeded, no body |
| 400 | Bad Request | Check request format/values |
| 401 | Unauthorized | Refresh token or check credentials |
| 403 | Forbidden | Check API key permissions/scope |
| 404 | Not Found | Entity doesn't exist |
| 409 | Conflict | Resource conflict (e.g., already released) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Rate Limited | Implement backoff with Retry-After |
| 500 | Server Error | Retry with exponential backoff |
| 503 | Service Unavailable | Temporary outage, retry later |

### Error Response Format

Errors return an `error` object with `code`, `message`, and (for validation failures) a `details` array naming the offending fields. See [references/errors.md](references/errors.md) for the full response example and the common error-code table.

## Performance Optimization

### Minimize API Calls

Fetch related data in one request using the `include` parameter (e.g., `include: ['iocs', 'timeline', 'relatedEmails']`) instead of issuing separate calls per related resource.

### Parallelize Independent Requests

Issue independent list calls (quarantine, threats, incidents) concurrently rather than sequentially. See [references/client-examples.md](references/client-examples.md) for both patterns as code.

### Use Appropriate Page Sizes

- Small page size (10-25) for interactive UI queries
- Medium page size (50-100) for batch processing
- Maximum page size (200) for data export operations

### Cache Static Data

Cache slowly-changing data to reduce API calls:
- Policy configurations (refresh every 15 minutes)
- Allow/block lists (refresh every 5 minutes)
- Tenant settings (refresh every 30 minutes)

## Best Practices

1. **Refresh tokens proactively** - Refresh 5 minutes before expiry, not after failure
2. **Use the correct regional endpoint** - Mismatched regions return auth errors
3. **Implement exponential backoff** - Handle 429 and 5xx errors gracefully
4. **Monitor rate limit headers** - Track remaining requests to avoid hitting limits
5. **Use bulk operations** - Batch quarantine release/delete instead of individual calls
6. **Paginate large results** - Never fetch unbounded result sets
7. **Cache reference data** - Reduce calls for policies, lists, and settings
8. **Validate before sending** - Check required fields and date ranges client-side
9. **Handle token expiry gracefully** - 401 errors should trigger automatic re-auth

## Related Skills

- [Checkpoint Quarantine](../quarantine/SKILL.md) - Quarantine management
- [Checkpoint Threats](../threats/SKILL.md) - Threat detection and analysis
- [Checkpoint Policies](../policies/SKILL.md) - Policy management
- [Checkpoint Incidents](../incidents/SKILL.md) - Incident investigation
