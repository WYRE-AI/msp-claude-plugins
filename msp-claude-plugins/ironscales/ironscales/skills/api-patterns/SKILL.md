---
name: "IRONSCALES API Patterns"
description: >
  Use this skill when working with Ironscales MCP tools — available tools,
  API key and company ID authentication, pagination, rate limiting, and
  error handling.
when_to_use: >-
  When working with available tools, API key and company ID authentication, pagination, rate
  limiting, and error handling in Ironscales MCP tools. Use when: ironscales, ironscales api,
  ironscales mcp, ironscales tools, ironscales authentication, ironscales pagination, ironscales
  error, or ironscales connection.
---

# Ironscales MCP Tools & API Patterns

## Overview

The Ironscales MCP server provides AI tool integration with the Ironscales anti-phishing platform. It exposes tools for listing and triaging phishing incidents, classifying emails, taking remediation actions, managing sender allowlists, and accessing company-wide phishing statistics. Authentication uses an API key and company ID passed as request headers.

## Connection & Authentication

### API Key + Company ID

Ironscales uses a static API key combined with a company ID for authentication. The MCP Gateway injects these via headers:

| Header | Description |
|--------|-------------|
| `X-Ironscales-API-Key` | Your Ironscales API key |
| `X-Ironscales-Company-ID` | Your Ironscales company (tenant) ID |

Generate credentials at: **Ironscales Platform > Settings > API**

**Environment Variables (self-hosted):**

```bash
export IRONSCALES_API_KEY="your-api-key"
export IRONSCALES_COMPANY_ID="your-company-id"
```

> **IMPORTANT:** Never hardcode credentials. Always use environment variables or the MCP Gateway.

The Company ID scopes all API requests to a specific tenant. MSPs managing multiple clients require a separate API key and company ID per client.

## Available MCP Tools

### Incidents

| Tool | Description |
|------|-------------|
| `ironscales_list_incidents` | List phishing incidents with status and type filters |
| `ironscales_get_incident` | Get detailed information for a specific incident |
| `ironscales_classify_email` | Classify an incident's email as phishing, spam, or legitimate |
| `ironscales_remediate_incident` | Take a remediation action on a confirmed incident |

### Statistics & Reporting

| Tool | Description |
|------|-------------|
| `ironscales_get_company_stats` | Get company-wide phishing statistics and dashboard metrics |

### Allowlist Management

| Tool | Description |
|------|-------------|
| `ironscales_manage_allowlist` | Add, remove, or list sender allowlist entries |

## Pagination

The Ironscales API uses offset-based pagination:

- Pass `offset` and `limit` parameters to paginate results
- Default `limit` is typically 50 records per page
- The response includes `total` — the total number of matching records

**Example response with pagination:**

```json
{
  "incidents": [...],
  "total": 148,
  "offset": 0,
  "limit": 50
}
```

**Pagination workflow:**

1. Call with `offset=0` and `limit=50`
2. If `total > offset + limit`, call again with `offset=50`
3. Continue incrementing offset by `limit` until all records are retrieved

## Rate Limiting

Ironscales enforces per-endpoint rate limits.

- HTTP 429 responses indicate rate limiting
- Use exponential backoff before retrying
- Use status and date filters to limit result volumes
- Avoid unnecessary polling

## Error Handling

### Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 400 | Bad Request | Check required parameters and classification values |
| 401 | Unauthorized | Verify API key and company ID |
| 403 | Forbidden | API key lacks permissions for this operation |
| 404 | Not Found | Incident ID or resource does not exist |
| 429 | Rate Limited | Wait and retry with exponential backoff |
| 500 | Server Error | Retry; contact Ironscales support if persistent |

### Error Response Format

```json
{
  "error": "INVALID_API_KEY",
  "message": "The provided API key is invalid.",
  "code": 401
}
```

## Best Practices

- Always include `companyId` in all requests (handled automatically by the MCP server)
- Use status filters (`open`, `closed`) to focus on actionable incidents
- Combine `offset` pagination with status filters to efficiently process large incident backlogs
- Verify incident status before attempting classification — closed incidents cannot be reclassified
- Check `ironscales_get_company_stats` weekly to track phishing trends and identify anomalies

## Related Skills

- [incidents](../incidents/SKILL.md) - Incident lifecycle, classification, and remediation
