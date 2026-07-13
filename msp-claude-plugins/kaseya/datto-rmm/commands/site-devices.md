---
description: List all devices at a site in Datto RMM
argument-hint: "<site> [status] [type] [alerts]"
arguments: [site, status, type, alerts]
---

# Site Devices

List all devices at a specific site in Datto RMM with optional filtering.

## Prerequisites

- Valid Datto RMM API credentials configured
- `DATTO_API_KEY` and `DATTO_API_SECRET` environment variables set
- `DATTO_PLATFORM` configured (pinotage, merlot, concord, vidal, zinfandel, syrah)

## Steps

1. **Resolve site identifier**
   - If UUID format, use as site UID directly
   - Otherwise, search sites by name

2. **Fetch devices for site**
   ```http
   GET /api/v2/site/{siteUid}/devices?max=250
   Authorization: Bearer {token}
   ```

3. **Apply filters**
   - Filter by status if `--status` specified
   - Filter by device type if `--type` specified
   - Filter by alert count if `--alerts` specified

4. **Format and display results**
   - Group by device type (optional)
   - Show status indicators
   - Include alert counts
   - Show last seen time

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| site | string | Yes | - | Site name or UID |
| status | string | No | all | Filter: `online`, `offline`, `all` |
| type | string | No | all | Filter: `server`, `desktop`, `laptop`, `network`, `printer` |
| alerts | flag | No | false | Show only devices with open alerts |

## Examples

### List All Devices at Site

```
/site-devices "Acme Corporation"
```

### List Online Devices Only

```
/site-devices "Acme Corporation" --status online
```

### List Servers Only

```
/site-devices "Acme Corporation" --type server
```

### List Devices with Alerts

```
/site-devices "Acme Corporation" --alerts
```

### Combined Filters

```
/site-devices "Acme Corporation" --status online --type server --alerts
```

### Using Site UID

```
/site-devices "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

## Output

### Full Device List

```
Devices at Acme Corporation

Site UID:    a1b2c3d4-e5f6-7890-abcd-ef1234567890
Total:       45 devices
Online:      42 (93%)
Offline:     3 (7%)
With Alerts: 5

SERVERS (8 devices)
Status | Hostname         | IP Address     | OS                        | Alerts | Last Seen
-------+------------------+----------------+---------------------------+--------+------------
 [ON]  | ACME-DC01        | 192.168.1.10   | Windows Server 2022       |   2    | 2 min ago
 [ON]  | ACME-DC02        | 192.168.1.11   | Windows Server 2022       |   0    | 1 min ago
 [ON]  | ACME-SQL01       | 192.168.1.20   | Windows Server 2019       |   1    | 3 min ago
 [ON]  | ACME-FILE01      | 192.168.1.30   | Windows Server 2019       |   0    | 2 min ago
 [ON]  | ACME-EXCH01      | 192.168.1.40   | Windows Server 2016       |   0    | 5 min ago
 [OFF] | ACME-BACKUP01    | 192.168.1.50   | Windows Server 2019       |   1    | 3 hours ago
 [ON]  | ACME-WEB01       | 192.168.1.60   | Ubuntu 22.04              |   0    | 1 min ago
 [ON]  | ACME-ESXI01      | 192.168.1.100  | VMware ESXi 7.0           |   0    | 4 min ago

DESKTOPS (25 devices)
Status | Hostname         | IP Address     | OS                        | Alerts | Last Seen
-------+------------------+----------------+---------------------------+--------+------------
 [ON]  | ACME-WKS001      | 192.168.1.101  | Windows 11 Pro            |   0    | 1 min ago
 [ON]  | ACME-WKS002      | 192.168.1.102  | Windows 11 Pro            |   1    | 2 min ago
 [ON]  | ACME-WKS003      | 192.168.1.103  | Windows 10 Pro            |   0    | 3 min ago
 ...   | (22 more)        |                |                           |        |

LAPTOPS (12 devices)
Status | Hostname         | IP Address     | OS                        | Alerts | Last Seen
-------+------------------+----------------+---------------------------+--------+------------
 [ON]  | ACME-LT001       | DHCP           | Windows 11 Pro            |   0    | 5 min ago
 [OFF] | ACME-LT002       | 192.168.1.150  | Windows 11 Pro            |   0    | 1 day ago
 ...   | (10 more)        |                |                           |        |

Legend: [ON] = Online, [OFF] = Offline
```

### Filtered View (Online Servers)

```
Online Servers at Acme Corporation

Site:   Acme Corporation
Filter: status=online, type=server
Found:  7 devices

