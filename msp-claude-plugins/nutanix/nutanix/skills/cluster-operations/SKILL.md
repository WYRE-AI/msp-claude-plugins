---
name: "Nutanix Cluster Operations"
description: >
  Working the clustermgmt namespace through `clustermgmt_execute` —
  cluster and host inventory, configuration and health state — plus the
  adjacent read surfaces: `prism_execute` for Prism Central tasks and
  categories, and `lifecycle_execute` for LCM upgrade inventory and
  recommendations.
when_to_use: >-
  When inspecting Nutanix clusters, hosts, or Prism Central itself. Use
  when: nutanix cluster, cluster health nutanix, host inventory nutanix,
  clustermgmt, prism central tasks, lcm inventory, nutanix upgrade
  status, or nutanix cluster configuration.
---

# Nutanix Cluster Operations

## Overview

Cluster-level work spans three namespaces. `clustermgmt` is the core:
clusters, hosts/nodes, cluster profiles, and storage container
associations. `prism` covers Prism Central's own surface — tasks,
categories, cluster registration state. `lifecycle` exposes LCM
(Lifecycle Manager) inventory: what software/firmware versions each
cluster runs and what upgrades LCM recommends. Each is reached through
its own executor after discovery.

## Key Concepts

| Concept | Namespace | Notes |
|---------|-----------|-------|
| Cluster | `clustermgmt` | Config, health state, nodes, network config; identified by `extId` |
| Host / node | `clustermgmt` | Physical servers in a cluster; disk and NIC detail per host |
| Task | `prism` | Async operations on PC; status is `QUEUED` / `RUNNING` / `SUCCEEDED` / `FAILED` |
| Category | `prism` | key:value tags shared by VMs, hosts, policies |
| LCM entity | `lifecycle` | An upgradeable component with current and available versions |

## Common Workflows

### Cluster health snapshot

1. `listOperations(namespace="clustermgmt", search="clusters")` →
   list-clusters operation.
2. `clustermgmt_execute` to list clusters; capture name, `extId`,
   version, node count.
3. For each cluster of interest, get it by `extId` for config and
   health detail, and list its hosts for per-node state.
4. Fold in open alerts from the `monitoring` namespace (see the
   monitoring-aiops skill) for a complete health picture.

### Recent task audit on Prism Central

1. Discover the list-tasks operation in `prism`.
2. `prism_execute` with an OData filter, e.g.
   `_filter="status eq 'FAILED'"` plus a time-range predicate, ordered
   by start time.
3. Report each task's `extId`, operation type, error messages, and
   timing.

### Upgrade posture (read-only)

1. `listOperations(namespace="lifecycle", search="entities")` to find
   the LCM inventory operation; `lifecycle_execute` to list current
   component versions per cluster.
2. Discover and read LCM recommendations to see upgrade candidates and
   blocking pre-check conditions.
3. Stop there: performing upgrades, pre-checks that mutate state, and
   node imaging are non-GET and blocked by read-only mode. Deliver the
   findings as an upgrade plan for a human to execute.

## Gotchas

- **The lifecycle namespace is huge (~110 operations).** Always narrow
  `listOperations` with a `search` term; paging the whole namespace
  wastes turns.
- **Storage containers appear in two namespaces.** `clustermgmt` holds
  cluster-side container associations; `storage` is the primary
  container/volume surface. Prefer `storage` for capacity questions.
- **Cluster registration is a prism concern.** A cluster missing from
  `clustermgmt` lists may simply not be registered with this Prism
  Central — check registration state via `prism` before declaring it
  down.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — discovery workflow, OData, read-only mode
- [storage](../storage/SKILL.md) — containers, volume groups, capacity
- [monitoring-aiops](../monitoring-aiops/SKILL.md) — alerts and capacity forecasting
