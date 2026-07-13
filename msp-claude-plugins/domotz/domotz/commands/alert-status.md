---
description: Check current Domotz alerts across all agents
argument-hint: "[agent_id] [severity]"
arguments: [agent_id, severity]
---

# Alert Status

Check active alerts across all monitored Domotz sites. Displays alerts sorted by severity with device and site context.

## Prerequisites

- Domotz MCP server connected with valid API credentials
- MCP tools `domotz_list_agents`, `domotz_list_alerts`, and `domotz_get_alert` available

## Steps

1. **Determine scope**

   If `agent_id` is provided, fetch alerts for that agent only. Otherwise, call `domotz_list_agents` to get all agents and collect alerts from each.

2. **Fetch active alerts**

   For each agent in scope, call `domotz_list_alerts`. Paginate if needed.

3. **Count and categorize**

   Aggregate alerts by:
   - Severity (critical, warning, info)
   - Type (device status, SNMP threshold, port, Eyes, agent)
   - Agent/site

4. **Build alert summary table**

   For each alert, show: alert ID, severity, type, message, affected device, site, and age (time since created).

5. **Highlight critical items**

   Flag critical alerts that need immediate attention. Identify sites with the most active alerts.

6. **Recommend next steps**

   Suggest investigating affected devices or reviewing alert profiles.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agent_id | integer | No | Filter to a specific agent/site |
| severity | string | No | Filter by severity (critical, warning, info) |

## Examples

### Check All Alerts

```
/alert-status
```

### Check Alerts for a Specific Site

```
/alert-status --agent_id "12345"
```

### Check Critical Alerts Only

```
/alert-status --severity "critical"
```

## Error Handling

- **No Alerts:** No active alerts is a good sign; verify alert profiles are configured
- **Rate Limit:** Use `agent_id` filter to reduce API calls when checking many sites
- **Authentication Error:** Verify API credentials and region

## Related Commands

- `/site-overview` - Full site health overview including alerts
- `/device-lookup` - Investigate a specific alerted device
- `/device-inventory` - Check device status at a site with alerts
