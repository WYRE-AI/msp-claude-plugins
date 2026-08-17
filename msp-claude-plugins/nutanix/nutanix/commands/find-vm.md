---
description: Find a VM by name across Nutanix clusters and show its configuration
argument-hint: "<vm_name>"
arguments: [vm_name]
---

# Find VM

Locate a virtual machine by name across all clusters managed by the
connected Prism Central, and present its configuration and state.

## Prerequisites

- Nutanix connected in the Conduit gateway with valid Prism Central credentials
- The `vmm` namespace available (check with `listOperations` if unsure)

## Steps

1. **Discover the list-VMs operation**

   Call `listOperations` with `namespace="vmm"` and `search="list vms"`.
   Confirm parameters with `getOperationSchema` if this is the first
   vmm call of the session.

2. **Search by name**

   Call `vmm_execute` with the list operation and
   `_filter="name eq '<vm_name>'"`. If nothing returns, retry with a
   broader OData `contains`/`startswith` predicate and present the
   candidates.

3. **Disambiguate**

   VM names are not unique across clusters. If multiple rows match,
   list them with cluster association and ask which one is meant.

4. **Fetch full detail**

   Call `vmm_execute` with the get-VM-by-id operation and the chosen
   `extId`. Optionally pull disk and NIC sub-resource lists for a
   complete picture.

5. **Report**

   Present name, `extId`, cluster, power state, vCPU/memory, disks
   (count and sizes), NICs (subnet attachments), and categories.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| vm_name | string | Yes | Exact or partial VM name to search for |

## Examples

```
/find-vm --vm_name "web-prod-01"
```

## Error Handling

- **No match:** Broaden the filter; confirm the right Prism Central is connected
- **`vmm_execute` tool absent:** The vmm namespace is not exposed by this PC — report it rather than retrying
- **404 on extId:** The VM was deleted between list and get; re-run the search

## Related Commands

- `/vm-inventory` - Full VM estate listing
- `/cluster-health` - Health of the cluster a VM runs on
