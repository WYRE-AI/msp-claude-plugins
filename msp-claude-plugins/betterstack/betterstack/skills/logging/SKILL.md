---
name: "Better Stack Logging"
description: >
  Better Stack log management (Logtail): log sources, structured log search
  and query syntax, log-based alerting, and log analysis workflows.
when_to_use: >-
  When querying logs or managing log sources in Better Stack / Logtail. Use
  when: betterstack logs, logtail, log search, log query, log source, search
  logs, log management, better stack logging, or log analysis.
---

# Better Stack Log Management (Logtail)

## Overview

Better Stack Logs (formerly Logtail) provides centralized log management with structured log ingestion, real-time search, and log-based alerting. MSPs use it to aggregate logs from client infrastructure, investigate incidents, and set up proactive alerting on error patterns.

## Key Concepts

### Log Sources

Sources define where logs come from and how they're ingested:
- **Platform sources** - AWS, Azure, GCP, Heroku, Vercel, etc.
- **Language sources** - Node.js, Python, Ruby, Go, etc.
- **Infrastructure sources** - Docker, Kubernetes, syslog, HTTP
- Each source gets a unique source token for authentication

### Log Structure

Logs in Better Stack are structured JSON documents:
- `dt` - Timestamp (ISO 8601)
- `level` - Log level (info, warn, error, debug, fatal)
- `message` - Log message text
- Any additional custom fields (request_id, user_id, service, etc.)

### Query Language

Better Stack supports SQL-like queries for log searching:
- Field-based filters: `level:error`, `service:api`
- Text search: `"connection refused"`
- Time ranges: `dt:[2026-03-27T00:00:00Z TO 2026-03-27T23:59:59Z]`
- Boolean operators: `AND`, `OR`, `NOT`
- Wildcards: `host:prod-*`

### Log-Based Alerts

Create alerts that trigger when log patterns match:
- Error rate thresholds (e.g., more than 10 errors in 5 minutes)
- Specific error message patterns
- Absence of expected log entries (heartbeat-style)

## API Patterns

### Query Logs

```
betterstack_query_logs
```

Parameters:
- `query` - Search query string (required)
- `source_id` - Filter to a specific source
- `from` - Start time (ISO 8601)
- `to` - End time (ISO 8601)
- `batch_size` - Number of results to return (default 100)
- `order` - Sort order: `newest_first` or `oldest_first`

**Example response:**

```json
{
  "data": [
    {
      "dt": "2026-03-27T10:15:30.123Z",
      "level": "error",
      "message": "Connection refused to database at 10.0.1.5:5432",
      "service": "api-gateway",
      "host": "prod-api-01",
      "request_id": "req-abc-123"
    },
    {
      "dt": "2026-03-27T10:15:29.456Z",
      "level": "error",
      "message": "Health check failed for postgres pool",
      "service": "api-gateway",
      "host": "prod-api-01"
    }
  ]
}
```

### List Log Sources

```
betterstack_list_sources
```

Parameters:
- `page` - Pagination cursor

**Example response:**

```json
{
  "data": [
    {
      "id": "src-789",
      "type": "source",
      "attributes": {
        "name": "Production API",
        "platform": "node",
        "token": "xxxx...xxxx",
        "ingesting_paused": false,
        "records_count": 1500000
      }
    }
  ]
}
```

### Create Log Source

```
betterstack_create_source
```

Parameters:
- `name` - Source name (required)
- `platform` - Platform type: node, python, ruby, go, docker, kubernetes, syslog, http, etc.

## Common Workflows

### Incident Log Investigation

1. Get the incident details and identify the affected monitor/service
2. Call `betterstack_query_logs` with the service name and time range around the incident
3. Filter for error and fatal level logs
4. Look for patterns: connection errors, timeout spikes, OOM events
5. Trace request IDs across services for distributed issues
6. Summarize findings with root cause analysis

### Error Rate Monitoring

1. Query logs for `level:error` over the last hour
2. Group by service to identify which services have elevated errors
3. Compare error counts against baseline
4. Drill into the highest-error services for specific error messages
5. Correlate with uptime monitor incidents

### Setting Up Logging for a New Client

1. Create log sources for each client service (API, web, workers)
2. Distribute source tokens for log ingestion configuration
3. Verify logs are flowing with a test query
4. Set up log-based alerts for critical error patterns
5. Create saved queries for common investigation patterns

### Security Log Review

1. Search for authentication failures: `"authentication failed" OR "invalid token" OR "unauthorized"`
2. Look for unusual access patterns: `level:warn AND "rate limit"`
3. Check for privilege escalation attempts
4. Review admin action logs
5. Document findings for compliance reporting

## Error Handling

### Source Not Found

**Cause:** Invalid source ID or source was deleted
**Solution:** List sources to verify the correct ID

### Query Syntax Error

**Cause:** Invalid query syntax
**Solution:** Verify query follows the supported syntax (field:value, boolean operators, quotes for phrases)

### No Results

**Cause:** No logs match the query for the given time range
**Solution:** Broaden the time range, check source ID, verify logs are being ingested

## Best Practices

- Use structured logging with consistent field names across services
- Include request IDs for distributed tracing across services
- Query with specific time ranges to improve performance
- Use source filters to scope queries to relevant services
- Create saved queries for common investigation patterns
- Set up log-based alerts for critical error patterns
- Use log levels consistently: error for failures, warn for degradation, info for operations
- Include contextual fields (user_id, tenant_id, request_id) for efficient filtering

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [monitors](../monitors/SKILL.md) - Monitors correlated with log data
- [incidents](../incidents/SKILL.md) - Incident investigation with logs
- [status-pages](../status-pages/SKILL.md) - Status context from log analysis
