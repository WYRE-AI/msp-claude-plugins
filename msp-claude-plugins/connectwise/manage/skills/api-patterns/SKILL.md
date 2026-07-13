---
name: "ConnectWise Manage API Patterns"
description: >
  Use this skill when working with the ConnectWise PSA REST API - authentication
  using public/private keys and clientId, pagination with page/pageSize, conditions
  query syntax, rate limiting (60/min), and error handling. Covers all common
  API patterns for ConnectWise PSA integration.
when_to_use: >-
  When working with authentication using public/private keys and clientId, pagination with
  page/pageSize, conditions query syntax, rate limiting (60/min). Use when: connectwise api,
  connectwise authentication, connectwise auth, api conditions, query builder connectwise,
  connectwise pagination, api rate limit, connectwise rest, api error connectwise, public key
  private key, or client id connectwise.
---

# ConnectWise PSA API Patterns

## Overview

The ConnectWise PSA REST API provides access to all PSA entities including tickets, companies, contacts, projects, and time entries. This skill covers authentication, query syntax, pagination, rate limiting, and best practices for API integration.

## Base URLs

| Region | Base URL |
|--------|----------|
| North America | `https://api-na.myconnectwise.net/{codebase}/apis/3.0/` |
| Europe | `https://api-eu.myconnectwise.net/{codebase}/apis/3.0/` |
| Australia | `https://api-au.myconnectwise.net/{codebase}/apis/3.0/` |

Replace `{codebase}` with your company identifier (e.g., `v4_6_release` or custom).

### Legacy URLs

Some instances may use legacy URLs:
```
https://api-na.myconnectwise.net/v4_6_release/apis/3.0/
https://api-staging.connectwisedev.com/v4_6_release/apis/3.0/
```

## Authentication

### Public/Private Key + Client ID

ConnectWise PSA uses Basic Authentication with a combined credential string plus a Client ID header.

### Credential Format

```
Authorization: Basic base64({companyId}+{publicKey}:{privateKey})
clientId: {your-client-id}
```

### Step-by-Step Authentication

1. **Combine credentials:**
   ```
   companyId + "+" + publicKey + ":" + privateKey
   Example: company+publickey:privatekey
   ```

2. **Base64 encode:**
   ```
   base64("company+publickey:privatekey") = "Y29tcGFueStwdWJsaWNrZXk6cHJpdmF0ZWtleQ=="
   ```

3. **Set headers:**
   ```http
   Authorization: Basic Y29tcGFueStwdWJsaWNrZXk6cHJpdmF0ZWtleQ==
   clientId: your-registered-client-id
   Content-Type: application/json
   ```

### Example Request

```http
GET /v4_6_release/apis/3.0/service/tickets
Host: api-na.myconnectwise.net
Authorization: Basic Y29tcGFueStwdWJsaWNrZXk6cHJpdmF0ZWtleQ==
clientId: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Content-Type: application/json
```

### JavaScript Authentication Example

```javascript
const companyId = process.env.CONNECTWISE_COMPANY_ID;
const publicKey = process.env.CONNECTWISE_PUBLIC_KEY;
const privateKey = process.env.CONNECTWISE_PRIVATE_KEY;
const clientId = process.env.CONNECTWISE_CLIENT_ID;

const credentials = `${companyId}+${publicKey}:${privateKey}`;
const base64Credentials = Buffer.from(credentials).toString('base64');

const headers = {
  'Authorization': `Basic ${base64Credentials}`,
  'clientId': clientId,
  'Content-Type': 'application/json'
};
```

### Obtaining Credentials

