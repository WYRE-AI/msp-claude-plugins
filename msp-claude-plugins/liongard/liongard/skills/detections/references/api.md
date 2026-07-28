# Liongard Detections, Alerts, Metrics & Timeline API Reference

Complete endpoint catalog with request and response shapes. All requests
require the `X-ROAR-API-KEY` header.

## Detections

### Query Detections (v1)

```http
POST /api/v1/detections
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Pagination": {
    "Page": 1,
    "PageSize": 100
  },
  "conditions": [
    {
      "path": "EnvironmentID",
      "op": "eq",
      "value": 1234
    },
    {
      "path": "Severity",
      "op": "in",
      "value": ["Critical", "High"]
    },
    {
      "path": "Status",
      "op": "eq",
      "value": "New"
    }
  ],
  "orderBy": [
    {
      "path": "DetectedOn",
      "direction": "desc"
    }
  ]
}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 80001,
      "Type": "Changed",
      "Severity": "High",
      "SystemID": 10001,
      "SystemName": "DC01.acme.local",
      "EnvironmentID": 1234,
      "EnvironmentName": "Acme Corporation",
      "InspectorName": "Active Directory",
      "Status": "New",
      "Summary": "Password policy minimum length changed from 12 to 8",
      "Details": {
        "Before": {
          "PasswordPolicy.MinimumLength": 12
        },
        "After": {
          "PasswordPolicy.MinimumLength": 8
        }
      },
      "DetectedOn": "2024-02-15T02:15:00Z"
    }
  ],
  "TotalRows": 15,
  "HasMoreRows": false,
  "CurrentPage": 1,
  "TotalPages": 1,
  "PageSize": 100
}
```

### Query Detections (v2)

The v2 endpoint provides enhanced filtering and field selection:

```http
POST /api/v2/detections
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Pagination": {
    "Page": 1,
    "PageSize": 100
  },
  "conditions": [
    {
      "path": "DetectedOn",
      "op": "gte",
      "value": "2024-02-01T00:00:00Z"
    },
    {
      "path": "Severity",
      "op": "eq",
      "value": "Critical"
    }
  ],
  "fields": ["ID", "Type", "Severity", "SystemName", "EnvironmentName", "Summary", "DetectedOn"],
  "orderBy": [
    {
      "path": "DetectedOn",
      "direction": "desc"
    }
  ]
}
```

## Alerts

### List Alert Rules

```http
GET /api/v1/alerts?page=1&pageSize=50
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 2001,
      "Name": "Critical Security Changes",
      "Description": "Alert on critical severity detections across all environments",
      "Enabled": true,
      "Conditions": {
        "Severity": ["Critical"],
        "Type": ["Changed", "Removed"]
      },
      "Notifications": {
        "Email": ["security@msp.com"],
        "Webhook": "https://hooks.slack.com/services/..."
      },
      "CreatedOn": "2023-01-01T00:00:00Z"
    }
  ],
  "TotalRows": 10,
  "HasMoreRows": false,
  "CurrentPage": 1,
  "TotalPages": 1,
  "PageSize": 50
}
```

### Get Alert by ID

```http
GET /api/v1/alerts/{alertId}
X-ROAR-API-KEY: {api_key}
```

### Create Alert Rule

```http
POST /api/v1/alerts
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Name": "MFA Disabled Alert",
  "Description": "Alert when MFA is disabled in any M365 tenant",
  "Enabled": true,
  "Conditions": {
    "InspectorName": ["Microsoft 365"],
    "Severity": ["Critical", "High"],
    "Summary": "MFA"
  },
  "Notifications": {
    "Email": ["alerts@msp.com"]
  }
}
```

### Update Alert Rule

```http
PUT /api/v1/alerts/{alertId}
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Enabled": false
}
```

### Delete Alert Rule

```http
DELETE /api/v1/alerts/{alertId}
X-ROAR-API-KEY: {api_key}
```

### List Triggered Alerts

```http
GET /api/v1/alerts/triggered?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 50001,
      "AlertRuleID": 2001,
      "AlertRuleName": "Critical Security Changes",
      "DetectionID": 80001,
      "EnvironmentName": "Acme Corporation",
      "SystemName": "DC01.acme.local",
      "Summary": "Password policy minimum length changed from 12 to 8",
      "TriggeredOn": "2024-02-15T02:15:30Z",
      "Status": "New"
    }
  ],
  "TotalRows": 5,
  "HasMoreRows": false,
  "CurrentPage": 1,
  "TotalPages": 1,
  "PageSize": 100
}
```

## Metrics

### List Metrics

