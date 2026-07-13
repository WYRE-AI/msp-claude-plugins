---
name: "Atera API Patterns"
description: >
  Use this skill when working with the Atera REST API - authentication,
  pagination, rate limiting, and error handling. Covers X-API-KEY header
  authentication, OData-style pagination, 700 requests/minute rate limits,
  and best practices for API integration.
when_to_use: >-
  When working with authentication, pagination, rate limiting, and error handling in the Atera
  REST API. Use when: atera api, atera authentication, api key atera, atera pagination, api rate
  limit, atera rest api, api error atera, or odata pagination.
---

# Atera API Patterns

## Overview

The Atera REST API (v3) provides access to all major entities in the RMM/PSA platform. This skill covers authentication, pagination, rate limiting, error handling, and performance optimization patterns.

## Authentication

### X-API-KEY Header Authentication

Atera uses a simple API key authentication via the `X-API-KEY` header:

```http
GET /api/v3/tickets
X-API-KEY: YOUR_API_KEY
Content-Type: application/json
Accept: application/json
```

**Required Headers:**

| Header | Value | Description |
|--------|-------|-------------|
| `X-API-KEY` | `{your_api_key}` | API key from Atera portal |
| `Content-Type` | `application/json` | For POST/PUT requests |
| `Accept` | `application/json` | Optional, for explicit format |

### Obtaining API Key

1. Log into Atera portal
2. Navigate to **Admin** > **API**
3. Generate or copy your API key
4. Store securely (treat as a password)

### Environment Variable Setup

```bash
export ATERA_API_KEY="your-api-key-here"
```

### Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Rotate keys periodically** - Generate new keys regularly
3. **Use HTTPS only** - Atera requires HTTPS
4. **Limit key access** - Only share with necessary services
5. **Monitor usage** - Watch for unauthorized access

## Base URL

All API requests use the following base URL:

```
https://app.atera.com/api/v3
```

## Pagination

### OData-Style Pagination

Atera uses OData-style pagination with `page` and `itemsInPage` parameters:

```http
GET /api/v3/tickets?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

**Pagination Parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | int | 1 | - | Page number (1-indexed) |
| `itemsInPage` | int | 20 | 50 | Items per page |

### Response Structure

```json
{
  "items": [...],
  "totalItems": 2847,
  "page": 1,
  "itemsInPage": 50,
  "totalPages": 57
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `items` | array | Array of entities |
| `totalItems` | int | Total count across all pages |
| `page` | int | Current page number |
| `itemsInPage` | int | Items in current page |
| `totalPages` | int | Total number of pages |

### Efficient Pagination Pattern

```javascript
async function fetchAllItems(endpoint) {
  const allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://app.atera.com/api/v3/${endpoint}?page=${page}&itemsInPage=50`,
      {
        headers: {
          'X-API-KEY': process.env.ATERA_API_KEY
        }
      }
    );

    const data = await response.json();
    allItems.push(...data.items);

    hasMore = page < data.totalPages;
    page++;

    // Respect rate limits
    if (hasMore) {
      await sleep(100); // 100ms between requests
    }
  }

  return allItems;
}
```

### Pagination Best Practices

1. **Use maximum page size** - 50 items reduces API calls
2. **Add delays between pages** - Avoid hitting rate limits
3. **Cache total counts** - Don't re-fetch unnecessarily
4. **Implement retry logic** - Handle transient failures

## Rate Limiting

### Rate Limit: 700 Requests per Minute

Atera enforces a rate limit of **700 requests per minute** per API key.

### Rate Limit Headers

Atera may return rate limit information in response headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Seconds until reset |

### Rate Limit Response

When rate limited (HTTP 429):

```json
{
  "Message": "Rate limit exceeded. Please wait before making more requests."
}
```

### Retry Strategy with Exponential Backoff

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = parseInt(response.headers.get('Retry-After')) || 30;
        const jitter = Math.random() * 1000;
        console.log(`Rate limited. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000 + jitter);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff with jitter
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Request Throttling

To stay within limits, implement request throttling:

