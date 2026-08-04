---
name: "Hudu API Patterns"
description: >
  Hudu REST API fundamentals: x-api-key authentication, base URL and
  /api/v1/ structure, granular API key permission levels, UI-vs-API
  resource naming differences, query-parameter filtering, page-based
  pagination, the 300 req/min rate limit, and HTTP status/error semantics.
when_to_use: >-
  When authenticating to or calling any Hudu endpoint directly, or when debugging a Hudu
  request that returns an unexpected status. Use when: hudu api, hudu query, hudu filter, hudu
  pagination, hudu rate limit, hudu authentication, hudu rest, hudu endpoint, or hudu request.
---

# Hudu API Patterns

## Overview

The Hudu API is a RESTful JSON API that provides access to companies, assets, asset layouts, articles, asset passwords, websites, folders, procedures, and more. This skill covers authentication, query building, pagination, error handling, and performance optimization patterns.

## Anti-triggers

- **IT Glue's request model** — the other documentation platform here uses
  a JSON:API envelope with `data`/`attributes` wrappers and its own
  pagination, against Hudu's flat JSON and `x-api-key` header. Use
  `it-glue-api-patterns`. Request shapes do not transfer between them.
- **A 403 on a password endpoint** — that is Hudu's per-API-key password
  toggle, not a bad key or an expired token, and the same key works
  everywhere else. Use `hudu-passwords`.
- **Hudu tools missing from the client entirely, or a 401 before any call
  succeeds** — that is a gateway-connection problem; use
  `shared-wyre-gateway-troubleshooting`.

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

## Request and Response Envelope

Hudu uses standard JSON (not JSON:API). Request and single-resource response bodies are wrapped
in the **singular** resource key (`{ "company": { ... } }`); collections are wrapped in the
**plural** key (`{ "companies": [ ... ] }`).

See [references/examples.md](references/examples.md) for full CRUD request/response examples.

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

## CRUD and Company Scoping

Standard REST verbs: `POST` to the collection, `GET` on collection or `/:id`, `PUT /:id` for
updates (send only the fields you're changing), `DELETE /:id`. DELETE requires explicit API key
permission — not all keys can delete records. Several resources also expose `/:id/archive` and
`/:id/unarchive` as PUT verbs rather than an `archived` field.

Most child resources are filtered by company rather than nested under it:

```http
GET /api/v1/assets?company_id=123
GET /api/v1/asset_passwords?company_id=123
GET /api/v1/articles?company_id=123
GET /api/v1/websites?company_id=123
GET /api/v1/assets?company_id=123&asset_layout_id=5
```

See [references/examples.md](references/examples.md) for full request/response bodies per verb.

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

Errors come back as either a single `error` string or an `errors` array of strings — handle both.
See [references/examples.md](references/examples.md) for the exact shapes and a status-code
dispatch helper.

## Gotchas

- **403 is about key scope, not key validity.** Password access, DELETE, IP whitelist, and
  company scope are all per-key toggles; a working key can still 403 on one resource.
- **404 often means a wrong `HUDU_BASE_URL` or a missing `/api/v1/` prefix**, not a missing record.
- **The UI name is not the API name.** Passwords are `asset_passwords`; Processes are `procedures`.
- **Page size is fixed at 25 and there is no total count** — you only know you've finished when a
  page returns fewer than 25 items.

## Best Practices

1. **Paginate large results** - Loop through pages until fewer than 25 results returned
2. **Implement retry logic** - Handle rate limits (429) and transient errors (500)
3. **Cache reference data** - Asset layouts rarely change; cache them
4. **Use filters** - Narrow results server-side rather than client-side filtering
5. **Monitor rate limits** - Stay under 300 requests per minute
6. **Scope by company** - Always filter by `company_id` when possible

## Related Skills

- [Hudu Companies](../companies/SKILL.md) - Company management
- [Hudu Assets](../assets/SKILL.md) - Asset management
- [Hudu Articles](../articles/SKILL.md) - Knowledge base articles
- [Hudu Passwords](../passwords/SKILL.md) - Secure credential storage
- [Hudu Websites](../websites/SKILL.md) - Website monitoring
