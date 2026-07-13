---
name: "IT Glue API Patterns"
description: >
  Use this skill when working with the IT Glue API - authentication,
  JSON:API structure, filtering, sorting, pagination, rate limiting,
  sideloading with includes, and error handling. Covers regional endpoints,
  x-api-key authentication, and best practices for API integration.
when_to_use: >-
  When working with authentication, JSON:API structure, filtering, sorting, pagination, rate
  limiting, sideloading with includes, and error handling in the IT Glue API. Use when: it glue
  api, it glue query, json api, it glue filter, it glue pagination, api rate limit, it glue
  authentication, it glue rest, it glue sideload, or it glue include.
---

# IT Glue API Patterns

## Overview

The IT Glue API follows the JSON:API specification, providing access to organizations, configurations (assets), contacts, passwords, documents, and flexible assets. This skill covers authentication, query building, pagination, error handling, and performance optimization patterns.

## Authentication

### API Key Authentication

IT Glue uses API key authentication via the `x-api-key` header:

```http
GET /organizations
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

**Required Headers:**
| Header | Value | Description |
|--------|-------|-------------|
| `x-api-key` | Your API key | Authentication token |
| `Content-Type` | `application/vnd.api+json` | JSON:API content type |

### Environment Variables

```bash
export IT_GLUE_API_KEY="ITG.your-api-key-here"
export IT_GLUE_REGION="us"  # us, eu, or au
```

### Regional Endpoints

IT Glue operates in multiple regions:

| Region | Base URL | Description |
|--------|----------|-------------|
| US | `https://api.itglue.com` | United States |
| EU | `https://api.eu.itglue.com` | European Union |
| AU | `https://api.au.itglue.com` | Australia |

## JSON:API Structure

### Request Format

IT Glue follows JSON:API specification for request bodies:

```json
{
  "data": {
    "type": "organizations",
    "attributes": {
      "name": "Acme Corporation",
      "organization-type-id": 12345,
      "organization-status-id": 1
    }
  }
}
```

### Response Format

```json
{
  "data": {
    "id": "123456",
    "type": "organizations",
    "attributes": {
      "name": "Acme Corporation",
      "organization-type-id": 12345,
      "organization-status-id": 1,
      "created-at": "2024-01-15T10:30:00.000Z",
      "updated-at": "2024-02-15T14:22:00.000Z"
    },
    "relationships": {
      "configurations": {
        "data": [
          {"id": "789", "type": "configurations"}
        ]
      }
    }
  },
  "included": [],
  "meta": {
    "current-page": 1,
    "next-page": 2,
    "prev-page": null,
    "total-pages": 5,
    "total-count": 125
  }
}
```

### Key Concepts

| Term | Description |
|------|-------------|
| `data` | Primary resource or array of resources |
| `attributes` | Resource properties |
| `relationships` | Links to related resources |
| `included` | Sideloaded related resources |
| `meta` | Pagination and metadata |

## Filtering

### Filter Syntax

IT Glue uses query parameter filtering:

```http
GET /organizations?filter[name]=Acme
GET /organizations?filter[organization-status-id]=1
GET /configurations?filter[organization-id]=123456
```

### Common Filter Parameters

| Endpoint | Filter | Example |
|----------|--------|---------|
| Organizations | `filter[name]` | Partial name match |
| Organizations | `filter[organization-type-id]` | By type |
| Organizations | `filter[organization-status-id]` | By status |
| Configurations | `filter[organization-id]` | By organization |
| Configurations | `filter[configuration-type-id]` | By type |
| Configurations | `filter[configuration-status-id]` | By status |
| Contacts | `filter[organization-id]` | By organization |
| Passwords | `filter[organization-id]` | By organization |
| Documents | `filter[organization-id]` | By organization |

### Multiple Filters

Combine filters with multiple parameters:

```http
GET /configurations?filter[organization-id]=123&filter[configuration-type-id]=456&filter[configuration-status-id]=1
```

### PSA Integration Filter

Filter resources by PSA ID for cross-platform lookups:

```http
GET /organizations?filter[psa-id]=12345
GET /contacts?filter[psa-id]=67890
```

## Sorting

### Sort Syntax

Use the `sort` parameter with field names:

```http
GET /organizations?sort=name
GET /organizations?sort=-created-at
GET /configurations?sort=name,-updated-at
```

**Sort Direction:**
| Prefix | Direction | Example |
|--------|-----------|---------|
| (none) | Ascending | `sort=name` |
| `-` | Descending | `sort=-created-at` |

### Common Sort Fields

| Endpoint | Fields |
|----------|--------|
| Organizations | `name`, `created-at`, `updated-at` |
| Configurations | `name`, `hostname`, `created-at`, `updated-at` |
| Contacts | `name`, `first-name`, `last-name`, `created-at` |
| Passwords | `name`, `created-at`, `updated-at` |
| Documents | `name`, `created-at`, `updated-at` |

## Pagination

### Request Pagination

```http
GET /organizations?page[size]=50&page[number]=1
```

**Pagination Parameters:**
| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `page[size]` | Items per page | 50 | 1000 |
| `page[number]` | Page number (1-based) | 1 | - |

### Response Metadata

