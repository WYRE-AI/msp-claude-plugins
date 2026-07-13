---
description: Generate a ThreatLocker computer inventory report
argument-hint: "[organization_id] [group]"
arguments: [organization_id, group]
---

# ThreatLocker Computer Inventory

Produce a managed computer inventory report from ThreatLocker. Useful for QBRs, license reconciliation, and detecting drift between the RMM source-of-truth and the actual ThreatLocker fleet.

## Prerequisites

- ThreatLocker MCP server connected with a valid `THREATLOCKER_API_KEY`
- Tools available: `threatlocker_computers_list`, `threatlocker_computer_groups_list`

## Steps

1. **List all computers**

   Call `threatlocker_computers_list`, paginating until exhausted. Include `organization_id` if provided.

2. **List computer groups**

   Call `threatlocker_computer_groups_list` so you can label every computer with its group(s).

3. **Build summary metrics**

   - Total managed computer count
   - Breakdown by OS (Windows / macOS / Linux, with version where available)
   - Breakdown by computer group
   - Count of agents that have NOT checked in within the last 7 days (use the most recent check-in timestamp on the computer record)

4. **Optional group drill-in**

   If `group` was supplied, filter to members of that group and produce a per-host detail table: hostname, OS, last check-in, agent version, group(s).

5. **Call out anomalies**

   - Hosts with no group assignment
   - Wildly out-of-date agent versions
   - Servers (where identifiable by hostname or OS) that haven't checked in recently

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organization_id | string | No | primary org | Scope to a child organization |
| group | string | No | all groups | Drill into a single computer group |

## Examples

### Inventory the whole org

```
/computer-inventory
```

### Drill into a single group

```
/computer-inventory --group "Finance Servers"
```

## Related Commands

- `/offline-agents` - Same data, focused on stale check-ins
- `/tenant-overview` - Multi-tenant view across all child orgs
