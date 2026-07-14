---
description: Capacity forecast for cloud resources, scoped to a resource type or covering everything connected
argument-hint: "[resource_type]"
arguments: [resource_type]
---

# Capacity Check

Cross-vendor cloud capacity forecast: identifies over-/under-provisioned
resources and projects near-term capacity risk based on observed growth
trends — pulled from whatever cloud platforms (Azure, DigitalOcean) the org
has connected through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least one cloud platform
  connector. Without one, there is no capacity data to report.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which cloud platform connector(s) are live and their actual tool names
   (e.g. `azure-mcp__quota`, `azure-mcp__monitor`,
   `digitalocean__list_droplets`, `digitalocean__list_kubernetes_clusters`,
   `digitalocean__list_databases`). Never assume a specific vendor's tool
   surface — cover every connected platform.

2. **Resolve scope.** Parse `resource_type` (optional; default: all resource
   types). Accepted values include `compute`, `storage`, `database`, or any
   other resource category the connected platform(s) expose. If omitted,
   cover everything connected.

3. **Pull resource inventory and utilization.** Per the
   `cloud-capacity-planning` skill's per-platform signal mapping, classify
   each resource: over-provisioned, right-sized, under-provisioned, or
   insufficient-data.

4. **Apply trend discipline.** Pull the longest available utilization
   history and require a sustained multi-window trend before treating
   anything as a genuine capacity risk — a single spike is not a finding.
   State the observation window used.

5. **Forecast near-term risks.** For resources trending toward a critical
   threshold, project an exhaustion window as a range (not a false-precision
   date) and classify it near-term (inside the planning horizon) or
   longer-horizon (worth tracking, not urgent).

6. **Return the report**, separating near-term risks, longer-horizon trends,
   over-provisioned/right-sizing opportunities, and right-sized resources.

## Arguments

- `resource_type` (optional; default: all) — Scope the forecast to a
  resource category, e.g. `compute`, `storage`, `database`. Omit to cover
  every resource type the connected platform(s) expose.

## Examples

### Full capacity forecast

```
/cloudops-pack:capacity-check
```

### Scoped to compute

```
/cloudops-pack:capacity-check compute
```

### Scoped to database

```
/cloudops-pack:capacity-check database
```

## Output

```
================================================================================
Capacity Forecast — scope: [resource_type or "all"]
================================================================================

NEAR-TERM CAPACITY RISKS ([N])
--------------------------------------------------------------------------------
[resource] ([platform]) — [current utilization], trending [N]%/week over [N]
weeks, projected exhaustion: [date range]

LONGER-HORIZON / MONITOR ([N])
--------------------------------------------------------------------------------
[same shape, outside the near-term planning horizon]

OVER-PROVISIONED — RIGHT-SIZING OPPORTUNITY ([N])
--------------------------------------------------------------------------------
[resource] ([platform]) — [current utilization], suggested action

RIGHT-SIZED ([N])
--------------------------------------------------------------------------------
[N] resources confirmed correctly sized across [platforms]
================================================================================
```

## Error Handling

- **No cloud platform connector connected:** Report plainly that a capacity
  forecast can't be produced without one, and stop rather than fabricating
  resource data.
- **Invalid or unrecognized `resource_type`:** Note the mismatch and report
  what resource types are actually available from the connected platform(s)
  instead of silently returning an empty result.
- **Platform connected but no historical/trend data exposed:** Report
  current utilization as a point-in-time snapshot and state plainly that a
  trend-based forecast wasn't possible.

## Related Commands

- `/cloudops-pack:network-sweep` - Network device/link health, the
  network-side counterpart to this cloud-side forecast
- `/cloudops-pack:cost-report [window]` - Cloud spend anomaly and
  reclaimable-cost report — a related but distinct judgment from capacity
