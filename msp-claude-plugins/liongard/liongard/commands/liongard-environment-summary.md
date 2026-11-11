---
description: Generate a detailed summary of a Liongard environment
argument-hint: "<environment>"
arguments: [environment]
---

# Liongard Environment Summary

Generate a comprehensive summary of a specific Liongard environment, including related agents, launchpoints, systems, and recent detections.

## Prerequisites

- Liongard connected in Conduit (`https://conduit.wyre.ai/connect/liongard`) with the Instance Name, Access Key ID and Access Key Secret
- The Liongard user that generated the access token has read permissions
- Environment must exist in Liongard

## Steps

1. **Look up environment by ID or name**
   - If numeric, call `liongard_environments_get` with `id`
   - If text, call `liongard_environments_list` (paging with `page` / `pageSize`) and filter the results for a matching name
   - Suggest similar names if no exact match found

2. **Get agents for the environment**
   - Call `liongard_agents_list`, paging through all agents, and keep the ones whose environment ID matches

3. **Get launchpoints for the environment**
   - Call `liongard_inspections_launchpoints`, paging through all launchpoints, and keep the ones whose environment ID matches

4. **Get systems for the environment**
   - Call `liongard_systems_list`, paging through all systems, and keep the ones whose environment ID matches

5. **Get recent detections for the environment**
   - Call `liongard_detections_list` with `filters` on the environment ID and `pageSize` 20; it covers the last 30 days unless you pass `startDate` / `endDate`

6. **Format comprehensive summary with tables**
   - Environment details
   - Agent status table
   - Launchpoint summary with last inspection times
   - System count by inspector type
   - Recent detections by severity

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| environment | string/int | Yes | - | Environment ID or name to summarize |

## Examples

### By Environment ID

```
/liongard-environment-summary 1234
```

### By Environment Name

```
/liongard-environment-summary "Acme Corporation"
```

### Partial Name Match

```
/liongard-environment-summary "Acme"
```

## Output

### Full Summary

```
================================================================================
Environment Summary: Acme Corporation
================================================================================

BASIC INFORMATION
--------------------------------------------------------------------------------
ID:             1234
Name:           Acme Corporation
Description:    Primary managed services client
Status:         Active
Tier:           Premium
Created:        2023-01-15
Last Updated:   2024-02-15

AGENTS (2)
--------------------------------------------------------------------------------
| ID    | Name              | Status  | Last Seen           |
|-------|-------------------|---------|---------------------|
| 501   | ACME-AGENT-01     | Online  | 2024-02-15 14:30:00 |
| 502   | ACME-AGENT-02     | Online  | 2024-02-15 14:28:00 |

Online: 2 | Offline: 0

LAUNCHPOINTS (15)
--------------------------------------------------------------------------------
| ID    | Inspector            | Status  | Last Inspection     | Schedule    |
|-------|----------------------|---------|---------------------|-------------|
| 5001  | Active Directory     | Active  | 2024-02-15 02:15:00 | Daily 2 AM  |
| 5002  | Microsoft 365        | Active  | 2024-02-15 03:00:00 | Daily 3 AM  |
| 5003  | Cisco Meraki         | Active  | 2024-02-15 04:00:00 | Daily 4 AM  |
| 5004  | VMware vSphere       | Active  | 2024-02-15 02:30:00 | Daily 2:30  |
| 5005  | Datto BCDR           | Active  | 2024-02-15 05:00:00 | Daily 5 AM  |
| 5006  | SonicWall            | Active  | 2024-02-15 04:30:00 | Daily 4:30  |
| 5007  | DNS Records          | Active  | 2024-02-12 02:00:00 | Weekly Sun  |
| 5008  | SSL Certificates     | Active  | 2024-02-12 03:00:00 | Weekly Sun  |
| ...   | (7 more)             |         |                     |             |

Active: 14 | Inactive: 1 | Error: 0

SYSTEMS BY INSPECTOR (47)
--------------------------------------------------------------------------------
| Inspector            | System Count | Last Inspection     |
|----------------------|--------------|---------------------|
| Active Directory     | 8            | 2024-02-15 02:15:00 |
| Microsoft 365        | 12           | 2024-02-15 03:00:00 |
| Cisco Meraki         | 6            | 2024-02-15 04:00:00 |
| VMware vSphere       | 10           | 2024-02-15 02:30:00 |
| Datto BCDR           | 3            | 2024-02-15 05:00:00 |
| SonicWall            | 2            | 2024-02-15 04:30:00 |
| DNS Records          | 4            | 2024-02-12 02:00:00 |
| SSL Certificates     | 2            | 2024-02-12 03:00:00 |

Total Systems: 47

RECENT DETECTIONS (Last 30 Days)
--------------------------------------------------------------------------------
| Date       | Severity | System            | Summary                          |
|------------|----------|-------------------|----------------------------------|
| 2024-02-15 | High     | DC01.acme.local   | Password policy length changed   |
| 2024-02-14 | Medium   | M365 Tenant       | New admin user added             |
| 2024-02-12 | Low      | Meraki Network    | New SSID configured              |
| 2024-02-10 | Medium   | SonicWall FW01    | Firewall rule modified           |
| 2024-02-08 | Info     | vSphere Cluster   | VM snapshot created              |

Critical: 0 | High: 1 | Medium: 2 | Low: 1 | Info: 1

================================================================================

Quick Actions:
- Run an inspection:    liongard_inspections_run (per launchpoint)
- View detections:      liongard_detections_list (filter by EnvironmentID: 1234)
- Environment URL:      https://acmemsp.app.liongard.com/environments/1234
```

## Error Handling

### Environment Not Found

```
Environment not found: "Acme"

Did you mean one of these?
- Acme Corporation (ID: 1234)
- Acme Industries (ID: 1235)
- Acme Labs LLC (ID: 1236)
```

### Environment ID Not Found

```
Environment not found: ID 9999

The environment may have been deleted or the ID may be incorrect.
Use /liongard-health-check to verify connectivity.
```

### Authentication Error

```
Authentication failed

Check the Liongard connection in Conduit (https://conduit.wyre.ai/connect/liongard):
- Instance Name: your Liongard subdomain
- Access Key ID and Access Key Secret: both halves of the access token

Generate a new token in Liongard under Profile > Account Settings > Access Tokens if needed.
```

### Rate Limited

```
Rate limited during environment summary generation.

Partial results retrieved:
- Environment details: OK
- Agents: OK
- Launchpoints: Rate limited
- Systems: Rate limited
- Detections: Rate limited

Retry in 30 seconds for full results.
```

### Empty Environment

```
================================================================================
Environment Summary: New Client Inc
================================================================================

BASIC INFORMATION
--------------------------------------------------------------------------------
ID:             5678
Name:           New Client Inc
Status:         Active
Tier:           Standard
Created:        2024-02-15

No agents, launchpoints, or systems found.

This environment appears to be newly created. Next steps:
1. Deploy a Liongard agent to the client site
2. Configure launchpoints for the client's platforms
3. Run initial inspections to capture baseline documentation
```

## Related Commands

- `/liongard-health-check` - Overall system health check
