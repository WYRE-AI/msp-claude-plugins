---
description: Check Liongard connectivity and return system health summary
argument-hint: ""
arguments: []
---

# Liongard Health Check

Check Liongard API connectivity and return an overall system health summary including environment count, agent status, and recent detections.

## Prerequisites

- Liongard connected in Conduit (`https://conduit.wyre.ai/connect/liongard`) with the Instance Name, Access Key ID and Access Key Secret
- The Liongard user that generated the access token has read permissions

## Steps

1. **Verify connectivity**
   - Call `liongard_environments_count` (no arguments). A count back means the Conduit connection and access token work.

2. **Get environment summary**
   - Call `liongard_environments_list` with `page` and `pageSize` (up to 2000), paging until every environment is read
   - Count active vs inactive environments

3. **Get agent status summary**
   - Call `liongard_agents_list` with `page` and `pageSize`, paging until every agent is read
   - Summarize online/offline counts

4. **Get recent detections**
   - Call `liongard_detections_list` with `startDate` set to 24 hours ago (ISO-8601) and a small `pageSize`
   - Use the envelope's total row count, and break the returned detections down by severity

5. **Format results in a clear summary table**
   - Display connectivity status
   - Show environment counts
   - Show agent online/offline breakdown
   - Show detection summary by severity

## Parameters

This command takes no parameters.

## Examples

### Basic Usage

```
/liongard-health-check
```

## Output

```
Liongard Health Check
=====================

Connection:     OK (access token valid)
Instance:       acmemsp.app.liongard.com

Environments
--------------------------------------------
Total:          150
Active:         142
Inactive:       8

Agents
--------------------------------------------
Total:          45
Online:         42
Offline:        3

Recent Detections (Last 24 Hours)
--------------------------------------------
Total:          12
Critical:       0
High:           2
Medium:         5
Low:            5

Status: HEALTHY
```

### Unhealthy Example

```
Liongard Health Check
=====================

Connection:     FAILED (401 Unauthorized)
Instance:       acmemsp.app.liongard.com

Error: Liongard rejected the access token.

Steps to resolve:
1. Open the Liongard connection in Conduit (https://conduit.wyre.ai/connect/liongard) and check the Access Key ID and Access Key Secret
2. Verify the token has not been deleted: sign in as the user who generated it and open Profile > Account Settings > Access Tokens
3. Confirm the connection's Instance Name matches your Liongard subdomain
```

### Degraded Example

```
Liongard Health Check
=====================

Connection:     OK (access token valid)
Instance:       acmemsp.app.liongard.com

Environments
--------------------------------------------
Total:          150
Active:         142
Inactive:       8

Agents
--------------------------------------------
Total:          45
Online:         38
Offline:        7   ** WARNING: 7 agents offline **

Recent Detections (Last 24 Hours)
--------------------------------------------
Total:          28
Critical:       3   ** ACTION REQUIRED **
High:           8
Medium:         10
Low:            7

Status: DEGRADED - 7 offline agents, 3 critical detections
```

## Error Handling

### Authentication Failed

```
Liongard Health Check: FAILED

Error: Authentication failed (401 Unauthorized)

Check the Liongard connection in Conduit (https://conduit.wyre.ai/connect/liongard):
- Instance Name: your Liongard subdomain
- Access Key ID and Access Key Secret: both halves of the access token

Generate a new token in Liongard under Profile > Account Settings > Access Tokens if needed.
```

### Connection Error

```
Liongard Health Check: FAILED

Error: Unable to connect to acmemsp.app.liongard.com

Possible causes:
- Invalid instance name
- Network connectivity issue
- Liongard service outage

Check https://status.liongard.com for service status.
```

### Rate Limited

```
Liongard Health Check: PARTIAL

Warning: Rate limited during health check. Partial results shown.

Connection:     OK
Environments:   150 total
Agents:         (rate limited - try again in 30s)
Detections:     (rate limited - try again in 30s)
```

## Related Commands

- `/liongard-environment-summary` - Detailed view of a specific environment
