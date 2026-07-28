---
name: "Cloud Capacity Planning"
description: >
  Right-sizing and capacity forecasting for cloud resources on whatever
  platforms (Azure, DigitalOcean) are connected: the per-platform
  over-provisioned and under-provisioned signals, growth-trend-based
  forecasting toward a projected exhaustion window, and the discipline that
  separates a genuine capacity risk from normal variance — require a trend
  not a spike, distinguish burst-tolerant from sustained-critical resources,
  and always state the observation window behind a forecast.
when_to_use: >-
  When right-sizing cloud resources or forecasting whether current capacity
  will hold up under growth. Use when: capacity planning, are we running out
  of capacity, resource forecast, growth planning, right-size this resource,
  over-provisioned, under-provisioned, quota check.
---

# Cloud Capacity Planning

## Overview

Capacity planning answers two distinct questions that are easy to conflate:
"is this resource sized correctly right now" (right-sizing) and "will it
still be sized correctly in N weeks given its growth trend" (forecasting).
This skill covers both, across whatever cloud platform(s) an org has
connected, and is deliberately conservative about calling something a risk —
a capacity plan that cries wolf on every metric blip gets ignored.

This is infrastructure-substrate capacity — compute, storage, database, and
cluster headroom on the platforms themselves. It is not application-level
performance or SLO tracking (see `devops-pack`, if connected) and it is not
spend (see the `cloud-cost-management` skill, a related but separate
concern: a resource can be correctly sized and still be a cost problem, or
be under-provisioned and cheap).

## Discovering available tools first

Never assume which cloud platform is connected:

1. Call `conduit__search_tools` with a query like `"list resources"`,
   `"resource group"`, `"droplet"`, or `"quota"` to discover which cloud
   platform connector(s) are live and their actual tool names (e.g.
   `azure-mcp__group_resource_list`, `azure-mcp__quota`,
   `digitalocean__list_droplets`, `digitalocean__list_kubernetes_clusters`,
   `digitalocean__list_databases`).
2. More than one cloud platform can be connected (an org running both Azure
   and DigitalOcean). Cover all connected platforms; don't stop at the
   first.
3. Only call concrete tools that discovery actually returned.

## Key Concepts

### Right-sizing signals, per platform

| Platform | Over-provisioned signal | Under-provisioned signal |
|---|---|---|
| Azure | Resource group / subscription quota usage well below allocated quota (via `azure-mcp__quota`); Advisor recommendations flagging low-utilization VMs or oversized SKUs (via `azure-mcp__advisor`); sustained low CPU/memory/IOPS in `azure-mcp__monitor` metrics against an oversized SKU | Quota usage approaching the allocated limit; Advisor or `azure-mcp__resourcehealth` flagging throttling, sustained high utilization, or scale-limited resources |
| DigitalOcean | A Droplet or Database sized well above its sustained CPU/memory/disk usage; a DOKS node pool with persistently low node utilization; unattached or lightly used block storage | A Droplet or Database consistently near its CPU/memory/disk ceiling; a DOKS cluster with pods pending due to insufficient node capacity; a Database approaching connection-limit or storage-limit thresholds |

### Genuine capacity risk vs. normal variance

Do not flag a resource as at-risk from a single data point or a short window.
Apply this discipline:

1. **Require a trend, not a spike.** A single hour or day of elevated
   utilization (batch job, deploy, traffic burst) is normal variance. A
   metric that has climbed over multiple consecutive observation windows
   (e.g., week-over-week) is a trend worth forecasting against.
2. **Distinguish burst-tolerant from sustained-critical resources.** A
   Droplet that spikes to 95% CPU for ten minutes during a nightly job is
   fine. A database consistently running at 85%+ storage utilization with no
   cleanup planned is a real risk — it degrades gracefully into an outage,
   not a burst.
3. **State the observation window used.** Always name how much history the
   forecast is based on (e.g., "based on the last 30 days of `azure-mcp__monitor`
   data") — a forecast built on three days of data is weaker evidence than
   one built on ninety, and the reader needs to know which they're getting.
4. **When historical/trend data isn't exposed**, say so explicitly and
   report current utilization as a point-in-time snapshot rather than
   fabricating a trend line.

### Growth-trend-based forecasting

1. Pull utilization history for the resource over the longest available
   window the connected platform exposes.
2. Compute the trend direction and rate (e.g., "storage utilization has grown
   ~3%/week over the last 8 weeks").
3. Project forward to the point the resource would hit a critical threshold
   (e.g., 90% of allocated capacity) at the observed rate, and state that
   projected date as a range, not a false-precision single day — growth rates
   fluctuate.
4. Flag only resources whose projected exhaustion falls within a
   near-to-medium planning horizon (e.g., inside ~90 days) as needing
   near-term action; note longer horizons as "monitor, no action needed yet."

## Common Workflows

### Portfolio right-sizing sweep

1. Discover connected cloud platforms via `conduit__search_tools`.
2. Pull resource inventory (resource groups, Droplets, DOKS clusters,
   managed databases) per connected platform.
3. Pull utilization/quota data for each and classify:
   over-provisioned / right-sized / under-provisioned / insufficient data.
4. Return a ranked list — under-provisioned (real risk) first, then
   over-provisioned (savings/right-sizing opportunity), then a clean summary
   of correctly sized resources.

### Capacity forecast for a resource type

1. Discover connected platforms.
2. Scope to the requested resource type (compute, storage, database, or all)
   per the caller's request.
3. Pull the longest available utilization history for resources of that
   type.
4. Apply the trend-vs-variance discipline above and produce a forecast
   timeline per at-risk resource, plus a "no near-term risk" summary for the
   rest.

## Error Handling

### No cloud platform connector discovered

Say so explicitly: "No cloud platform connector (Azure, DigitalOcean) is
available through the gateway, so there's no capacity data to report." Do
not fabricate resource data.

### Platform connected but historical/trend data not exposed

Report current point-in-time utilization and state plainly that a
trend-based forecast wasn't possible — do not extrapolate from a single
reading.

### Ambiguous resource-type scope

If asked to scope to a resource type that doesn't map cleanly onto what's
connected (e.g., "database" requested but only compute platforms are
connected), say so and report what is available instead of silently
returning an empty result.

## Related Skills

- [Network Health Sweep](../network-health-sweep/SKILL.md) — device/network
  health rather than cloud resource capacity
- [Cloud Cost Management](../cloud-cost-management/SKILL.md) — spend
  anomalies and reclaimable cost; a right-sized resource can still be a cost
  problem and vice versa
