---
description: Triage current Better Stack incidents
argument-hint: "[status] [from] [to] [limit]"
arguments: [status, from, to, limit]
---

# Better Stack Incident Triage

Triage current incidents across all monitored services. Lists unacknowledged incidents, groups by monitor, and identifies services requiring immediate attention. This is the primary daily workflow for MSP operations.

## Prerequisites

- Better Stack MCP server connected with valid API token
- MCP tools `list_incidents` and `get_incident` available

## Steps

1. **Fetch active incidents**

   Call `list_incidents` to retrieve incidents. Default to unresolved incidents (status=started). If `from` or `to` date filters are provided, include them. Paginate through all results up to the specified `limit`.

2. **Categorize incidents**

   Group incidents by status: started (unacknowledged), acknowledged (in progress), resolved. Count incidents in each category.

3. **Build triage summary table**

   For each incident, extract: incident ID, name/cause, started time, acknowledged time (if any), associated monitor, and notification status (call, SMS, email).

4. **Highlight unacknowledged incidents**

   Flag incidents that have not been acknowledged -- these need immediate attention. Identify how long each has been open.

5. **Provide next-step recommendations**

   Suggest acknowledging the most critical incidents first. For recurring incidents on the same monitor, recommend investigating the underlying cause. Cross-reference with logs using `/search-logs`.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | started | Filter by status (started, acknowledged, resolved) |
| from | string | No | none | Start date filter (ISO 8601) |
| to | string | No | none | End date filter (ISO 8601) |
| limit | integer | No | 50 | Maximum number of incidents to return |

## Examples

### Triage All Active Incidents

```
/incident-triage
```

### Show Acknowledged Incidents

```
/incident-triage --status acknowledged
```

### Triage Incidents from Today

```
/incident-triage --from "2026-03-27"
```

## Error Handling

- **Authentication Error:** Verify `BETTERSTACK_API_TOKEN` is set correctly
- **Rate Limit:** Wait and retry; use date filters to reduce result set
- **No Results:** No active incidents -- all services are healthy

## Related Commands

- `/monitor-status` - Check monitor statuses to see which services are affected
- `/search-logs` - Search logs for root cause analysis during incident investigation
- `/status-page-update` - Update status pages to communicate outages to clients
