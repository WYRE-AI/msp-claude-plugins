---
description: Capacity runway and VM rightsizing report from Nutanix AIOps analysis
argument-hint: "[cluster_name]"
arguments: [cluster_name]
---

# Capacity Report

Forward-looking capacity report: per-cluster resource runway plus VM
rightsizing recommendations, built on the `aiops` namespace analysis.

## Prerequisites

- Nutanix connected in the Conduit gateway with valid Prism Central credentials
- `aiops` namespace available on the connected Prism Central (feature availability depends on PC version and licensing)

## Steps

1. **Verify the analysis surface**

   Call `listOperations` with `namespace="aiops"`. If the namespace is
   absent, say so and fall back to a point-in-time utilization summary
   from `clustermgmt_execute` and `storage_execute` instead of
   fabricating trends.

2. **Capacity runway**

   Discover and call the capacity/analysis operations via
   `aiops_execute` for each target cluster: CPU, memory, and storage
   runway projections.

3. **Rightsizing recommendations**

   Call `aiops_execute` for VM rightsizing data: oversized, undersized,
   and inactive VMs. Resolve VM `extId`s to names via `vmm_execute`
   where the recommendation payload lacks them.

4. **Compile**

   Per cluster: runway per resource with the constraining resource
   highlighted; then reclaimable capacity (top oversized and inactive
   VMs) and performance-risk VMs (undersized). Close with recommended
   actions — as recommendations only, since the connection is
   read-only.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cluster_name | string | No | Report on a single cluster instead of all |

## Examples

```
/capacity-report
/capacity-report --cluster_name "prod-east"
```

## Error Handling

- **`aiops` absent or thin:** Deliver the fallback utilization snapshot and state explicitly that trend/runway analysis was unavailable
- **Recommendations without names:** Always join back to `vmm` data before presenting VM lists to a client

## Related Commands

- `/vm-inventory` - The raw estate behind the recommendations
- `/storage-usage` - Storage capacity detail per container