```javascript
class RateLimiter {
  constructor(maxRequests = 700, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();

    // Remove requests outside window
    this.requests = this.requests.filter(t => t > now - this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      // Wait until oldest request expires
      const waitTime = this.requests[0] - (now - this.windowMs) + 100;
      await sleep(waitTime);
    }

    this.requests.push(Date.now());
  }
}

const limiter = new RateLimiter();

async function makeRequest(endpoint) {
  await limiter.throttle();
  return fetch(`https://app.atera.com/api/v3/${endpoint}`, {
    headers: { 'X-API-KEY': process.env.ATERA_API_KEY }
  });
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created successfully |
| 400 | Bad Request | Check request format/values |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "Message": "Error description here",
  "ErrorCode": "SPECIFIC_ERROR_CODE"
}
```

### Error Handling Pattern

```javascript
async function handleAteraRequest(endpoint, options = {}) {
  const response = await fetch(
    `https://app.atera.com/api/v3/${endpoint}`,
    {
      ...options,
      headers: {
        'X-API-KEY': process.env.ATERA_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    switch (response.status) {
      case 401:
        throw new Error('Invalid API key. Check ATERA_API_KEY.');
      case 403:
        throw new Error('Permission denied. Check API key permissions.');
      case 404:
        throw new Error(`Resource not found: ${endpoint}`);
      case 429:
        throw new Error('Rate limit exceeded. Implement backoff.');
      default:
        throw new Error(error.Message || `API error: ${response.status}`);
    }
  }

  return response.json();
}
```

## CRUD Operations

### Create (POST)

```http
POST /api/v3/tickets
X-API-KEY: {api_key}
Content-Type: application/json

{
  "TicketTitle": "New ticket",
  "Description": "Issue description",
  "EndUserID": 12345,
  "TicketPriority": "Medium"
}
```

**Response:**
```json
{
  "ActionID": 54321,
  "TicketID": 54321
}
```

### Read (GET)

**Single entity:**
```http
GET /api/v3/tickets/54321
X-API-KEY: {api_key}
```

**List with pagination:**
```http
GET /api/v3/tickets?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

### Update (POST to specific ID)

```http
POST /api/v3/tickets/54321
X-API-KEY: {api_key}
Content-Type: application/json

{
  "TicketStatus": "Resolved",
  "TicketPriority": "Low"
}
```

### Delete (DELETE)

```http
DELETE /api/v3/tickets/54321
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "ActionID": 54321,
  "Success": true
}
```

## Available Endpoints

### Core Resources

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/tickets` | GET, POST, DELETE | Service tickets |
| `/tickets/{id}/comments` | GET, POST | Ticket comments |
| `/tickets/{id}/workhours` | GET | Work hour entries |
| `/agents` | GET, DELETE | RMM agents |
| `/agents/{id}/powershell` | POST | Run PowerShell |
| `/customers` | GET, POST, DELETE | Customers |
| `/contacts` | GET, POST, DELETE | Contacts |
| `/alerts` | GET, POST, DELETE | Alerts |

### Device Monitors

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/devices/generic` | GET | All devices |
| `/devices/http` | GET, POST, DELETE | HTTP monitors |
| `/devices/snmp` | GET, POST, DELETE | SNMP v1/v2c monitors |
| `/devices/snmpv3` | GET, POST, DELETE | SNMP v3 monitors |
| `/devices/tcp` | GET, POST, DELETE | TCP monitors |

### Additional Resources

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/contracts` | GET | Service contracts |
| `/billing/invoices` | GET | Billing invoices |
| `/customvalues` | GET, POST, DELETE | Custom field values |
| `/knowledgebases` | GET | Knowledge base articles |
| `/rates` | GET, POST | Product/expense rates |

## Performance Optimization

### Batch Operations

When processing multiple items, batch requests:

```javascript
async function batchProcess(items, batchSize = 10, delayMs = 1000) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );

    results.push(...batchResults);

    // Delay between batches to respect rate limits
    if (i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }

  return results;
}
```

### Caching Strategy

Cache slowly-changing data to reduce API calls:

```javascript
const cache = new Map();

async function getCachedData(key, fetchFn, ttlMs = 300000) {
  const cached = cache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs
  });

  return data;
}

// Usage
const customers = await getCachedData(
  'customers',
  () => fetchAllItems('customers'),
  5 * 60 * 1000 // 5 minute cache
);
```

### Parallel Requests

For independent requests, use parallel execution:

```javascript
const [tickets, agents, alerts] = await Promise.all([
  fetchAllItems('tickets'),
  fetchAllItems('agents'),
  fetchAllItems('alerts')
]);
```

## Best Practices Summary

1. **Use X-API-KEY header** - Never include key in URL
2. **Implement rate limiting** - Stay under 700 req/min
3. **Add retry logic** - Handle transient failures
4. **Use pagination** - Request 50 items per page
5. **Cache reference data** - Reduce redundant requests
6. **Handle errors gracefully** - Log and recover
7. **Monitor usage** - Track API call volume
8. **Batch operations** - Group related requests
9. **Use HTTPS only** - Required by Atera
10. **Validate inputs** - Check before sending

## Related Skills

- [Atera Tickets](../tickets/SKILL.md) - Ticket management
- [Atera Agents](../agents/SKILL.md) - Agent management
- [Atera Customers](../customers/SKILL.md) - Customer management
- [Atera Alerts](../alerts/SKILL.md) - Alert management
- [Atera Devices](../devices/SKILL.md) - Device monitors
