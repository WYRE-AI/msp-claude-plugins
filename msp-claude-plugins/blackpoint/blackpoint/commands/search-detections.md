---
description: List recent Blackpoint Cyber detections for a tenant
argument-hint: "[tenant]"
arguments: [tenant]
---

# Blackpoint Detection Search

List recent CompassOne detections, then enrich each with its affected asset for an investigation-ready view.

## Arguments

- `tenant` (optional) — Tenant name or ID to scope the search

## Prerequisites

- Blackpoint MCP server connected with a valid `BLACKPOINT_API_TOKEN`
- Tools available: `blackpoint_tenants_list`, `blackpoint_detections_list`, `blackpoint_detections_get`, `blackpoint_assets_get`

## Steps

1. **Resolve tenant scope**

   If `tenant` was supplied, call `blackpoint_tenants_list` and match. Otherwise, list across all tenants the partner can see.

2. **List detections**

   Call `blackpoint_detections_list` for the chosen tenant scope.

3. **Enrich the top results**

   For the top N (e.g. 10) detections, call `blackpoint_detections_get` and `blackpoint_assets_get` for the affected asset.

4. **Output**

   - Detection count, severity distribution, time range
   - Top 10 detection table: timestamp, severity, detection type, asset hostname, tenant
   - Suggested follow-up assets to investigate further (`blackpoint_assets_relationships`)

## Examples

### All recent detections, partner-wide
```
/search-detections
```

### Drill into one tenant
```
/search-detections "Acme Corp"
```

## Related Commands

- (none yet)
