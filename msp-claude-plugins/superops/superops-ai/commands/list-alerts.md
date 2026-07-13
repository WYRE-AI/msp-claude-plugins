---
description: List active RMM alerts across all clients or filtered by criteria
argument-hint: "[client_id] [severity] [status] [asset_id] [limit]"
arguments: [client_id, severity, status, asset_id, limit]
---

# List SuperOps.ai RMM Alerts

List active RMM alerts across all clients or filtered by specific criteria.

## Prerequisites

- Valid SuperOps.ai API token configured
- User must have alert viewing permissions
- RMM module enabled in SuperOps.ai

## Steps

1. **Build filter criteria**
   - Resolve client ID if client name provided
   - Map severity string to API enum
   - Map status string to API enum (default: active)
   - Validate asset exists if asset_id provided

2. **Query alerts**
   ```graphql
   query getAlertList($input: ListInfoInput!) {
     getAlertList(input: $input) {
       alerts {
         alertId
         message
         severity
         status
         type
         createdTime
         acknowledgedTime
         asset {
           assetId
           name
           status
         }
         client {
           accountId
           name
         }
         site {
           id
           name
         }
         acknowledgedBy {
           id
           name
         }
         ticket {
           ticketId
           ticketNumber
         }
       }
       listInfo {
         totalCount
         hasNextPage
         endCursor
       }
     }
   }
   ```

   Variables:
   ```json
   {
     "input": {
       "first": 25,
       "filter": {
         "status": "Active",
         "severity": ["Critical", "High"],
         "client": { "accountId": "client-uuid" }
       },
       "orderBy": {
         "field": "createdTime",
         "direction": "DESC"
       }
     }
   }
   ```

3. **Apply pagination**
   - Default limit: 25
   - Maximum limit: 100
   - Show pagination info for additional results

4. **Format and display results**
   - Group by severity
   - Show alert age
   - Include linked ticket info

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client_id | string | No | - | Filter by client ID or name |
| severity | string | No | - | Low, Medium, High, Critical |
| status | string | No | active | active, acknowledged, resolved |
| asset_id | string | No | - | Filter by specific asset |
| limit | integer | No | 25 | Max results (1-100) |

## Alert Severity Levels

| Severity | Description | Typical Response |
|----------|-------------|------------------|
| **Critical** | Immediate attention required | Respond within 15 minutes |
| **High** | Significant issue | Respond within 1 hour |
| **Medium** | Moderate concern | Respond within 4 hours |
| **Low** | Informational | Review during business hours |

## Alert Status Values

| Status | Description |
|--------|-------------|
| **Active** | Alert triggered and unaddressed |
| **Acknowledged** | Alert seen, being worked |
| **Resolved** | Issue fixed, alert closed |

## Examples

### List All Active Alerts

```
/list-alerts
```

### List Critical and High Severity

```
/list-alerts --severity Critical
/list-alerts --severity High
```

### Filter by Client

```
/list-alerts --client_id client_123
/list-alerts --client_id "Acme Corporation"
```

### Filter by Status

```
/list-alerts --status active
/list-alerts --status acknowledged
```

### Combined Filters

```
/list-alerts --client_id client_123 --severity Critical --status active
```

### Increase Result Limit

```
/list-alerts --limit 50
```

### Filter by Asset

```
/list-alerts --asset_id asset_456
```

## Output

### Default Output (Active Alerts)

