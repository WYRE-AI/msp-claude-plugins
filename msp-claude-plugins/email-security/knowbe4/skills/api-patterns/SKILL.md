---
name: "KnowBe4 API Patterns"
description: >
  Use this skill when working with the KnowBe4 REST API - Bearer token authentication,
  multi-region base URLs, pagination, rate limiting, error handling, and common
  request patterns. Covers all KnowBe4 API regions (US, EU, CA, UK, DE),
  authentication headers, response formats, and retry strategies.
when_to_use: >-
  When working with bearer token authentication, multi-region base URLs, pagination, rate
  limiting, error handling, and common request patterns in the KnowBe4 REST API. Use when: knowbe4
  api, knowbe4 authentication, knowbe4 api key, knowbe4 region, knowbe4 rate limit, knowbe4
  pagination, knowbe4 api error, knowbe4 rest api, knowbe4 base url, or knowbe4 bearer token.
---

# KnowBe4 API Patterns

## Overview

The KnowBe4 Reporting API provides read access to account data including users, groups, phishing campaigns, training campaigns, and risk scores. Authentication uses Bearer token (API key) in the Authorization header. The API is region-specific -- your base URL depends on where your KnowBe4 account is hosted.

## Authentication

### Bearer Token Authentication

KnowBe4 uses a simple API key passed as a Bearer token:

```http
GET /v1/users
Authorization: Bearer YOUR_API_KEY
Accept: application/json
```

**Required Headers:**

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer <API_KEY>` | API authentication token |
| `Accept` | `application/json` | Response format |
| `Content-Type` | `application/json` | Request body format (for POST/PUT) |

### Obtaining an API Key

1. Log into KnowBe4 console as an admin
2. Navigate to **Account Settings > API > API Token**
3. Click **Generate Token** (or copy existing)
4. Store securely -- the token has full read access to your account

### Environment Variables

```bash
export KNOWBE4_API_KEY="your-api-token-here"
export KNOWBE4_REGION="US"  # US, EU, CA, UK, DE
```

## Multi-Region Base URLs

KnowBe4 operates in multiple geographic regions. Your API base URL is determined by your account's region:

| Region | Base URL | Data Center |
|--------|----------|-------------|
| **US** | `https://us.api.knowbe4.com` | United States |
| **EU** | `https://eu.api.knowbe4.com` | European Union (Frankfurt) |
| **CA** | `https://ca.api.knowbe4.com` | Canada |
| **UK** | `https://uk.api.knowbe4.com` | United Kingdom |
| **DE** | `https://de.api.knowbe4.com` | Germany |

### Region Detection

Your region is set when your KnowBe4 account is created and cannot be changed. To determine your region:

1. Log into the KnowBe4 console
2. Check the URL in your browser:
   - `training.knowbe4.com` = US
   - `eu.knowbe4.com` = EU
   - `ca.knowbe4.com` = CA
   - `uk.knowbe4.com` = UK
   - `de.knowbe4.com` = DE

### Building the Full URL

```javascript
function getBaseUrl(region) {
  const regionMap = {
    'US': 'https://us.api.knowbe4.com',
    'EU': 'https://eu.api.knowbe4.com',
    'CA': 'https://ca.api.knowbe4.com',
    'UK': 'https://uk.api.knowbe4.com',
    'DE': 'https://de.api.knowbe4.com'
  };

  return regionMap[region.toUpperCase()] || regionMap['US'];
}

// Example: GET https://us.api.knowbe4.com/v1/users
const url = `${getBaseUrl('US')}/v1/users`;
```

## API Versioning

The current API version is **v1**. All endpoints are prefixed with `/v1/`:

```
https://{region}.api.knowbe4.com/v1/{resource}
```

## Common Endpoints

### Account

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/account` | Account-level information and summary stats |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/users` | List all users |
| GET | `/v1/users/{user_id}` | Get user details |
| GET | `/v1/users/{user_id}/risk_score_history` | User risk score history |

### Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/groups` | List all groups |
| GET | `/v1/groups/{group_id}` | Get group details |
| GET | `/v1/groups/{group_id}/members` | List group members |
| GET | `/v1/groups/{group_id}/risk_score_history` | Group risk score history |

### Phishing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/phishing/campaigns` | List phishing campaigns |
| GET | `/v1/phishing/campaigns/{campaign_id}` | Get campaign details |
| GET | `/v1/phishing/security_tests` | List all security tests |
| GET | `/v1/phishing/security_tests/{pst_id}` | Get security test details |
| GET | `/v1/phishing/security_tests/{pst_id}/recipients` | List test recipients |

### Training

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/training/campaigns` | List training campaigns |
| GET | `/v1/training/campaigns/{campaign_id}` | Get campaign details |
| GET | `/v1/training/enrollments` | List all enrollments |
| GET | `/v1/training/enrollments/{enrollment_id}` | Get enrollment details |

### Store Purchases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/training/store_purchases` | List store purchases |
| GET | `/v1/training/store_purchases/{purchase_id}` | Get purchase details |

## Pagination

### Request Parameters

KnowBe4 uses page-based pagination with query parameters:

