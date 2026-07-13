---
description: Initiate a network discovery scan in RunZero
argument-hint: "<site_id> <targets> [scan_rate] [name]"
arguments: [site_id, targets, scan_rate, name]
---

# RunZero Network Scan

Initiate a network discovery scan on a specific site. Creates a scan task targeting the specified IP ranges using an available explorer.

## Prerequisites

- RunZero MCP server connected with valid API token
- MCP tools `runzero_sites_get`, `runzero_explorers_list`, and `runzero_tasks_create` available
- At least one healthy explorer assigned to the target site

## Steps

1. **Verify the target site**

   Call `runzero_sites_get` with the provided `site_id` to confirm the site exists and retrieve its configuration.

2. **Find an available explorer**

   Call `runzero_explorers_list` and identify a healthy explorer assigned to the target site.

3. **Create the scan task**

   Call `runzero_tasks_create` with the site, explorer, targets, and scan rate. If no `name` is provided, generate one from the site name and timestamp.

4. **Confirm task creation**

   Report the task ID, targets, explorer, and estimated scan parameters.

5. **Provide monitoring guidance**

   Advise the user to check scan progress with `runzero_tasks_get` and review results once completed.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| site_id | string | Yes | | Site UUID to scan |
| targets | string | Yes | | IP ranges in CIDR notation |
| scan_rate | string | No | normal | Scan speed (slow, normal, fast, max) |
| name | string | No | auto-generated | Human-readable task name |

## Examples

### Scan a Subnet

```
/scan-network --site_id "site-uuid-456" --targets "192.168.1.0/24"
```

### Fast Scan of Multiple Ranges

```
/scan-network --site_id "site-uuid-456" --targets "10.0.0.0/24,10.0.1.0/24" --scan_rate fast
```

### Named Scan

```
/scan-network --site_id "site-uuid-456" --targets "172.16.0.0/16" --name "Quarterly Full Scan - ACME HQ"
```

## Error Handling

- **No Explorer Available:** Deploy an explorer on the target network or use a hosted explorer
- **Invalid Targets:** Verify CIDR notation; use slash notation (e.g., /24)
- **Site Not Found:** Verify the site UUID with `/site-overview`
- **Authentication Error:** Verify `RUNZERO_API_TOKEN` is set correctly

## Related Commands

- `/site-overview` - Review site details before scanning
- `/asset-search` - Search discovered assets after scan completes
- `/service-inventory` - Review discovered services after scan
