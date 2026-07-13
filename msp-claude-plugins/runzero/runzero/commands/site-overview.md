---
description: Overview of a RunZero site's assets, services, and health
argument-hint: "<site_id>"
arguments: [site_id]
---

# RunZero Site Overview

Generate a comprehensive overview of a site including asset counts, service distribution, explorer health, scan history, and security posture.

## Prerequisites

- RunZero MCP server connected with valid API token
- MCP tools `runzero_sites_get`, `runzero_assets_list`, `runzero_services_list`, `runzero_tasks_list`, and `runzero_explorers_list` available

## Steps

1. **Retrieve site details**

   Call `runzero_sites_get` with the provided `site_id` to get site name, scope, and summary counts.

2. **Summarize assets**

   Call `runzero_assets_list` filtered by `site_id`. Aggregate by type, OS, and alive status. Highlight key counts.

3. **Summarize services**

   Call `runzero_services_list` filtered by `site_id`. Aggregate by protocol. Flag high-risk services (RDP, Telnet, FTP, SMB exposed).

4. **Check explorer health**

   Call `runzero_explorers_list` and filter to explorers assigned to this site. Report connectivity status and last check-in.

5. **Review recent scans**

   Call `runzero_tasks_list` filtered by `site_id`. Show last 5 scans with status, timing, and discovery counts.

6. **Generate site health summary**

   Combine all data into a site health report: asset counts, service profile, explorer status, scan recency, and security flags.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| site_id | string | Yes | Site UUID to review |

## Examples

### View Site Overview

```
/site-overview --site_id "site-uuid-456"
```

## Error Handling

- **Site Not Found:** Verify the site UUID; list all sites with `runzero_sites_list`
- **No Scan Data:** The site has not been scanned; recommend running `/scan-network`
- **Explorer Offline:** Flag the offline explorer and recommend remediation
- **Authentication Error:** Verify `RUNZERO_API_TOKEN` is set correctly

## Related Commands

- `/asset-search` - Search for specific assets within the site
- `/service-inventory` - Detailed service listing for the site
- `/scan-network` - Initiate a new scan for the site
- `/vuln-report` - Vulnerability report for the site