```http
GET /v1/users?page=1&per_page=500
```

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | int | 1 | - | Page number (1-based) |
| `per_page` | int | 25 | 500 | Records per page |

### Response Headers

Pagination metadata is returned in response headers:

| Header | Description |
|--------|-------------|
| `Total` | Total number of records |
| `Per-Page` | Records per page |
| `Total-Pages` | Total number of pages |
| `Current-Page` | Current page number |
| `Link` | Links to first, last, next, prev pages |

### Link Header Format

```http
Link: <https://us.api.knowbe4.com/v1/users?page=2&per_page=25>; rel="next",
      <https://us.api.knowbe4.com/v1/users?page=10&per_page=25>; rel="last",
      <https://us.api.knowbe4.com/v1/users?page=1&per_page=25>; rel="first"
```

### Pagination Pattern

```javascript
async function fetchAllPages(endpoint, apiKey, region) {
  const baseUrl = getBaseUrl(region);
  const allItems = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetch(`${baseUrl}${endpoint}?page=${page}&per_page=500`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    allItems.push(...data);

    totalPages = parseInt(response.headers.get('Total-Pages') || '1');
    page++;
  } while (page <= totalPages);

  return allItems;
}
```

## Rate Limiting

### Limits

| Limit | Value | Scope |
|-------|-------|-------|
| Requests per day | 1,000 | Per API token |
| Requests per minute | Not published | Varies by endpoint |

### Rate Limit Response

When rate limited, the API returns HTTP 429:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

### Retry Strategy

```javascript
async function requestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      const jitter = Math.random() * 5000;
      await sleep((retryAfter * 1000) + jitter);
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

### Rate Limit Best Practices

1. **Cache responses** -- User lists and group data change infrequently
2. **Use per_page=500** -- Minimize number of requests needed
3. **Batch reporting queries** -- Combine date ranges where possible
4. **Monitor daily usage** -- Stay well under 1,000 requests/day
5. **Spread requests** -- Avoid bursts; add small delays between calls

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check query parameters |
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | API key lacks required permissions |
| 404 | Not Found | Resource does not exist |
| 429 | Rate Limited | Wait and retry with backoff |
| 500 | Server Error | Retry with exponential backoff |

### Error Response Format

```json
{
  "error": "Description of what went wrong",
  "message": "Additional detail if available"
}
```

### Common Error Scenarios

| Error | Cause | Resolution |
|-------|-------|------------|
| 401 on all requests | Wrong API key | Regenerate token in KnowBe4 console |
| 401 on some requests | Token lacks scope | Check API token permissions |
| 404 on valid ID | Wrong region | Verify KNOWBE4_REGION matches account |
| Empty results | No data in date range | Widen date range or check filters |
| Timeout | Large result set | Use pagination with smaller page sizes |

### Error Handling Pattern

```javascript
async function knowbe4Request(endpoint, options) {
  const response = await requestWithRetry(endpoint, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    switch (response.status) {
      case 401:
        throw new Error('Invalid API key. Regenerate at Account Settings > API > API Token');
      case 403:
        throw new Error('API key lacks required permissions. Check token scope.');
      case 404:
        throw new Error(`Resource not found. Verify the ID and that KNOWBE4_REGION (${process.env.KNOWBE4_REGION}) is correct.`);
      case 429:
        throw new Error('Rate limited. Reduce request frequency.');
      default:
        throw new Error(`KnowBe4 API error ${response.status}: ${error.error || 'Unknown error'}`);
    }
  }

  return response.json();
}
```

## Response Formats

### List Response

List endpoints return a JSON array:

```json
[
  {
    "id": 12345,
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@company.com"
  },
  {
    "id": 12346,
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@company.com"
  }
]
```

### Single Resource Response

Detail endpoints return a JSON object:

```json
{
  "id": 12345,
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@company.com",
  "phish_prone_percentage": 12.5,
  "current_risk_score": 28.3
}
```

### Date Formats

All dates use ISO 8601 format:

```
2024-02-15T14:30:00.000Z
```

## Best Practices

1. **Cache reference data** -- User and group lists change infrequently; cache for 5-15 minutes
2. **Use maximum page size** -- Set `per_page=500` to minimize API calls
3. **Verify region first** -- A wrong region causes confusing 404 errors
4. **Store API key securely** -- Use environment variables or secrets manager, never hardcode
5. **Monitor rate limits** -- Log request counts to avoid hitting daily limits
6. **Handle pagination completely** -- Always check `Total-Pages` header
7. **Use consistent date ranges** -- ISO 8601 format, always include timezone
8. **Test with account endpoint** -- `GET /v1/account` is the simplest way to verify connectivity
9. **Log API errors** -- Include response body for debugging
10. **Implement circuit breaker** -- If API is consistently failing, back off gracefully

## Related Skills

- [KnowBe4 Phishing](../phishing/SKILL.md) - Phishing simulation campaigns
- [KnowBe4 Training](../training/SKILL.md) - Training campaign management
- [KnowBe4 Users](../users/SKILL.md) - User management and risk scores
- [KnowBe4 Reporting](../reporting/SKILL.md) - Security awareness metrics
