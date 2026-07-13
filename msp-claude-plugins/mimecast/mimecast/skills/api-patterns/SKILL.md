---
name: "Mimecast API Patterns"
description: >
  Use this skill when working with Mimecast MCP tools — available tools,
  OAuth 2.0 client credentials authentication, regional API endpoints,
  pagination, rate limiting, and error handling.
when_to_use: >-
  When working with available tools, OAuth 2.0 client credentials authentication, regional API
  endpoints, pagination, rate limiting, and error handling in Mimecast MCP tools. Use when:
  mimecast, mimecast api, mimecast authentication, mimecast tools, mimecast mcp, mimecast request,
  mimecast error, mimecast region, or mimecast pagination.
---

# Mimecast MCP Tools & API Patterns

## Overview

The Mimecast MCP server provides AI tool integration with the Mimecast Email Security platform. It covers message tracking, threat intelligence (TTP), email delivery queue management, and audit event access. Authentication is via OAuth 2.0 client credentials — the MCP Gateway handles token acquisition automatically using the injected client ID and secret.

## Connection & Authentication

### OAuth 2.0 Client Credentials

Mimecast uses OAuth 2.0 client credentials flow. The MCP Gateway injects credentials via headers:

| Header | Description |
|--------|-------------|
| `X-Mimecast-Client-ID` | OAuth 2.0 Client ID |
| `X-Mimecast-Client-Secret` | OAuth 2.0 Client Secret |
| `X-Mimecast-Region` | Regional API endpoint key (us, eu, de, ca, za, au) |

The server exchanges the client ID and secret for a bearer token at startup and refreshes it as needed. Individual tool calls do not require manual token management.

**Environment Variables (self-hosted):**

```bash
export MIMECAST_CLIENT_ID="your-client-id"
export MIMECAST_CLIENT_SECRET="your-client-secret"
export MIMECAST_REGION="us"
```

> **IMPORTANT:** Never hardcode credentials. Always use environment variables or the MCP Gateway.

### Regional Endpoints

Mimecast tenants are hosted in specific regions. Using the wrong region returns empty results or authentication failures.

| Region Key | Base URL |
|------------|----------|
| `us` | `https://api.services.mimecast.com` |
| `eu` | `https://eu-api.mimecast.com` |
| `de` | `https://de-api.mimecast.com` |
| `ca` | `https://ca-api.mimecast.com` |
| `za` | `https://za-api.mimecast.com` |
| `au` | `https://au-api.mimecast.com` |

To identify the correct region, log into the Mimecast Administration Console and check the URL — the subdomain indicates the region (`us`, `eu`, `de`, etc.).

## Available MCP Tools

### Message Tracking

| Tool | Description |
|------|-------------|
| `mimecast_find_message` | Search messages by sender, recipient, subject, date range |
| `mimecast_get_message_info` | Get detailed metadata for a specific message |
| `mimecast_hold_message` | Place a message on hold (prevent delivery) |
| `mimecast_release_message` | Release a held message for delivery |

### Threat Intelligence

| Tool | Description |
|------|-------------|
| `mimecast_get_threat_incidents` | List threat remediation incidents |
| `mimecast_get_ttp_logs` | Get TTP logs — URL clicks, attachment checks, impersonation |
| `mimecast_get_audit_events` | Retrieve audit log entries |

### Queue Management

| Tool | Description |
|------|-------------|
| `mimecast_get_queue` | Get email delivery queue status |

## Pagination

Most Mimecast list endpoints use cursor-based pagination:

- Responses include a `meta.pagination` object with `pageSize`, `totalCount`, and optionally `next`
- Pass the `next` cursor value as the `pageToken` parameter on the next call
- Continue until `meta.pagination.next` is absent or null

**Example pagination response:**

```json
{
  "meta": {
    "status": 200,
    "pagination": {
      "pageSize": 25,
      "totalCount": 142,
      "next": "eyJwYWdlIjoyLCJwYWdlU2l6ZSI6MjV9"
    }
  },
  "data": []
}
```

**Pagination workflow:**

1. Call the tool with no `pageToken`
2. Check `meta.pagination.next` in the response
3. If present, call again with `pageToken` set to that value
4. Repeat until `next` is absent

## Rate Limiting

Mimecast enforces per-endpoint rate limits. Specific limits vary by subscription tier.

- HTTP 429 responses indicate rate limiting
- Use exponential backoff before retrying
- Apply date range and sender/recipient filters to reduce result set sizes
- Avoid broad sweeping queries — target specific messages or time windows

## Error Handling

### Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 400 | Bad Request | Check required parameters and date format (ISO 8601) |
| 401 | Unauthorized | Verify Client ID and Secret; check token expiry |
| 403 | Forbidden | Insufficient OAuth scopes for the operation |
| 404 | Not Found | Message ID or resource doesn't exist |
| 429 | Rate Limited | Wait and retry with backoff |
| 500 | Server Error | Retry; contact Mimecast support if persistent |

### Error Response Format

```json
{
  "meta": {
    "status": 401,
    "message": "Invalid credentials"
  },
  "fail": [
    {
      "errors": [
        {
          "code": "err_auth_invalid",
          "message": "The provided client credentials are invalid",
          "retryable": false
        }
      ]
    }
  ]
}
```

### Wrong Region

If requests succeed but return empty `data` arrays when results are expected, the region is likely incorrect. Verify the tenant's region and update the `MIMECAST_REGION` configuration.

## Best Practices

- Always specify date ranges when searching messages — open-ended queries are slow and may be rate limited
- Use sender and recipient filters together to narrow results quickly
- Check the `meta.status` field in every response — Mimecast sometimes returns HTTP 200 with error status in the body
- Prefer targeted searches over paginating through all messages
- Store the OAuth token and reuse it until near expiry rather than fetching a new one per call
- Log the `requestId` from response headers for support escalations

## Related Skills

- [message-tracking](../message-tracking/SKILL.md) - Search and manage messages
- [threat-intelligence](../threat-intelligence/SKILL.md) - TTP logs and threat incidents
- [queue-management](../queue-management/SKILL.md) - Delivery queue monitoring
