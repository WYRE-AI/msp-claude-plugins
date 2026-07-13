---
description: Scan Auvik interface statistics for saturated links and recurring congestion
argument-hint: "<tenant_id> [window]"
arguments: [tenant_id, window]
---

# Auvik Capacity Check

Pull interface statistics for a tenant and flag any link running hot. The output supports both incident response ("why is the network slow right now?") and capacity planning ("which links will we need to upgrade in the next quarter?").

## Prerequisites

- Tools: `auvik_interfaces_list`, `auvik_statistics_interface`, `auvik_devices_get`, `auvik_statistics_device`

## Steps

1. **Enumerate interfaces**

   Call `auvik_interfaces_list` for the tenant. Filter to interfaces that are admin-up and oper-up - down links produce no utilization signal. Prioritize uplinks, WAN interfaces, and trunks; deprioritize user-facing access ports unless the user specifically asked.

2. **Pull statistics**

   For each candidate interface call `auvik_statistics_interface` over `window`. Pull at minimum `bandwidthInRate` and `bandwidthOutRate` (or the equivalent fields the response exposes), plus error/discard counters if available.

3. **Compute utilization**

   For each sample, utilization = max(in, out) / linkSpeed. Track:
   - Peak utilization in the window
   - Sustained utilization at the 95th percentile (the standard MSP framing)
   - Count of intervals above 70%

4. **Classify each interface**

   - **Saturated** - p95 > 70%, or peak > 90% with > 5% of intervals above 70%. Flag for upgrade.
   - **Warm** - p95 between 40% and 70%. Monitor; consider for upgrade if growth trend is upward.
   - **Cool** - p95 < 40%. Healthy.

5. **Surface error and discard hotspots separately**

   An interface that is not saturated but is dropping packets or seeing CRC errors is a different problem (cable, optic, duplex mismatch) - flag it in its own section.

6. **Cross-reference device health**

   For each device owning a saturated interface, call `auvik_statistics_device` to check CPU and memory in the same window. A saturated link on a CPU-bound device is a different conversation than a saturated link on a healthy device.

7. **Output**

   Sections:
   - Saturated interfaces - table with device, interface, link speed, p95, peak, % time above 70%
   - Warm interfaces - same table, watchlist
   - Error/discard hotspots - device, interface, error count, error rate
   - Devices with elevated CPU/memory that own saturated interfaces

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| tenant_id | string | Yes | - | Tenant to scan |
| window | string | No | 7d | Time window for statistics |

## Examples

```
/auvik:capacity-check tenant_id=12345
```

```
/auvik:capacity-check tenant_id=12345 window=30d
```

## Related Commands

- `/auvik:alert-triage` - When saturation has already triggered alerts
- `/auvik:network-audit` - For the configuration/topology side of the same network