```
Active Alerts (showing 12 of 47)

CRITICAL (3)
------------
  [2m ago]  ACME-DC01         Disk Space Critical: C: drive at 5% free
            Acme Corporation  Type: Disk Space | Asset: Online

  [15m ago] TECH-SQL01        Service Stopped: MSSQLSERVER
            Tech Solutions    Type: Service | Asset: Online

  [1h ago]  ABC-FILE01        CPU Usage: 98% for 30 minutes
            ABC Industries    Type: Performance | Asset: Online

HIGH (5)
--------
  [30m ago] ACME-WS001        Security: Failed login attempts (15)
            Acme Corporation  Type: Security | Asset: Online

  [45m ago] ACME-WS002        Antivirus: Definitions outdated (7 days)
            Acme Corporation  Type: Security | Asset: Online

  [2h ago]  TECH-WS005        Patch Status: 3 critical updates pending
            Tech Solutions    Type: Patch | Asset: Online

  ... 2 more

MEDIUM (4)
----------
  [3h ago]  ABC-LAPTOP01      Battery Health: Degraded (65%)
            ABC Industries    Type: Hardware | Asset: Offline

  ... 3 more

Summary:
  Total Active: 47 | Critical: 8 | High: 15 | Medium: 18 | Low: 6

Use --limit 100 to see more results
```

### Client-Filtered Output

```
Active Alerts for Acme Corporation (showing 8 of 8)

CRITICAL (1)
------------
  [2m ago]  ACME-DC01         Disk Space Critical: C: drive at 5% free
            Type: Disk Space  Asset: Online
            Linked Ticket: TICK-12345

HIGH (3)
--------
  [30m ago] ACME-WS001        Security: Failed login attempts (15)
  [45m ago] ACME-WS002        Antivirus: Definitions outdated (7 days)
  [2h ago]  ACME-DC02         Memory Usage: 95% sustained

MEDIUM (2)
----------
  [4h ago]  ACME-LAPTOP03     Disk Health: SMART warning
  [6h ago]  ACME-WS003        Pending Reboot: 14 days

LOW (2)
-------
  [1d ago]  ACME-WS004        Windows Update: Optional updates available
  [2d ago]  ACME-WS005        Uptime: 45 days since last reboot

Summary:
  Total Active: 8 | Acknowledged: 3 | Last 24h: 4 new alerts
```

## curl Example

```bash
curl -X POST 'https://yourcompany.superops.ai/graphql' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "query getAlertList($input: ListInfoInput!) { getAlertList(input: $input) { alerts { alertId message severity status type createdTime asset { assetId name status } client { accountId name } } listInfo { totalCount hasNextPage } } }",
    "variables": {
      "input": {
        "first": 25,
        "filter": {
          "status": "Active",
          "severity": ["Critical", "High"]
        },
        "orderBy": {
          "field": "createdTime",
          "direction": "DESC"
        }
      }
    }
  }'
```

## Error Handling

### Client Not Found

```
Client not found: "Acme"

Did you mean one of these?
- Acme Corporation (ID: client_123)
- Acme Industries (ID: client_456)
```

### Invalid Severity

```
Invalid severity: "Urgent"

Valid severity values:
- Critical
- High
- Medium
- Low
```

### No Alerts Match

```
No alerts found matching criteria:
- Status: active
- Severity: Critical
- Client: Acme Corporation

This is good news! No critical active alerts for this client.

Try broadening your search:
/list-alerts --client_id client_123 --severity High
/list-alerts --client_id client_123 --status acknowledged
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid client ID | Verify client exists |
| Invalid severity | Use: Critical, High, Medium, Low |
| Invalid status | Use: active, acknowledged, resolved |
| Permission denied | Check user permissions |
| Rate limited | Wait and retry (800 req/min limit) |

## Best Practices

1. **Check critical alerts first** - Use `--severity Critical` for urgent triage
2. **Acknowledge promptly** - Use `/acknowledge-alert` to show you're working on it
3. **Filter by client** - Focus on specific client issues
4. **Review acknowledged alerts** - Don't let them sit indefinitely
5. **Create tickets for tracking** - Use `/create-ticket` for complex issues

## Related Commands

- `/acknowledge-alert` - Acknowledge an alert
- `/resolve-alert` - Resolve an alert
- `/create-ticket` - Create ticket from alert
- `/get-asset` - View asset details
- `/run-script` - Run remediation script
