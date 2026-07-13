---
name: "Autotask API Patterns"
description: >
  Use this skill when working with the Autotask REST API - authentication,
  query building, pagination, includes, rate limiting, and error handling.
  Covers all 14 query operators, zone detection, header authentication,
  retry strategies, and best practices for API integration.
when_to_use: >-
  When working with authentication, query building, pagination, includes, rate limiting, and error
  handling in the Autotask REST API. Use when: autotask api, autotask query, autotask
  authentication, api filter, query builder, autotask pagination, api rate limit, autotask zone,
  api error, or autotask rest.
---

# Autotask API Patterns

## Overview

The Autotask REST API provides access to 215+ entities across the PSA. This skill covers authentication, query building, pagination, error handling, and performance optimization patterns.

## Authentication

### Header-Based Authentication

Autotask uses header-based authentication (NOT Basic Auth):

```http
GET /v1.0/Tickets
ApiIntegrationCode: YOUR_INTEGRATION_CODE
UserName: your-api-user@domain.com
Secret: YOUR_SECRET
Content-Type: application/json
```

**Required Headers:**
| Header | Description |
|--------|-------------|
| `ApiIntegrationCode` | Your Autotask integration code |
| `UserName` | API username (email address) |
| `Secret` | API secret/password |
| `Content-Type` | `application/json` |

### Environment Variables

```bash
export AUTOTASK_USERNAME="your-api-user@domain.com"
export AUTOTASK_INTEGRATION_CODE="YOUR_INTEGRATION_CODE"
export AUTOTASK_SECRET="YOUR_SECRET"
```

### Automatic Zone Detection

Autotask operates in multiple zones. The API can automatically detect your zone:

```http
GET https://webservices.autotask.net/atservicesrest/v1.0/ZoneInformation
UserName: your-api-user@domain.com
```

**Response:**
```json
{
  "url": "https://webservices5.autotask.net/atservicesrest",
  "webUrl": "https://ww5.autotask.net"
}
```

**Common Zones:**
| Zone | API URL |
|------|---------|
| webservices | `https://webservices.autotask.net/atservicesrest` |
| webservices1 | `https://webservices1.autotask.net/atservicesrest` |
| webservices2 | `https://webservices2.autotask.net/atservicesrest` |
| webservices5 | `https://webservices5.autotask.net/atservicesrest` |
| webservices6 | `https://webservices6.autotask.net/atservicesrest` |

## Query Builder

### Query Operators

The Autotask API supports 14 query operators:

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `{"field": "status", "op": "eq", "value": 1}` |
| `ne` / `noteq` | Not equals | `{"field": "status", "op": "noteq", "value": 5}` |
| `gt` | Greater than | `{"field": "priority", "op": "gt", "value": 2}` |
| `gte` | Greater than or equal | `{"field": "createDate", "op": "gte", "value": "2024-01-01"}` |
| `lt` | Less than | `{"field": "priority", "op": "lt", "value": 3}` |
| `lte` | Less than or equal | `{"field": "dueDateTime", "op": "lte", "value": "2024-02-15T17:00:00Z"}` |
| `contains` | Contains substring | `{"field": "title", "op": "contains", "value": "email"}` |
| `startsWith` | Starts with | `{"field": "companyName", "op": "startsWith", "value": "Acme"}` |
| `endsWith` | Ends with | `{"field": "email", "op": "endsWith", "value": "@acme.com"}` |
| `in` | In array | `{"field": "status", "op": "in", "value": [1, 2, 5]}` |
| `notIn` | Not in array | `{"field": "status", "op": "notIn", "value": [5, 10]}` |
| `isNull` | Is null | `{"field": "assignedResourceId", "op": "isNull"}` |
| `isNotNull` | Is not null | `{"field": "dueDateTime", "op": "isNotNull"}` |
| `between` | Between range | `{"field": "createDate", "op": "between", "value": ["2024-01-01", "2024-01-31"]}` |

### Date Filtering: "Today" Queries

**CRITICAL:** To filter for records from "today", you must use a **range** — `gte` today's date AND `lt` tomorrow's date. Using only today's date (e.g. `eq` or a single filter on today) returns **zero results**. "Today" in Autotask means: created on or after today's midnight, but before tomorrow's midnight.

**Correct — "tickets created today":**
```json
{
  "filter": [
    {"field": "createDate", "op": "gte", "value": "2026-04-13T00:00:00Z"},
    {"field": "createDate", "op": "lt", "value": "2026-04-14T00:00:00Z"}
  ]
}
```

**Wrong — returns NO results:**
```json
{
  "filter": [
    {"field": "createDate", "op": "eq", "value": "2026-04-13"}
  ]
}
```

