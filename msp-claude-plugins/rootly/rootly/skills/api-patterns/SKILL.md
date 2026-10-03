---
name: "Rootly API Patterns"
description: >
  The Rootly hosted MCP server and the JSON:API REST surface behind it: Global vs.
  Team token types and how the gateway injects credentials, the catalog of roughly
  253 dynamically generated tools by category, page-number pagination and relationship
  includes, filter syntax, rate limits, and error handling.
when_to_use: >-
  When authenticating to Rootly, discovering which MCP tool to call, or debugging Rootly
  pagination, filters, or errors. Use when: rootly api, rootly mcp,
  rootly token, rootly authentication, rootly pagination, rootly filter, rootly rate limit, rootly
  tools, rootly connection, rootly endpoint, rootly request, or rootly credentials.
---

# Rootly MCP Tools & API Patterns

## Overview

Rootly exposes a hosted MCP server at `mcp.rootly.com` built with FastMCP. When accessed through the MCP Gateway, credentials are injected automatically via the `Authorization: Bearer` header — no manual token handling is required. The MCP server generates its tools dynamically from Rootly's OpenAPI specification -- roughly 253 tools as served by the hosted endpoint (a handful of hand-written "agentic" tools like `find_related_incidents` plus the bulk generated one-per-endpoint from the REST API, e.g. `list_incidents`, `create_incident`, `list_services`).

The Rootly REST API follows the **JSON:API specification** (`application/vnd.api+json`), using page-number-based pagination and relationship includes.

## Authentication

### Token Types

| Token Type | Scope | Use Case |
|------------|-------|----------|
| **Global Token** | Full organization access | Recommended for MCP gateway integration |
| **Team Token** | Team-owned resources only | On-call schedules, team escalation policies |
| **User Token** | Inherits user's Rootly permissions | Individual integrations |

For the MCP Gateway, use a **Global Token** to ensure all incident management tools work without permission errors.

**Generate:** Rootly web UI → Account → Manage API Keys → Generate New API Key

### How the Gateway Injects Credentials

When using Rootly through the MCP Gateway, the API token is stored as an org credential and automatically forwarded as:

```
Authorization: Bearer <org-api-token>
```

No additional configuration is needed in the MCP tool calls.

## Complete MCP Tool Reference

### Intelligent Incident Analysis

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `find_related_incidents` | Finds historically similar incidents using TF-IDF text similarity | `incident_id` or `query` string |
| `suggest_solutions` | Mines past incident resolutions to recommend actionable fixes | `incident_id` or `description` |
| `check_oncall_health_risk` | Detects workload health risk in scheduled responders | Schedule or team context |

### On-Call Management

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_oncall_shift_metrics` | Shift metrics grouped by user, team, or schedule | `group_by`, time range |
| `get_oncall_handoff_summary` | Current/next on-call status plus shift incidents | Schedule context |
| `get_shift_incidents` | Incidents during a specific shift timeframe | `severity`, `status`, `tags`, time range |

### Core Incident Management

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `list_incidents` / `search_incidents` | List and search incidents | `filter[status]`, `filter[severity]`, `page[number]`, `page[size]` |
| `get_incident` | Get a single incident | Incident ID |
| `create_incident` | Create a new incident | `title`, `severity_id`, `team_ids`, `service_ids` |
| `update_incident` | Update an incident's fields | Incident ID |
| `attach_alert` | Attach an alert to an incident | `incident_id`, alert payload |
| `list_incident_alerts` | List alerts attached to an incident | `incident_id` |
| `create_incident_action_item` | Create a follow-up action item | `incident_id`, `summary`, `assigned_to` |
| `list_incident_action_items` | List action items on an incident | `incident_id` |
| `list_all_incident_action_items` | List action items across every incident | -- |

### Alerts

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `list_alerts` | List alerts from integrations | `filter[status]`, `page[number]`, `page[size]` |
| `get_alert` | Get a single alert | Alert ID |
| `create_alert` | Create an alert | alert payload |
| `acknowledge_alert` / `resolve_alert` | Acknowledge or resolve an alert | Alert ID |

### Configuration & Metadata

| Tool | Description |
|------|-------------|
| `list_severities` | List severity levels (slug, color, description) |
| `create_severity` | Create a severity level |
| `list_services` | List services in the service catalog |
| `create_service` | Create a service |
| `list_environments` | List environments (production, staging, etc.) |
| `create_environment` | Create an environment |
| `list_functionalities` | List business functionalities mapped to services |
| `create_functionality` | Create a functionality |
| `list_incident_types` | List incident types (bug, outage, performance, etc.) |
| `create_incident_type` | Create an incident type |
| `list_workflows` | List automation workflows |
| `create_workflow` | Create an automation workflow |

### Teams & Users

| Tool | Description |
|------|-------------|
| `list_teams` | List teams |
| `create_team` | Create a team |
| `list_users` | List organization users |
| `get_current_user` | Get the current authenticated user's profile |
| `list_endpoints` | Discover all available API endpoints dynamically |

## JSON:API Pagination

Rootly's REST API uses **page-number-based pagination** following the JSON:API spec:

### Request Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page[number]` | Page number (1-indexed) | 1 |
| `page[size]` | Results per page | 25 |

