---
name: "ConnectWise Automate Computers"
description: >
  ConnectWise Automate computer/endpoint management: computer identifiers (ComputerID,
  Name, ComputerGUID, MAC), status values, OS types, hardware/software inventory, disk,
  patch, and antivirus status, plus remote management operations.
when_to_use: >-
  When listing, searching, managing, and monitoring devices. Use when: automate computer, automate
  endpoint, automate device, automate agent, computer status, computer lookup, managed computer,
  computer online, computer offline, computer inventory, computer patches, computer antivirus, or
  labtech computer.
---

# ConnectWise Automate Computer Management

## Overview

Computers are the core managed entities in ConnectWise Automate. Each computer represents an endpoint with the Automate agent installed - workstations, servers, or network devices. This skill covers computer identification, status monitoring, inventory, patch management, and antivirus status.

## Key Concepts

### Computer Identifiers

Every computer has multiple identifiers:

| Identifier | Type | Description | Example |
|------------|------|-------------|---------|
| `ComputerID` | integer | Primary key, auto-incrementing | `12345` |
| `Name` | string | Computer hostname | `ACME-DC01` |
| `ComputerGUID` | string | Globally unique identifier | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `LastContact` | datetime | Last agent check-in time | `2024-02-15T10:30:00Z` |
| `MAC` | string | Primary MAC address | `00:1A:2B:3C:4D:5E` |

### Computer Status Values

| Status | Description | Business Impact |
|--------|-------------|-----------------|
| `Online` | Agent actively checking in | Normal operation |
| `Offline` | No agent communication | May require attention |
| `Degraded` | Agent checking in with issues | Performance concerns |
| `Unknown` | Status undetermined | Check connectivity |

### Operating System Types

| OS Type | Examples |
|---------|----------|
| `Windows Server` | 2016, 2019, 2022 |
| `Windows Workstation` | Windows 10, Windows 11 |
| `macOS` | Monterey, Ventura, Sonoma |
| `Linux` | Ubuntu, CentOS, RHEL |

## Field Reference

Computer objects expose roughly 30 fields covering identifiers, client/location
association, status, network, OS, hardware, agent, and timestamp data, plus an
`ExtraData` map for Extra Data Fields (EDFs). `ComputerInventory` objects cover drives,
software, memory, network adapters, printers, services, and monitors.

See [references/fields.md](references/fields.md) for the complete `Computer` and
`ComputerInventory` field reference.

## API Patterns

All endpoints require `Authorization: Bearer {token}` (see the API Patterns skill for
authentication and token management). Core calls:

- List: `GET /cwa/api/v1/Computers?pageSize=250`
- Get one: `GET /cwa/api/v1/Computers/{computerID}`
- Filter: `GET /cwa/api/v1/Computers?condition=ClientID = 100&pageSize=250` (or
  `Status = 'Online'`, `OS contains 'Windows Server'`, etc. - see the API Patterns
  skill for full OData filter syntax)
- Sub-resources: `/Computers/{id}/Drives`, `/Computers/{id}/Software`,
  `/Computers/{id}/Patches`, `/Computers/{id}/Antivirus`

See [references/api.md](references/api.md) for the complete endpoint catalog with
example requests and responses.

## Workflows

### Computer Lookup by Hostname

```javascript
async function findComputerByHostname(client, hostname) {
  const computers = await client.request(
    `/Computers?condition=Name contains '${hostname}'&pageSize=100`
  );

  if (computers.length === 0) {
    return { found: false, suggestions: [] };
  }

  if (computers.length === 1) {
    return { found: true, computer: computers[0] };
  }

  return {
    found: false,
    ambiguous: true,
    suggestions: computers.map(c => ({
      name: c.Name,
      id: c.ComputerID,
      client: c.Client?.Name,
      status: c.Status
    }))
  };
}
```

### Computer Lookup by IP Address

```javascript
async function findComputerByIP(client, ipAddress) {
  const computers = await client.request(
    `/Computers?condition=IPAddress = '${ipAddress}' or ExternalIP = '${ipAddress}'`
  );

  return computers[0] || null;
}
```

### Offline Computer Report

```javascript
async function getOfflineComputers(client, options = {}) {
  const { clientId, offlineMinutes = 30 } = options;

  let condition = "Status = 'Offline'";
  if (clientId) {
    condition += ` and ClientID = ${clientId}`;
  }

  const computers = await client.request(
    `/Computers?condition=${encodeURIComponent(condition)}&pageSize=500`
  );

  const now = new Date();

  return computers.map(computer => ({
    name: computer.Name,
    id: computer.ComputerID,
    client: computer.Client?.Name,
    location: computer.Location?.Name,
    lastContact: computer.LastContact,
    offlineMinutes: Math.floor(
      (now - new Date(computer.LastContact)) / 60000
    )
  }));
}
```

### Disk Space Report

