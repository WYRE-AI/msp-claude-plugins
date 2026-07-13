---
name: "ConnectWise Automate Monitors"
description: >
  Use this skill when working with ConnectWise Automate monitors - configuring
  thresholds, creating templates, and assigning to computers. Covers monitor types
  (internal, remote, SNMP), alert thresholds, monitor templates, assignment methods,
  and monitor status evaluation.
when_to_use: >-
  When configuring thresholds, creating templates, and assigning to computers. Use when: automate
  monitor, automate monitoring, automate threshold, monitor template, monitor assignment, monitor
  alert, internal monitor, remote monitor, snmp monitor, or labtech monitor.
---

# ConnectWise Automate Monitor Management

## Overview

Monitors in ConnectWise Automate continuously evaluate conditions on managed endpoints and generate alerts when thresholds are exceeded. This skill covers monitor types, threshold configuration, template management, and assignment strategies.

## Key Concepts

### Monitor Types

| Type | Description | Execution |
|------|-------------|-----------|
| **Internal Monitor** | Runs on the Automate server | Checks agent data |
| **Remote Monitor** | Runs from the Automate server | Network checks (ping, port, HTTP) |
| **Agent Monitor** | Runs on the endpoint agent | Local system checks |
| **SNMP Monitor** | Polls SNMP-enabled devices | Network device monitoring |
| **Script Monitor** | Executes script for check | Custom logic |

### Monitor Categories

| Category | Examples |
|----------|----------|
| **Performance** | CPU, memory, disk usage |
| **Service** | Service status, process running |
| **Event Log** | Windows Event Log entries |
| **Network** | Ping, port open, HTTP response |
| **Security** | AV status, patch compliance |
| **Hardware** | Drive health, temperature |
| **Application** | Specific app monitoring |

### Alert Severity Levels

| Level | Value | Description |
|-------|-------|-------------|
| `Information` | 1 | Informational, no action needed |
| `Warning` | 2 | Potential issue, investigate |
| `Error` | 3 | Failure, action required |
| `Critical` | 4 | Severe issue, immediate action |

## Field Reference

### Monitor Definition Fields

```typescript
interface Monitor {
  // Identifiers
  MonitorID: number;            // Primary key
  MonitorGUID: string;          // Global unique ID
  Name: string;                 // Monitor name

  // Type and Category
  MonitorType: MonitorType;     // Internal, Remote, Agent, SNMP
  Category: string;             // Performance, Service, etc.
  Enabled: boolean;             // Is active

  // Check Configuration
  CheckInterval: number;        // Seconds between checks
  FailAfter: number;            // Failures before alerting
  ResetAfter: number;           // Successes before clearing

  // Alert Settings
  AlertSeverity: number;        // 1-4 severity level
  AlertMessage: string;         // Alert text template
  AlertAction: string;          // Action on alert

  // Thresholds
  Thresholds: MonitorThreshold[];

  // Assignment
  AssignmentType: string;       // Group, Computer, Client
  TargetID: number;             // Target group/computer/client ID

  // Template
  TemplateID: number;           // Parent template ID (0 if not from template)

  // Metadata
  Description: string;          // Monitor description
  DateCreated: string;          // Creation date
  DateModified: string;         // Last modified
}

type MonitorType = 'Internal' | 'Remote' | 'Agent' | 'SNMP' | 'Script';

interface MonitorThreshold {
  Field: string;                // Field to check
  Operator: ThresholdOperator;  // Comparison operator
  Value: string;                // Threshold value
  Duration: number;             // Minutes condition must persist
}

type ThresholdOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le' | 'contains' | 'notcontains';
```

### Monitor Template Fields

```typescript
interface MonitorTemplate {
  TemplateID: number;           // Primary key
  Name: string;                 // Template name
  Description: string;          // Template description
  Category: string;             // Template category

  // Default Settings
  MonitorType: MonitorType;
  CheckInterval: number;
  FailAfter: number;
  ResetAfter: number;
  AlertSeverity: number;

  // Thresholds
  Thresholds: MonitorThreshold[];

  // Assignment Rules
  AutoApply: boolean;           // Auto-apply to new computers
  ApplyCondition: string;       // Condition for auto-apply

  // Metadata
  IsBuiltIn: boolean;           // System template
  DateCreated: string;
  DateModified: string;
}
```

### Monitor Status Fields

