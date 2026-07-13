---
name: "Proofpoint API Patterns"
description: >
  Use this skill when working with the Proofpoint API - authentication using HTTP
  Basic Auth with service principal and secret, base URLs, rate limits, pagination,
  error codes, and common integration patterns. Covers TAP SIEM API, quarantine API,
  people API, and URL Defense API authentication and usage patterns.
when_to_use: >-
  When working with authentication using HTTP Basic Auth with service principal and secret, base
  URLs, rate limits, pagination, error codes. Use when: proofpoint api, proofpoint authentication,
  proofpoint auth, proofpoint rate limit, proofpoint pagination, proofpoint error, proofpoint base
  url, proofpoint service principal, proofpoint api key, proofpoint rest api, or proofpoint
  credentials.
---

# Proofpoint API Patterns

## Overview

The Proofpoint APIs provide programmatic access to email security data including threat events, quarantine management, people risk analytics, and URL defense. This skill covers authentication, base URLs, rate limiting, pagination, error handling, and best practices for API integration.

Proofpoint operates multiple API endpoints, each serving a different product area. All APIs share the same authentication mechanism but have different base URLs and rate limits.

## Authentication

### HTTP Basic Auth

All Proofpoint APIs use HTTP Basic Authentication with a service principal and secret:

```http
GET /v2/siem/all?sinceSeconds=3600
Host: tap-api.proofpoint.com
Authorization: Basic <base64(service_principal:service_secret)>
Content-Type: application/json
```

**Constructing the Authorization Header:**

```javascript
const credentials = Buffer.from(`${servicePrincipal}:${serviceSecret}`).toString('base64');
const headers = {
  'Authorization': `Basic ${credentials}`,
  'Content-Type': 'application/json'
};
```

```bash
# Using curl
curl -u "SERVICE_PRINCIPAL:SERVICE_SECRET" \
  "https://tap-api.proofpoint.com/v2/siem/all?sinceSeconds=3600"
```

### Environment Variables

```bash
export PROOFPOINT_SERVICE_PRINCIPAL="your-service-principal"
export PROOFPOINT_SERVICE_SECRET="your-service-secret"
export PROOFPOINT_MCP_URL="https://proofpoint-mcp.wyre.workers.dev/mcp"
```

### Obtaining Credentials

1. Log into the **Proofpoint TAP Dashboard** at `https://threatinsight.proofpoint.com`
2. Navigate to **Settings > Connected Applications**
3. Click **Create New Credential**
4. Copy the **Service Principal** and **Service Secret**
5. Store securely - the secret is shown only once

**Important:** Service credentials are scoped to your organization. Each MSP client organization requires its own set of credentials.

## Base URLs

### API Endpoints

| API | Base URL | Description |
|-----|----------|-------------|
| **TAP SIEM** | `https://tap-api.proofpoint.com` | Threat events, clicks, messages |
| **People** | `https://tap-api.proofpoint.com` | VAP reports, top clickers, user risk |
| **Quarantine** | `https://tap-api.proofpoint.com` | Quarantine management |
| **Forensics** | `https://tap-api.proofpoint.com` | Threat response and investigation |
| **URL Defense** | `https://tap-api.proofpoint.com` | URL decoding and analysis |

**Note:** All APIs currently share the same base URL (`tap-api.proofpoint.com`) but are versioned and namespaced separately in the path.

### API Versioning

| API | Version | Path Prefix | Example |
|-----|---------|-------------|---------|
| TAP SIEM | v2 | `/v2/siem/` | `/v2/siem/all?sinceSeconds=3600` |
| People | v2 | `/v2/people/` | `/v2/people/vap?window=30` |
| Campaign | v1 | `/v1/campaign/` | `/v1/campaign/{campaignId}` |
| Forensics | v2 | `/v2/forensics/` | `/v2/forensics?threatId={id}` |
| URL Defense | v2 | `/v2/url/` | `/v2/url/decode` |

## Rate Limiting

### Rate Limit Tiers

| API | Requests per Hour | Burst Limit | Notes |
|-----|-------------------|-------------|-------|
| TAP SIEM | 1000 | 10/sec | Per service principal |
| People | 500 | 5/sec | Per service principal |
| Quarantine | 500 | 5/sec | Per service principal |
| Forensics | 500 | 5/sec | Per service principal |
| URL Defense | 1000 | 10/sec | Per service principal |

### Rate Limit Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1708012800
```

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |

### Rate Limit Response (HTTP 429)

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please retry after the rate limit window resets.",
  "retryAfter": 60
}
```