Status | Hostname         | IP Address     | OS                        | Alerts | Last Seen
-------+------------------+----------------+---------------------------+--------+------------
 [ON]  | ACME-DC01        | 192.168.1.10   | Windows Server 2022       |   2    | 2 min ago
 [ON]  | ACME-DC02        | 192.168.1.11   | Windows Server 2022       |   0    | 1 min ago
 [ON]  | ACME-SQL01       | 192.168.1.20   | Windows Server 2019       |   1    | 3 min ago
 [ON]  | ACME-FILE01      | 192.168.1.30   | Windows Server 2019       |   0    | 2 min ago
 [ON]  | ACME-EXCH01      | 192.168.1.40   | Windows Server 2016       |   0    | 5 min ago
 [ON]  | ACME-WEB01       | 192.168.1.60   | Ubuntu 22.04              |   0    | 1 min ago
 [ON]  | ACME-ESXI01      | 192.168.1.100  | VMware ESXi 7.0           |   0    | 4 min ago
```

### Devices with Alerts

```
Devices with Open Alerts at Acme Corporation

Site:   Acme Corporation
Filter: alerts=true
Found:  5 devices with 7 total alerts

Status | Hostname         | Alerts | Priority Summary
-------+------------------+--------+----------------------------------
 [ON]  | ACME-DC01        |   2    | High (1), Moderate (1)
 [ON]  | ACME-SQL01       |   1    | High (1)
 [ON]  | ACME-WKS002      |   1    | Low (1)
 [OFF] | ACME-BACKUP01    |   1    | Critical (1)
 [ON]  | ACME-LT005       |   2    | Moderate (2)

Alert Summary:
  Critical:  1
  High:      2
  Moderate:  3
  Low:       1

Use /resolve-alert <hostname> to view and resolve alerts.
```

### Offline Devices

```
Offline Devices at Acme Corporation

Site:   Acme Corporation
Filter: status=offline
Found:  3 devices

Status | Hostname         | Last Seen          | Offline Duration | Alerts
-------+------------------+--------------------+------------------+--------
 [OFF] | ACME-BACKUP01    | 2024-02-15 07:30   | 3 hours          |   1
 [OFF] | ACME-LT002       | 2024-02-14 17:00   | 17 hours         |   0
 [OFF] | ACME-CONF01      | 2024-02-13 09:00   | 2 days           |   0

Recommendations:
- ACME-BACKUP01: Check backup job completion
- ACME-LT002: Normal for laptop (after hours)
- ACME-CONF01: Extended offline - investigate
```

### Empty Results

```
No devices found matching criteria

Site:   Acme Corporation
Filter: status=offline, type=server

All servers at this site are currently online.

Try:
- Remove filters to see all devices
- Check a different device type
- Use /site-devices "Acme Corporation" to see all
```

## Error Handling

### Site Not Found

```
Site not found: "Acme"

Did you mean one of these?
- Acme Corporation (45 devices)
- Acme Corp - Remote (12 devices)
- Acme Industries (28 devices)

Use the full site name or site UID.
```

### No Sites Match

```
No site found matching "Unknown Client"

Available sites:
- Acme Corporation
- TechStart Inc
- GlobalTech LLC
- ...

Use /sites to list all available sites.
```

### Invalid Filter Value

```
Invalid status filter: "onlin"

Valid status values:
- online  : Show only online devices
- offline : Show only offline devices
- all     : Show all devices (default)

Usage: /site-devices "Acme Corp" --status online
```

### Invalid Device Type

```
Invalid device type: "workstation"

Valid device types:
- server   : Servers
- desktop  : Desktop computers
- laptop   : Laptops
- network  : Network devices
- printer  : Network printers
- esxi     : ESXi hosts
- all      : All types (default)

Usage: /site-devices "Acme Corp" --type server
```

## Site Summary Mode

For a quick overview without device list:

```
/site-devices "Acme Corporation" --summary
```

Output:
```
Site Summary: Acme Corporation

Site UID:       a1b2c3d4-e5f6-7890-abcd-ef1234567890
Created:        2023-01-15
Last Activity:  2 minutes ago

Device Counts:
  Total:        45
  Online:       42 (93.3%)
  Offline:      3 (6.7%)

By Type:
  Servers:      8
  Desktops:     25
  Laptops:      12

Alert Summary:
  Total Open:   7
  Critical:     1
  High:         2
  Moderate:     3
  Low:          1

Health Score:   72/100 (Fair)

Use --status, --type, or --alerts for filtered device lists.
```

## Related Commands

- `/device-lookup` - Find a specific device
- `/resolve-alert` - Resolve alerts on devices
- `/run-job` - Run jobs on devices

## Related Skills

- [Sites Skill](../skills/sites/SKILL.md) - Site management
- [Devices Skill](../skills/devices/SKILL.md) - Device details
- [Alerts Skill](../skills/alerts/SKILL.md) - Alert information
