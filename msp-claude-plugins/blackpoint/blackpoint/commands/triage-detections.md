---
description: Sweep and prioritize the open Blackpoint Cyber / CompassOne detection queue across tenants
argument-hint: "[tenant] [hours]"
arguments: [tenant, hours]
---

# Triage Blackpoint Detections

Sweep open CompassOne detections, rank them by severity and tenant
impact, and produce a shift-ready priority list with dispositions.

## Prerequisites

- Blackpoint MCP server connected with a valid `BLACKPOINT_API_TOKEN`
- Tools: `blackpoint_tenants_list`, `blackpoint_detections_list`,
  `blackpoint_detections_get`, `blackpoint_assets_get`

## Steps

1. **Enumerate scope**

   If `tenant` was supplied, resolve it with
   `blackpoint_tenants_list`. Otherwise enumerate all tenants the
   partner can see.

2. **Sweep open detections**

   For each tenant, call `blackpoint_detections_list` filtered to the
   look-back window and `status` in {`new`, `investigating`}.

3. **Rank**

   Sort by `severity` (critical → low), then tenant impact, then
   recency (`new` outranks long-running `investigating`).

4. **Enrich the top candidates**

   For the highest-ranked detections only, call
   `blackpoint_detections_get` and `blackpoint_assets_get` to name
   the affected host.

5. **Assign dispositions**

   For each detection: escalate to Blackpoint SOC, investigate
   in-house, monitor, or likely-noise — with a one-line reason.

6. **Output**

   A ranked priority table (tenant, detection ID, severity, type,
   asset, age, disposition) and a numbered recommended-actions list.
   Flag any tenant with anomalous detection volume.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| tenant | string | No | all tenants | Scope to one customer |
| hours | number | No | 24 | Look-back window in hours |

## Examples

### Triage the whole partner queue
```
/triage-detections
```

### Triage one tenant over the last 8 hours
```
/triage-detections --tenant "Contoso" --hours 8
```

## Related Commands

- `/investigate-detection` - Drill into a single ranked detection
- `/tenant-exposure` - Pivot to a tenant's exposure posture