1. **API Member:** Create in System > Members > API Members
2. **Public/Private Keys:** Generate for API member
3. **Client ID:** Register at [ConnectWise Developer Portal](https://developer.connectwise.com/)

## Conditions Query Syntax

### Basic Syntax

```
conditions=field operator value
```

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `status/id=1` |
| `!=` | Not equals | `status/id!=5` |
| `<` | Less than | `priority/id<3` |
| `<=` | Less than or equal | `priority/id<=2` |
| `>` | Greater than | `dateEntered>2024-01-01` |
| `>=` | Greater than or equal | `dateEntered>=2024-01-01` |
| `contains` | Contains substring | `summary contains "email"` |
| `like` | Pattern match | `summary like "%email%"` |
| `in` | In list | `status/id in (1,2,3)` |
| `not in` | Not in list | `status/id not in (5)` |

### Field References

Use `/` to reference nested fields:

```
company/id=12345
status/name="New"
contact/firstName contains "John"
```

### Combining Conditions

**AND (default):**
```
conditions=company/id=12345 and status/id!=5 and priority/id<=2
```

**OR:**
```
conditions=status/id=1 or status/id=2
```

**Complex:**
```
conditions=(status/id=1 or status/id=2) and company/id=12345
```

### Date Conditions

**Date format:** `YYYY-MM-DD` or ISO 8601

```
conditions=dateEntered>=[2024-01-01]
conditions=dateEntered>=[2024-01-01T00:00:00Z] and dateEntered<[2024-02-01T00:00:00Z]
```

### String Conditions

**Exact match:**
```
conditions=summary="Email not working"
```

**Contains:**
```
conditions=summary contains "email"
```

**Like (wildcards):**
```
conditions=summary like "%email%"
conditions=company/identifier like "AC%"
```

### Null Checks

```
conditions=contact=null
conditions=assignedResource!=null
```

### URL Encoding

Special characters must be URL-encoded:

| Character | Encoded |
|-----------|---------|
| Space | `%20` |
| `=` | `%3D` |
| `<` | `%3C` |
| `>` | `%3E` |
| `"` | `%22` |

**Example:**
```
GET /service/tickets?conditions=company/id%3D12345%20and%20status/id!%3D5
```

## Pagination

### Request Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | int | 1 | - | Page number (1-based) |
| `pageSize` | int | 25 | 1000 | Records per page |

### Example Request

```http
GET /service/tickets?page=1&pageSize=100
```

### Response Headers

| Header | Description |
|--------|-------------|
| `Link` | Contains next/prev page URLs |
| `X-Total-Count` | Total record count (if requested) |

### Pagination Example

```javascript
async function fetchAllTickets(conditions) {
  const allTickets = [];
  let page = 1;
  const pageSize = 250;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${baseUrl}/service/tickets?conditions=${conditions}&page=${page}&pageSize=${pageSize}`,
      { headers }
    );

    const tickets = await response.json();
    allTickets.push(...tickets);

    hasMore = tickets.length === pageSize;
    page++;
  }

  return allTickets;
}
```

### Getting Total Count

```http
GET /service/tickets?conditions=status/id!=5&pageSize=1&fields=id
```

Check `X-Total-Count` header or use `/count` endpoint:

```http
GET /service/tickets/count?conditions=status/id!=5
```

## Rate Limiting

### Limits

| Limit | Value |
|-------|-------|
| Requests per minute | 60 |
| Per API member | Yes |

### Rate Limit Headers

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per minute |
| `X-RateLimit-Remaining` | Requests remaining in window |
| `X-RateLimit-Reset` | Seconds until limit resets |

### 429 Response

When rate limited, you receive HTTP 429:

```json
{
  "code": "RateLimitExceeded",
  "message": "Rate limit exceeded. Try again in 30 seconds."
}
```

### Retry Strategy

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 30;
      const jitter = Math.random() * 1000;
      await sleep(retryAfter * 1000 + jitter);
      continue;
    }

    return response;
  }
  throw new Error('Max retries exceeded');
}
```

### Best Practices for Rate Limits

