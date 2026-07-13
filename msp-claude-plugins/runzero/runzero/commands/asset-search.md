---
description: Search for assets in RunZero by criteria
argument-hint: "[query] [site_id] [limit]"
arguments: [query, site_id, limit]
---

# RunZero Asset Search

Search for assets across all sites using RunZero's query language. Returns matching assets with OS fingerprinting, network details, and classification.

## Prerequisites

- RunZero MCP server connected with valid API token
- MCP tools `runzero_assets_list` and `runzero_assets_search` available

## Steps

1. **Search for assets**

   Call `runzero_assets_search` or `runzero_assets_list` with the provided `query` and optional `site_id` filter. Paginate through results up to `limit`.

2. **Summarize results**

   For each asset, extract: hostname, IP addresses, OS, type, last seen, and site.

3. **Aggregate statistics**

   Count assets by type, OS, and site. Highlight key findings.

4. **Present findings**

   Build a summary table of matching assets with key attributes.

5. **Recommend next steps**

   Suggest deeper investigation with `/site-overview` or `/service-inventory` for specific assets.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | all | RunZero query string |
| site_id | string | No | all | Filter to a specific site |
| limit | integer | No | 50 | Maximum assets to return |

## Examples

### Search for Windows Servers

```
/asset-search --query "os:Windows Server"
```

### Search for IoT Devices

```
/asset-search --query "type:iot"
```

### Search by Subnet

```
/asset-search --query "address:192.168.1.0/24"
```

### Search in a Specific Site

```
/asset-search --site_id "site-uuid-456" --query "alive:true"
```

### Search for Stale Assets

```
/asset-search --query "alive:false AND last_seen:<30d"
```

## Error Handling

- **Authentication Error:** Verify `RUNZERO_API_TOKEN` is set correctly
- **Rate Limit:** Use site or query filters to reduce result set
- **No Results:** Broaden the query or verify the site has been scanned

## Related Commands

- `/site-overview` - Detailed overview of a specific site
- `/service-inventory` - Services running on matching assets
- `/vuln-report` - Vulnerability assessment of matching assets
