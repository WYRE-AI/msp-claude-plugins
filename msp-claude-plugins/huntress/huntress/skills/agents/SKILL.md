---
name: "Huntress Agents"
description: >
  Huntress endpoint agents: the agent lifecycle, organization and platform
  filters, health signals such as `last_seen_at` and version, fleet-audit
  workflows, and the errors returned for missing or empty agent results.
when_to_use: >-
  When listing, filtering, or investigating Huntress endpoint agents, or auditing fleet
  health and coverage. Use when: huntress
  agent, huntress endpoint, agent health, agent status, agent inventory, agent list, or endpoint
  management.
---

# Huntress Agents

## Overview

Huntress agents are lightweight endpoint monitors deployed across MSP client organizations. They collect telemetry and enable Huntress's managed detection and response capabilities. This skill covers listing, filtering, and inspecting agents across your managed fleet.

## Key Concepts

### Agent Lifecycle

Agents are installed on endpoints and report back to the Huntress platform. Each agent belongs to an organization and has a status indicating its health and connectivity.

### Agent Filtering

Agents can be filtered by:
- **Organization** — Scope to a specific client
- **Platform** — Filter by OS (Windows, macOS, Linux)
- **Status** — Online, offline, or degraded

## API Patterns

### List Agents

```
huntress_agents_list
```

Parameters:
- `organization_id` — Filter by organization
- `page_token` — Pagination token for next page

**Example response:**

```json
{
  "agents": [
    {
      "id": "agent-123",
      "hostname": "ACME-WS-042",
      "organization_id": "org-456",
      "platform": "windows",
      "version": "0.13.25",
      "status": "online",
      "last_seen_at": "2026-02-26T15:30:00Z"
    }
  ],
  "next_page_token": "eyJwYWdlIjoyfQ=="
}
```

### Get Agent Details

```
huntress_agents_get
```

Parameters:
- `agent_id` — The specific agent ID

**Example response:**

```json
{
  "agent": {
    "id": "agent-123",
    "hostname": "ACME-WS-042",
    "organization_id": "org-456",
    "platform": "windows",
    "version": "0.13.25",
    "status": "online",
    "ip_address": "192.168.1.42",
    "external_ip": "203.0.113.50",
    "os_version": "Windows 11 23H2",
    "last_seen_at": "2026-02-26T15:30:00Z",
    "created_at": "2025-06-15T10:00:00Z"
  }
}
```

## Common Workflows

### Fleet Health Check

1. Call `huntress_agents_list` to get all agents
2. Paginate through full result set
3. Group by status (online/offline)
4. Flag agents not seen in >24 hours as potentially unhealthy
5. Group by organization to identify clients with agent issues

### Organization Agent Audit

1. Call `huntress_agents_list` with `organization_id` filter
2. Compare agent count against expected endpoint count
3. Check for outdated agent versions
4. Identify endpoints missing agents

### Platform Inventory

1. List all agents across organizations
2. Group by platform (Windows, macOS, Linux)
3. Generate platform distribution report per client

## Error Handling

### Agent Not Found

**Cause:** Invalid agent ID or agent has been uninstalled
**Solution:** Verify the agent ID; check if the endpoint was decommissioned

### Empty Agent List

**Cause:** Organization has no agents deployed, or filter is too restrictive
**Solution:** Verify organization ID; try listing without filters first

## Best Practices

- Paginate through all results for accurate fleet counts
- Monitor `last_seen_at` to detect offline agents early
- Track agent version distribution to plan upgrades
- Use organization filtering to generate per-client reports
- Cross-reference agent counts with RMM tool endpoint counts

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and rate limiting
- [organizations](../organizations/SKILL.md) - Organization management
- [incidents](../incidents/SKILL.md) - Incidents affecting specific agents
- [signals](../signals/SKILL.md) - Signals from specific agents
