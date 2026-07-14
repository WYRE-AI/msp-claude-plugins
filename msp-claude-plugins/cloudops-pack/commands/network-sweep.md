---
description: Full network health sweep across all connected network-monitoring tools — devices down, degraded links, and topology changes
argument-hint: ""
arguments: []
---

# Network Sweep

Cross-vendor network health sweep: devices down, degraded interfaces, and
topology changes since the last sweep — pulled from whatever
network-monitoring tools (Auvik, Meraki, Domotz) the org has connected
through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least one network-monitoring
  connector. Without one, there is no network health data to report.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which network-monitoring connector(s) are live and their actual tool
   names (e.g. `auvik__devices_list`, `meraki__list_networks`,
   `domotz__list_agents`). Never assume a specific vendor's tool surface —
   resolve it fresh each run, and sweep every connected family, not just the
   first one found.

2. **Check collector/agent health first (Domotz).** If Domotz is connected,
   confirm agent status before trusting any device status behind it — an
   offline agent means "unknown," not "down" or "healthy," for everything it
   collects.

3. **Pull device and interface status.** For each connected vendor family,
   resolve device status into the shared taxonomy (Down / Degraded / Unknown
   / Healthy) per the `network-health-sweep` skill. Apply sustained (not
   momentary) error and utilization thresholds for the Degraded
   classification.

4. **Pull topology-change history where available.** Strongest on Auvik via
   configuration/audit history. Surface unplanned changes as their own
   section rather than silently absorbing them.

5. **Assemble and return the report**, ranked: Down → Degraded → Unknown
   (collector-caused) → Topology Changes → Healthy summary.

## Arguments

This command takes no arguments — it always sweeps the full portfolio across
whatever network-monitoring tools are connected.

## Examples

### Basic Usage

```
/cloudops-pack:network-sweep
```

## Output

```
================================================================================
Network Sweep — [Date/time]
================================================================================

DOWN ([N])
--------------------------------------------------------------------------------
[device] ([vendor source], [site]) — last online [N]h ago

DEGRADED ([N])
--------------------------------------------------------------------------------
[device/interface] ([vendor source]) — [finding], threshold exceeded [N] days

UNKNOWN — COLLECTOR ISSUE ([N])
--------------------------------------------------------------------------------
[agent name] offline ([site]) — [N] devices affected, status unconfirmed

TOPOLOGY CHANGES SINCE LAST SWEEP
--------------------------------------------------------------------------------
[List of changes, or: No topology-change data available from connected sources.]

HEALTHY SUMMARY
--------------------------------------------------------------------------------
[N] devices confirmed healthy across [vendor sources]
================================================================================
```

## Error Handling

- **No network-monitoring connector connected:** Report plainly that a
  network sweep can't be produced without one, and stop rather than
  fabricating device status.
- **Some vendor families connected, others not:** Sweep what's connected and
  name explicitly which families weren't available.
- **A vendor call fails mid-sweep:** Report the partial results gathered and
  name the failure — don't let one vendor's failure suppress the rest.

## Related Commands

- `/cloudops-pack:capacity-check [resource_type]` - Cloud resource capacity
  forecast, the cloud-side counterpart to this network-side sweep
- `/cloudops-pack:cost-report [window]` - Cloud spend anomaly and
  reclaimable-cost report