```typescript
interface MonitorStatus {
  MonitorID: number;
  ComputerID: number;
  Status: MonitorStatusValue;
  LastCheck: string;            // ISO datetime
  LastAlertTime: string;        // Last alert generated
  ConsecutiveFailures: number;  // Current failure count
  CurrentValue: string;         // Last checked value
  Message: string;              // Status message
}

type MonitorStatusValue = 'OK' | 'Warning' | 'Error' | 'Critical' | 'Unknown' | 'Disabled';
```

## API Patterns

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

## Workflows

### Create Disk Space Monitor

```javascript
async function createDiskSpaceMonitor(client, computerId, options = {}) {
  const {
    drive = 'C:',
    warningThreshold = 15,
    criticalThreshold = 5,
    checkInterval = 300
  } = options;

  const monitor = await client.request('/Monitors', {
    method: 'POST',
    body: JSON.stringify({
      Name: `Disk ${drive} Free Space`,
      MonitorType: 'Agent',
      Category: 'Performance',
      CheckInterval: checkInterval,
      FailAfter: 1,
      ResetAfter: 1,
      AlertSeverity: 2, // Warning
      Thresholds: [
        {
          Field: 'DiskFreePercent',
          Operator: 'lt',
          Value: String(warningThreshold),
          Duration: 0
        }
      ],
      AssignmentType: 'Computer',
      TargetID: computerId
    })
  });

  return monitor;
}
```

### Create Service Monitor

```javascript
async function createServiceMonitor(client, groupId, serviceName) {
  const monitor = await client.request('/Monitors', {
    method: 'POST',
    body: JSON.stringify({
      Name: `Service: ${serviceName}`,
      MonitorType: 'Agent',
      Category: 'Service',
      CheckInterval: 300,
      FailAfter: 2,
      ResetAfter: 1,
      AlertSeverity: 3, // Error
      AlertMessage: `Service ${serviceName} is not running on %computername%`,
      Thresholds: [
        {
          Field: 'ServiceStatus',
          Operator: 'ne',
          Value: 'Running'
        }
      ],
      AssignmentType: 'Group',
      TargetID: groupId
    })
  });

  return monitor;
}
```

### Get Failing Monitors for Client

```javascript
async function getFailingMonitors(client, clientId) {
  // Get all computers for client
  const computers = await client.request(
    `/Clients/${clientId}/Computers?pageSize=500`
  );

  const failingMonitors = [];

  for (const computer of computers) {
    const monitors = await client.request(
      `/Computers/${computer.ComputerID}/Monitors`
    );

    const failing = monitors.filter(m =>
      ['Warning', 'Error', 'Critical'].includes(m.Status)
    );

    if (failing.length > 0) {
      failingMonitors.push({
        computer: computer.Name,
        computerId: computer.ComputerID,
        monitors: failing.map(m => ({
          name: m.Name,
          status: m.Status,
          value: m.CurrentValue,
          lastCheck: m.LastCheck
        }))
      });
    }

    // Respect rate limits
    await sleep(100);
  }

  return failingMonitors;
}
```

### Apply Template to All Servers

```javascript
async function applyTemplateToServers(client, templateId) {
  // Get the template details
  const template = await client.request(`/Monitors/Templates/${templateId}`);

  // Get all servers
  const servers = await client.request(
    `/Computers?condition=OS contains 'Server'&pageSize=500`
  );

  const results = [];

  for (const server of servers) {
    try {
      await client.request(`/Computers/${server.ComputerID}/Monitors`, {
        method: 'POST',
        body: JSON.stringify({ TemplateID: templateId })
      });
      results.push({
        computer: server.Name,
        status: 'applied'
      });
    } catch (error) {
      results.push({
        computer: server.Name,
        status: 'failed',
        error: error.message
      });
    }

    await sleep(100);
  }

  return {
    template: template.Name,
    applied: results.filter(r => r.status === 'applied').length,
    failed: results.filter(r => r.status === 'failed').length,
    details: results
  };
}
```

### Monitor Health Summary

```javascript
async function getMonitorHealthSummary(client) {
  const statuses = await client.request('/Monitors/Status?pageSize=1000');

  const summary = {
    total: statuses.length,
    ok: 0,
    warning: 0,
    error: 0,
    critical: 0,
    unknown: 0,
    disabled: 0,
    byCategory: {}
  };

  for (const status of statuses) {
    switch (status.Status) {
      case 'OK': summary.ok++; break;
      case 'Warning': summary.warning++; break;
      case 'Error': summary.error++; break;
      case 'Critical': summary.critical++; break;
      case 'Unknown': summary.unknown++; break;
      case 'Disabled': summary.disabled++; break;
    }

    // Track by category
    const category = status.Category || 'Uncategorized';
    if (!summary.byCategory[category]) {
      summary.byCategory[category] = { ok: 0, issues: 0 };
    }

    if (status.Status === 'OK') {
      summary.byCategory[category].ok++;
    } else {
      summary.byCategory[category].issues++;
    }
  }

  summary.healthPercentage = Math.round(
    (summary.ok / (summary.total - summary.disabled)) * 100
  );

  return summary;
}
```