1. **Implement exponential backoff** - Don't hammer the API
2. **Check headers** - Monitor remaining requests
3. **Batch operations** - Reduce total requests
4. **Cache reference data** - Queues, statuses, members
5. **Use webhooks** - Instead of polling for changes

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created |
| 204 | No Content | Delete successful |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify credentials |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 409 | Conflict | Record locked/modified |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "code": "InvalidArgument",
  "message": "The value 'invalid' is not valid for field 'status/id'.",
  "errors": [
    {
      "code": "InvalidArgument",
      "message": "status/id must be a valid integer",
      "field": "status/id"
    }
  ]
}
```

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `InvalidCredentials` | Bad auth | Verify company ID, keys |
| `MissingClientId` | No clientId header | Add clientId header |
| `InvalidArgument` | Bad field value | Check field type/values |
| `RequiredFieldMissing` | Missing required field | Add required fields |
| `RecordNotFound` | Entity doesn't exist | Verify ID exists |
| `RecordLocked` | Being edited | Retry after delay |

## Common API Patterns

### Field Selection

Request specific fields only:

```http
GET /service/tickets?fields=id,summary,status/name,company/name
```

### Ordering

```http
GET /service/tickets?orderBy=priority/id asc, dateEntered desc
```

### Child Collections

Include child records:

```http
GET /service/tickets?childconditions=notes/text contains "update"
```

### Custom Fields

```http
GET /service/tickets?customFieldConditions=customField1 contains "value"
```

## Webhook Configuration

### Webhook Callback

ConnectWise can POST to your endpoint on entity changes:

```json
{
  "Action": "updated",
  "ID": 54321,
  "Type": "ticket",
  "MemberID": 123,
  "Callback": {
    "ID": 54321,
    "Type": "ticket"
  }
}
```

### Registering Callbacks

```http
POST /system/callbacks
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "objectId": 0,
  "type": "ticket",
  "level": "owner",
  "description": "Ticket updates webhook"
}
```

## Environment Configuration

### Recommended Environment Variables

```bash
export CONNECTWISE_COMPANY_ID="your-company-id"
export CONNECTWISE_PUBLIC_KEY="your-public-key"
export CONNECTWISE_PRIVATE_KEY="your-private-key"
export CONNECTWISE_CLIENT_ID="your-client-id"
export CONNECTWISE_SITE="api-na.myconnectwise.net"
```

### Configuration Object

```javascript
const config = {
  companyId: process.env.CONNECTWISE_COMPANY_ID,
  publicKey: process.env.CONNECTWISE_PUBLIC_KEY,
  privateKey: process.env.CONNECTWISE_PRIVATE_KEY,
  clientId: process.env.CONNECTWISE_CLIENT_ID,
  site: process.env.CONNECTWISE_SITE || 'api-na.myconnectwise.net',
  apiPath: '/apis/3.0'
};
```

## Best Practices

1. **Store credentials securely** - Never commit to source control
2. **Use environment variables** - For configuration
3. **Implement rate limit handling** - Don't get blocked
4. **Cache reference data** - Reduce API calls
5. **Handle errors gracefully** - Retry transient failures
6. **Use pagination** - Don't fetch unbounded results
7. **Select needed fields** - Reduce payload size
8. **Log API calls** - For debugging and audit
9. **Test in sandbox** - Before production changes
10. **Monitor usage** - Track API call patterns

## API Documentation

- [ConnectWise Developer Portal](https://developer.connectwise.com/)
- [REST API Reference](https://developer.connectwise.com/Products/ConnectWise_PSA/REST)
- [API Schema Browser](https://developer.connectwise.com/Products/ConnectWise_PSA/REST#swagger)

## Related Skills

- [ConnectWise Tickets](../tickets/SKILL.md) - Ticket management
- [ConnectWise Companies](../companies/SKILL.md) - Company management
- [ConnectWise Contacts](../contacts/SKILL.md) - Contact management
- [ConnectWise Projects](../projects/SKILL.md) - Project management
- [ConnectWise Time Entries](../time-entries/SKILL.md) - Time tracking
