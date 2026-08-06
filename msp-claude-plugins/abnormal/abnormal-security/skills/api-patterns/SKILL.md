---
name: "Abnormal Security API Patterns"
description: >
  Abnormal Security REST API fundamentals: Bearer token authentication, base
  URLs, rate limiting, pagination, OData filtering, request/response
  formats, and error handling.
when_to_use: >-
  When authenticating to or calling the Abnormal Security REST API. Use
  when: abnormal api, abnormal authentication, abnormal rest api, abnormal
  rate limit, abnormal pagination, abnormal api error, abnormal api token,
  abnormal odata filter, or abnormal security api.
---

# Abnormal Security REST API Patterns

## Overview

The Abnormal Security REST API provides programmatic access to threat detection, cases, abuse mailbox submissions, message analysis, and per-message remediation. This skill covers authentication, request patterns, pagination, filtering, rate limiting, error handling, and performance optimization.

The paths below are the ones this plugin's MCP server actually calls. The
vendor's wider API surface is out of scope here — if a path is not
listed, no tool reaches it.

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

| Service | Path | Backing tool |
|---------|------|--------------|
| **Threats** | `/v1/threats` | `abnormal_threats_list` |
| **Threat Details** | `/v1/threats/{threatId}` | `abnormal_threats_get`, `abnormal_messages_list` |
| **Cases** | `/v1/cases` | `abnormal_cases_list` |
| **Case Details** | `/v1/cases/{caseId}` | `abnormal_cases_get` |
| **Messages** | `/v1/threats/{threatId}/messages/{messageId}` | `abnormal_messages_get` |
| **Remediation** | `/v1/threats/{threatId}/messages/{messageId}/remediation` | `abnormal_remediation_manage` — GET for `status`, POST for `remediate`/`unremediate` |
| **Abuse Mailbox** | `/v1/abuse_mailbox` | `abnormal_abuse_list` |

`{threatId}` is a UUID string; `{caseId}` is a number. They are the two
identifier vocabularies in this API and they look alike in prose — a
threat UUID on the `/cases/` path is a type error, not a 404 you should
retry.

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

Page-number based, not cursor based — `GET /v1/threats?pageSize=25&pageNumber=1`.
Responses carry `nextPageNumber` (absent on the last page) and `total`,
as in the response example above.

### Pagination Parameters

| Parameter | Type | Description | Default | Maximum |
|-----------|------|-------------|---------|---------|
| `pageSize` | int | Results per page | 100 at the tool layer | 100 |
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

Abnormal Security supports OData-style filter expressions on list endpoints.

All three list tools — `abnormal_threats_list`, `abnormal_cases_list`,
`abnormal_abuse_list` — expose this as one `filter` string parameter.
There is no `fromDate`/`toDate` pair anywhere; date scoping goes inside
the filter string, and the time field differs per endpoint:
`receivedTime` for threats, `createdTime` for cases,
`firstReportedTime` for abuse mailbox.

### Filter Syntax

```
filter=<field> <operator> '<value>'
```

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `attackType eq 'BEC'` |
| `ne` | Not equals | `status ne 'Closed'` |
| `gt` | Greater than | `receivedTime gt 2026-03-01T00:00:00Z` |
| `lt` | Less than | `createdTime lt 2026-03-27T00:00:00Z` |
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

Push the narrowing into the `filter` argument of `abnormal_threats_list`,
`abnormal_cases_list`, and `abnormal_abuse_list` rather than pulling a
broad page and discarding most of it client-side. Each of the three takes
an OData `filter` plus `pageSize`/`pageNumber`.

### What can and cannot run in parallel

`abnormal_threats_list`, `abnormal_cases_list`, and `abnormal_abuse_list`
are independent top-level collections and can be issued concurrently.

`abnormal_messages_list`, `abnormal_messages_get`, and
`abnormal_remediation_manage` are **not** independent — all three are
nested under a threat and need a `threatId` you obtained first, so they
serialise behind a `/threats` call. Remediating a campaign is therefore
inherently sequential: list the threat's messages, then one
`abnormal_remediation_manage` call per message. At 60 requests/minute a
wide campaign will hit the rate limit mid-loop, so record which message
IDs succeeded rather than assuming the loop ran to completion — a
half-remediated campaign looks identical to a finished one from the
outside.

### Use Appropriate Page Sizes

- Small page size (10-25) for interactive queries
- Medium page size (50) for batch processing
- Maximum page size (100) for data export

## Best Practices

1. **Implement retry logic** - Handle 429 and 5xx errors gracefully
2. **Use OData filters** - Reduce response size and processing time
3. **Paginate all list calls** - Never assume results fit in one page
4. **Monitor rate limits** - Track usage to avoid throttling
5. **Use ISO 8601 dates** - Always include timezone (Z suffix for UTC)
6. **Track per-message remediation outcomes** - Partial failure is silent

## Related Skills

- [Abnormal Threats](../threats/SKILL.md) - Threat detection and analysis
- [Abnormal Cases](../cases/SKILL.md) - Abuse mailbox case management
- [Abnormal Messages](../messages/SKILL.md) - Message analysis
