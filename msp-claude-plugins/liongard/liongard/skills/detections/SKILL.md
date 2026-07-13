---
name: "Liongard Detections"
description: >
  Use this skill when working with Liongard detections, change monitoring,
  alerts, metrics, or timeline events. Covers automated change detection,
  anomaly alerts, alert rules, custom metrics, metric evaluation, and
  timeline audit trails for compliance and monitoring workflows.
when_to_use: >-
  When working with Liongard detections, change monitoring, alerts, metrics, or timeline events.
  Use when: liongard detection, liongard change, liongard alert, liongard metric, liongard
  timeline, change monitoring liongard, liongard anomaly, liongard compliance, or liongard audit.
---

# Liongard Change Detection & Alerts

## Overview

Detections are Liongard's automated change and anomaly detection system. Every time an inspection runs, Liongard compares the new data with previous inspection results and identifies changes. These changes become detections that MSPs can monitor, investigate, and act upon.

The detection ecosystem includes:

- **Detections** - Automated change/anomaly alerts from inspection comparisons
- **Alerts** - Configurable rules that trigger notifications based on detection criteria
- **Metrics** - Custom measurements tracked across systems and environments
- **Timeline** - Comprehensive audit trail of all platform events

## Detections

### What Are Detections?

Detections represent specific changes identified between inspection runs. When Liongard inspects a system and finds that something has changed since the previous inspection, it creates a detection record. Examples include:

- A new user account was created in Active Directory
- A firewall rule was modified on a SonicWall
- An MFA policy was disabled in Microsoft 365
- A backup job failed on a Datto appliance
- A new device joined the network on Meraki
- A certificate is expiring within 30 days

### Detection Fields

| Field | Type | Description |
|-------|------|-------------|
| `ID` | int | Unique detection identifier |
| `Type` | string | Detection type (Added, Removed, Changed, Threshold) |
| `Severity` | string | Critical, High, Medium, Low, Info |
| `SystemID` | int | System where detection occurred |
| `SystemName` | string | System display name |
| `EnvironmentID` | int | Parent environment |
| `EnvironmentName` | string | Environment display name |
| `InspectorName` | string | Inspector that triggered detection |
| `Status` | string | New, Acknowledged, Resolved, Dismissed |
| `Summary` | string | Brief description of the change |
| `Details` | object | Detailed before/after data |
| `DetectedOn` | datetime | When the change was detected |
| `AcknowledgedOn` | datetime | When acknowledged by user |
| `ResolvedOn` | datetime | When marked resolved |

### Detection Types

| Type | Description | Example |
|------|-------------|---------|
| `Added` | New item discovered | New user account created |
| `Removed` | Item no longer present | Device removed from network |
| `Changed` | Existing item modified | Firewall rule updated |
| `Threshold` | Value crossed a defined threshold | Disk usage exceeded 90% |

### Detection Severity Levels

| Severity | Description | Typical Use |
|----------|-------------|-------------|
| `Critical` | Immediate action required | Security policy disabled, admin account compromised |
| `High` | Urgent attention needed | MFA disabled, backup failure |
| `Medium` | Review within business hours | Configuration change, new admin user |
| `Low` | Informational but notable | New standard user, minor setting change |
| `Info` | Routine change logged | Regular updates, expected modifications |

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

### Detection Status Transitions

```
New ───────────────────> Dismissed
  |                          |
  v                          v
Acknowledged ──────> Resolved
```

**Status Descriptions:**
- **New** - Freshly detected, awaiting review
- **Acknowledged** - Reviewed by an MSP technician
- **Resolved** - Change has been addressed or accepted
- **Dismissed** - Change is expected or irrelevant

## Alerts

### What Are Alerts?

Alerts are configurable rules that define what types of detections should trigger notifications. Alert rules specify:

- Which environments to monitor
- What detection types and severities to watch for
- What notification channels to use (email, webhook, etc.)
- What conditions must be met

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

### What Are Metrics?

Metrics allow MSPs to define custom measurements that are tracked across systems and environments. Metrics can evaluate specific data points from system details and aggregate results for compliance reporting, health monitoring, and trend analysis.

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

### What Is the Timeline?

The timeline provides a comprehensive audit trail of all events within Liongard. It captures inspection runs, detection triggers, user actions, configuration changes, and system events.

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

### Timeline Event Types

| Event Type | Description |
|------------|-------------|
| `InspectionQueued` | Inspection was scheduled to run |
| `InspectionStarted` | Inspection began executing |
| `InspectionCompleted` | Inspection finished successfully |
| `InspectionFailed` | Inspection encountered an error |
| `DetectionCreated` | New detection was identified |
| `DetectionAcknowledged` | Detection was acknowledged by user |
| `DetectionResolved` | Detection was marked resolved |
| `AlertTriggered` | Alert rule fired a notification |
| `UserAction` | User performed an action in the platform |
| `EnvironmentCreated` | New environment was added |
| `LaunchpointCreated` | New launchpoint was configured |
| `AgentOnline` | Agent came online |
| `AgentOffline` | Agent went offline |

