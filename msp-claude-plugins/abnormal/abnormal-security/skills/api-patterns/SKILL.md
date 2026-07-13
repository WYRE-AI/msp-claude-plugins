---
name: "Abnormal Security API Patterns"
description: >
  Use this skill when working with the Abnormal Security REST API -
  Bearer token authentication, base URLs, rate limiting, pagination,
  OData filtering, error handling, and common API patterns. Covers
  token management, request/response formats, and integration best practices.
  Essential for developers and MSP administrators integrating with the
  Abnormal Security API.
when_to_use: >-
  When working with bearer token authentication, base URLs, rate limiting, pagination, OData
  filtering, error handling, and common API patterns in the Abnormal Security REST API. Use when:
  abnormal api, abnormal authentication, abnormal rest api, abnormal rate limit, abnormal
  pagination, abnormal api error, abnormal api token, abnormal odata filter, or abnormal security
  api.
---

# Abnormal Security REST API Patterns

## Overview

The Abnormal Security REST API provides programmatic access to threat detection, abuse mailbox cases, account takeover protection, vendor risk assessment, and message analysis. This skill covers authentication, request patterns, pagination, filtering, rate limiting, error handling, and performance optimization.

## Authentication

### Bearer Token Authentication

Abnormal Security uses a static Bearer token for API authentication:

```http
GET https://api.abnormalplatform.com/v1/threats
Authorization: Bearer YOUR_API_TOKEN
Accept: application/json
```

### Token Management

| Field | Description |
|-------|-------------|
| Type | Static API token (no expiry rotation required) |
| Format | Long alphanumeric string |
| Header | `Authorization: Bearer <token>` |
| Scope | Full API access (determined at token creation) |

### Environment Variables

```bash
export ABNORMAL_API_TOKEN="your-api-token"
export ABNORMAL_MCP_URL="https://mcp.wyre.ai/v1/abnormal-security/mcp"
```

### MCP Gateway Headers

When used through the MCP Gateway, credentials are passed via the `Authorization` header:

```json
{
  "headers": {
    "Authorization": "Bearer ${ABNORMAL_API_TOKEN}"
  }
}
```

The gateway forwards this header to the Abnormal Security MCP server, which uses it to authenticate with the Abnormal API.

## Base URL

| Environment | Base URL |
|-------------|----------|
| **Production** | `https://api.abnormalplatform.com` |

### API Paths

| Service | Path | Description |
|---------|------|-------------|
| **Threats** | `/v1/threats` | Threat detection data |
| **Threat Details** | `/v1/threats/{threatId}` | Individual threat details |
| **Cases** | `/v1/cases` | Abuse mailbox cases |
| **Case Details** | `/v1/cases/{caseId}` | Individual case details |
| **Account Takeover** | `/v1/account-takeover/cases` | ATO cases |
| **Vendors** | `/v1/vendors` | VendorBase vendor risk |
| **Messages** | `/v1/threats/{threatId}/messages` | Messages for a threat |

## Request Patterns

### Standard GET Request

```http
GET /v1/threats?pageSize=25&pageNumber=1
Authorization: Bearer <token>
Accept: application/json
```

### GET with OData Filter

```http
GET /v1/threats?filter=attackType eq 'BEC'&pageSize=25
Authorization: Bearer <token>
Accept: application/json
```

### Standard Response Format

```json
{
  "threats": [
    {
      "threatId": "184def76-3c28-4e1b-9ef0-a5abc123def4",
      "attackType": "BEC",
      "attackStrategy": "Invoice/Payment Fraud",
      "sentTime": "2026-03-25T14:30:00Z"
    }
  ],
  "pageNumber": 1,
  "total": 142,
  "nextPageNumber": 2
}
```

## Pagination

### Cursor-Based Pagination

Abnormal Security uses page-number-based pagination:

```http
GET /v1/threats?pageSize=25&pageNumber=1
```

**Response:**
```json
{
  "threats": [...],
  "pageNumber": 1,
  "total": 142,
  "nextPageNumber": 2
}
```

### Pagination Parameters

| Parameter | Type | Description | Default | Maximum |
|-----------|------|-------------|---------|---------|
| `pageSize` | int | Results per page | 25 | 100 |
| `pageNumber` | int | Page number (1-based) | 1 | - |

### Pagination Pattern

```javascript
async function fetchAllPages(endpoint, params = {}) {
  const allItems = [];
  let pageNumber = 1;
  const pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(endpoint, 'https://api.abnormalplatform.com');
    url.searchParams.set('pageSize', pageSize.toString());
    url.searchParams.set('pageNumber', pageNumber.toString());
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    const items = data.threats || data.cases || [];
    allItems.push(...items);

    hasMore = data.nextPageNumber != null;
    pageNumber = data.nextPageNumber || pageNumber + 1;
  }

  return allItems;
}
```