## Error Handling

### Common Monitor API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Template not found | 404 | Invalid TemplateID | Verify template exists |
| Invalid threshold | 400 | Malformed threshold | Check threshold syntax |
| Monitor exists | 400 | Duplicate monitor | Use unique name |
| Permission denied | 403 | No access | Check user permissions |
| Invalid operator | 400 | Bad comparison operator | Use valid operator |

### Error Response Example

```json
{
  "error": {
    "code": "BadRequest",
    "message": "Invalid threshold operator: 'greater'"
  }
}
```

### Monitor Validation

```javascript
function validateMonitorDefinition(monitor) {
  const errors = [];

  if (!monitor.Name) {
    errors.push('Monitor name is required');
  }

  if (!['Internal', 'Remote', 'Agent', 'SNMP', 'Script'].includes(monitor.MonitorType)) {
    errors.push('Invalid monitor type');
  }

  if (monitor.CheckInterval < 60) {
    errors.push('Check interval must be at least 60 seconds');
  }

  if (monitor.AlertSeverity < 1 || monitor.AlertSeverity > 4) {
    errors.push('Alert severity must be 1-4');
  }

  const validOperators = ['eq', 'ne', 'gt', 'lt', 'ge', 'le', 'contains', 'notcontains'];
  for (const threshold of monitor.Thresholds || []) {
    if (!validOperators.includes(threshold.Operator)) {
      errors.push(`Invalid threshold operator: ${threshold.Operator}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Best Practices

1. **Use templates** - Standardize monitoring across environments
2. **Set appropriate intervals** - Balance responsiveness vs. load
3. **Configure FailAfter** - Avoid alert storms from transient issues
4. **Use groups for assignment** - Easier management than per-computer
5. **Document thresholds** - Record why specific values were chosen
6. **Test monitors** - Validate before broad deployment
7. **Review regularly** - Audit monitors for relevance
8. **Layer severity** - Warning before Error, Error before Critical
9. **Include context in alerts** - Use variables in alert messages
10. **Plan for maintenance** - Disable monitors during scheduled work

## Common Monitor Configurations

### CPU Usage Monitor

```javascript
{
  Name: "CPU Usage - High",
  MonitorType: "Agent",
  Category: "Performance",
  CheckInterval: 300,
  FailAfter: 3,
  ResetAfter: 2,
  AlertSeverity: 2,
  Thresholds: [
    { Field: "CPUUsage", Operator: "gt", Value: "90", Duration: 10 }
  ]
}
```

### Memory Usage Monitor

```javascript
{
  Name: "Memory Usage - Critical",
  MonitorType: "Agent",
  Category: "Performance",
  CheckInterval: 300,
  FailAfter: 2,
  ResetAfter: 1,
  AlertSeverity: 3,
  Thresholds: [
    { Field: "MemoryUsagePercent", Operator: "gt", Value: "95", Duration: 5 }
  ]
}
```

### Service Running Monitor

```javascript
{
  Name: "Service: SQL Server",
  MonitorType: "Agent",
  Category: "Service",
  CheckInterval: 180,
  FailAfter: 1,
  ResetAfter: 1,
  AlertSeverity: 4,
  Thresholds: [
    { Field: "ServiceStatus", Operator: "ne", Value: "Running" }
  ]
}
```

### Ping Monitor

```javascript
{
  Name: "Ping: Gateway",
  MonitorType: "Remote",
  Category: "Network",
  CheckInterval: 60,
  FailAfter: 3,
  ResetAfter: 2,
  AlertSeverity: 3,
  Thresholds: [
    { Field: "PingStatus", Operator: "ne", Value: "Success" }
  ]
}
```

## Related Skills

- [ConnectWise Automate Computers](../computers/SKILL.md) - Monitored computers
- [ConnectWise Automate Alerts](../alerts/SKILL.md) - Monitor-generated alerts
- [ConnectWise Automate Scripts](../scripts/SKILL.md) - Script monitors
- [ConnectWise Automate API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
