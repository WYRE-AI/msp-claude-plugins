---
description: List active RMM alerts from Syncro
argument-hint: "[customer_id] [severity] [status] [asset_id] [limit]"
arguments: [customer_id, severity, status, asset_id, limit]
---

# List Syncro RMM Alerts

List active RMM alerts across all customers or filtered by criteria.

## Prerequisites

- Valid Syncro API key configured
- Syncro RMM enabled on your account
- User must have alert read permissions

## Steps

1. **Build filter query**
   - Parse all provided filter parameters
   - Map severity to API values
   - Map status to API values

2. **Fetch alerts**
   ```bash
   curl -s -X GET \
     "https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/rmm_alerts?api_key=${SYNCRO_API_KEY}&status=active&customer_id=${customer_id}&per_page=${limit}"
   ```

3. **Format and return results**
   - Display alert list with key details
   - Include severity indicators
   - Provide quick action links

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| customer_id | integer | No | - | Filter by customer ID |
| severity | string | No | - | Low, Medium, High, Critical |
| status | string | No | active | active, resolved, all |
| asset_id | integer | No | - | Filter by specific asset |
| limit | integer | No | 25 | Maximum results (1-100) |

## API Endpoints Used

```
GET /api/v1/rmm_alerts
GET /api/v1/rmm_alerts?customer_id={id}
GET /api/v1/rmm_alerts?asset_id={id}
```

## Examples

### All Active Alerts

```
/list-alerts
```

### Customer-Specific Alerts

```
/list-alerts --customer_id 12345
```

### Critical Alerts Only

```
/list-alerts --severity Critical
```

### High and Critical Alerts

```
/list-alerts --severity High
/list-alerts --severity Critical
```

### All Alerts (Including Resolved)

```
/list-alerts --status all
```

### Asset-Specific Alerts

```
/list-alerts --asset_id 67890
```

### Combined Filters

```
/list-alerts --customer_id 12345 --severity Critical --limit 50
```

## Output

### Alert List

```
Active RMM Alerts (15 total, showing 15)

| Sev | Alert | Asset | Customer | Age |
|-----|-------|-------|----------|-----|
| [!] CRIT | Disk Space < 5% | ACME-DC01 | Acme Corp | 2h |
| [!] CRIT | Service Stopped | ACME-DC02 | Acme Corp | 4h |
| [H] HIGH | High CPU Usage | SMITH-WS01 | Smith LLC | 1d |
| [H] HIGH | Memory > 90% | JONES-SRV | Jones Inc | 1d |
| [M] MED | Windows Updates | ACME-WS001 | Acme Corp | 3d |
| [M] MED | AV Out of Date | SMITH-LT01 | Smith LLC | 5d |
| [L] LOW | Uptime > 30 days | JONES-WS01 | Jones Inc | 7d |

Severity Legend:
  [!] CRIT = Critical - Immediate attention required
  [H] HIGH = High - Attention needed today
  [M] MED = Medium - Schedule for review
  [L] LOW = Low - Informational

Quick Actions:
- Resolve alert: /resolve-alert <alert_id>
- View customer: /get-customer <customer_id>
- View asset: /search-assets --asset_id <asset_id>
```

### Critical Alerts

```
Critical RMM Alerts (2 total)

| ID | Alert | Asset | Customer | Details | Age |
|----|-------|-------|----------|---------|-----|
| 9876 | Disk Space < 5% | ACME-DC01 | Acme Corp | C: 4.2GB free | 2h |
| 9875 | Service Stopped | ACME-DC02 | Acme Corp | SQL Server | 4h |

Immediate action recommended!

Resolve: /resolve-alert 9876 --resolution_note "Cleared temp files"
```

### Customer-Specific

```
RMM Alerts for Acme Corporation (5 total)

| Sev | Alert | Asset | Age | Status |
|-----|-------|-------|-----|--------|
| [!] CRIT | Disk Space < 5% | ACME-DC01 | 2h | Active |
| [!] CRIT | Service Stopped | ACME-DC02 | 4h | Active |
| [M] MED | Windows Updates | ACME-WS001 | 3d | Active |
| [L] LOW | Uptime > 30 days | ACME-DC01 | 7d | Active |
| [L] LOW | Uptime > 30 days | ACME-DC02 | 7d | Active |
```

### No Alerts Found

```
No active alerts found

Filters applied:
- Status: Active
- Severity: Critical

All systems operating normally, or try different filters:
/list-alerts --status all
/list-alerts --severity High
```

## Error Handling

### Invalid Customer ID

```
Error: Customer not found

Customer ID 99999 does not exist or you do not have access.

Suggestions:
- Verify the customer ID is correct
- Use /get-customer --query "name" to find the ID
```

### Invalid Severity

```
Error: Invalid severity value

"Urgent" is not a valid severity.

Valid severities:
- Critical
- High
- Medium
- Low
```

### Invalid Status

```
Error: Invalid status value

"pending" is not a valid status.

Valid statuses:
- active (default)
- resolved
- all
```

### Permission Denied

```
Error: Permission denied (403)

You do not have permission to view RMM alerts.

Contact your Syncro administrator if you need access.
```

### RMM Not Enabled

```
Error: RMM not enabled

Your Syncro account does not have RMM features enabled.

Contact Syncro support to enable RMM functionality.
```

### Rate Limiting

```
Rate limited by Syncro API (180 req/min)

Retrying in 5 seconds...
```

## Severity Reference

| Severity | Description | Action |
|----------|-------------|--------|
| Critical | System down or imminent failure | Immediate response |
| High | Significant issue affecting operations | Same-day response |
| Medium | Issue requiring attention | Scheduled response |
| Low | Informational or minor issue | Review when available |

## Tips

### Morning Alert Review

Start the day with critical alerts:

```
/list-alerts --severity Critical
```

### Customer Check Before Call

Review alerts before a support call:

```
/list-alerts --customer_id 12345
```

### Aging Alerts

Find alerts that have been open too long:

```
/list-alerts --status active --limit 100
```

### Proactive Monitoring

Regular review of all severity levels:

```
/list-alerts --severity Critical
/list-alerts --severity High
```

## Related Commands

- `/resolve-alert` - Resolve an RMM alert
- `/get-customer` - Get customer details
- `/search-assets` - Search for assets
- `/create-ticket` - Create a ticket from an alert
