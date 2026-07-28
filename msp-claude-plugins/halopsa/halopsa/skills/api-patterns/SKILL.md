---
name: "HaloPSA API Patterns"
description: >
  HaloPSA REST API fundamentals: OAuth 2.0 client-credentials authentication,
  authorization vs. resource server URLs, the tenant query parameter, filtering
  and pagination conventions, array-wrapped POST bodies, rate-limit behavior,
  scopes, and error codes.
when_to_use: >-
  When authenticating to or calling the HaloPSA REST API directly or through MCP tools. Use when:
  halopsa api, halopsa authentication, halopsa oauth, halopsa token, halopsa query, halopsa
  pagination, halopsa rate limit, halopsa rest, or halo api.
---

# HaloPSA API Patterns

## Overview

The HaloPSA REST API provides access to all PSA entities including tickets, clients, assets, contracts, and more. This skill covers OAuth 2.0 Client Credentials authentication, tenant configuration, query patterns, pagination, and error handling.

## Authentication

### OAuth 2.0 Client Credentials Flow

HaloPSA uses OAuth 2.0 Client Credentials flow for API authentication. This is different from basic API key authentication - you must obtain an access token before making API requests.

### Server URLs

HaloPSA has two server URLs:

| Server | Purpose | Example |
|--------|---------|---------|
| **Authorization Server** | Token endpoint | `https://yourcompany.halopsa.com/auth` |
| **Resource Server** | API endpoints | `https://yourcompany.halopsa.com/api` |

Find these in **Configuration > Integrations > HaloPSA API > API Details**.

### Token Endpoint

```
POST https://{base_url}/auth/token?tenant={tenant_name}
```

Form-encoded body with `grant_type=client_credentials`, `client_id`, `client_secret`, and `scope`. The `tenant` query parameter is required for cloud-hosted instances and omitted for self-hosted. Tokens are returned with an `expires_in` (typically 3600s) - cache them and refresh with a buffer before expiry.

See [references/auth.md](references/auth.md) for the full token request/response, parameter table, environment configuration, a caching token-manager class, and the scope catalog.

## API Request Structure

### Making Authenticated Requests

```http
GET /api/Tickets
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Base URL Structure

| Instance Type | URL Pattern |
|---------------|-------------|
| Cloud-hosted | `https://{company}.halopsa.com/api` |
| Self-hosted | `https://{your-server}/api` |

### Filtering

Filters are plain query parameters, e.g. `GET /api/Tickets?client_id=123&status_id=1&tickettype_id=5`. Date ranges use `_start` / `_end` suffixes on the date field (`dateoccurred_start`, `dateoccurred_end`).

See [references/api.md](references/api.md) for the endpoint catalog, the full query-parameter table, and complete CRUD request shapes.

## Pagination

### Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page_no` | int | 1 | Page number (1-based) |
| `page_size` | int | 50 | Results per page |
| `count` | int | - | Total count (in response) |

### Paginated Request

```http
GET /api/Tickets?page_no=1&page_size=100
```

### Response Structure

Results come back under a key named for the entity (not a generic `data`/`items` key), alongside `record_count`:

```json
{
  "record_count": 523,
  "tickets": [
    { "id": 1, "summary": "..." },
    { "id": 2, "summary": "..." }
  ]
}
```

See [references/examples.md](references/examples.md) for a full pagination loop, retry, and batch-processing implementations.

## CRUD Conventions

- **POST bodies are always arrays**, even for a single record.
- **Updates reuse POST** on the collection endpoint - include the `id` field to update an existing record instead of creating one.
- **DELETE** is `DELETE /api/{Entity}/{id}`, but not all entities support it.

## Rate Limiting

HaloPSA rate limits return HTTP `429 Too Many Requests`, sometimes with a `Retry-After` header and a JSON body carrying `retry_after` seconds. Back off for the indicated interval plus jitter, and space bulk operations into batches with a delay between them.

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created |
| 400 | Bad Request | Check request format/values |
| 401 | Unauthorized | Refresh token or check credentials |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |

Validation errors (400) return a `details` array naming the offending field and reason. See [references/api.md](references/api.md) for the error and rate-limit response shapes, and [references/examples.md](references/examples.md) for a status-code dispatch handler.

## Best Practices

1. **Cache access tokens** - Tokens are valid for the `expires_in` duration; refresh before expiry rather than per-request
2. **Use tenant parameter** - Required for cloud-hosted instances
3. **Implement retry logic** - Handle rate limits and transient errors
4. **Batch operations** - Group related requests with delays
5. **Use specific scopes** - Request only needed permissions
6. **Use pagination** - Never fetch unbounded result sets

## Common Issues

### "Invalid grant" Error

**Cause:** Client credentials are incorrect or application is disabled.

**Fix:**
1. Verify Client ID and Secret
2. Check application is active in HaloPSA
3. Ensure permissions are configured

### "Tenant not found" Error

**Cause:** Incorrect or missing tenant parameter.

**Fix:**
1. For cloud-hosted: Use company name from URL
2. For self-hosted: Leave tenant empty

### 401 After Successful Token

**Cause:** Token used with wrong server URL.

**Fix:** Ensure Resource Server URL is correct (`/api` path).

## Related Skills

- [HaloPSA Tickets](../tickets/SKILL.md) - Ticket management
- [HaloPSA Clients](../clients/SKILL.md) - Client management
- [HaloPSA Assets](../assets/SKILL.md) - Asset tracking
- [HaloPSA Contracts](../contracts/SKILL.md) - Contract management