### Pagination Pattern

1. Call the list tool with `page[number]=1`, `page[size]=50`
2. Check the response `meta.total_count` to determine total records
3. Increment `page[number]` until you have all records:
   - `total_pages = ceil(total_count / page_size)`
4. Continue fetching until `page[number] > total_pages`

**Example: Fetch all open incidents:**
- Call `list_incidents` with `page[number]=1`, `page[size]=50`
- Check `meta.total_count`; if 120 total, you need 3 pages (50 + 50 + 20)
- Repeat with `page[number]=2` and `page[number]=3`

### Response Structure (JSON:API)

```json
{
  "data": [
    {
      "id": "abc-123",
      "type": "incidents",
      "attributes": {
        "title": "API gateway latency spike",
        "status": "in_triage",
        "sequential_id": 342
      },
      "relationships": {
        "severity": { "data": { "id": "sev-id", "type": "severities" } },
        "services": { "data": [{ "id": "svc-id", "type": "services" }] }
      }
    }
  ],
  "meta": {
    "total_count": 120,
    "total_pages": 3,
    "current_page": 1
  }
}
```

## Common Query Patterns

### Filter Active Incidents by Status

Call `list_incidents` with `filter[status]=in_triage` or `filter[status]=detected` to find open incidents.

### Filter by Severity

Call `list_incidents` with `filter[severity]=critical` (use the slug from `list_severities`) to focus on the highest-priority incidents.

### Lookup IDs Before Creating Resources

Rootly uses UUIDs for all resource IDs. Before creating an incident, always:
1. Call `list_severities` → use the matching severity's `id`
2. Call `list_services` → use the affected service's `id`
3. Call `list_teams` → use the responding team's `id`

### Discover Endpoints Dynamically

Call `list_endpoints` to get the current full list of available API endpoints. This is useful when the MCP server has been updated to expose new Rootly API endpoints.

## Rate Limiting

Rootly applies rate limits at the API level. The MCP server does not expose rate limit headers, but:

- Avoid fetching all records in rapid succession for large datasets
- Use `page[size]` to limit response sizes (max 100 per page)
- If you receive a 429, wait 30-60 seconds before retrying
- Prefer filtering server-side to reduce total API calls

## Error Handling

### Common Errors

| Error | HTTP Code | Cause | Resolution |
|-------|-----------|-------|------------|
| Invalid API token | 401 | Token missing or expired | Regenerate at Account > Manage API Keys |
| Insufficient permissions | 403 | Team-scoped token used for org-wide resource | Use a Global token for MCP gateway integration |
| Resource not found | 404 | Invalid ID or resource deleted | Call the list tool to verify the resource exists |
| Validation failed | 422 | Missing required field or invalid ID | Check required parameters; call lookup tools for valid IDs |
| Rate limited | 429 | Too many requests | Back off 30-60 seconds; retry |
| Server error | 500 | Rootly API issue | Retry once; check Rootly status page |

## Best Practices

1. **Use `list_endpoints` to discover tools** — The MCP server generates tools dynamically; new endpoints appear automatically after Rootly API updates
2. **Look up IDs, don't guess** — Always call `list_severities`, `list_services`, and `list_teams` before creating incidents
3. **Paginate large datasets** — Set `page[size]=50` and iterate pages rather than fetching all at once
4. **Use AI tools first** — `find_related_incidents` and `suggest_solutions` often resolve incidents faster than manual investigation
5. **Filter server-side** — Use `filter[status]` and `filter[severity]` in `list_incidents` rather than fetching all and filtering locally
6. **Use Global tokens in the gateway** — Team tokens will cause 403 errors for cross-team incident queries

## Related Skills

- [Incidents](../incidents/SKILL.md) — Incident lifecycle, AI analysis, action items
- [On-Call Management](../oncall/SKILL.md) — Handoff summaries, shift metrics, health risk
