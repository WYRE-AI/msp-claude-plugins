---
description: Storage container and volume group usage across Nutanix clusters
argument-hint: "[cluster_name]"
arguments: [cluster_name]
---

# Storage Usage

Storage utilization report: containers ranked by usage, volume group
attachment state, and reclaimable capacity candidates.

## Prerequisites

- Nutanix connected in the Conduit gateway with valid Prism Central credentials

## Steps

1. **List storage containers**

   Discover the list-containers operation via `listOperations` with
   `namespace="storage"`, then call `storage_execute` — per container
   capture cluster, logical usage, physical capacity, and
   compression/replication settings. Filter to the named cluster if
   given.

2. **Volume groups**

   Call `volumes_execute` with the list-volume-groups operation; read
   attachment state per group to identify unattached (reclaimable)
   groups.

3. **Optional service tiers**

   If `files_execute` or `objects_execute` are registered, add file
   server share usage and object store capacity. Skip silently-absent
   services with a one-line note — absence is expected on
   deployments without those licenses.

4. **Compile**

   Containers ranked by percent used (flag anything above the warning
   threshold, default 80%), both logical and physical figures shown,
   then unattached volume groups with their sizes as reclaim
   candidates.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cluster_name | string | No | Restrict the report to one cluster |

## Examples

```
/storage-usage
/storage-usage --cluster_name "prod-east"
```

## Error Handling

- **Thin-provisioning confusion:** Never report only provisioned capacity — pair it with physical
- **Cross-cluster totals:** State which clusters were summed; containers are cluster-scoped

## Related Commands

- `/capacity-report` - Runway projection over this usage
- `/cluster-health` - Overall cluster state
