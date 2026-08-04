---
name: "runZero Tasks"
description: >
  runZero scan tasks: creating scans, scheduling recurring scans, managing explorers,
  configuring scan parameters, and reviewing scan results.
when_to_use: >-
  When launching, scheduling, configuring, or reviewing runZero scans. Use when: runzero
  scan, runzero task, network scan, scan schedule, scan explorer, scan configuration,
  scan results, discovery scan, or scan targets.
---

# RunZero Tasks (Scans)

## Overview

RunZero tasks represent network discovery scans. Each scan is executed by an explorer (scan agent), targets a set of IP ranges or subnets, and discovers assets, services, and network topology. This skill covers creating, managing, and reviewing scan tasks.

## Anti-triggers

- **Vulnerability scanning.** A runZero task fingerprints and inventories;
  it does not test for CVEs or produce findings. CVE posture is
  `sentinelone-vulnerabilities`.
- **A unit of work rather than a network scan.** "Task" collides badly —
  PSA project tasks and tickets are `connectwise-manage-projects` or
  `connectwise-manage-tickets`, and an RMM script run is
  `connectwise-automate-scripts`.
- **Continuous polling.** Auvik and Domotz watch the network without a
  scan to launch, so there is no task to create — use `auvik-devices` or
  `domotz-devices`.
- **Reading what a scan found** — results live on the records, not the
  task; use `runzero-assets` or `runzero-services`.

## Key Concepts

### Explorers

Explorers are RunZero's scan agents deployed on the network:

| Type | Description |
|------|-------------|
| Managed Explorer | Deployed on-premises, managed via RunZero Console |
| Hosted Explorer | Cloud-hosted by RunZero for external scanning |

Each explorer is assigned to a site and executes scans within that network segment.

### Scan Types

| Type | Description |
|------|-------------|
| Discovery | Full asset and service discovery |
| Quick | Fast ping sweep to identify live hosts |
| Targeted | Scan specific ports or protocols |

### Scan Targets

Targets are specified as:

- CIDR notation: `192.168.1.0/24`
- IP ranges: `10.0.0.1-10.0.0.254`
- Individual IPs: `172.16.0.1`
- Multiple entries separated by commas or newlines

### Scan Rate

Scan rate controls how aggressively the explorer scans:

| Rate | Description |
|------|-------------|
| `slow` | Minimal network impact, longer scan time |
| `normal` | Balanced speed and network impact |
| `fast` | Faster scan, higher network utilization |
| `max` | Maximum speed, highest network impact |

## API Patterns

### List Tasks

```
runzero_tasks_list
```

Parameters:
- `site_id` -- Filter by site
- `status` -- Filter by status (running, completed, stopped, error)
- `count` -- Results per page
- `offset` -- Pagination offset

**Example response:**

```json
{
  "tasks": [
    {
      "id": "task-uuid-123",
      "name": "Weekly Discovery - ACME HQ",
      "site_id": "site-uuid-456",
      "status": "completed",
      "type": "discovery",
      "targets": "192.168.0.0/16",
      "explorer_id": "explorer-uuid-789",
      "created_at": "2026-03-27T02:00:00Z",
      "completed_at": "2026-03-27T03:45:00Z",
      "stats": {
        "assets_found": 342,
        "services_found": 1205,
        "new_assets": 5
      }
    }
  ]
}
```

### Get Task Details

```
runzero_tasks_get
```

Parameters:
- `task_id` -- The specific task UUID

Returns full scan details including targets, results, timing, and discovered asset/service counts.

### Create a Scan Task

```
runzero_tasks_create
```

Parameters:
- `site_id` -- Site to scan (required)
- `targets` -- IP ranges to scan (required)
- `explorer_id` -- Explorer to execute the scan (required)
- `name` -- Human-readable task name
- `scan_rate` -- Scan speed (slow, normal, fast, max)
- `probes` -- Specific probes to enable (e.g., `arp,syn,connect`)

### Stop a Task

```
runzero_tasks_stop
```

Parameters:
- `task_id` -- The running task to stop

## Common Workflows

### Initiate a Discovery Scan

1. Call `runzero_sites_list` to identify the target site
2. Call `runzero_explorers_list` to find available explorers for the site
3. Call `runzero_tasks_create` with the site, explorer, and target ranges
4. Monitor progress with `runzero_tasks_get`
5. Review results once completed

### Review Recent Scan Results

1. Call `runzero_tasks_list` with `status=completed`
2. Sort by completion time
3. For each task, summarize asset and service discovery counts
4. Flag tasks with errors or unexpected results

### Explorer Health Check

1. Call `runzero_explorers_list` to get all explorers
2. Check each explorer's last check-in time
3. Flag explorers that are offline or haven't reported recently
4. Verify each site has at least one healthy explorer

### Scan Coverage Analysis

1. List all sites and their configured target ranges
2. List recent completed scans per site
3. Identify sites with no recent scans
4. Recommend scan schedules for gaps

## Error Handling

### Explorer Offline

**Cause:** The selected explorer is not connected
**Solution:** Verify explorer connectivity; check the host machine

### Invalid Targets

**Cause:** Malformed CIDR notation or IP range
**Solution:** Verify target format; use CIDR or dash-separated ranges

### Scan Timeout

**Cause:** Large target range or slow scan rate
**Solution:** Split targets into smaller subnets; increase scan rate

## Best Practices

- Schedule recurring scans for each site to maintain current inventory
- Use `normal` scan rate for routine scans; reserve `fast`/`max` for urgent discovery
- Name tasks descriptively (e.g., "Weekly Discovery - ClientName HQ")
- Review scan results for new assets after each scan
- Monitor explorer health to ensure scan coverage
- Split large networks into smaller scan targets for manageability

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - API authentication and pagination
- [assets](../assets/SKILL.md) - Assets discovered by scans
- [sites](../sites/SKILL.md) - Sites where scans run
- [services](../services/SKILL.md) - Services discovered by scans
