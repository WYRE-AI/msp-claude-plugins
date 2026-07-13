---
name: "Hudu API Patterns"
description: >
  Use this skill when working with the Hudu API - authentication,
  REST structure, filtering, pagination, rate limiting, error handling,
  and best practices. Covers x-api-key authentication, base URL patterns,
  API naming differences (UI vs API), and API key permission levels.
when_to_use: >-
  When working with authentication, REST structure, filtering, pagination, rate limiting, error
  handling, and best practices in the Hudu API. Use when: hudu api, hudu query, hudu filter, hudu
  pagination, hudu rate limit, hudu authentication, hudu rest, hudu endpoint, or hudu request.
---

# Hudu API Patterns

## Overview

The Hudu API is a RESTful JSON API that provides access to companies, assets, asset layouts, articles, asset passwords, websites, folders, procedures, and more. This skill covers authentication, query building, pagination, error handling, and performance optimization patterns.

## Authentication

### API Key Authentication

Hudu uses API key authentication via the `x-api-key` header:

```http
GET /api/v1/companies
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**Required Headers:**
| Header | Value | Description |
|--------|-------|-------------|
| `x-api-key` | Your API key | Authentication token |
| `Content-Type` | `application/json` | JSON content type |

### Environment Variables

```bash
export HUDU_BASE_URL="https://your-company.huducloud.com"
export HUDU_API_KEY="your-api-key-here"
```

### Base URL Pattern

All API endpoints follow the pattern:

```
https://[YOUR_DOMAIN]/api/v1/[resource]
```

For Hudu Cloud instances:
```
https://your-company.huducloud.com/api/v1/companies
```

For self-hosted instances:
```
https://hudu.yourcompany.com/api/v1/companies
```

### API Key Permission Levels

Hudu API keys support granular permission controls:

| Permission | Description |
|------------|-------------|
| Password Access | Allow or deny reading password values |
| DELETE Operations | Allow or deny deletion of records |
| IP Whitelist | Restrict API key usage to specific IPs |
| Company Scope | Restrict API key to specific companies |

Administrators configure these in Admin > API Keys when creating or editing a key.

## API Naming Differences

Hudu's UI names differ from API endpoint names in several cases. This is critical to get right:

| Hudu UI Name | API Endpoint | API Resource Name |
|---|---|---|
| Company (label is customizable) | `/api/v1/companies` | `company` |
| Password | `/api/v1/asset_passwords` | `asset_password` |
| Knowledge Base Article | `/api/v1/articles` | `article` |
| Process | `/api/v1/procedures` | `procedure` |
| Asset | `/api/v1/assets` | `asset` |
| Asset Layout | `/api/v1/asset_layouts` | `asset_layout` |
| Website | `/api/v1/websites` | `website` |
| Folder | `/api/v1/folders` | `folder` |
| Activity Log | `/api/v1/activity_logs` | `activity_log` |
| Magic Dash | `/api/v1/magic_dash` | `magic_dash` |
| Network | `/api/v1/networks` | `network` |
| Relation | `/api/v1/relations` | `relation` |

## Request Format

### Standard JSON Request

Hudu uses standard JSON (not JSON:API) for request and response bodies:

```json
{
  "company": {
    "name": "Acme Corporation",
    "nickname": "ACME",
    "address_line_1": "123 Main St",
    "city": "Springfield",
    "state": "IL"
  }
}
```

### Response Format

**Single Resource:**
```json
{
  "company": {
    "id": 1,
    "name": "Acme Corporation",
    "nickname": "ACME",
    "address_line_1": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-02-15T14:22:00.000Z"
  }
}
```

**Collection:**
```json
{
  "companies": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "nickname": "ACME"
    },
    {
      "id": 2,
      "name": "TechStart Inc",
      "nickname": "TSI"
    }
  ]
}
```

## Filtering

### Query Parameter Filtering

Hudu uses simple query parameters for filtering:

```http
GET /api/v1/companies?name=Acme
GET /api/v1/companies?city=Springfield
GET /api/v1/companies?id_in_integration=12345
GET /api/v1/assets?company_id=1
GET /api/v1/asset_passwords?company_id=1&name=Domain
GET /api/v1/articles?company_id=1&name=backup
```

### Common Filter Parameters by Endpoint

| Endpoint | Parameters | Description |
|----------|-----------|-------------|
| `/companies` | `name`, `city`, `state`, `id_in_integration`, `website` | Filter companies |
| `/assets` | `company_id`, `asset_layout_id`, `name`, `primary_serial`, `archived` | Filter assets |
| `/asset_passwords` | `company_id`, `name`, `slug` | Filter passwords |
| `/articles` | `company_id`, `name`, `slug` | Filter articles |
| `/websites` | `company_id`, `name`, `slug` | Filter websites |
| `/asset_layouts` | `name` | Filter asset layouts |
| `/activity_logs` | `user_id`, `user_email`, `resource_id`, `resource_type`, `action_message` | Filter logs |

### Search Parameter

Some endpoints support a `search` parameter for broader matching:

```http
GET /api/v1/companies?search=Acme
```

## Pagination

### Page-Based Pagination

Hudu uses page-based pagination with the `page` query parameter:

```http
GET /api/v1/companies?page=1
GET /api/v1/companies?page=2
GET /api/v1/companies?page=3
```

**Pagination Details:**
| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number (1-based) | 1 |
| Results per page | Fixed by Hudu | 25 |

### Detecting End of Pages

When a page returns fewer than 25 results (or an empty array), you have reached the last page:

```javascript
async function fetchAllCompanies() {
  const allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${baseUrl}/api/v1/companies?page=${page}`,
      { headers: { 'x-api-key': apiKey } }
    );

    const data = await response.json();
    const companies = data.companies || [];
    allItems.push(...companies);

    // If fewer than 25 results, we reached the last page
    hasMore = companies.length === 25;
    page++;
  }

  return allItems;
}
```

## Rate Limiting

### Rate Limit Details

Hudu enforces rate limits to ensure fair API usage:

| Metric | Limit |
|--------|-------|
| Requests per minute | 300 |

### Rate Limit Response

When rate limited (HTTP 429):

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
POST /api/v1/companies
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "company": {
    "name": "New Client Inc",
    "nickname": "NCI",
    "address_line_1": "456 Oak Ave",
    "city": "Portland",
    "state": "OR"
  }
}
```

### Read (GET)

**Single resource:**
```http
GET /api/v1/companies/123
```

**Collection with filters:**
```http
GET /api/v1/companies?name=Acme&page=1
```

### Update (PUT)

```http
PUT /api/v1/companies/123
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "company": {
    "nickname": "ACME-UPDATED",
    "notes": "Updated contact information"
  }
}
```

### Delete (DELETE)

```http
DELETE /api/v1/companies/123
x-api-key: YOUR_API_KEY
```

**Note:** DELETE operations require explicit API key permission. Not all API keys can delete records.

## Nested / Company-Scoped Patterns

Many resources can be filtered by company:

```http
GET /api/v1/assets?company_id=123
GET /api/v1/asset_passwords?company_id=123
GET /api/v1/articles?company_id=123
GET /api/v1/websites?company_id=123
```

For assets specifically, you can also scope by asset layout:

```http
GET /api/v1/assets?company_id=123&asset_layout_id=5
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Resource created successfully |
| 204 | No Content | Delete successful |
| 400 | Bad Request | Check request format and required fields |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check API key permissions (e.g., password access, DELETE) |
| 404 | Not Found | Resource doesn't exist or wrong base URL |
| 422 | Unprocessable Entity | Validation errors (missing/invalid fields) |
| 429 | Rate Limited | Implement backoff, wait 60 seconds |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "error": "Validation failed: Name can't be blank"
}
```

Or for multiple errors:

```json
{
  "errors": [
    "Name can't be blank",
    "Company is required"
  ]
}
```

### Error Handling Pattern

```javascript
function handleApiError(response, body) {
  if (response.status === 401) {
    console.log('API key invalid or expired. Check HUDU_API_KEY.');
  } else if (response.status === 403) {
    console.log('Permission denied. Check API key permissions.');
    console.log('If accessing passwords, verify password access is enabled.');
  } else if (response.status === 404) {
    console.log('Resource not found. Check HUDU_BASE_URL and resource ID.');
  } else if (response.status === 422) {
    console.log('Validation error:', body.error || body.errors);
  } else if (response.status === 429) {
    console.log('Rate limited. Wait 60 seconds before retrying.');
  }
}
```

## Best Practices

1. **Use the correct base URL** - Include `/api/v1/` in all requests
2. **Paginate large results** - Loop through pages until fewer than 25 results returned
3. **Implement retry logic** - Handle rate limits (429) and transient errors (500)
4. **Cache reference data** - Asset layouts rarely change; cache them
5. **Use filters** - Narrow results server-side rather than client-side filtering
6. **Monitor rate limits** - Stay under 300 requests per minute
7. **Remember naming differences** - Passwords are `asset_passwords`, Processes are `procedures`
8. **Scope by company** - Always filter by `company_id` when possible
9. **Log API calls** - Enable debugging and audit trails
10. **Validate before sending** - Check required fields client-side to avoid 422 errors

## Related Skills

- [Hudu Companies](../companies/SKILL.md) - Company management
- [Hudu Assets](../assets/SKILL.md) - Asset management
- [Hudu Articles](../articles/SKILL.md) - Knowledge base articles
- [Hudu Passwords](../passwords/SKILL.md) - Secure credential storage
- [Hudu Websites](../websites/SKILL.md) - Website monitoring
