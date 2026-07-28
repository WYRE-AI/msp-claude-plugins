---
name: "SalesBuildr API Patterns"
description: >
  Salesbuildr API fundamentals: api-key header authentication, offset-based
  from/size pagination, error handling, and the 500 requests per 10 minutes
  rate limit.
when_to_use: >-
  When authenticating to or calling the Salesbuildr API. Use when:
  salesbuildr api, salesbuildr authentication, salesbuildr pagination,
  salesbuildr rate limit, or salesbuildr error.
---

# Salesbuildr API Patterns

## Overview

The Salesbuildr public API provides REST endpoints for managing CRM data. All requests require an API key and follow consistent patterns for pagination and error handling.

## Authentication

Every API request must include the `api-key` header:

```
Headers:
  api-key: ${SALESBUILDR_API_KEY}
  Content-Type: application/json
```

API keys are generated in the Salesbuildr portal under Settings > API Keys.

## Base URL

```
https://portal.salesbuildr.com/public-api
```

## Pagination

All list endpoints use offset-based pagination:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| from | number | 0 | - | Starting index (0-based offset) |
| size | number | 20 | 100 | Number of results per page |

Example: To get page 2 with 25 results per page:
```
GET /companies?from=25&size=25
```

## Rate Limiting

- **Limit:** 500 requests per 10 minutes
- **Strategy:** Implement conservative request patterns
- **Backoff:** If rate limited, wait and retry with exponential backoff

## Error Handling

| Status Code | Meaning | Resolution |
|-------------|---------|------------|
| 400 | Bad Request | Check request body/parameters |
| 401 | Unauthorized | Verify API key is correct |
| 403 | Forbidden | Check API key permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Retry after delay |

## Common Request Patterns

### Search with filtering
```
GET /companies?search=acme&from=0&size=25
```

### Get by ID
```
GET /companies/12345
```

### Create resource
```
POST /contacts
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "company_id": 12345
}
```

### Update resource
```
PATCH /opportunities/12345
Content-Type: application/json

{
  "stage": "proposal",
  "value": 15000
}
```
