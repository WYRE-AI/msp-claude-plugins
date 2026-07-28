---
name: "Domotz API Patterns"
description: >
  Domotz API and MCP fundamentals: API-key header authentication, region-specific
  endpoints (us-east-1 / eu-central-1), the full MCP tool catalog by domain,
  offset-based pagination, rate limiting, and HTTP error codes.
when_to_use: >-
  When authenticating to or calling the Domotz API directly or through the MCP
  tools, or when discovering which Domotz tool to use. Use when: domotz api, domotz authentication, domotz
  pagination, domotz rate limit, domotz mcp, domotz tools, domotz request, domotz error, domotz
  connection, or domotz region.
---

# Domotz MCP Tools & API Patterns

## Overview

The Domotz MCP server provides AI tool integration with the Domotz network monitoring and management platform. It exposes tools covering agents, devices, alerts, network scanning, SNMP, port monitoring, speed tests, and Domotz Eyes sensors. The API authenticates with an API key passed via the `X-Api-Key` header.

## Connection & Authentication

### API Key Authentication

Domotz authenticates using an API key passed as an HTTP header:

| Header | Description |
|--------|-------------|
| `X-Domotz-API-Key` | Your Domotz API key |
| `X-Domotz-Region` | API region (`us-east-1` or `eu-central-1`) |

Generate credentials at: **Domotz Portal > User Menu > API Keys**

**Environment Variables:**

```bash
export DOMOTZ_API_KEY="your-api-key"
export DOMOTZ_REGION="us-east-1"
```

> **IMPORTANT:** Never hardcode credentials. Always use environment variables.

### Regional Endpoints

Domotz operates region-specific API endpoints:

| Region | API Host |
|--------|----------|
| `us-east-1` (default) | `api-us-east-1-cell-1.domotz.com` |
| `eu-central-1` | `api-eu-central-1-cell-1.domotz.com` |

Ensure your region matches your Domotz account's region. Using the wrong region returns authentication errors.

## Available MCP Tools

### Agents

| Tool | Description |
|------|-------------|
| `domotz_list_agents` | List all Domotz agents/collectors |
| `domotz_get_agent` | Get details for a specific agent |
| `domotz_get_agent_status` | Get agent connectivity status |

### Devices

| Tool | Description |
|------|-------------|
| `domotz_list_devices` | List devices monitored by an agent |
| `domotz_get_device` | Get device details by ID |
| `domotz_search_devices` | Search devices by name, IP, or MAC |
| `domotz_get_device_status` | Get device online/offline status |

### Alerts

| Tool | Description |
|------|-------------|
| `domotz_list_alerts` | List active alerts |
| `domotz_get_alert` | Get alert details |
| `domotz_list_alert_profiles` | List configured alert profiles |

### Network

| Tool | Description |
|------|-------------|
| `domotz_scan_network` | Trigger a network discovery scan |
| `domotz_list_snmp_data` | Get SNMP polled data for a device |
| `domotz_list_ports` | List open ports on a device |
| `domotz_run_speed_test` | Run a speed test from an agent |

### Domotz Eyes

| Tool | Description |
|------|-------------|
| `domotz_list_eyes` | List Domotz Eyes sensors for an agent |
| `domotz_get_eye` | Get sensor details and status |
| `domotz_list_eye_results` | Get historical results for a sensor |

## Pagination

The Domotz API uses offset-based pagination:

- Pass `page` (1-indexed) and `page_size` to control result pages
- The response includes `count` for total number of results
- Continue fetching pages until all results are retrieved

**Example workflow:**

1. Call `domotz_list_devices` with `agent_id` and `page=1`, `page_size=50`
2. If `count` exceeds 50, call again with `page=2`
3. Repeat until all pages are fetched

## Rate Limiting

Domotz enforces API rate limits per API key.

- HTTP 429 responses indicate rate limit exceeded
- Wait before retrying -- use exponential backoff
- Batch operations where possible
- Use filters to reduce result set sizes

## Error Handling

### Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 401 | Unauthorized | Check API key; verify region matches account |
| 403 | Forbidden | Insufficient permissions for this resource |
| 404 | Not Found | Resource doesn't exist or wrong ID |
| 429 | Rate Limited | Wait and retry after delay |
| 500 | Server Error | Retry; contact support if persistent |

### Error Response Format

```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

## Best Practices

- Paginate through full result sets for complete device inventories
- Use agent ID filters to scope queries to specific sites
- Cache agent and device info to reduce API calls
- Monitor `last_seen` timestamps to detect offline agents/devices

## Related Skills

- [agents](../agents/SKILL.md) - Agent and site management
- [devices](../devices/SKILL.md) - Device inventory and discovery
- [alerts](../alerts/SKILL.md) - Alert profiles and triggers
- [network](../network/SKILL.md) - Network scanning and SNMP
- [eyes](../eyes/SKILL.md) - Domotz Eyes sensors
