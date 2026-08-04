---
name: "runZero API Patterns"
description: >
  runZero API fundamentals: the available MCP tools, Bearer-token authentication, the
  Export API for bulk retrieval, pagination, rate-limit headers, error codes, and the
  runZero query language.
when_to_use: >-
  When authenticating to, paginating, exporting from, or troubleshooting errors in the
  runZero API or MCP tools. Use when: runzero api, runzero authentication, runzero
  pagination, runzero rate limit, runzero mcp, runzero tools, runzero request, runzero
  error, runzero connection, or runzero export.
---

# RunZero MCP Tools & API Patterns

## Overview

The RunZero MCP server provides AI tool integration with the RunZero asset discovery and network security platform. It exposes tools covering asset inventory, network scanning, site management, service discovery, wireless detection, and vulnerability reporting. The API uses Bearer token authentication with an Account API Token.

## Anti-triggers

- **Running an export.** This skill explains the Export API's mechanics;
  the tools that actually pull bulk data are `runzero_assets_export` in
  `runzero-assets` and `runzero_services_export` in `runzero-services`.
- **Deciding what to scan.** Query-language syntax lives here, but scan
  scope and rate belong to `runzero-tasks` and `runzero-sites`.

## Connection & Authentication

### Bearer Token Auth

RunZero authenticates using an Account API Token passed as a Bearer token:

| Header | Description |
|--------|-------------|
| `Authorization` | `Bearer <your-account-api-token>` |

Generate credentials at: **RunZero Console > Account > API Keys**

**Environment Variables:**

```bash
export RUNZERO_API_TOKEN="your-account-api-token"
```

> **IMPORTANT:** Never hardcode credentials. Always use environment variables.

### Token Types

RunZero supports multiple token scopes:

| Token Type | Scope | Use Case |
|------------|-------|----------|
| Account API Token | Full account access | General API usage |
| Organization API Token | Single org access | Scoped integrations |
| Export API Token | Read-only exports | Bulk data retrieval |

For MCP usage, use an **Account API Token** for broadest access.

## Available MCP Tools

### Assets

| Tool | Description |
|------|-------------|
| `runzero_assets_list` | List assets with filters (site, OS, type) |
| `runzero_assets_get` | Get detailed asset information |
| `runzero_assets_search` | Search assets by query string |
| `runzero_assets_export` | Export assets in bulk via Export API |

### Tasks (Scans)

| Tool | Description |
|------|-------------|
| `runzero_tasks_list` | List scan tasks |
| `runzero_tasks_get` | Get scan task details and results |
| `runzero_tasks_create` | Create and start a new scan task |
| `runzero_tasks_stop` | Stop a running scan task |

### Sites

| Tool | Description |
|------|-------------|
| `runzero_sites_list` | List organization sites |
| `runzero_sites_get` | Get site details |
| `runzero_sites_create` | Create a new site |
| `runzero_sites_update` | Update site configuration |

### Services

| Tool | Description |
|------|-------------|
| `runzero_services_list` | List discovered services |
| `runzero_services_get` | Get service details |
| `runzero_services_export` | Export services in bulk |

### Wireless

| Tool | Description |
|------|-------------|
| `runzero_wireless_list` | List discovered wireless networks |
| `runzero_wireless_get` | Get wireless network details |

### Explorers

| Tool | Description |
|------|-------------|
| `runzero_explorers_list` | List deployed explorers (scan agents) |
| `runzero_explorers_get` | Get explorer details and status |

## Export API

RunZero provides a dedicated Export API for bulk data retrieval. This is the preferred method for large datasets.

### Export Endpoints

| Resource | Description |
|----------|-------------|
| Assets | Export all assets with full attribute data |
| Services | Export all discovered services |
| Wireless | Export all wireless networks |
| Software | Export discovered software inventory |

### Export Filters

Exports support RunZero's query language for filtering:

```
os:Windows AND site_id:<uuid>
protocol:rdp AND alive:true
type:server AND last_seen:<30d
```

## Pagination

The RunZero API uses offset-based pagination:

- Results are returned in pages with configurable size
- Use `offset` and `count` parameters to navigate
- Default page size is typically 100 records
- Continue fetching until fewer results than `count` are returned

**Example workflow:**

1. Call `runzero_assets_list` with `count=100` and `offset=0`
2. If 100 results returned, call again with `offset=100`
3. Repeat until fewer than `count` results are returned

## Rate Limiting

RunZero enforces API rate limits per token:

- Monitor `X-RateLimit-Remaining` response headers
- HTTP 429 responses indicate rate limit exceeded
- Wait before retrying -- use exponential backoff
- Use the Export API for bulk operations to reduce call count

## Error Handling

### Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 401 | Unauthorized | Check API token |
| 403 | Forbidden | Token lacks required scope |
| 404 | Not Found | Resource doesn't exist or wrong ID |
| 429 | Rate Limited | Wait and retry after delay |
| 500 | Server Error | Retry; contact support if persistent |

### Error Response Format

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired API token"
}
```

## RunZero Query Language

RunZero uses a powerful query language for filtering assets and services:

### Syntax

```
field:value AND field:value OR field:value
```

### Common Fields

| Field | Description | Example |
|-------|-------------|---------|
| `os` | Operating system | `os:Windows` |
| `type` | Asset type | `type:server` |
| `hostname` | Hostname | `hostname:DC01` |
| `address` | IP address | `address:192.168.1.0/24` |
| `protocol` | Service protocol | `protocol:ssh` |
| `port` | Service port | `port:443` |
| `alive` | Asset is alive | `alive:true` |
| `last_seen` | Last seen time | `last_seen:<7d` |
| `site_id` | Site UUID | `site_id:<uuid>` |

### Operators

| Operator | Description |
|----------|-------------|
| `:` | Equals / contains |
| `:<` | Less than |
| `:>` | Greater than |
| `AND` | Logical AND |
| `OR` | Logical OR |
| `NOT` | Logical NOT |

## Best Practices

- Use the Export API for large dataset retrieval instead of paginating list endpoints
- Apply query filters to scope results to relevant assets
- Use site-based filtering to generate per-client reports
- Cache site and explorer metadata to reduce API calls
- Use Organization API Tokens for scoped integrations

## Related Skills

- [assets](../assets/SKILL.md) - Asset inventory and search
- [tasks](../tasks/SKILL.md) - Scan task management
- [sites](../sites/SKILL.md) - Site management
- [services](../services/SKILL.md) - Service discovery
- [wireless](../wireless/SKILL.md) - Wireless network detection
