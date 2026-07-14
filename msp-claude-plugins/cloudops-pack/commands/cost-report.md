---
description: Cloud cost anomaly and reclaimable-spend report for a given window
argument-hint: "[window]"
arguments: [window]
---

# Cost Report

Cross-vendor cloud cost anomaly report: flags unexpected spend spikes and
ranks orphaned/idle resources by reclaimable monthly cost — pulled from
whatever cloud platforms (Azure, DigitalOcean) the org has connected through
the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least one cloud platform
  connector. Without one, there is no cost data to report.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which cloud platform connector(s) are live and their actual tool names
   (e.g. `azure-mcp__pricing`, `azure-mcp__monitor`,
   `digitalocean__list_droplets`, `digitalocean__list_volumes`,
   `digitalocean__list_databases`). Never assume a specific vendor's tool
   surface — cover every connected platform.

2. **Resolve the window.** Parse `window` (default `30d` if omitted). Accept
   shorthand like `7d`, `30d`, `90d`. Pull cost/usage data for the window and
   the prior comparable window.

3. **Correlate spend against inventory change.** Flag as anomalies: spend
   growth with no corresponding inventory change (highest confidence), and
   spend growth beyond ~20% period-over-period (a stated default threshold,
   not tuned policy). Where itemized billing isn't exposed by a connected
   platform, build an inventory-based cost estimate instead and label it
   explicitly as an estimate.

4. **Hunt for orphaned and idle resources.** Across all connected platforms,
   check unattached storage, idle load balancers, stopped-but-still-billing
   compute, idle managed databases, and orphaned network resources per the
   `cloud-cost-management` skill. Classify each finding's confidence
   (confirmed idle vs. likely idle — needs confirmation).

5. **Rank both sections by dollar impact** and return them as clearly
   separated findings — anomalies need investigation, reclaimable resources
   need a decommission decision.

## Arguments

- `window` (optional; default: `30d`) — Time window for the cost comparison,
  e.g. `7d`, `30d`, `90d`.

## Examples

### Default 30-day window

```
/cloudops-pack:cost-report
```

### 90-day window

```
/cloudops-pack:cost-report 90d
```

### Tight 7-day window after a known change

```
/cloudops-pack:cost-report 7d
```

## Output

```
================================================================================
Cost Report — window: [window]
================================================================================

COST ANOMALIES ([N], ranked by dollar impact)
--------------------------------------------------------------------------------
[resource/service] ([platform]) — $[prior] to $[current] ([+/-N]%)
  Inventory change: [yes/no]   Confidence: [high/medium]   Action: [investigate/expected]

RECLAIMABLE SPEND — ORPHANED & IDLE RESOURCES ([N], ranked by dollar impact)
--------------------------------------------------------------------------------
[resource] ([platform], [category]) — est. $[N]/month   Confidence: [confirmed idle/likely idle]

TOTAL OPPORTUNITY
--------------------------------------------------------------------------------
Reclaimable spend identified: $[total]/month
Largest anomaly: [resource] ($[N] change)
================================================================================
```

## Error Handling

- **No cloud platform connector connected:** Report plainly that a cost
  report can't be produced without one, and stop rather than fabricating
  spend figures.
- **Invalid window format:** Note the parse failure and fall back to the
  default `30d`, stating that the fallback was used.
- **Platform connected but no billing data exposed:** Fall back to the
  inventory-based cost estimate and label it clearly as an estimate, never
  as a billed actual.

## Related Commands

- `/cloudops-pack:capacity-check [resource_type]` - Resource right-sizing
  and forecasting — a related but distinct judgment from cost anomalies
- `/cloudops-pack:network-sweep` - Network device/link health report
