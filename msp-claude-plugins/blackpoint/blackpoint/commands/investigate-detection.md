---
description: Investigate a single Blackpoint Cyber / CompassOne detection end-to-end
argument-hint: "<detection_id> [tenant]"
arguments: [detection_id, tenant]
---

# Investigate Blackpoint Detection

Walk a single CompassOne detection from the alert to its affected
asset, map blast radius, and pull vulnerability context — producing
an investigation-ready summary.

## Prerequisites

- Blackpoint MCP server connected with a valid `BLACKPOINT_API_TOKEN`
- Tools: `blackpoint_tenants_list`, `blackpoint_detections_get`,
  `blackpoint_assets_get`, `blackpoint_assets_relationships`,
  `blackpoint_vulnerabilities_list`

## Steps

1. **Resolve the detection**

   Call `blackpoint_detections_get` with `detection_id`. Capture
   severity, type, status, timestamp, and the affected asset ID. If
   `tenant` was supplied, confirm it with `blackpoint_tenants_list`.

2. **Pull the affected asset**

   Call `blackpoint_assets_get` for the affected asset — hostname,
   class, status.

3. **Map blast radius**

   Call `blackpoint_assets_relationships` from the affected asset.
   Bucket related assets by class (endpoint, server, network, cloud).

4. **Add vulnerability context**

   Call `blackpoint_vulnerabilities_list` filtered to the affected
   `asset_id`. Note any open, exploit-available CVE that could
   explain the detection.

5. **Summarize**

   Produce: Tenant, Detection (ID/type/severity/status/time),
   Affected Asset, Blast Radius table, Vulnerability Context,
   Conclusion, and specific Recommended Actions.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| detection_id | string | Yes | none | CompassOne detection ID |
| tenant | string | No | inferred | Tenant name or ID |

## Examples

### Investigate a detection
```
/investigate-detection D-1234
```

### Investigate within a known tenant
```
/investigate-detection D-1234 --tenant "Acme Corp"
```

## Related Commands

- `/search-detections` - Find the detection ID first
- `/triage-detections` - Prioritize the whole queue
