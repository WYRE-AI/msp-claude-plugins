---
description: Check Liongard connectivity and return system health summary
argument-hint: ""
arguments: []
---

# Liongard Health Check

Check Liongard API connectivity and return an overall system health summary including environment count, agent status, and recent detections.

## Prerequisites

- Valid Liongard API key configured
- Liongard instance name configured
- User must have read permissions

## Steps

1. **Verify API connectivity**
   - Call the environments count endpoint to confirm the API key is valid
   ```bash
   curl -s "https://${LIONGARD_INSTANCE}.app.liongard.com/api/v1/environments/count" \
     -H "X-ROAR-API-KEY: ${LIONGARD_API_KEY}" \
     -H "Content-Type: application/json"
   ```

2. **Get environment summary**
   - Retrieve total environment count
   - Count active vs inactive environments
   ```bash
   curl -s "https://${LIONGARD_INSTANCE}.app.liongard.com/api/v1/environments?page=1&pageSize=2000" \
     -H "X-ROAR-API-KEY: ${LIONGARD_API_KEY}" \
     -H "Content-Type: application/json"
   ```

3. **Get agent status summary**
   - List all agents and summarize online/offline counts
   ```bash
   curl -s "https://${LIONGARD_INSTANCE}.app.liongard.com/api/v1/agents?page=1&pageSize=2000" \
     -H "X-ROAR-API-KEY: ${LIONGARD_API_KEY}" \
     -H "Content-Type: application/json"
   ```

4. **Get recent detections count**
   - Query detections from the last 24 hours
   ```bash
   curl -s -X POST "https://${LIONGARD_INSTANCE}.app.liongard.com/api/v1/detections" \
     -H "X-ROAR-API-KEY: ${LIONGARD_API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "Pagination": {"Page": 1, "PageSize": 1},
       "conditions": [
         {"path": "DetectedOn", "op": "gte", "value": "<24h_ago_iso>"},
         {"path": "Status", "op": "eq", "value": "New"}
       ]
     }'
   ```

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

Connection:     OK (API key valid)
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

Error: Invalid API key. Please verify LIONGARD_API_KEY is correct.

Steps to resolve:
1. Check that LIONGARD_API_KEY is set correctly
2. Verify the key has not been revoked in Liongard Settings > Access Keys
3. Confirm LIONGARD_INSTANCE matches your Liongard subdomain
```

### Degraded Example

```
Liongard Health Check
=====================

Connection:     OK (API key valid)
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

Please verify your Liongard credentials:
- LIONGARD_INSTANCE: Your instance subdomain
- LIONGARD_API_KEY: Your API key

Obtain credentials from Liongard Settings > Access Keys.
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
