# Additional Monitor Examples

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

### Common Monitor Configurations

#### CPU Usage Monitor

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

#### Memory Usage Monitor

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

#### Service Running Monitor

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

#### Ping Monitor

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
