---
name: "Cloud Cost Management"
description: >
  Cloud spend anomaly detection and reclaimable-spend hunting on whatever
  platforms (Azure, DigitalOcean) are connected: the signals that make a
  spend increase an anomaly rather than expected cost, the per-platform
  orphaned/idle resource catalog (unattached storage, idle load balancers,
  stopped-but-not-deallocated compute, idle managed databases, orphaned
  network resources), and how to build a monthly cost trend view — or a
  clearly labeled inventory-and-list-pricing estimate when a platform
  exposes no billing data.
when_to_use: >-
  When tracking cloud spend, investigating a cost spike, or hunting for
  orphaned/idle resources that are still incurring cost. Use when: cloud
  cost anomaly, unexpected cloud spend, cost spike, orphaned resources, idle
  resources, cloud bill went up, reclaim spend, cost trend.
---

# Cloud Cost Management

## Overview

Cloud cost management here means two things: catching spend that changed
unexpectedly, and finding spend that shouldn't exist at all (a resource
nobody is using but that's still billing). Both are about protecting margin
on infrastructure that's easy to lose track of once it's provisioned — this
skill treats "the bill went up" and "we're paying for something idle" as
related but distinct findings, and reports them separately.

This is spend on the infrastructure substrate itself (compute, storage,
managed databases, networking). It is not PSA/contract billing
reconciliation (see `finance-pack`) — this skill is about what the cloud
platform itself is charging, not what the MSP bills the client for it.

## Anti-triggers

- **Azure retail pricing and inventory lookups** — meter rates, quota
  headroom, and subscription/resource-group listings are the connector's own
  read-only surface; use `azure-mcp-cost-and-capacity`. This skill consumes
  those numbers to find anomalies and reclaimable spend.
- **The raw metric or log query behind a spend signal** — use
  `azure-mcp-observability` for the monitor and log surface itself.

## Discovering available tools first

Never assume which cloud platform is connected:

1. Call `conduit__search_tools` with a query like `"cost"`, `"pricing"`,
   `"billing"`, or `"list droplets"` to discover which cloud platform
   connector(s) are live and their actual tool names (e.g.
   `azure-mcp__pricing`, `azure-mcp__monitor`, `azure-mcp__group_resource_list`,
   `digitalocean__list_droplets`, `digitalocean__list_databases`,
   `digitalocean__list_volumes`, `digitalocean__list_load_balancers`).
2. More than one cloud platform can be connected — cover all of them.
3. Only call concrete tools that discovery actually returned. Not every
   connected platform exposes a first-class billing API through its MCP
   surface — where cost data isn't directly available, build the cost view
   from resource inventory and known pricing (`azure-mcp__pricing`) instead,
   and say explicitly that it's a derived estimate, not a billed figure.

## Key Concepts

### Cost spikes vs. normal variance

Apply the same discipline as capacity planning: a spend increase driven by a
known, intentional change (a new resource provisioned, a planned scale-up) is
not an anomaly — it's expected cost. Flag as an anomaly only spend growth
that:

1. Doesn't correspond to a visible inventory change (resource count and
   sizing look the same, but the bill went up) — this is the strongest
   anomaly signal, since it points at either a pricing/tier change, a usage
   spike (egress, API calls, storage growth within existing resources), or a
   billing error.
2. Exceeds a reasonable period-over-period threshold (in the absence of a
   documented client policy, flag month-over-month growth beyond roughly 20%
   for review — state this as a default, not a tuned threshold).
3. Is concentrated in a single resource or service rather than spread evenly
   across the whole environment — concentrated spikes are easier to root-cause
   and usually more actionable than broad, gradual growth.

### Orphaned and idle resources — the reclaimable-spend hunt

These are resources that cost money but provide no value, and they're the
highest-confidence savings finding because reclaiming them has no
functional downside (unlike right-sizing, which requires judgment about
headroom). Check for, per platform:

| Category | Azure | DigitalOcean |
|---|---|---|
| Unattached storage | Managed disks not attached to any VM (via `azure-mcp__group_resource_list` filtered to disk resources, cross-referenced against VM attachments) | Unattached volumes (via `digitalocean__list_volumes`, cross-referenced against Droplet attachments) |
| Idle load balancers / gateways | Load balancers or app gateways with no healthy backend pool members, or minimal-to-no traffic in `azure-mcp__monitor` | Load balancers with no attached Droplets or near-zero traffic |
| Stopped-but-billing compute | VMs stopped but not deallocated (still billing for reserved compute) — check power state distinctly from "stopped/deallocated" via resource health/monitor | Droplets powered off but not destroyed still bill for reserved disk/resources — flag long-powered-off Droplets |
| Idle managed databases | Databases provisioned with no recent connection activity in `azure-mcp__monitor` | Databases (`digitalocean__list_databases`) with no recent connection activity |
| Orphaned network resources | Unused public IPs, NICs not attached to any VM | Reserved IPs not attached to any Droplet |

For each candidate, distinguish "confirmed idle" (clear evidence of no use
over a meaningful window) from "likely idle, needs confirmation" (e.g., a
resource with sparse but non-zero activity, or a standby/DR resource that's
supposed to be idle) — never recommend deleting something without stating
the confidence level and evidence.

### Building a monthly cost trend view

1. Discover what billing/usage data each connected platform actually
   exposes through the gateway — this varies by platform, and not every
   connector surfaces itemized billing.
2. Where usable cost/usage data exists, build a month-over-month view scoped
   to whatever history is available, broken out by resource/service category
   where the data supports it.
3. Where cost data isn't directly exposed, build a resource-inventory-based
   proxy (current resource count/sizing × platform list pricing) and label
   it explicitly as an estimate, not an actual bill.
4. Always state the data source and window behind the trend view so the
   reader knows whether they're looking at billed actuals or an estimate.

## Common Workflows

### Cost anomaly report for a window

1. Discover connected cloud platforms via `conduit__search_tools`.
2. Pull cost/usage data (or the inventory-based proxy, if billing data isn't
   exposed) for the requested window and the prior comparable window.
3. Apply the spike-detection logic above; rank anomalies by dollar impact
   (largest absolute change first).
4. Separately, run the orphaned/idle-resource hunt across all connected
   platforms and rank by reclaimable monthly cost.
5. Return both sections — anomalies and reclaimable spend — clearly
   separated, since they call for different actions (investigate vs.
   decommission).

### Reclaimable-spend sweep only

1. Discover connected platforms.
2. Run the orphaned/idle-resource checks above across all resource
   categories the connected platform(s) expose.
3. Rank findings by estimated monthly reclaimable cost, with confidence
   level per finding.

## Error Handling

### No cloud platform connector discovered

Say so explicitly: "No cloud platform connector (Azure, DigitalOcean) is
available through the gateway, so there's no cost data to report." Do not
fabricate spend figures.

### Platform connected but no billing/cost data exposed

Fall back to the inventory-based cost estimate described above and label it
as an estimate. Never present an estimate as a billed actual.

### Ambiguous or ambiguous-confidence idle-resource finding

Report it with its confidence level and evidence rather than omitting it or
overstating certainty — a "likely idle, needs confirmation" finding is still
useful if labeled honestly.

## Related Skills

- [Cloud Capacity Planning](../cloud-capacity-planning/SKILL.md) — resource
  right-sizing and forecasting; a related but distinct judgment from cost
  anomaly detection
- [Network Health Sweep](../network-health-sweep/SKILL.md) — device/network
  health, a different infrastructure axis entirely
