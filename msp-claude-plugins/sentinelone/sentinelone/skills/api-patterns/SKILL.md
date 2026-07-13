---
name: "SentinelOne API Patterns"
description: >
  Use this skill when working with the SentinelOne Purple MCP tools -
  available tools, connection setup, uvx-based installation, Service User
  token authentication, transport modes, dual API architecture (GraphQL
  and REST), rate limits, error handling, and best practices. Covers all
  23 Purple MCP tools organized by domain.
when_to_use: >-
  When working with available tools, connection setup, uvx-based installation, Service User token
  authentication, transport modes, dual API architecture (GraphQL and REST). Use when: sentinelone
  api, sentinelone query, sentinelone filter, sentinelone pagination, sentinelone rate limit,
  sentinelone authentication, sentinelone mcp, sentinelone endpoint, sentinelone request,
  sentinelone token, sentinelone tools, purple mcp, sentinelone connection, or sentinelone service
  user.
---

# SentinelOne Purple MCP Tools & API Patterns

## Overview

SentinelOne provides the Purple MCP server for AI tool integration with the Singularity XDR platform. The MCP server is a Python package installed via `uvx` from GitHub. It exposes 23 tools covering Purple AI, alerts, vulnerabilities, misconfigurations, asset inventory, and PowerQuery threat hunting. All tools are **read-only** -- they support investigation and reporting but cannot modify, remediate, or take action on any resources.

The Purple MCP server has a dual API architecture:
- **GraphQL API** - Used for Purple AI, alerts, vulnerabilities, and misconfigurations
- **REST API** - Used for asset inventory

## Connection & Authentication

### Service User Token

Authentication requires a Service User token from the SentinelOne Management Console:

1. Navigate to **Policy & Settings > User Management > Service Users**
2. Create a Service User with appropriate Account or Site scope
3. Generate an API token

> **CRITICAL:** The token must be **Account** or **Site** level. **Global-level tokens are rejected** by the Purple MCP server and will return authentication errors.

**Environment Variables:**

| Variable | Description |
|----------|-------------|
| `PURPLEMCP_CONSOLE_TOKEN` / `SENTINELONE_TOKEN` | Service User API token |
| `PURPLEMCP_CONSOLE_BASE_URL` / `SENTINELONE_BASE_URL` | Console URL (e.g., `https://your-console.sentinelone.net`) |

```bash
export SENTINELONE_TOKEN="your-service-user-token"
export SENTINELONE_BASE_URL="https://your-console.sentinelone.net"
```

### Transport Modes

The Purple MCP server supports three transport modes:

| Mode | Flag | Description | Use Case |
|------|------|-------------|----------|
| stdio | `--mode stdio` | Standard input/output | Claude Desktop, local usage (recommended) |
| SSE | `--mode sse` | Server-Sent Events over HTTP | Remote/shared access |
| Streamable HTTP | `--mode streamable-http` | HTTP with streaming | Production deployments |

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "sentinelone": {
      "command": "uvx",
      "args": [
        "--from", "git+https://github.com/Sentinel-One/purple-mcp.git",
        "purple-mcp",
        "--mode", "stdio"
      ],
      "env": {
        "PURPLEMCP_CONSOLE_TOKEN": "YOUR_SERVICE_USER_TOKEN",
        "PURPLEMCP_CONSOLE_BASE_URL": "https://your-console.sentinelone.net"
      }
    }
  }
}
```

### Installation Requirements

The Purple MCP server requires Python and `uv`/`uvx`:

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify installation
uvx --version

# Test the MCP server
uvx --from git+https://github.com/Sentinel-One/purple-mcp.git purple-mcp --help
```

> **Note:** This is a Python package, not Node.js. Use `uvx`, not `npx`.

## Complete MCP Tool Reference

### Purple AI Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `purple_ai` | Natural language cybersecurity assistant for threat investigation and PowerQuery generation | `query` (required) - natural language question or investigation prompt |

