---
name: "SpamTitan API Patterns"
description: >
  Use this skill when working with the SpamTitan MCP tools —
  available tools, authentication via API key header, API structure,
  pagination, rate limiting, error handling, and best practices.
when_to_use: >-
  When working with available tools, authentication via API key header, API structure, pagination,
  rate limiting, error handling, and best practices in the SpamTitan MCP tools. Use when:
  spamtitan, spamtitan api, spam filter, titanhq, SpamTitan API, SpamTitan tools, spamtitan
  authentication, spamtitan mcp, spamtitan rate limit, or spamtitan error.
---

# SpamTitan MCP Tools & API Patterns

## Overview

The SpamTitan MCP server provides AI tool integration with the SpamTitan email security platform by TitanHQ. It exposes tools covering quarantine queue management, email flow statistics, and sender allowlist/blocklist management. The API uses an API key passed as an HTTP header.

## Connection & Authentication

### API Key Header Auth

SpamTitan authenticates using an API key passed via HTTP header:

| Header | Description |
|--------|-------------|
| `X-SpamTitan-API-Key` | Your SpamTitan API key |

Generate credentials at: **SpamTitan Admin Interface > Settings > API**

**Environment Variables:**

```bash
export SPAMTITAN_API_KEY="your-api-key"
```

> **IMPORTANT:** Never hardcode credentials. Always use environment variables.

## Available MCP Tools

### Quarantine Management

| Tool | Description |
|------|-------------|
| `spamtitan_get_queue` | List messages in the quarantine queue |
| `spamtitan_release_message` | Release a quarantined message to the recipient |
| `spamtitan_delete_message` | Permanently delete a quarantined message |
| `spamtitan_get_message` | Get details for a specific quarantined message |

### Email Statistics

| Tool | Description |
|------|-------------|
| `spamtitan_get_stats` | Get email flow statistics (inbound, outbound, spam rates) |
| `spamtitan_get_domain_stats` | Get statistics broken down by domain |

### List Management

| Tool | Description |
|------|-------------|
| `spamtitan_manage_allowlist` | Add or remove entries from the sender allowlist |
| `spamtitan_manage_blocklist` | Add or remove entries from the sender blocklist |
| `spamtitan_list_allowlist` | List current allowlist entries |
| `spamtitan_list_blocklist` | List current blocklist entries |

## Pagination

The SpamTitan API uses page/limit style pagination:

- Pass `page` (1-based) and `limit` parameters
- Continue fetching pages until the result count is less than the `limit`

**Example workflow:**

1. Call `spamtitan_get_queue` with `page=1&limit=100`
2. If 100 results returned, call again with `page=2`
3. Repeat until fewer than `limit` results are returned

## Rate Limiting

SpamTitan enforces API rate limits per API key:

- HTTP 429 responses indicate rate limit exceeded
- Wait before retrying — use exponential backoff
- Use date range filters to reduce result set sizes
- Avoid polling at high frequency; fetch on demand

## Error Handling

### Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 401 | Unauthorized | Check `X-SpamTitan-API-Key` header value |
| 403 | Forbidden | Insufficient API key permissions |
| 404 | Not Found | Resource doesn't exist or wrong ID |
| 422 | Unprocessable Entity | Invalid request parameters |
| 429 | Rate Limited | Wait and retry after delay |
| 500 | Server Error | Retry; contact TitanHQ support if persistent |

### Error Response Format

```json
{
  "error": {
    "code": 401,
    "message": "Invalid or missing API key"
  }
}
```

## Best Practices

- Use date range filters when listing the quarantine queue to avoid pulling the full history
- Use domain filters to scope queries to specific customer domains in multi-tenant deployments
- Use bulk actions (release or delete) rather than individual calls when processing multiple messages
- Always confirm before bulk-deleting quarantined messages — deletion is irreversible
- Handle rate limits gracefully with exponential backoff
- Log all list management changes (allowlist/blocklist) for audit trail purposes

## Related Skills

- [quarantine](../quarantine/SKILL.md) - Quarantine queue management
- [lists](../lists/SKILL.md) - Sender allowlist and blocklist management