Always compute "tomorrow" dynamically. For example:
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const todayISO = today.toISOString(); // "2026-04-13T00:00:00.000Z"
const tomorrowISO = tomorrow.toISOString(); // "2026-04-14T00:00:00.000Z"
```

This pattern applies to **all datetime fields** (`createDate`, `lastActivityDate`, `dueDateTime`, `startDateTime`, `endDateTime`, `dateWorked`, etc.) across all entities — not just tickets.

### Query Structure

```http
POST /v1.0/Tickets/query
Content-Type: application/json
```

```json
{
  "filter": [
    {"field": "companyID", "op": "eq", "value": 12345},
    {"field": "status", "op": "noteq", "value": 5}
  ],
  "maxRecords": 50,
  "includeFields": ["Company.companyName", "AssignedResource.firstName"]
}
```

### Complex Queries with Logical Grouping

**AND conditions (default):**
```json
{
  "filter": [
    {"field": "companyID", "op": "eq", "value": 12345},
    {"field": "priority", "op": "lte", "value": 2},
    {"field": "status", "op": "in", "value": [1, 2, 5]}
  ]
}
```

**OR conditions with items array:**
```json
{
  "filter": [
    {
      "op": "or",
      "items": [
        {"field": "priority", "op": "eq", "value": 1},
        {"field": "status", "op": "eq", "value": 14}
      ]
    }
  ]
}
```

**Nested AND/OR:**
```json
{
  "filter": [
    {"field": "companyID", "op": "eq", "value": 12345},
    {
      "op": "or",
      "items": [
        {"field": "priority", "op": "in", "value": [3, 4]},
        {
          "op": "and",
          "items": [
            {"field": "status", "op": "eq", "value": 1},
            {"field": "estimatedHours", "op": "gt", "value": 10}
          ]
        }
      ]
    }
  ]
}
```

### Field Includes

Retrieve related entity fields in a single request:

```json
{
  "filter": [{"field": "id", "op": "gt", "value": 0}],
  "includeFields": [
    "Company.companyName",
    "Company.phone",
    "AssignedResource.firstName",
    "AssignedResource.lastName",
    "Contact.emailAddress"
  ]
}
```

**Response with includes:**
```json
{
  "items": [
    {
      "id": 54321,
      "title": "Email issue",
      "companyID": 12345,
      "companyName": "Acme Corporation",
      "companyPhone": "555-123-4567",
      "assignedResourceFirstName": "Jane",
      "assignedResourceLastName": "Tech"
    }
  ]
}
```

## Pagination

### Request Pagination

```json
{
  "filter": [{"field": "id", "op": "gt", "value": 0}],
  "maxRecords": 100,
  "pageNumber": 1
}
```

**Pagination Fields:**
| Field | Description | Max |
|-------|-------------|-----|
| `maxRecords` | Records per page | 500 |
| `pageNumber` | Current page (1-based) | - |

### Response Structure

```json
{
  "items": [...],
  "pageDetails": {
    "count": 100,
    "nextPageUrl": "/v1.0/Tickets/query?pageNumber=2",
    "prevPageUrl": null,
    "requestCount": 2847
  }
}
```

### Efficient Pagination Pattern

```javascript
async function fetchAllTickets(filter) {
  const allItems = [];
  let pageNumber = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch('/v1.0/Tickets/query', {
      method: 'POST',
      body: JSON.stringify({
        filter,
        maxRecords: 500,
        pageNumber
      })
    });

    const data = await response.json();
    allItems.push(...data.items);

    hasMore = data.pageDetails.nextPageUrl !== null;
    pageNumber++;
  }

  return allItems;
}
```

## Rate Limiting

### Autotask API Hard Limits

Autotask enforces two hard limits:

| Limit | Value | Scope |
|-------|-------|-------|
| **Concurrent threads per endpoint** | **3** | Per API tracking identifier (your `integrationCode`) |
| **Total requests per hour** | **10,000** | Per Autotask tenant database (all integrations combined) |

**Concurrent thread limit** is the most common cause of slowdowns in LLM-driven integrations. When Claude issues several tool calls in parallel (e.g., tickets search + companies search + contacts search), all three may target the Tickets endpoint simultaneously and hit the 3-thread cap.

When using the MCP server or `autotask-node` SDK, this is handled automatically — excess requests are queued and released as slots free up, so you won't see hard failures, but responses may be slower under load.

**Multi-user / shared key risk**: The 3-thread limit applies per `integrationCode`. If multiple users or teams share the same credentials, they compete for the same 3 slots. In a team deployment, give each team their own API user:

```
Support Team  → integrationCode: SUPPORT_TEAM_CODE  (3 threads, independent)
Projects Team → integrationCode: PROJECTS_TEAM_CODE (3 threads, independent)
```

### Rate Limit Response

When the concurrent thread limit or hourly request limit is exceeded (HTTP 429):

```json
{
  "errors": [
    {
      "message": "Rate limit exceeded. Try again in 30 seconds."
    }
  ]
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

### Query Different Entity Types in Parallel

To maximize throughput without hitting the per-endpoint thread limit, query **different endpoints in parallel** rather than the same endpoint multiple times:

```javascript
// Good: parallel requests to different endpoints — each has its own 3-thread budget
const [tickets, companies, contacts] = await Promise.all([
  client.tickets.query().where('status', 'in', [1, 5]).execute(),
  client.companies.query().where('companyType', 'eq', 1).execute(),
  client.contacts.query().where('isActive', 'eq', true).execute(),
]);

// Avoid: parallel requests to the SAME endpoint — they share 3 threads
// (will queue automatically, but adds latency)
const [page1, page2, page3] = await Promise.all([
  client.tickets.query().pageNumber(1).execute(),  // ← same endpoint
  client.tickets.query().pageNumber(2).execute(),  // ← same endpoint
  client.tickets.query().pageNumber(3).execute(),  // ← same endpoint
]);
```

### Batch Processing

For bulk operations, batch requests to avoid the hourly limit:

```javascript
async function batchProcess(items, batchSize = 50, delayMs = 1000) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);

    if (i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }

  return results;
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created successfully |
| 400 | Bad Request | Check request format/values |
| 401 | Unauthorized | Verify credentials |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 409 | Conflict | Resource locked/modified |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "errors": [
    {
      "message": "The value '999' is not valid for field 'status'.",
      "field": "status",
      "value": 999
    }
  ]
}
```

### Validation Error Handling

```javascript
function handleApiError(response) {
  if (!response.errors) return;

  response.errors.forEach(error => {
    console.log(`Error: ${error.message}`);

    if (error.field) {
      console.log(`  Field: ${error.field}`);
      console.log(`  Invalid Value: ${error.value}`);

      // Suggest fix based on field
      if (error.field === 'status') {
        console.log('  Suggestion: Query /v1.0/Tickets/entityInformation/fields for valid status IDs');
      } else if (error.field === 'queueID') {
        console.log('  Suggestion: Query /v1.0/Queues for valid queue IDs');
      }
    }
  });
}
```

## Entity Information

### Get Field Definitions

```http
GET /v1.0/Tickets/entityInformation/fields
```

**Response:**
```json
{
  "fields": [
    {
      "name": "status",
      "dataType": "Integer",
      "isRequired": true,
      "isPickList": true,
      "picklistValues": [
        {"value": 1, "label": "New"},
        {"value": 2, "label": "In Progress"},
        {"value": 5, "label": "Complete"}
      ]
    }
  ]
}
```

### Get User-Defined Fields

```http
GET /v1.0/Tickets/entityInformation/userDefinedFields
```

## CRUD Operations

### Create (POST)

```http
POST /v1.0/Tickets
Content-Type: application/json

{
  "companyID": 12345,
  "title": "New ticket",
  "status": 1,
  "priority": 2,
  "queueID": 8
}
```

### Read (GET)

**Single entity:**
```http
GET /v1.0/Tickets/54321
```

**Query:**
```http
POST /v1.0/Tickets/query
```

### Update (PATCH)

```http
PATCH /v1.0/Tickets
Content-Type: application/json

{
  "id": 54321,
  "status": 2,
  "assignedResourceID": 29744150
}
```

### Replace (PUT)

```http
PUT /v1.0/Tickets/54321
Content-Type: application/json

{
  "id": 54321,
  "companyID": 12345,
  "title": "Updated ticket",
  "status": 2,
  "priority": 2,
  "queueID": 8
}
```

### Delete (DELETE)

```http
DELETE /v1.0/Tickets/54321
```

**Note:** Not all entities support DELETE. Check entity documentation.

## Performance Optimization

### Select Only Needed Fields

```json
{
  "filter": [{"field": "id", "op": "gt", "value": 0}],
  "fields": ["id", "title", "status", "priority"]
}
```

### Use Efficient Filters

**Good - Uses indexed field:**
```json
{"field": "companyID", "op": "eq", "value": 12345}
```

**Avoid - Full text search:**
```json
{"field": "description", "op": "contains", "value": "error"}
```

### Cache Reference Data

Cache slowly-changing data:
- Queues
- Resources
- Issue Types
- Priorities
- Company lists

```javascript
const cache = new Map();

async function getQueues() {
  if (!cache.has('queues') || cache.get('queues').expires < Date.now()) {
    const queues = await fetchQueues();
    cache.set('queues', {
      data: queues,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
  }
  return cache.get('queues').data;
}
```

## Best Practices

1. **Detect zone once** - Cache the zone URL after initial detection
2. **Use includes** - Avoid N+1 queries by including related data
3. **Paginate large results** - Never fetch unbounded result sets
4. **Implement retry logic** - Handle rate limits and transient errors
5. **Cache reference data** - Reduce API calls for static lookups
6. **Select specific fields** - Only request fields you need
7. **Use batch operations** - Group related operations together
8. **Monitor rate limits** - Track remaining requests
9. **Log API calls** - Enable debugging and audit trails
10. **Validate before sending** - Check required fields client-side
11. **One API key per team** - Autotask limits 3 concurrent threads per `integrationCode`. Each team using the integration should have their own API user so they don't compete for the same thread budget
12. **Parallelize across endpoints, not within** - To maximize throughput, query Tickets + Companies + Contacts simultaneously (different endpoints, independent thread budgets) rather than fetching multiple pages of the same endpoint in parallel

## Related Skills

- [Autotask Tickets](../tickets/SKILL.md) - Ticket management
- [Autotask CRM](../crm/SKILL.md) - Company and contact management
- [Autotask Contracts](../contracts/SKILL.md) - Service agreements
