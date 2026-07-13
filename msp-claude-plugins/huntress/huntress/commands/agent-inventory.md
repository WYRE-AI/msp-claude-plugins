---
description: List and filter Huntress agents across organizations
argument-hint: "[organization_id] [platform] [status]"
arguments: [organization_id, platform, status]
---

# Agent Inventory

List and filter Huntress agents across all managed organizations. Provides agent counts, platform distribution, health status, and version information.

## Prerequisites

- Huntress MCP server connected with valid API credentials
- MCP tool `huntress_agents_list` available

## Steps

1. **List agents with filters**

   Call `huntress_agents_list` with any specified filters (`organization_id`, `platform`, `status`). Paginate through all results.

2. **Aggregate statistics**

   Compute: total agents, agents by platform, agents by status, agents by organization.

3. **Identify health issues**

   Flag agents that are offline or haven't reported in >24 hours. Identify outdated agent versions.

4. **Build inventory report**

   Present the inventory grouped by organization with status and platform breakdowns.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organization_id | string | No | Filter to a specific organization |
| platform | string | No | Filter by platform (windows, macos, linux) |
| status | string | No | Filter by status (online, offline) |

## Examples

### Full Agent Inventory

```
/agent-inventory
```

### Agents for a Specific Client

```
/agent-inventory --organization_id "org-456"
```

### Offline Agents Only

```
/agent-inventory --status offline
```

### macOS Agents

```
/agent-inventory --platform macos
```

## Error Handling

- **Large Result Sets:** Use filters to narrow results; paginate through all pages
- **Rate Limit:** Filter by organization to reduce API calls
- **Authentication Error:** Verify API credentials

## Related Commands

- `/org-health` - Full organization health check
- `/incident-triage` - Check incidents affecting inventoried agents
- `/billing-report` - Compare agent counts with billing
