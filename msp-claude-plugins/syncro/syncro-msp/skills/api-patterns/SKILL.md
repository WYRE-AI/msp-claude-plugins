---
name: "Syncro API Patterns"
description: >
  Use this skill when working with the Syncro MSP API - authentication,
  pagination, rate limiting, and error handling. Covers API key setup,
  request patterns, response handling, and best practices for API integration.
when_to_use: >-
  When working with authentication, pagination, rate limiting, and error handling in the Syncro
  MSP API. Use when: syncro api, syncro authentication, syncro api key, syncro pagination, syncro
  rate limit, api error syncro, syncro rest api, or syncro integration.
---

# Syncro MSP API Patterns

## Overview

The Syncro MSP API provides access to tickets, customers, assets, invoices, and more. This skill covers authentication, pagination, rate limiting, error handling, and best practices for API integration.

## Authentication

### API Key Authentication

Syncro uses Bearer token authentication with API keys:

```http
GET /api/v1/tickets
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Getting Your API Key

1. Log into your Syncro MSP account
2. Go to **Admin > API Tokens** (or User Profile)
3. Generate a new API token
4. Copy and securely store the token

### Environment Variables

```bash
export SYNCRO_API_KEY="your-api-key-here"
export SYNCRO_SUBDOMAIN="your-subdomain"  # e.g., "acme" for acme.syncromsp.com
```

### Base URL Format

The API base URL uses your subdomain:

```
https://{subdomain}.syncromsp.com/api/v1/
```

**Example:**
```
https://acme.syncromsp.com/api/v1/tickets
```

## Pagination

### Page-Based Pagination

Syncro uses page-based pagination:

```http
GET /api/v1/tickets?page=1
GET /api/v1/tickets?page=2
GET /api/v1/tickets?page=3
```

### Pagination Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number (1-based) | 1 |

### Response Metadata

Responses include pagination information:

```json
{
  "tickets": [...],
  "meta": {
    "total_entries": 156,
    "total_pages": 7,
    "page": 1,
    "per_page": 25
  }
}
```

### Efficient Pagination Pattern

```javascript
async function fetchAllTickets(filter = {}) {
  const allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://${SUBDOMAIN}.syncromsp.com/api/v1/tickets?page=${page}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    allItems.push(...data.tickets);

    hasMore = page < data.meta.total_pages;
    page++;

    // Respect rate limits
    await sleep(350); // ~170 req/min to stay under 180/min
  }

  return allItems;
}
```

## Rate Limiting

### Rate Limit Policy

Syncro enforces a rate limit of **180 requests per minute** per IP address.

### Rate Limit Response

When rate limited, you receive:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
```

```json
{
  "error": "Rate limit exceeded. Please wait before making more requests."
}
```

### Retry Strategy

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 30;
        const jitter = Math.random() * 1000;
        console.log(`Rate limited. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000 + jitter);
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

For bulk operations, throttle requests:

```javascript
async function batchProcess(items, processFunc, delayMs = 350) {
  const results = [];

  for (const item of items) {
    const result = await processFunc(item);
    results.push(result);
    await sleep(delayMs);
  }

  return results;
}
```

## Request Patterns

### GET - Retrieve Data

**Single resource:**
```http
GET /api/v1/tickets/12345
Authorization: Bearer YOUR_API_KEY
```

**List with filters:**
```http
GET /api/v1/tickets?customer_id=123&status=open&page=1
Authorization: Bearer YOUR_API_KEY
```

### POST - Create Resources

```http
POST /api/v1/tickets
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "customer_id": 12345,
  "subject": "New support request",
  "status": "New",
  "priority": "Medium"
}
```

### PUT - Update Resources

```http
PUT /api/v1/tickets/12345
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "status": "Resolved",
  "priority": "Low"
}
```

### DELETE - Remove Resources

```http
DELETE /api/v1/contacts/67890
Authorization: Bearer YOUR_API_KEY
```

## Common Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `page` | Page number | `page=2` |
| `query` | Search term | `query=email` |
| `customer_id` | Filter by customer | `customer_id=123` |
| `date_from` | Start date | `date_from=2024-01-01` |
| `date_to` | End date | `date_to=2024-01-31` |
| `mine` | Current user only | `mine=true` |
| `status` | Status filter | `status=open` |

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Resource created |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable | Validation failed |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "customer_id",
      "message": "is required"
    }
  ]
}
```

