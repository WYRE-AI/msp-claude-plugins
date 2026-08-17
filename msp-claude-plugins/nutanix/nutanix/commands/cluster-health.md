---
description: Health check for Nutanix clusters covering nodes, alerts, and recent failed tasks
argument-hint: "[cluster_name]"
arguments: [cluster_name]
---

# Cluster Health

At-a-glance health for one or all Nutanix clusters: node state, open
alerts by severity, and recent failed Prism Central tasks.

## Prerequisites

- Nutanix connected in the Conduit gateway with valid Prism Central credentials

## Steps

1. **List clusters**

   Discover the list-clusters operation via `listOperations` with
   `namespace="clustermgmt"`, then call `clustermgmt_execute`. Scope to
   the named cluster if given; otherwise cover all.

2. **Per-cluster detail**

   For each cluster, get it by `extId` and list its hosts via
   `clustermgmt_execute` — capture node count, version, and any
   degraded host state.

3. **Open alerts**

   Discover the list-alerts operation in `monitoring` and call
   `monitoring_execute` filtered to unresolved alerts for these
   clusters, grouped by severity.

4. **Recent failed tasks**

   Call `prism_execute` with the list-tasks operation,
   `_filter="status eq 'FAILED'"` and a recent time window, to surface
   failed operations that alerting may not cover.

5. **Compile**

   Per cluster: node summary, critical/warning alert counts with the
   top items, failed task list, and an overall verdict
   (healthy / attention / critical).

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cluster_name | string | No | Check a single cluster instead of all |

## Examples

```
/cluster-health
/cluster-health --cluster_name "prod-east"
```

## Error Handling

- **Multiple calls per cluster:** On large estates, summarize alert counts rather than fetching every alert body
- **Missing namespace tools:** Report which of `clustermgmt` / `monitoring` / `prism` is unavailable instead of presenting a partial check as complete

## Related Commands

- `/capacity-report` - Forward-looking capacity runway for these clusters
- `/storage-usage` - Storage-container level detail