### Retry Strategy

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      const jitter = Math.random() * 5000;
      await sleep(retryAfter * 1000 + jitter);
      continue;
    }

    if (response.status >= 500) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await sleep(delay);
      continue;
    }

    return response;
  }

  throw new Error(`Request failed after ${maxRetries} retries`);
}
```

## Pagination

### TAP SIEM API Pagination

The TAP SIEM API does not use traditional offset-based pagination. Instead, it uses time-based windowing:

```http
GET /v2/siem/all?sinceSeconds=3600
GET /v2/siem/all?sinceTime=2024-02-15T00:00:00Z
GET /v2/siem/all?interval=PT30M/2024-02-15T12:00:00Z
```

| Parameter | Description | Max |
|-----------|-------------|-----|
| `sinceSeconds` | Events from N seconds ago to now | 86400 (24h) |
| `sinceTime` | Events from timestamp to now | 24h from now |
| `interval` | ISO 8601 interval (duration/end) | 1 hour window |

### Quarantine API Pagination

```http
GET /v2/quarantine/search?limit=25&offset=0
GET /v2/quarantine/search?limit=25&offset=25
```

| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `limit` | Results per page | 25 | 500 |
| `offset` | Starting offset | 0 | - |

### People API Pagination

```http
GET /v2/people/vap?window=30&size=100&page=1
```

| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `size` | Results per page | 100 | 1000 |
| `page` | Page number (1-based) | 1 | - |

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 204 | No content | No events in the specified window |
| 400 | Bad request | Check request parameters |
| 401 | Unauthorized | Verify service principal and secret |
| 403 | Forbidden | Check API access permissions |
| 404 | Not found | Resource does not exist |
| 429 | Rate limited | Implement backoff and retry |
| 500 | Server error | Retry with exponential backoff |
| 503 | Service unavailable | Retry after brief delay |

### Error Response Format

```json
{
  "error": "Bad Request",
  "message": "The sinceSeconds parameter must be between 1 and 86400.",
  "status": 400
}
```

### Common Error Scenarios

| Error | Cause | Resolution |
|-------|-------|------------|
| 401 with valid credentials | Credentials may be expired | Regenerate in TAP dashboard |
| 403 on People API | License does not include People | Upgrade license or contact Proofpoint |
| 400 on time range | Window exceeds 24 hours | Reduce sinceSeconds to <= 86400 |
| 204 on SIEM query | No events in time window | Normal - no threats in the period |
| 404 on campaign | Campaign ID is invalid or old | Verify ID from TAP event data |

## Request Patterns

### TAP SIEM All Events

```http
GET /v2/siem/all?format=json&sinceSeconds=3600
Authorization: Basic <credentials>
```

### TAP Messages Blocked

```http
GET /v2/siem/messages/blocked?format=json&sinceSeconds=3600
Authorization: Basic <credentials>
```

### TAP Messages Delivered

```http
GET /v2/siem/messages/delivered?format=json&sinceSeconds=3600
Authorization: Basic <credentials>
```

### TAP Clicks Permitted

```http
GET /v2/siem/clicks/permitted?format=json&sinceSeconds=3600
Authorization: Basic <credentials>
```

### People VAP Report

```http
GET /v2/people/vap?window=30&size=20
Authorization: Basic <credentials>
```

### Campaign Details

```http
GET /v1/campaign/{campaignId}
Authorization: Basic <credentials>
```

### Forensics Report

```http
GET /v2/forensics?threatId={threatId}
Authorization: Basic <credentials>
```

## Response Patterns

### TAP SIEM Response Structure

```json
{
  "queryEndTime": "2024-02-15T12:00:00Z",
  "messagesBlocked": [...],
  "messagesDelivered": [...],
  "clicksBlocked": [...],
  "clicksPermitted": [...]
}
```

### People VAP Response Structure

```json
{
  "users": [
    {
      "identity": {
        "guid": "abc123",
        "customerUserId": null,
        "emails": ["user@example.com"],
        "name": "John Smith",
        "department": "Finance",
        "location": "New York",
        "title": "CFO",
        "vip": true
      },
      "threatStatistics": {
        "attackIndex": 856,
        "families": [
          {"name": "Emotet", "count": 12},
          {"name": "QBot", "count": 8}
        ]
      }
    }
  ],
  "totalVapUsers": 150
}
```

## Performance Optimization

### Minimize Polling Frequency

```javascript
// Good: Poll every 5 minutes for near-real-time
setInterval(() => fetchTAPEvents('sinceSeconds=300'), 5 * 60 * 1000);

// Avoid: Polling every 10 seconds burns rate limit
setInterval(() => fetchTAPEvents('sinceSeconds=10'), 10 * 1000);
```

### Use Appropriate Time Windows

```javascript
// Good: Fetch only new events since last poll
const lastPoll = getLastPollTime();
fetch(`/v2/siem/all?sinceTime=${lastPoll.toISOString()}`);

// Avoid: Always fetching full 24 hours
fetch('/v2/siem/all?sinceSeconds=86400');
```

### Cache Reference Data

Cache data that changes infrequently:
- VAP reports (refresh daily)
- Top clickers (refresh daily)
- Campaign details (cache by campaign ID)
- URL verdicts (cache for 5-15 minutes)

## Best Practices

1. **Store credentials securely** - Use environment variables or a secrets manager, never commit to code
2. **One credential set per client** - Each MSP client needs their own service principal
3. **Monitor rate limit headers** - Track `X-RateLimit-Remaining` to avoid hitting limits
4. **Implement exponential backoff** - Always retry with increasing delays on 429 and 5xx
5. **Use time-based polling** - Track your last poll time and only fetch new events
6. **Handle 204 gracefully** - No content is normal when there are no events
7. **Validate timestamps** - Ensure `sinceTime` is within the 24-hour maximum window
8. **Log API calls** - Maintain audit logs of all API calls for troubleshooting
9. **Test with small windows** - Start with `sinceSeconds=300` (5 minutes) when testing
10. **Parallelize across APIs** - TAP, People, and Quarantine have independent rate limits

## Related Skills

- [Proofpoint TAP](../tap/SKILL.md) - TAP SIEM API usage
- [Proofpoint Quarantine](../quarantine/SKILL.md) - Quarantine API usage
- [Proofpoint People](../people/SKILL.md) - People API usage
- [Proofpoint URL Defense](../url-defense/SKILL.md) - URL Defense API usage
