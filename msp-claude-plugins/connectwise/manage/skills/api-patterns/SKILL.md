---
name: "ConnectWise Manage API Patterns"
description: >
  ConnectWise PSA REST API fundamentals: public/private key + clientId
  authentication, page/pageSize pagination, the conditions query syntax,
  rate limiting (60/min), and error-response handling.
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

See [references/examples.md](references/examples.md) for a JavaScript authentication example and recommended environment variable setup.

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

Paginate by incrementing `page` until the response has fewer records than
`pageSize`. See [references/examples.md](references/examples.md) for a
full fetch-all-pages implementation.

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

Implement exponential backoff with jitter on 429s using the `Retry-After`
header. See [references/examples.md](references/examples.md) for a retry
strategy implementation.

### Best Practices for Rate Limits

1. **Implement exponential backoff** - Don't hammer the API
2. **Check headers** - Monitor remaining requests
3. **Batch operations** - Reduce total requests
4. **Use webhooks** - Instead of polling for changes

## Error Handling

Errors return the relevant HTTP status code plus a JSON body with `code`
and `message` fields, and per-field detail in `errors[]`. See
[references/errors.md](references/errors.md) for the complete HTTP status
code table, error response format, and common error codes.

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

ConnectWise can POST entity-change events to a registered callback URL.
See [references/webhooks.md](references/webhooks.md) for the callback
payload shape and the registration request.

## Best Practices

1. **Store credentials securely** - Never commit to source control
2. **Handle errors gracefully** - Retry transient failures
3. **Use pagination** - Don't fetch unbounded results
4. **Select needed fields** - Reduce payload size
5. **Log API calls** - For debugging and audit
6. **Monitor usage** - Track API call patterns

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
