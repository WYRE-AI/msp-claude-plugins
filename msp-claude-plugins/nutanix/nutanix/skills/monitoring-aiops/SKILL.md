---
name: "Nutanix Monitoring & AIOps"
description: >
  The Nutanix operational-intelligence read surface: `monitoring_execute`
  for alerts, alert policies, events, and audit logs, and `aiops_execute`
  for capacity planning, VM rightsizing recommendations, and workload
  performance analysis — the namespaces behind health checks and
  capacity reports.
when_to_use: >-
  When reviewing Nutanix alerts, events, or audit logs, or producing
  capacity and rightsizing analysis. Use when: nutanix alerts, nutanix
  events, nutanix audit, alert policy nutanix, nutanix capacity
  planning, vm rightsizing, aiops, or nutanix capacity report.
---

# Nutanix Monitoring & AIOps

## Overview

`monitoring` is the reactive surface: active and resolved alerts,
alert policies, the event stream, and Prism Central audit logs.
`aiops` is the analytical surface: capacity planning, VM rightsizing
recommendations, workload trends, and what-if simulations. Together
they answer "what is wrong right now" and "what will run out, and
when" — the two questions behind MSP health checks and quarterly
business reviews.

## Key Concepts

| Concept | Namespace | Notes |
|---------|-----------|-------|
| Alert | `monitoring` | Severity-ranked (critical/warning/info), tied to a source entity; has resolved/acknowledged state |
| Alert policy | `monitoring` | Rules that generate alerts and notifications |
| Event | `monitoring` | Informational state changes, higher volume than alerts |
| Audit | `monitoring` | Who did what on Prism Central — the compliance trail |
| Rightsizing recommendation | `aiops` | Per-VM sizing verdicts (oversized/undersized/inactive) |
| Capacity analysis | `aiops` | Runway projections per cluster resource (CPU, memory, storage) |

## Common Workflows

### Alert triage sweep

1. `listOperations(namespace="monitoring", search="alerts")` → the
   list-alerts operation.
2. `monitoring_execute` filtered to unresolved alerts, ordered by
   severity, `_limit=100` and paged.
3. Group by cluster and severity; lead with criticals. Include each
   alert's source entity so findings map to hardware or VMs.

### Audit trail pull

1. Discover the audit list operation in `monitoring`.
2. Filter by time window (OData predicate on the timestamp field) and,
   when investigating one operator, by user.
3. Report chronologically; this is the evidence trail for change
   review.

### Capacity and rightsizing report

1. `listOperations(namespace="aiops")` to see the analysis surface the
   connected PC exposes.
2. `aiops_execute` for capacity/runway data per cluster, then for VM
   rightsizing recommendations.
3. Deliver: per-cluster runway, top oversized VMs (reclaimable
   resources), undersized VMs (performance risk), and inactive VMs.

## Read-only boundary

Acknowledging or resolving alerts, editing alert policies, and
creating or running AIOps playbooks are non-GET and blocked by
read-only mode. Reports end with recommended actions, not applied
changes.

## Gotchas

- **Events are high-volume.** Always constrain event queries with a
  time-window `_filter` and `_limit`; an unbounded event pull is the
  easiest way to blow past useful context.
- **`aiops` availability varies.** Analysis operations depend on PC
  version and licensing (Prism Ultimate features); verify with
  `listOperations` before promising a rightsizing report.
- **Alerts are not events.** If a customer asks "what happened",
  check both: alerts for actionable conditions, events for the state
  changes around them.
- **`opsmgmt` is adjacent, not a substitute.** It carries shared
  platform plumbing for the ops domains; start alert and capacity
  questions in `monitoring` and `aiops`.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — discovery workflow, OData, read-only mode
- [cluster-operations](../cluster-operations/SKILL.md) — cluster health context for alerts
- [vm-management](../vm-management/SKILL.md) — the VMs rightsizing verdicts point at
