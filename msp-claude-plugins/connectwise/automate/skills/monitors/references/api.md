# Monitor API Endpoint Catalog

### List All Monitor Templates

```http
GET /cwa/api/v1/Monitors/Templates?pageSize=100
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "TemplateID": 1,
    "Name": "CPU Usage - High",
    "Category": "Performance",
    "MonitorType": "Agent",
    "CheckInterval": 300,
    "AlertSeverity": 3,
    "Description": "Alerts when CPU usage exceeds 90% for 10 minutes",
    "Thresholds": [
      {
        "Field": "CPUUsage",
        "Operator": "gt",
        "Value": "90",
        "Duration": 10
      }
    ]
  }
]
```

### Get Monitor Template Details

```http
GET /cwa/api/v1/Monitors/Templates/{templateID}
Authorization: Bearer {token}
```

### List Monitors for Computer

```http
GET /cwa/api/v1/Computers/{computerID}/Monitors
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "MonitorID": 5001,
    "Name": "Disk C: Free Space",
    "MonitorType": "Agent",
    "Status": "OK",
    "LastCheck": "2024-02-15T10:30:00Z",
    "CurrentValue": "45%",
    "AlertSeverity": 2,
    "Enabled": true
  }
]
```

### Get Monitor Status for Computer

```http
GET /cwa/api/v1/Computers/{computerID}/Monitors/{monitorID}/Status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "MonitorID": 5001,
  "ComputerID": 12345,
  "Status": "Warning",
  "LastCheck": "2024-02-15T10:30:00Z",
  "ConsecutiveFailures": 2,
  "CurrentValue": "8%",
  "Message": "Disk C: is 8% free (threshold: 10%)"
}
```

### Create Monitor from Template

```http
POST /cwa/api/v1/Computers/{computerID}/Monitors
Authorization: Bearer {token}
Content-Type: application/json

{
  "TemplateID": 1,
  "Name": "CPU Usage - Custom",
  "Thresholds": [
    {
      "Field": "CPUUsage",
      "Operator": "gt",
      "Value": "85",
      "Duration": 15
    }
  ]
}
```

### Create Custom Monitor

```http
POST /cwa/api/v1/Monitors
Authorization: Bearer {token}
Content-Type: application/json

{
  "Name": "Custom Service Monitor",
  "MonitorType": "Agent",
  "Category": "Service",
  "CheckInterval": 300,
  "FailAfter": 2,
  "ResetAfter": 1,
  "AlertSeverity": 3,
  "Thresholds": [
    {
      "Field": "ServiceStatus",
      "Operator": "ne",
      "Value": "Running"
    }
  ],
  "AssignmentType": "Group",
  "TargetID": 10
}
```

### Update Monitor Threshold

```http
PATCH /cwa/api/v1/Monitors/{monitorID}
Authorization: Bearer {token}
Content-Type: application/json

{
  "Thresholds": [
    {
      "Field": "DiskFreePercent",
      "Operator": "lt",
      "Value": "15",
      "Duration": 0
    }
  ]
}
```

### Assign Template to Group

```http
POST /cwa/api/v1/Groups/{groupID}/Monitors
Authorization: Bearer {token}
Content-Type: application/json

{
  "TemplateID": 1
}
```

### Disable Monitor

```http
PATCH /cwa/api/v1/Monitors/{monitorID}
Authorization: Bearer {token}
Content-Type: application/json

{
  "Enabled": false
}
```

### Delete Monitor

```http
DELETE /cwa/api/v1/Monitors/{monitorID}
Authorization: Bearer {token}
```

### List All Active Monitors with Status

```http
GET /cwa/api/v1/Monitors/Status?condition=Status ne 'OK'&pageSize=100
Authorization: Bearer {token}
```