### Error Handling Pattern

```javascript
async function makeRequest(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    switch (response.status) {
      case 401:
        throw new Error('Invalid API key. Check your credentials.');
      case 403:
        throw new Error('Permission denied. Check API key permissions.');
      case 404:
        throw new Error('Resource not found.');
      case 422:
        const messages = errorData.errors?.map(e => `${e.field}: ${e.message}`).join(', ');
        throw new Error(`Validation failed: ${messages}`);
      case 429:
        throw new Error('Rate limited. Try again later.');
      default:
        throw new Error(`API error: ${response.status}`);
    }
  }

  return response.json();
}
```

## Common Endpoints

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tickets` | List tickets |
| POST | `/api/v1/tickets` | Create ticket |
| GET | `/api/v1/tickets/{id}` | Get ticket |
| PUT | `/api/v1/tickets/{id}` | Update ticket |
| POST | `/api/v1/tickets/{id}/comment` | Add comment |
| POST | `/api/v1/tickets/{id}/timer` | Timer operations |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customers` | List customers |
| POST | `/api/v1/customers` | Create customer |
| GET | `/api/v1/customers/{id}` | Get customer |
| PUT | `/api/v1/customers/{id}` | Update customer |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/contacts` | List contacts |
| POST | `/api/v1/contacts` | Create contact |
| GET | `/api/v1/contacts/{id}` | Get contact |
| PUT | `/api/v1/contacts/{id}` | Update contact |
| DELETE | `/api/v1/contacts/{id}` | Delete contact |

### Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customer_assets` | List assets |
| POST | `/api/v1/customer_assets` | Create asset |
| GET | `/api/v1/customer_assets/{id}` | Get asset |
| PUT | `/api/v1/customer_assets/{id}` | Update asset |
| DELETE | `/api/v1/customer_assets/{id}` | Delete asset |
| GET | `/api/v1/customer_assets/{id}/patches` | Get patches |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/invoices` | List invoices |
| POST | `/api/v1/invoices` | Create invoice |
| GET | `/api/v1/invoices/{id}` | Get invoice |
| PUT | `/api/v1/invoices/{id}` | Update invoice |
| POST | `/api/v1/invoices/{id}/email` | Email invoice |
| POST | `/api/v1/invoices/{id}/payments` | Record payment |

## Best Practices

1. **Store API key securely** - Use environment variables, never commit to code
2. **Use subdomain correctly** - Ensure URL matches your account
3. **Implement retry logic** - Handle rate limits and transient errors
4. **Paginate large requests** - Don't fetch unbounded result sets
5. **Cache reference data** - Reduce API calls for static lookups
6. **Log API calls** - Enable debugging and audit trails
7. **Validate before sending** - Check required fields client-side
8. **Handle errors gracefully** - Provide meaningful error messages
9. **Respect rate limits** - Space out requests appropriately
10. **Test in sandbox first** - If available, use test environment

## Request Example with cURL

```bash
# List tickets
curl -X GET "https://acme.syncromsp.com/api/v1/tickets?page=1" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"

# Create ticket
curl -X POST "https://acme.syncromsp.com/api/v1/tickets" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 12345,
    "subject": "New ticket",
    "status": "New",
    "priority": "Medium"
  }'
```

## Related Skills

- [Syncro Tickets](../tickets/SKILL.md) - Ticket management
- [Syncro Customers](../customers/SKILL.md) - Customer management
- [Syncro Assets](../assets/SKILL.md) - Asset management
- [Syncro Invoices](../invoices/SKILL.md) - Invoice management
