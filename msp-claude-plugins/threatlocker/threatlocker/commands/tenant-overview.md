---
description: Multi-tenant ThreatLocker overview across child organizations
argument-hint: "[limit]"
arguments: [limit]
---

# ThreatLocker Tenant Overview

Multi-tenant pivot for MSP analysts working many ThreatLocker customers. Enumerates child organizations and shows pending approval volume + recent audit activity for each, so the analyst can prioritize which tenants to look at first.

## Prerequisites

- ThreatLocker MCP server connected with a valid `THREATLOCKER_API_KEY` issued at the parent / MSP level
- Tools available: `threatlocker_organizations_list_children`, `threatlocker_approvals_pending_count`, `threatlocker_audit_search`

## Steps

1. **Enumerate child organizations**

   Call `threatlocker_organizations_list_children`, paginating up to `limit`.

2. **Pull pending approval counts per child**

   For each child org, call `threatlocker_approvals_pending_count` scoped to that organization. Cache the result alongside the org name.

3. **Pull recent audit volume per child (last 24h)**

   For each child org, call `threatlocker_audit_search` for the last 24h with a small page size and read total / count. If volume is large enough to be expensive, sample the first page and note "≥N" instead of an exact figure.

4. **Render the overview table**

   Columns: organization name, organization ID, pending approvals, audit events (24h), notes. Sort descending by pending approvals, then by audit volume.

5. **Surface the analyst recommendation**

   - Tenants with >10 pending approvals: run `/approval-triage --organization_id <id>` next
   - Tenants with abnormally high 24h audit volume vs. their baseline: run `/audit-investigation --organization_id <id>`
   - Tenants with zero approvals AND zero events: probably fine, but worth confirming agent health via `/offline-agents --organization_id <id>`

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | integer | No | 200 | Max child orgs to enumerate |

## Examples

### Run the morning multi-tenant sweep

```
/tenant-overview
```

## Related Commands

- `/approval-triage` - Drill into a tenant's pending approvals
- `/audit-investigation` - Drill into a tenant's audit log
- `/offline-agents` - Drill into a tenant's agent health
