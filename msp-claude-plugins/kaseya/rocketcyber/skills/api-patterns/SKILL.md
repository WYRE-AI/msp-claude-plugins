---
name: "RocketCyber API Patterns"
description: >
  RocketCyber REST API v3 fundamentals: Bearer token authentication, regional
  base URL selection, pagination, rate limiting, error handling, and account
  hierarchy navigation.
when_to_use: >-
  When working with the RocketCyber API. Use when: rocketcyber api, rocketcyber authentication,
  rocketcyber query, rocketcyber pagination, rocketcyber rate limit, rocketcyber token, rocketcyber
  base url, or soc api.
---

# RocketCyber API Patterns

## Overview

The RocketCyber REST API v3 provides programmatic access to managed SOC data including security incidents, agents, accounts, applications, and threat events. This skill covers authentication, endpoint patterns, pagination, error handling, and account hierarchy navigation.

## Key Concepts

### Authentication

RocketCyber uses Bearer token authentication. The API key is generated per provider account and grants access to all customer sub-accounts under that provider.

```
┌─────────────┐     API Request with Bearer Token     ┌─────────────────┐
│   Client    │ ──────────────────────────────────>   │  RocketCyber    │
│             │     Authorization: Bearer {key}       │  API v3         │
│             │ <────────────────────────────────────  │                 │
└─────────────┘     JSON Response                     └─────────────────┘
```

**Token characteristics:**
- Obtained from RocketCyber app > Provider Settings > API tab
- Scoped to the provider account (covers all sub-accounts)
- Does not expire on a fixed schedule (verify current behavior with RocketCyber)
- One key per provider account

### Base URL

The API base URL is region-specific:

| Region | Base URL |
|--------|----------|
| US (default) | `https://api-us.rocketcyber.com/v3` |

> **Note:** Additional regional endpoints may exist. Verify with RocketCyber documentation if operating outside the US.

### Account Hierarchy

RocketCyber uses a provider-customer hierarchy:

```
Provider Account (your MSP)
├── Customer Account A
├── Customer Account B
├── Customer Account C
└── ...
```

- The API key is tied to the **provider** account
- All API calls can filter by `accountId` to scope to a specific customer
- Omitting `accountId` typically returns data across all customer accounts

## Field Reference

### Common Request Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer {api_key}` | Required. API authentication token |
| `Content-Type` | `application/json` | Required for POST/PUT/PATCH requests |

### Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `accountId` | integer | Filter results to a specific customer account |
| `page` | integer | Page number for paginated results (verify against API docs) |
| `limit` | integer | Number of results per page (verify against API docs) |
| `startDate` | string | Filter by start date (ISO 8601 format, verify against API docs) |
| `endDate` | string | Filter by end date (ISO 8601 format, verify against API docs) |

## API Patterns

### Authentication Test

```bash
# Verify API key is valid by listing accounts
curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/accounts" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}" \
  -H "Content-Type: application/json"
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 12345,
      "name": "Acme Corporation",
      "type": "customer",
      "status": "active"
    }
  ],
  "totalCount": 1,
  "page": 1,
  "limit": 50
}
```

### Pagination Pattern

Pagination likely follows a page/limit model (verify against API docs):

```bash
# First page
curl -s "https://api-us.rocketcyber.com/v3/incidents?page=1&limit=50" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"

# Next page
curl -s "https://api-us.rocketcyber.com/v3/incidents?page=2&limit=50" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

**Pagination response fields (verify against API docs):**
```json
{
  "data": [...],
  "totalCount": 245,
  "page": 1,
  "limit": 50
}
```

**Iterating all pages:**
1. Request page 1 with desired limit
2. Check `totalCount` against `page * limit`
3. Continue requesting until all records retrieved
4. Respect rate limits between page requests

### Filtering by Account

Most endpoints accept `accountId` to scope results:

```bash
# Incidents for a specific customer
curl -s "https://api-us.rocketcyber.com/v3/incidents?accountId=12345" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"

# Agents for a specific customer
curl -s "https://api-us.rocketcyber.com/v3/agents?accountId=12345" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

## Common Workflows

### Initial Setup Verification

1. Test API connectivity with accounts endpoint
2. List all customer accounts to verify scope
3. Query incidents for a known account to confirm data access

### Cross-Account Reporting

1. List all accounts to get account IDs
2. For each account, query incidents, agents, and apps
3. Aggregate results for provider-level reporting

## Error Handling

### HTTP Status Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 200 | Success | Request completed |
| 400 | Bad Request | Check query parameters and request body |
| 401 | Unauthorized | Verify API key is correct and not revoked |
| 403 | Forbidden | API key may lack permissions for this resource |
| 404 | Not Found | Resource does not exist or invalid endpoint |
| 429 | Too Many Requests | Rate limited -- back off and retry |
| 500 | Internal Server Error | RocketCyber server error -- retry with backoff |

### Error Response Format (verify against API docs)

```json
{
  "error": {
    "code": 401,
    "message": "Unauthorized: Invalid API key"
  }
}
```

### Rate Limiting Strategy

Rate limits are not publicly documented. Use conservative backoff:

1. **Default pace:** 1-2 requests per second
2. **On 429 response:** Wait 30 seconds, then retry with exponential backoff
3. **Batch operations:** Add 500ms delay between requests
4. **Pagination:** Add 200ms delay between page requests

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid or expired API key | Regenerate key in Provider Settings > API |
| 403 Forbidden | Key lacks access to resource | Verify provider account has the required subscription |
| Empty response for accountId | Account does not exist or has no data | Verify account ID with accounts endpoint |

## Endpoint Reference

All endpoints are relative to `https://api-{region}.rocketcyber.com/v3`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts` | List all accounts (verify against API docs) |
| GET | `/accounts/{id}` | Get account by ID (verify against API docs) |
| GET | `/incidents` | List incidents with filters (verify against API docs) |
| GET | `/incidents/{id}` | Get incident details (verify against API docs) |
| GET | `/agents` | List agents with filters (verify against API docs) |
| GET | `/agents/{id}` | Get agent details (verify against API docs) |
| GET | `/apps` | List applications (verify against API docs) |
| GET | `/defender` | Defender status per endpoint (verify against API docs) |
| GET | `/events` | Threat events and detection logs (verify against API docs) |

> **Important:** Endpoint paths are inferred from the Celerium PowerShell wrapper and may differ from the actual API. Verify each endpoint against current RocketCyber API documentation before use in production.

## Related Skills

- [incidents](../incidents/SKILL.md) - Incident lifecycle and investigation
- [agents](../agents/SKILL.md) - Agent deployment and monitoring
- [accounts](../accounts/SKILL.md) - Account hierarchy and management
- [apps](../apps/SKILL.md) - Application inventory and monitoring