```http
GET /api/v1/metrics?page=1&pageSize=50
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 3001,
      "Name": "Password Policy Compliance",
      "Description": "Checks if password minimum length is >= 12",
      "InspectorID": 100,
      "Expression": "Data.PasswordPolicy.MinimumLength",
      "Threshold": 12,
      "Operator": "gte",
      "CreatedOn": "2023-01-15T00:00:00Z"
    }
  ]
}
```

### Create Metric

```http
POST /api/v1/metrics
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Name": "MFA Enabled Check",
  "Description": "Verifies MFA is enabled in M365 tenants",
  "InspectorID": 101,
  "Expression": "Data.SecurityDefaults.MFAEnabled",
  "Threshold": true,
  "Operator": "eq"
}
```

### Evaluate Metrics (v2)

Evaluate a metric across all applicable systems:

```http
POST /api/v2/metrics/evaluate
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "MetricID": 3001,
  "Pagination": {
    "Page": 1,
    "PageSize": 100
  }
}
```

**Response:**
```json
{
  "Data": [
    {
      "SystemID": 10001,
      "SystemName": "DC01.acme.local",
      "EnvironmentID": 1234,
      "EnvironmentName": "Acme Corporation",
      "Value": 12,
      "Compliant": true,
      "EvaluatedOn": "2024-02-15T02:15:00Z"
    },
    {
      "SystemID": 10002,
      "SystemName": "DC01.newco.local",
      "EnvironmentID": 5678,
      "EnvironmentName": "New Company Inc",
      "Value": 8,
      "Compliant": false,
      "EvaluatedOn": "2024-02-15T03:00:00Z"
    }
  ],
  "TotalRows": 50,
  "HasMoreRows": false,
  "CurrentPage": 1,
  "TotalPages": 1,
  "PageSize": 100
}
```

### Evaluate Metrics Per System (v2)

Evaluate all metrics for specific systems:

```http
POST /api/v2/metrics/evaluate-systems
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "SystemIDs": [10001, 10002],
  "Pagination": {
    "Page": 1,
    "PageSize": 100
  }
}
```

**Response:**
```json
{
  "Data": [
    {
      "SystemID": 10001,
      "MetricID": 3001,
      "MetricName": "Password Policy Compliance",
      "Value": 12,
      "Compliant": true
    },
    {
      "SystemID": 10001,
      "MetricID": 3002,
      "MetricName": "MFA Enabled Check",
      "Value": true,
      "Compliant": true
    }
  ]
}
```

### Update Metric

```http
PUT /api/v1/metrics/{metricId}
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Threshold": 14,
  "Description": "Updated: Checks if password minimum length is >= 14"
}
```

### Delete Metric

```http
DELETE /api/v1/metrics/{metricId}
X-ROAR-API-KEY: {api_key}
```

## Timeline

### Query Timeline (v1)

```http
GET /api/v1/timeline?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

### Query Timeline (v2)

The v2 endpoint supports POST-based filtering:

```http
POST /api/v2/timelines-query
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Pagination": {
    "Page": 1,
    "PageSize": 100
  },
  "conditions": [
    {
      "path": "EnvironmentID",
      "op": "eq",
      "value": 1234
    },
    {
      "path": "EventDate",
      "op": "gte",
      "value": "2024-02-01T00:00:00Z"
    }
  ],
  "orderBy": [
    {
      "path": "EventDate",
      "direction": "desc"
    }
  ]
}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 900001,
      "EventType": "InspectionCompleted",
      "EnvironmentID": 1234,
      "EnvironmentName": "Acme Corporation",
      "SystemID": 10001,
      "SystemName": "DC01.acme.local",
      "Description": "Active Directory inspection completed successfully",
      "EventDate": "2024-02-15T02:15:00Z",
      "UserID": null
    },
    {
      "ID": 900002,
      "EventType": "DetectionCreated",
      "EnvironmentID": 1234,
      "EnvironmentName": "Acme Corporation",
      "SystemID": 10001,
      "SystemName": "DC01.acme.local",
      "Description": "Password policy minimum length changed",
      "EventDate": "2024-02-15T02:15:30Z",
      "UserID": null
    },
    {
      "ID": 900003,
      "EventType": "UserAction",
      "EnvironmentID": null,
      "Description": "User admin@msp.com acknowledged detection #80001",
      "EventDate": "2024-02-15T09:00:00Z",
      "UserID": 1
    }
  ],
  "TotalRows": 500,
  "HasMoreRows": true,
  "CurrentPage": 1,
  "TotalPages": 5,
  "PageSize": 100
}
```
