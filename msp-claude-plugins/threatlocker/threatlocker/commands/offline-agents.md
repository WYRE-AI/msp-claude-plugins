---
description: Find ThreatLocker agents that have not checked in recently
argument-hint: "[organization_id] [limit]"
arguments: [organization_id, limit]
---

# ThreatLocker Offline Agents

Find ThreatLocker agents that have stopped checking in. Bucketed by severity so an MSP analyst can route remediation: a 26-hour outage probably needs a reboot, a 35-day outage likely needs reinstall or offboarding.

## Prerequisites

- ThreatLocker MCP server connected with a valid `THREATLOCKER_API_KEY`
- Tools available: `threatlocker_computers_list`, `threatlocker_computers_get_checkins`

## Steps

1. **List all computers**

   Call `threatlocker_computers_list` (paginating up to `limit`), scoped by `organization_id` if provided.

2. **Inspect check-in history per host**

   For each computer, call `threatlocker_computers_get_checkins` to retrieve the latest check-in timestamp. Skip the call if the list response already exposes a `last_checkin` field accurately - prefer the explicit endpoint when in doubt.

3. **Bucket the results**

   Compute time since last check-in and bucket:

   - **Warn (>24h, ≤7d)** - probably temporarily off / sleeping / VPN; nudge user
   - **Stale (>7d, ≤30d)** - investigate; likely needs RMM remote-in to restart agent service
   - **Dead (>30d)** - reinstall agent, decommission asset in RMM, or remove from ThreatLocker

4. **Render the report**

   Three tables (one per bucket) with: hostname, OS, group, last check-in, days offline. Sort each table descending by days offline.

5. **Provide remediation suggestions per tier**

   - Warn: leave alone unless pattern persists
   - Stale: open a ticket to remote-in and check the `ThreatLockerService` Windows service or `threatlocker` macOS daemon
   - Dead: reinstall or remove

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organization_id | string | No | primary org | Scope to a child organization |
| limit | integer | No | 500 | Max computers to inspect |

## Examples

### Find offline agents across the org

```
/offline-agents
```

### Scoped to a child org

```
/offline-agents --organization_id "org-abc-123"
```

## Related Commands

- `/computer-inventory` - Full fleet report
- `/audit-investigation` - Was the host doing anything suspicious right before it went silent?
