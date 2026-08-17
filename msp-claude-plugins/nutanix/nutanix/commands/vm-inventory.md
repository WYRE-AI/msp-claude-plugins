---
description: Inventory all VMs across Nutanix clusters with sizing and power state
argument-hint: "[cluster_name]"
arguments: [cluster_name]
---

# VM Inventory

Produce a complete VM inventory across the connected Prism Central,
optionally scoped to one cluster, with sizing and power state suitable
for client reporting.

## Prerequisites

- Nutanix connected in the Conduit gateway with valid Prism Central credentials

## Steps

1. **Discover operations**

   Call `listOperations` with `namespace="vmm"` for the list-VMs
   operation. If scoping to a cluster, also discover the list-clusters
   operation in `clustermgmt` to resolve the cluster name to its
   `extId`.

2. **Page through the estate**

   Call `vmm_execute` with `_limit=100`, walking `_page` from 0 until a
   short page. Use `_select` to restrict to name, power state, vCPU,
   memory, and cluster fields. Apply a cluster `_filter` when scoped.

3. **Aggregate**

   Compute totals: VM count, powered-on vs off, total provisioned vCPU
   and memory, per-cluster breakdown.

4. **Report**

   A summary block (totals) followed by a per-cluster table of VMs with
   name, power state, vCPU, memory. Note the page count so completeness
   is auditable.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cluster_name | string | No | Restrict the inventory to one cluster |

## Examples

```
/vm-inventory
/vm-inventory --cluster_name "prod-east"
```

## Error Handling

- **Large estates:** Never report from page 0 alone; state how many pages were fetched
- **Cluster not found:** List clusters via `clustermgmt_execute` and show candidates

## Related Commands

- `/find-vm` - Detail on a single VM
- `/capacity-report` - Rightsizing and runway analysis over this inventory