## OData Filtering

Abnormal Security supports OData-style filter expressions on list endpoints:

### Filter Syntax

```
filter=<field> <operator> '<value>'
```

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `attackType eq 'BEC'` |
| `ne` | Not equals | `status ne 'Closed'` |
| `gt` | Greater than | `riskScore gt 70` |
| `lt` | Less than | `riskScore lt 30` |
| `ge` | Greater than or equal | `sentTime ge '2026-03-01T00:00:00Z'` |
| `le` | Less than or equal | `sentTime le '2026-03-27T00:00:00Z'` |
| `and` | Logical AND | `attackType eq 'BEC' and severity eq 'Critical'` |
| `or` | Logical OR | `attackType eq 'BEC' or attackType eq 'Phishing'` |

### Date Filtering

```http
GET /v1/threats?filter=sentTime ge '2026-03-20T00:00:00Z' and sentTime le '2026-03-27T00:00:00Z'
```

### Combined Filters

```http
GET /v1/threats?filter=attackType eq 'BEC' and remediationStatus eq 'Not Remediated'&pageSize=50
```

## Rate Limiting

### Rate Limit Thresholds

| Limit Type | Value | Scope |
|-----------|-------|-------|
| **Requests per minute** | 60 | Per API token |
| **Requests per hour** | 1,000 | Per API token |

### Rate Limit Response

When rate limited, the API returns HTTP 429:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

```json
{
  "error": "Rate limit exceeded. Please retry after 60 seconds."
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

    if (response.status === 401) {
      throw new Error('Invalid API token. Regenerate at Settings > Integrations > API.');
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
| 400 | Bad Request | Check request format, filter syntax |
| 401 | Unauthorized | Check API token |
| 403 | Forbidden | Token lacks required permissions |
| 404 | Not Found | Entity does not exist |
| 429 | Rate Limited | Wait per Retry-After header |
| 500 | Server Error | Retry with exponential backoff |
| 503 | Service Unavailable | Temporary outage, retry later |

### Error Response Format

```json
{
  "error": "Invalid filter expression",
  "message": "The field 'attackType' does not support the operator 'contains'.",
  "statusCode": 400
}
```

### Common Error Scenarios

| Error | Scenario | Resolution |
|-------|----------|------------|
| Invalid token | Token revoked or miscopied | Regenerate at Settings > Integrations > API |
| Invalid filter | Unsupported OData expression | Check filter syntax and supported operators |
| Entity not found | Threat/case ID does not exist | Verify the ID via list endpoint |
| Permission denied | Token scope insufficient | Generate new token with required permissions |
| Date range error | Dates in wrong format | Use ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` |

## Performance Optimization

### Minimize API Calls

```javascript
// Good: Use filters to narrow results server-side
const threats = await client.threats.list({
  filter: "attackType eq 'BEC' and sentTime ge '2026-03-20T00:00:00Z'",
  pageSize: 100
});

// Avoid: Fetching all threats and filtering client-side
const allThreats = await client.threats.list({ pageSize: 100 });
const becThreats = allThreats.filter(t => t.attackType === 'BEC');
```

### Parallelize Independent Requests

```javascript
// Good: Independent endpoints in parallel
const [threats, cases, atoCases] = await Promise.all([
  client.threats.list({ pageSize: 25 }),
  client.cases.list({ pageSize: 25 }),
  client.ato.list({ pageSize: 25 })
]);
```

### Use Appropriate Page Sizes

- Small page size (10-25) for interactive queries
- Medium page size (50) for batch processing
- Maximum page size (100) for data export

## Best Practices

1. **Store tokens securely** - Use environment variables, never hardcode
2. **Implement retry logic** - Handle 429 and 5xx errors gracefully
3. **Use OData filters** - Reduce response size and processing time
4. **Paginate all list calls** - Never assume results fit in one page
5. **Monitor rate limits** - Track usage to avoid throttling
6. **Validate inputs** - Check IDs and filter syntax before sending
7. **Log API calls** - Enable debugging and audit trails
8. **Use ISO 8601 dates** - Always include timezone (Z suffix for UTC)

## Related Skills

- [Abnormal Threats](../threats/SKILL.md) - Threat detection and analysis
- [Abnormal Cases](../cases/SKILL.md) - Abuse mailbox case management
- [Abnormal Messages](../messages/SKILL.md) - Message analysis
- [Abnormal Vendors](../vendors/SKILL.md) - Vendor risk assessment
- [Abnormal Account Takeover](../account-takeover/SKILL.md) - Account takeover detection