### Alert Tools (GraphQL)

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_alert` | Get a single alert by ID | `alertId` (required) |
| `list_alerts` | List alerts with filters | `severity`, `status`, `viewType`, `limit`, `cursor`, `sortBy`, `sortOrder` |
| `search_alerts` | Search alerts with GraphQL filters | `filters` (fieldId/filterType/values), `limit`, `cursor` |
| `get_alert_notes` | Get notes/comments on an alert | `alertId` (required) |
| `get_alert_history` | Get timeline of changes for an alert | `alertId` (required) |

### Vulnerability Tools (GraphQL)

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_vulnerability` | Get a single vulnerability by ID | `vulnerabilityId` (required) |
| `list_vulnerabilities` | List vulnerabilities with filters | `severity`, `status`, `limit`, `cursor`, `sortBy`, `sortOrder` |
| `search_vulnerabilities` | Search vulnerabilities with GraphQL filters | `filters` (fieldId/filterType/values), `limit`, `cursor` |
| `get_vulnerability_notes` | Get notes on a vulnerability | `vulnerabilityId` (required) |
| `get_vulnerability_history` | Get timeline of changes for a vulnerability | `vulnerabilityId` (required) |

### Misconfiguration Tools (GraphQL)

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_misconfiguration` | Get a single misconfiguration by ID | `misconfigurationId` (required) |
| `list_misconfigurations` | List misconfigurations with filters | `severity`, `status`, `viewType`, `limit`, `cursor`, `sortBy`, `sortOrder` |
| `search_misconfigurations` | Search misconfigurations with GraphQL filters | `filters` (fieldId/filterType/values), `limit`, `cursor` |
| `get_misconfiguration_notes` | Get notes on a misconfiguration | `misconfigurationId` (required) |
| `get_misconfiguration_history` | Get timeline of changes for a misconfiguration | `misconfigurationId` (required) |

### Inventory Tools (REST)

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_inventory_item` | Get a single inventory item by ID | `itemId` (required) |
| `list_inventory_items` | List inventory items with filters | `surface`, `limit`, `offset`, `sortBy`, `sortOrder` |
| `search_inventory_items` | Search inventory with REST filters | `filters`, `surface`, `limit`, `offset` |

### PowerQuery / Data Lake Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `powerquery` | Execute a PowerQuery against the Singularity Data Lake | `query` (required), `fromDate`, `toDate` |
| `get_timestamp_range` | Get the available time range for PowerQuery data | None |
| `iso_to_unix_timestamp` | Convert an ISO 8601 timestamp to Unix epoch milliseconds | `timestamp` (required) |

## Dual API Architecture

### GraphQL API (Alerts, Vulnerabilities, Misconfigurations, Purple AI)

The GraphQL API uses a filter-based query model:

**Filter Structure:**

```json
{
  "fieldId": "severity",
  "filterType": "EQUALS",
  "values": ["CRITICAL"]
}
```

**Filter Types:**

| Filter Type | Description | Example |
|-------------|-------------|---------|
| `EQUALS` | Exact match | `{"fieldId": "severity", "filterType": "EQUALS", "values": ["CRITICAL"]}` |
| `CONTAINS` | Substring match | `{"fieldId": "name", "filterType": "CONTAINS", "values": ["ransomware"]}` |
| `IN` | Match any in list | `{"fieldId": "status", "filterType": "IN", "values": ["NEW", "IN_PROGRESS"]}` |
| `NOT_EQUALS` | Negation | `{"fieldId": "status", "filterType": "NOT_EQUALS", "values": ["RESOLVED"]}` |

**Pagination:** Cursor-based. Use the `cursor` value from the response to fetch the next page.

**Sorting:**

| Parameter | Values |
|-----------|--------|
| `sortBy` | Varies by resource (e.g., `severity`, `detectedAt`, `status`) |
| `sortOrder` | `ASC`, `DESC` |

### REST API (Inventory)

The REST API uses offset-based pagination with filter parameters:

**Filter Types:**

