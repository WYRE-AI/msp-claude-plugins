---
name: "ConnectWise Automate Monitors"
description: >
  ConnectWise Automate monitor management: monitor types (internal, remote,
  agent, SNMP, script), categories, threshold configuration, templates,
  assignment methods (computer/group/client), and status evaluation.
when_to_use: >-
  When configuring thresholds, creating templates, and assigning to computers. Use when: automate
  monitor, automate monitoring, automate threshold, monitor template, monitor assignment, monitor
  alert, internal monitor, remote monitor, snmp monitor, or labtech monitor.
---

# ConnectWise Automate Monitor Management

## Overview

Monitors in ConnectWise Automate continuously evaluate conditions on managed endpoints and generate alerts when thresholds are exceeded. This skill covers monitor types, threshold configuration, template management, and assignment strategies.

## Anti-triggers

- **A monitor that has already fired** — the resulting notification has
  its own lifecycle, acknowledgment and history; use
  `connectwise-automate-alerts`.
- **Response and resolution targets** — SLA clocks and escalation rules
  are ConnectWise PSA ticket behaviour, not Automate thresholds; use
  `connectwise-manage-tickets`.
- **Mapping the network itself** — Automate SNMP monitors evaluate a
  threshold on a device you point them at; discovering topology and
  watching links between devices is `auvik-networks`.

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

See [references/fields.md](references/fields.md) for the complete Monitor, MonitorTemplate, and MonitorStatus field reference.

## API Patterns

Monitors are created either from a template (`POST /Computers/{computerID}/Monitors` with `TemplateID`) or as a fully custom definition (`POST /Monitors` with the full threshold/assignment payload). Thresholds always use one of the short operator codes — `eq`, `ne`, `gt`, `lt`, `ge`, `le`, `contains`, `notcontains` — not full words like "greater". Assignment targets a `Group`, `Computer`, or `Client` via `AssignmentType` + `TargetID`.

```http
GET /cwa/api/v1/Monitors/Status?condition=Status ne 'OK'&pageSize=100
Authorization: Bearer {token}
```

See [references/api.md](references/api.md) for the complete endpoint catalog (templates, per-computer monitors, status, create/update/disable/delete, group assignment).

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

See [references/examples.md](references/examples.md) for a sample error response, a `validateMonitorDefinition` helper, and ready-made configurations for CPU, memory, service, and ping monitors.

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

## Related Skills

- [ConnectWise Automate Computers](../computers/SKILL.md) - Monitored computers
- [ConnectWise Automate Alerts](../alerts/SKILL.md) - Monitor-generated alerts
- [ConnectWise Automate Scripts](../scripts/SKILL.md) - Script monitors
- [ConnectWise Automate API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
