---
description: Check all Better Stack monitor statuses and identify downtime
argument-hint: "[status] [monitor_group] [limit]"
arguments: [status, monitor_group, limit]
---

# Better Stack Monitor Status

Check the current status of all uptime monitors, highlighting any that are down or in a degraded state. This is the primary dashboard check for MSP operations.

## Prerequisites

- Better Stack MCP server connected with valid API token
- MCP tools `list_monitors` and `get_monitor` available

## Steps

1. **Fetch all monitors**

   Call `list_monitors` to retrieve all monitors. If `status` filter is provided, filter results accordingly. Paginate through all results up to the specified `limit`.

2. **Categorize by status**

   Group monitors by status: up, down, paused, pending, maintenance, validating. Count monitors in each category.

3. **Build status summary table**

   For each monitor, extract: monitor ID, name, URL, status, last checked time, and check frequency.

4. **Highlight downtime**

   Flag any monitors with status `down` or `validating` and identify which clients/services are affected.

5. **Provide next-step recommendations**

   For down monitors, suggest checking associated incidents with `/incident-triage`. For paused monitors, verify they should still be paused.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | all | Filter by status (up, down, paused, pending, maintenance) |
| monitor_group | string | No | all | Filter by monitor group name |
| limit | integer | No | 100 | Maximum number of monitors to return |

## Examples

### Check All Monitors

```
/monitor-status
```

### Show Only Down Monitors

```
/monitor-status --status down
```

### Check Monitors for a Specific Client

```
/monitor-status --monitor_group "Acme Corp"
```

## Error Handling

- **Authentication Error:** Verify `BETTERSTACK_API_TOKEN` is set correctly
- **Rate Limit:** Wait and retry; use status filters to reduce result set
- **No Results:** Confirm filters are correct; no monitors may be configured yet

## Related Commands

- `/create-monitor` - Create a new uptime monitor
- `/incident-triage` - Triage incidents triggered by down monitors
- `/status-page-update` - Update status pages for affected services