| Type | Description | Example |
|------|-------------|---------|
| Exact match | Direct value comparison | `surface=ENDPOINT` |
| Contains | Substring matching | `name__contains=server` |
| Range | Numeric/date ranges | `lastSeen__gte=2026-01-01` |
| ID list | Match multiple IDs | `ids=id1,id2,id3` |
| Negation | Exclude matches | `status__ne=INACTIVE` |

**Pagination:**

| Parameter | Description | Default |
|-----------|-------------|---------|
| `limit` | Results per page | 50 |
| `offset` | Skip N results | 0 |

## PowerQuery Language

> **IMPORTANT:** PowerQuery is SentinelOne's Scalyr-based pipeline query language. It is **NOT** Splunk SPL, SQL, KQL, or Elasticsearch Query DSL.

PowerQuery uses a pipeline syntax with filters and aggregations:

```
EventType = "Process Creation" AND TgtProcName = "powershell.exe"
| columns SrcProcName, TgtProcName, TgtProcCmdLine, EndpointName
| limit 100
```

**Best practice:** Use the `purple_ai` tool with a natural language description of what you want to find, and it will generate the correct PowerQuery syntax. Then execute the generated query with the `powerquery` tool.

## Rate Limiting

SentinelOne enforces rate limits on API calls. The Purple MCP server does not expose specific rate limit headers, but:

- Space out requests when iterating over large datasets
- Use pagination to limit result sizes
- If you receive rate limit errors, wait 30-60 seconds before retrying
- Filter server-side to reduce total API calls

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| 401 Unauthorized | Invalid or expired token | Regenerate Service User token |
| 403 Forbidden | Global-level token used | Use Account or Site-level token instead |
| Tool not found | MCP server not connected | Verify uvx installation and environment variables |
| Invalid query | Malformed PowerQuery syntax | Use `purple_ai` to generate correct syntax |
| Resource not found | Invalid ID | Verify the resource ID exists |
| Timeout | Query too broad or Data Lake overloaded | Narrow time range or add filters |

### Troubleshooting MCP Connection

1. **Verify uvx** - Ensure `uvx --version` returns a version
2. **Check Python** - Ensure `python3 --version` is available
3. **Test manually** - Run `uvx --from git+https://github.com/Sentinel-One/purple-mcp.git purple-mcp --help`
4. **Verify token** - Ensure the token is Account or Site level, not Global
5. **Check console URL** - Must include `https://` and the full domain
6. **Test with a simple call** - Try `list_alerts` with `limit=1` to verify connectivity

## Best Practices

1. **Use Account/Site tokens** - Never use Global-level tokens; they will be rejected
2. **Start with Purple AI** - Use `purple_ai` for investigation before diving into specific tools
3. **Filter server-side** - Always use tool parameters to narrow results rather than fetching everything
4. **Use cursor pagination** - For GraphQL tools, use the cursor from each response to fetch subsequent pages
5. **Scope to clients** - When reviewing a specific client's security, filter by site or account
6. **Generate PowerQuery via Purple AI** - Do not write PowerQuery manually; describe what you want in natural language
7. **Time-bound queries** - Always set time ranges for PowerQuery to avoid scanning the entire Data Lake
8. **Cache inventory data** - Endpoint and asset data changes less frequently than alerts
9. **Triage by severity** - Always start with CRITICAL and HIGH severity items
10. **Document findings** - Use alert notes and history to build investigation timelines

## Related Skills

- [Purple AI](../purple-ai/SKILL.md) - Natural language threat investigation
- [Alerts](../alerts/SKILL.md) - Unified alert management
- [Vulnerabilities](../vulnerabilities/SKILL.md) - Vulnerability tracking and remediation
- [Misconfigurations](../misconfigurations/SKILL.md) - Cloud security posture management
- [Inventory](../inventory/SKILL.md) - Asset inventory
- [Threat Hunting](../threat-hunting/SKILL.md) - PowerQuery and Data Lake queries
