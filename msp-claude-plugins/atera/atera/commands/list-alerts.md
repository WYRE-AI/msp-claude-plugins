---
description: List active RMM alerts from Atera
argument-hint: "[customer_id] [severity] [alert_category] [since] [limit]"
arguments: [customer_id, severity, alert_category, since, limit]
---

# List Atera Alerts

List active RMM alerts with filtering by customer, severity, and alert category.

## Prerequisites

- Valid Atera API key configured
- User must have alert read permissions

## Steps

1. **Build query parameters**
   - Set default time range to last 24 hours if not specified
   - Set default limit to 50 if not specified
   - Build filter string for customer, severity, category

2. **Fetch alerts**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/alerts" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```

   With customer filter:
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/alerts?customerId={customer_id}" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```

3. **Apply filters**
   - Filter by severity if specified
   - Filter by alert category if specified
   - Filter by date if since parameter provided
   - Limit results to specified count

4. **Sort and format results**
   - Sort by created date (newest first)
   - Group by severity for visibility
   - Include agent/device information

5. **Return alert list**
   - Alert ID and title
   - Severity and category
   - Device/agent name
   - Customer name
   - Created timestamp

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| customer_id | integer | No | - | Filter by customer ID |
| severity | string | No | - | Information, Warning, Critical |
| alert_category | string | No | - | Hardware, Disk, Availability, Performance, General |
| since | datetime | No | 24 hours | Alerts since this date |
| limit | integer | No | 50 | Maximum results (max 500) |

## Examples

### List All Recent Alerts

```
/list-alerts
```

### Filter by Customer

```
/list-alerts --customer_id 12345
```

### Filter by Severity

```
/list-alerts --severity Critical
```

### Filter by Category

```
/list-alerts --alert_category Disk
```

### Combined Filters

```
/list-alerts --customer_id 12345 --severity Critical
```

### Custom Time Range

```
/list-alerts --since "2026-02-01"
```

### Increase Limit

```
/list-alerts --severity Warning --limit 100
```

## Output

```
Active Alerts: 23

Critical (5):
| ID    | Alert                          | Device           | Customer        | Created             |
|-------|--------------------------------|------------------|-----------------|---------------------|
| 98765 | Disk Space Critical (<5%)      | SERVER-DC01      | Acme Corp       | 2026-02-04 09:15:00 |
| 98766 | Service Stopped: SQL Server    | SERVER-SQL01     | Acme Corp       | 2026-02-04 08:45:00 |
| 98767 | CPU Usage >95% for 30 min      | WORKSTATION-01   | Beta Inc        | 2026-02-04 08:30:00 |
...

Warning (12):
| ID    | Alert                          | Device           | Customer        | Created             |
|-------|--------------------------------|------------------|-----------------|---------------------|
| 98770 | Disk Space Warning (<15%)      | LAPTOP-JD01      | Acme Corp       | 2026-02-04 07:00:00 |
| 98771 | Backup Failed                  | SERVER-BK01      | Gamma LLC       | 2026-02-04 06:30:00 |
...

Information (6):
| ID    | Alert                          | Device           | Customer        | Created             |
|-------|--------------------------------|------------------|-----------------|---------------------|
| 98780 | Windows Update Available       | DESKTOP-ABC123   | Acme Corp       | 2026-02-04 05:00:00 |
...

Summary: 5 Critical | 12 Warning | 6 Information
```

## Error Handling

### Customer Not Found

```
Customer not found: 12345

Please verify the customer ID and try again.
Use /search-customers to find valid customer IDs.
```

### Invalid Severity

```
Invalid severity: "High"

Valid severities: Information, Warning, Critical
```

### Invalid Category

```
Invalid alert category: "Network"

Valid categories: Hardware, Disk, Availability, Performance, General
```

### No Alerts Found

```
No alerts found matching your criteria

Filters applied:
- Customer: Acme Corp (12345)
- Severity: Critical
- Since: 2026-02-01

Try broadening your search criteria.
```

### Rate Limit Exceeded

```
Rate limit exceeded (700 req/min)

Waiting 30 seconds before retry...
```

## API Patterns

### Get All Alerts (Paginated)
```http
GET /api/v3/alerts?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

### Get Alerts by Customer
```http
GET /api/v3/alerts?customerId={customerId}
X-API-KEY: {api_key}
```

### Response Structure
```json
{
  "Page": 1,
  "ItemsInPage": 50,
  "TotalPages": 3,
  "TotalItemsCount": 125,
  "items": [
    {
      "AlertID": 98765,
      "Title": "Disk Space Critical",
      "Severity": "Critical",
      "AlertCategoryID": "Disk",
      "DeviceName": "SERVER-DC01",
      "CustomerName": "Acme Corp",
      "Created": "2026-02-04T09:15:00Z"
    }
  ]
}
```

## Related Commands

- `/resolve-alert` - Resolve an alert
- `/search-agents` - Search for RMM agents
- `/create-ticket` - Create a ticket from an alert
