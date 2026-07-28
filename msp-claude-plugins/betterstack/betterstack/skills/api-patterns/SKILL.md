---
name: "Better Stack API Patterns"
description: >
  Better Stack MCP and API surface across Uptime, Telemetry (Logtail), and
  Error Tracking: available tools, Bearer token authentication, API
  structure, cursor-based pagination, rate limiting, and error handling.
when_to_use: >-
  When authenticating to or calling Better Stack through its MCP tools or
  REST API. Use when: betterstack api, betterstack authentication,
  betterstack pagination, betterstack rate limit, betterstack mcp,
  betterstack tools, betterstack request, betterstack error, betterstack
  connection, betterstack token, betterstack credentials, or better stack
  api.
---

# Better Stack MCP Tools & API Patterns

## Overview

Better Stack provides an official hosted MCP server at `mcp.betterstack.com` covering three products in one server: **Uptime** (monitors, on-call, incidents, status pages), **Telemetry** (logs, metrics, ClickHouse SQL, dashboards), and **Error Tracking** (exceptions, releases). When accessed through the MCP Gateway, the Bearer token is injected automatically.

## Connection & Authentication

### Bearer Token Auth

Better Stack authenticates using an API token passed as a Bearer token:

| Header | Description |
|--------|-------------|
| `Authorization` | `Bearer <your-api-token>` |

### Token Types

| Token Type | Scope | Where to Generate |
|------------|-------|-------------------|
| **Global API Token** | All products, all teams | Better Stack > API tokens > Global API tokens |
| **Uptime API Token** | Uptime product only, team-scoped | Better Stack > API tokens > (select team) > Uptime API tokens |

Use the **Global API Token** for full MCP access across Uptime, Telemetry, and Error Tracking.

**Environment Variables:**

```bash
export BETTERSTACK_API_TOKEN="your-api-token"
```

> **IMPORTANT:** Never hardcode credentials. Always use environment variables.

### How the Gateway Injects Credentials

The MCP Gateway stores your token as an org credential and automatically forwards:

```
Authorization: Bearer <stored-api-token>
```

## Available MCP Tools

### Monitoring

| Tool | Description |
|------|-------------|
| `list_monitors` | List all monitors with status and uptime metrics |
| `get_monitor` | Get monitor details (URL, threshold, check interval) |
| `create_monitor` | Create a new uptime monitor |
| `update_monitor` | Update monitor settings |
| `delete_monitor` | Delete a monitor |
| `pause_monitor` | Pause monitoring (during maintenance) |
| `resume_monitor` | Resume a paused monitor |

### Heartbeat Monitoring

| Tool | Description |
|------|-------------|
| `list_heartbeats` | List all heartbeats |
| `get_heartbeat` | Get heartbeat details |
| `create_heartbeat` | Create a heartbeat monitor |
| `update_heartbeat` | Update heartbeat settings |
| `delete_heartbeat` | Delete a heartbeat |

### Incident Management

| Tool | Description |
|------|-------------|
| `list_incidents` | List incidents with status filters |
| `get_incident` | Get incident details |
| `create_incident` | Create a manual incident |
| `acknowledge_incident` | Acknowledge an active incident |
| `resolve_incident` | Resolve an incident |

### On-Call Scheduling

| Tool | Description |
|------|-------------|
| `list_on_call_schedules` | List all on-call schedules |
| `get_on_call_schedule` | Get schedule details with rotation |
| `create_on_call_schedule` | Create a new schedule |
| `update_on_call_schedule` | Update schedule settings |
| `delete_on_call_schedule` | Delete a schedule |
| `list_schedule_policies` | List escalation/notification policies |

### Status Pages

| Tool | Description |
|------|-------------|
| `list_status_pages` | List all status pages |
| `get_status_page` | Get status page details |
| `create_status_page` | Create a new status page |
| `update_status_page` | Update status page settings |
| `list_status_page_sections` | List sections on a status page |
| `create_status_page_incident` | Post an incident update to status page |

### Query Execution (Telemetry / Logtail)

| Tool | Description |
|------|-------------|
| `execute_query` | Run ClickHouse SQL against log/metric data |
| `list_saved_queries` | List saved query templates |
| `get_saved_query` | Get a saved query |

### Dashboards (Telemetry)

| Tool | Description |
|------|-------------|
| `list_dashboards` | List all dashboards |
| `get_dashboard` | Get dashboard details and panels |
| `create_dashboard` | Create a new dashboard |
| `list_dashboard_panels` | List panels on a dashboard |

### Applications (Error Tracking)

| Tool | Description |
|------|-------------|
| `list_applications` | List error tracking applications |
| `get_application` | Get application error tracking details |
| `list_releases` | List application releases |
| `create_release` | Register a new release (for error tracking) |

## Pagination

Better Stack uses cursor-based pagination:

| Parameter | Description |
|-----------|-------------|
| `per_page` | Results per page (max 50) |
| `page[after]` | Cursor from previous response to fetch next page |

**Pattern:**
1. Call tool with `per_page=50`
2. Check `pagination.next` in response -- if present, it contains the cursor URL
3. Extract the `page[after]` cursor and pass to the next call
4. Continue until `pagination.next` is null

## Rate Limiting

Better Stack enforces API rate limits per token.

- HTTP 429 responses indicate rate limit exceeded
- Back off 30 seconds; retry with exponential backoff
- Batch operations where possible
- Use filters to reduce result set sizes

## Error Handling

### Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 401 | Unauthorized | Verify token; check it's a Global or Uptime API token |
| 403 | Forbidden | Global token needed for Telemetry/Error Tracking |
| 404 | Not Found | Verify ID with a list call |
| 422 | Unprocessable Entity | Check required fields in the request |
| 429 | Rate Limited | Back off 30 seconds; retry |
| 503 | Service Unavailable | Check status.betterstack.com |

### Error Response Format

```json
{
  "errors": [
    {
      "status": "422",
      "title": "Unprocessable Entity",
      "detail": "URL is not a valid URL"
    }
  ]
}
```

## Best Practices

- Use **Global API Token** for full MCP access across all products
- Paginate large monitor lists -- large accounts can have hundreds of monitors
- Prefer ClickHouse SQL (`execute_query`) for log analysis over browsing
- Pause monitors during maintenance to prevent false-positive incidents
- Cache monitor and status page metadata to reduce API calls

## Related Skills

- [monitors](../monitors/SKILL.md) - Uptime monitor management
- [incidents](../incidents/SKILL.md) - Incident lifecycle management
- [status-pages](../status-pages/SKILL.md) - Status page management
- [oncall](../oncall/SKILL.md) - On-call schedules and escalations
- [logging](../logging/SKILL.md) - Log management via Logtail
