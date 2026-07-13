---
description: Search logs via Better Stack Logtail
argument-hint: "<query> [source] [from] [to] [limit]"
arguments: [query, source, from, to, limit]
---

# Better Stack Log Search

Search and query logs via Better Stack Logtail using structured queries. Use for incident investigation, error pattern analysis, and proactive monitoring.

## Prerequisites

- Better Stack MCP server connected with valid API token (Global API Token required for Telemetry)
- MCP tools `execute_query` and `list_sources` available

## Steps

1. **Identify log sources**

   If a `source` filter is provided, resolve the source name to a source ID. Otherwise, search across all sources. Call `list_sources` to see available sources if needed.

2. **Build and execute query**

   Call `execute_query` with the ClickHouse SQL query based on the provided `query` string. Apply `from` and `to` time range filters. Limit results to the specified `limit`.

3. **Format results**

   For each log entry, extract: timestamp, level, message, service, host, and any relevant custom fields.

4. **Identify patterns**

   Group results by error type or service. Highlight recurring errors, error rate spikes, or unusual patterns.

5. **Provide investigation context**

   Suggest related queries for deeper investigation. Cross-reference with monitor incidents using `/incident-triage`.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | | Search query (field:value, text search, boolean operators) |
| source | string | No | all | Log source name or ID |
| from | string | No | last 1 hour | Start time (ISO 8601) |
| to | string | No | now | End time (ISO 8601) |
| limit | integer | No | 100 | Maximum number of log entries to return |

## Examples

### Search for Errors

```
/search-logs --query "level:error"
```

### Search Specific Service

```
/search-logs --query "level:error AND service:api-gateway" --from "2026-03-27T08:00:00Z"
```

### Search for Specific Error Message

```
/search-logs --query "\"connection refused\""
```

### Search from a Specific Source

```
/search-logs --query "level:fatal" --source "Production API"
```

## Error Handling

- **Authentication Error:** Verify `BETTERSTACK_API_TOKEN` is set and is a Global API Token (Uptime-only tokens cannot access Telemetry)
- **Query Syntax Error:** Verify query follows ClickHouse SQL syntax
- **No Results:** Broaden the time range or check that the source is ingesting logs
- **Rate Limit:** Wait and retry; narrow the time range to reduce result size

## Related Commands

- `/incident-triage` - Cross-reference log errors with active incidents
- `/monitor-status` - Check if services with log errors are reporting downtime
- `/status-page-update` - Update status pages based on log investigation findings