```json
{
  "meta": {
    "current-page": 1,
    "next-page": 2,
    "prev-page": null,
    "total-pages": 5,
    "total-count": 247
  }
}
```

### Efficient Pagination Pattern

```javascript
async function fetchAllOrganizations() {
  const allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${baseUrl}/organizations?page[size]=1000&page[number]=${page}`,
      { headers: { 'x-api-key': apiKey } }
    );

    const data = await response.json();
    allItems.push(...data.data);

    hasMore = data.meta['next-page'] !== null;
    page++;
  }

  return allItems;
}
```

## Sideloading with Includes

### Include Related Resources

Retrieve related resources in a single request:

```http
GET /configurations/123?include=organization,configuration-interfaces
GET /organizations/456?include=configurations,contacts,passwords
```

### Common Includes

| Endpoint | Available Includes |
|----------|-------------------|
| Configurations | `organization`, `configuration-type`, `configuration-status`, `configuration-interfaces`, `related-items` |
| Contacts | `organization`, `contact-type`, `location` |
| Passwords | `organization`, `password-category` |
| Documents | `organization` |
| Flexible Assets | `organization`, `flexible-asset-type` |

### Response with Includes

```json
{
  "data": {
    "id": "123",
    "type": "configurations",
    "attributes": { "name": "DC-01" },
    "relationships": {
      "organization": {
        "data": { "id": "456", "type": "organizations" }
      }
    }
  },
  "included": [
    {
      "id": "456",
      "type": "organizations",
      "attributes": {
        "name": "Acme Corporation"
      }
    }
  ]
}
```

## Rate Limiting

### Rate Limit Details

IT Glue enforces rate limits to ensure fair API usage:

| Metric | Limit |
|--------|-------|
| Requests per 5 minutes | 3000 |
| Burst limit | ~100 requests/second |

### Rate Limit Headers

```http
X-RateLimit-Limit: 3000
X-RateLimit-Remaining: 2847
X-RateLimit-Reset: 1708012800
```

### Rate Limit Response

When rate limited (HTTP 429):

```json
{
  "errors": [
    {
      "status": "429",
      "title": "Rate Limit Exceeded",
      "detail": "Too many requests. Please try again later."
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
        const retryAfter = response.headers.get('Retry-After') || 60;
        const jitter = Math.random() * 5000;
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

## CRUD Operations

### Create (POST)

```http
POST /organizations
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "organizations",
    "attributes": {
      "name": "New Client Inc",
      "organization-type-id": 12345,
      "organization-status-id": 1
    }
  }
}
```

### Read (GET)

**Single resource:**
```http
GET /organizations/123456
```

**Collection with filters:**
```http
GET /organizations?filter[name]=Acme&page[size]=50
```

### Update (PATCH)

```http
PATCH /organizations/123456
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "organizations",
    "attributes": {
      "quick-notes": "Updated contact info"
    }
  }
}
```

### Delete (DELETE)

```http
DELETE /organizations/123456
x-api-key: YOUR_API_KEY
```

**Note:** Not all resources support DELETE. Check endpoint documentation.

## Nested Resources

### Organization-Scoped Endpoints

Access resources within an organization context:

```http
GET /organizations/123/relationships/configurations
GET /organizations/123/relationships/contacts
GET /organizations/123/relationships/passwords
GET /organizations/123/relationships/documents
```

### Creating Nested Resources

```http
POST /organizations/123/relationships/configurations
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "configurations",
    "attributes": {
      "name": "NEW-SERVER-01",
      "configuration-type-id": 456,
      "configuration-status-id": 1
    }
  }
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Resource created successfully |
| 204 | No Content | Delete successful |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "errors": [
    {
      "status": "422",
      "title": "Validation Error",
      "detail": "Name can't be blank",
      "source": {
        "pointer": "/data/attributes/name"
      }
    }
  ]
}
```

### Error Handling Pattern

```javascript
function handleApiError(response) {
  if (!response.errors) return;

  response.errors.forEach(error => {
    console.log(`Error ${error.status}: ${error.title}`);
    console.log(`  Detail: ${error.detail}`);

    if (error.source?.pointer) {
      console.log(`  Field: ${error.source.pointer}`);
    }

    // Suggest fix based on status
    if (error.status === '401') {
      console.log('  Check IT_GLUE_API_KEY environment variable');
    } else if (error.status === '422') {
      console.log('  Verify required fields are provided');
    }
  });
}
```

## Best Practices

1. **Use regional endpoint** - Match your IT Glue region (US, EU, AU)
2. **Include related data** - Use `include` to avoid N+1 queries
3. **Paginate large results** - Use `page[size]` up to 1000
4. **Implement retry logic** - Handle rate limits and transient errors
5. **Cache reference data** - Organization types, configuration types rarely change
6. **Use filters** - Narrow results server-side vs client-side filtering
7. **Sort server-side** - Use `sort` parameter for ordered results
8. **Monitor rate limits** - Track remaining requests via headers
9. **Log API calls** - Enable debugging and audit trails
10. **Validate before sending** - Check required fields client-side

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Organization management
- [IT Glue Configurations](../configurations/SKILL.md) - Asset management
- [IT Glue Passwords](../passwords/SKILL.md) - Secure credential storage
- [IT Glue Documents](../documents/SKILL.md) - Documentation management