```javascript
async function getLowDiskSpaceComputers(client, threshold = 10) {
  // Get all computers
  const computers = await client.request('/Computers?pageSize=500');
  const lowDiskComputers = [];

  for (const computer of computers) {
    const drives = await client.request(
      `/Computers/${computer.ComputerID}/Drives`
    );

    const lowDrives = drives.filter(d =>
      d.Type === 'Fixed' && d.PercentFree < threshold
    );

    if (lowDrives.length > 0) {
      lowDiskComputers.push({
        computer: computer.Name,
        client: computer.Client?.Name,
        drives: lowDrives.map(d => ({
          letter: d.Letter,
          percentFree: d.PercentFree,
          freeGB: Math.round(d.FreeSpace / 1024)
        }))
      });
    }

    // Respect rate limits
    await sleep(100);
  }

  return lowDiskComputers;
}
```

### Patch Compliance Report

```javascript
async function getPatchComplianceReport(client, clientId) {
  let condition = '';
  if (clientId) {
    condition = `?condition=ClientID = ${clientId}`;
  }

  const computers = await client.request(`/Computers${condition}&pageSize=500`);
  const report = {
    total: computers.length,
    compliant: 0,
    nonCompliant: 0,
    computers: []
  };

  for (const computer of computers) {
    const patches = await client.request(
      `/Computers/${computer.ComputerID}/Patches`
    );

    const isCompliant = patches.Missing === 0 && patches.Failed === 0;

    if (isCompliant) {
      report.compliant++;
    } else {
      report.nonCompliant++;
      report.computers.push({
        name: computer.Name,
        missing: patches.Missing,
        failed: patches.Failed
      });
    }

    await sleep(100);
  }

  return report;
}
```

## Error Handling

### Common Computer API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Computer not found | 404 | Invalid ComputerID | Verify computer exists |
| Invalid filter | 400 | Malformed condition | Check OData syntax |
| Permission denied | 403 | Insufficient rights | Check user permissions |
| Rate limited | 429 | Too many requests | Wait and retry |

### Error Response Example

```json
{
  "error": {
    "code": "NotFound",
    "message": "Computer with ID 99999 not found"
  }
}
```

### Computer Validation

```javascript
function validateComputerQuery(params) {
  const errors = [];

  if (params.condition) {
    // Validate OData operators
    const validOperators = ['=', '!=', '<', '>', '<=', '>=', 'contains', 'startswith'];
    const hasValidOperator = validOperators.some(op =>
      params.condition.includes(op)
    );

    if (!hasValidOperator) {
      errors.push('Invalid condition operator');
    }
  }

  if (params.pageSize && (params.pageSize < 1 || params.pageSize > 1000)) {
    errors.push('pageSize must be between 1 and 1000');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Best Practices

1. **Use ComputerID for specific lookups** - Faster than hostname searches
2. **Filter by ClientID when possible** - Reduces data transfer
3. **Implement pagination** - Always handle multiple pages
4. **Monitor LastContact** - Check for stale offline status
5. **Cache inventory data** - Software/hardware changes infrequently
6. **Batch operations** - Group requests to stay under rate limits
7. **Use EDFs for custom data** - Extra Data Fields for business-specific info
8. **Schedule inventory scans** - Keep software/hardware data current
9. **Track agent versions** - Plan upgrades based on version distribution
10. **Document naming conventions** - Consistent hostnames across clients

## Computer Health Assessment

### Determining Computer Health

```javascript
function assessComputerHealth(computer, patches, antivirus, drives) {
  const issues = [];

  // Check online status
  if (computer.Status !== 'Online') {
    issues.push({
      severity: 'critical',
      message: `Computer is ${computer.Status}`
    });
  }

  // Check agent age
  const lastContact = new Date(computer.LastContact);
  const minutesSinceContact = (Date.now() - lastContact) / 60000;

  if (minutesSinceContact > 60) {
    issues.push({
      severity: 'warning',
      message: `No contact in ${Math.round(minutesSinceContact)} minutes`
    });
  }

  // Check patch status
  if (patches.Missing > 0) {
    const severity = patches.Missing > 10 ? 'critical' : 'warning';
    issues.push({
      severity,
      message: `${patches.Missing} missing patch(es)`
    });
  }

  // Check antivirus
  if (!antivirus.RealTimeProtection) {
    issues.push({
      severity: 'critical',
      message: 'Real-time protection disabled'
    });
  }

  const defAge = (Date.now() - new Date(antivirus.DefinitionDate)) / 86400000;
  if (defAge > 7) {
    issues.push({
      severity: 'warning',
      message: `AV definitions ${Math.round(defAge)} days old`
    });
  }

  // Check disk space
  for (const drive of drives) {
    if (drive.Type === 'Fixed' && drive.PercentFree < 10) {
      issues.push({
        severity: drive.PercentFree < 5 ? 'critical' : 'warning',
        message: `Drive ${drive.Letter} only ${drive.PercentFree}% free`
      });
    }
  }

  return {
    healthy: issues.filter(i => i.severity === 'critical').length === 0,
    issues
  };
}
```

## Related Skills

- [ConnectWise Automate Clients](../clients/SKILL.md) - Client management
- [ConnectWise Automate Scripts](../scripts/SKILL.md) - Script execution on computers
- [ConnectWise Automate Monitors](../monitors/SKILL.md) - Computer monitoring
- [ConnectWise Automate Alerts](../alerts/SKILL.md) - Computer alerts
- [ConnectWise Automate API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