## Common Workflows

### Monitoring for Changes

1. **Query recent detections** - Filter for New status and Critical/High severity
2. **Review changes** - Examine before/after details for each detection
3. **Investigate context** - Check timeline for related events
4. **Take action** - Acknowledge, resolve, or escalate as needed
5. **Document decisions** - Update detection status with resolution notes

### Setting Up Alert Rules

1. **Identify critical changes** - Determine what changes need immediate attention
2. **Create alert rules** - Configure conditions (severity, inspector, type)
3. **Set notification channels** - Email, webhook, or integration targets
4. **Test alerts** - Verify notifications fire correctly
5. **Review and tune** - Adjust thresholds to reduce noise

### Compliance Auditing

1. **Define compliance metrics** - Create metrics for each compliance requirement
2. **Evaluate across environments** - Run metric evaluations
3. **Identify non-compliant systems** - Filter for Compliant=false
4. **Generate reports** - Export metric results for audit documentation
5. **Track remediation** - Re-evaluate after fixes are applied
6. **Maintain audit trail** - Use timeline for evidence of monitoring

### Detection Management Workflow

```javascript
async function processNewDetections(environmentId) {
  // Fetch new detections for the environment
  const response = await fetch(
    `https://${instance}.app.liongard.com/api/v1/detections`,
    {
      method: 'POST',
      headers: {
        'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Pagination: { Page: 1, PageSize: 100 },
        conditions: [
          { path: 'EnvironmentID', op: 'eq', value: environmentId },
          { path: 'Status', op: 'eq', value: 'New' }
        ],
        orderBy: [{ path: 'Severity', direction: 'asc' }]
      })
    }
  );

  const data = await response.json();

  // Categorize by severity
  const critical = data.Data.filter(d => d.Severity === 'Critical');
  const high = data.Data.filter(d => d.Severity === 'High');
  const medium = data.Data.filter(d => d.Severity === 'Medium');
  const low = data.Data.filter(d => d.Severity === 'Low');

  return {
    total: data.TotalRows,
    critical: critical.length,
    high: high.length,
    medium: medium.length,
    low: low.length,
    detections: data.Data
  };
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid filter conditions | Check condition syntax |
| 401 | Unauthorized | Verify API key |
| 404 | Detection not found | Confirm detection ID |
| 404 | Alert rule not found | Confirm alert ID |
| 422 | Invalid metric expression | Check JMESPath syntax |
| 429 | Rate limited | Wait and retry (300 req/min) |

### Metric Evaluation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Expression error | Invalid JMESPath in metric | Fix the metric expression |
| No data | System has no detail data | Run an inspection first |
| Type mismatch | Threshold type doesn't match value | Align threshold with data type |

## Best Practices

### Detection Management

1. **Review critical detections daily** - Don't let high-severity items pile up
2. **Acknowledge promptly** - Show clients you're monitoring their environment
3. **Document resolutions** - Record why changes were accepted or rejected
4. **Dismiss noise** - Mark expected changes to reduce alert fatigue
5. **Trend analysis** - Track detection volumes over time

### Alert Configuration

1. **Start conservative** - Begin with Critical/High only to avoid alert fatigue
2. **Use specific conditions** - Target specific inspectors and change types
3. **Set up escalation** - Different channels for different severities
4. **Review regularly** - Tune alert rules based on false positive rates
5. **Test notification channels** - Verify webhooks and emails work

### Metric Design

1. **Align with standards** - Map metrics to CIS benchmarks or client SLAs
2. **Use clear naming** - Make metric names self-documenting
3. **Set reasonable thresholds** - Avoid overly strict thresholds that create noise
4. **Evaluate periodically** - Run evaluations on a regular schedule
5. **Track trends** - Monitor compliance percentages over time

## Data Relationships

```
Detection (DetectionID)
    |
    +-- System (SystemID)
    +-- Environment (EnvironmentID)
    +-- Inspector (InspectorName)
    +-- Severity / Type / Status
    +-- Before/After Details

Alert Rule (AlertID)
    |
    +-- Conditions (Severity, Type, Inspector)
    +-- Notifications (Email, Webhook)
    +-- Triggered Alerts
            +-- Detection (DetectionID)

Metric (MetricID)
    |
    +-- Inspector (InspectorID)
    +-- Expression (JMESPath)
    +-- Threshold / Operator
    +-- Evaluations
            +-- System (SystemID)
            +-- Value / Compliant

Timeline (EventID)
    |
    +-- EventType
    +-- Environment (EnvironmentID)
    +-- System (SystemID)
    +-- User (UserID)
    +-- EventDate
```

## Related Skills

- [Liongard Overview](../overview/SKILL.md) - Platform overview and terminology
- [Liongard Environments](../environments/SKILL.md) - Environment management
- [Liongard Inspections](../inspections/SKILL.md) - Inspectors and launchpoints
- [Liongard Systems](../systems/SKILL.md) - Systems and dataprints
