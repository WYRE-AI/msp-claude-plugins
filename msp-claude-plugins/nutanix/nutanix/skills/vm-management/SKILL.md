---
name: "Nutanix VM Management"
description: >
  Working the vmm namespace through `vmm_execute`: VM inventory and
  lookup on AHV clusters, resolving names to extId UUIDs, reading VM
  configuration (disks, NICs, GPUs, power state), OData filters for VM
  queries, and the read-only boundaries around VM lifecycle actions.
when_to_use: >-
  When listing, finding, or inspecting virtual machines on Nutanix AHV
  via Prism Central. Use when: nutanix vm, ahv vm, vm inventory nutanix,
  find vm nutanix, vm power state, vm configuration nutanix, vmm
  namespace, or vmm_execute.
---

# Nutanix VM Management

## Overview

The `vmm` namespace covers the VM lifecycle on AHV, Nutanix's built-in
hypervisor, managed through Prism Central. For an MSP this is the
day-to-day surface: which VMs exist across a client's clusters, how
they are configured, what state they are in, and which host they run
on. All access goes through the single `vmm_execute` tool — discover
the exact operation with `listOperations(namespace="vmm")` first.

## Key Concepts

| Concept | Notes |
|---------|-------|
| `extId` | UUID identifying every VM (and every sub-resource); all get-by-id operations take it |
| Power state | `ON`, `OFF`, plus transitional states; read from the VM entity |
| Sub-resources | Disks, NICs, GPUs, serial ports each have their own list/get operations under the VM |
| Cluster association | Each VM belongs to one cluster; cross-reference `clustermgmt` for cluster detail |
| Categories | Prism categories (key:value tags) attach to VMs; category CRUD lives in the `prism` namespace |

## Common Workflows

### Find a VM by name

1. `listOperations` with `namespace="vmm"`, `search="list vms"` to get
   the list-VMs operation id.
2. `getOperationSchema` for that id to confirm parameters.
3. `vmm_execute` with the operation id and
   `_filter="name eq 'web-prod-01'"`. Names are not unique across
   clusters — if several rows return, disambiguate by cluster before
   reporting.
4. Use the returned `extId` for any follow-up get-by-id call.

### VM inventory sweep

1. List VMs with `_limit=100` and walk `_page` until a short page.
2. `_select` the fields you need (name, power state, sizing, cluster)
   to keep pages small on large estates.
3. Group client-side by cluster or category for the report.

### Inspect one VM's configuration

1. Get the VM by `extId` for CPU/memory/power state.
2. List its disks and NICs via the corresponding sub-resource
   operations (discover them with `search="disk"` / `search="nic"`
   scoped to `vmm`).

## Read-only boundary

The vmm namespace includes create, clone, update, power-cycle, and
delete operations — discovery will list them, but the server's
read-only mode blocks all of them. Do not offer to power-cycle,
resize, clone, or delete a VM. When a change is the right next step,
hand off: pull the operation's contract with `getOperationSchema` and
a `getCodeSample` snippet so the operator can execute it through their
own authenticated tooling.

## Gotchas

- **Name-to-extId resolution is mandatory.** Get-by-id operations only
  accept `extId`. A "VM not found" on a name you can see in Prism
  usually means the name was passed where a UUID belongs.
- **Filter casing follows OData, not SQL.** `name eq 'x'` works;
  `name = "x"` does not. String literals take single quotes.
- **Metrics live elsewhere.** VM performance/rightsizing analysis comes
  from the `aiops` namespace, not `vmm` — see the monitoring-aiops
  skill.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — discovery workflow, OData, read-only mode
- [cluster-operations](../cluster-operations/SKILL.md) — the clusters and hosts VMs run on
- [monitoring-aiops](../monitoring-aiops/SKILL.md) — VM rightsizing and performance analysis
