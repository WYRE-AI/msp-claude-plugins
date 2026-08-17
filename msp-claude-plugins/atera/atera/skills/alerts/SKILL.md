---
name: "Atera Alerts"
description: >
  Atera alerts: alert types, severity levels, alert sources, the
  acknowledge/resolve lifecycle, and alert-to-ticket conversion.
when_to_use: >-
  When viewing, acknowledging, resolving, or managing alerts raised by
  Atera-monitored devices. Use when: atera alert, rmm alert, monitoring
  alert, alert severity, alert acknowledge, alert resolve, device alert,
  threshold alert, or atera monitoring.
---

# Atera Alert Management

## Overview

Alerts in Atera are notifications generated when monitored systems exceed defined thresholds or encounter issues. They serve as the early warning system for MSPs, enabling proactive response to client issues before they become critical problems.

## Anti-triggers

- **The work the alert generated** — an alert promoted into a service
  desk record is a ticket; use `atera-tickets`.
- **What raises the alert** — thresholds and monitor configuration are
  `atera-devices` for agentless monitors and `atera-agents` for
  endpoint health.
- **Alerts from a different RMM** — `superops-alerts`,
  `ninjaone-alerts`, `datto-rmm-alerts`,
  `connectwise-automate-alerts`, and N-central active issues
  (`ncentral-monitoring-tasks`) are separate stores with their own
  severity scales. Nothing here reads them, and the counts are not
  comparable.
- **A security detection** — endpoint threat findings come from the EDR,
  not the RMM; use `huntress-incidents`, `sentinelone-alerts`, or
  `rocketcyber-incidents`.

## Alert Severity Levels

| Severity | Description | Typical Response |
|----------|-------------|------------------|
| **Critical** | Immediate action required | Respond within 15 minutes |
| **Warning** | Attention needed soon | Respond within 1 hour |
| **Information** | FYI, no action required | Review during normal hours |

## Alert Sources

| Source | Description |
|--------|-------------|
| **Agent** | Alerts from RMM agent monitoring |
| **Device** | Alerts from HTTP/SNMP/TCP monitors |
| **Threshold** | Alerts when metrics exceed limits |
| **Custom** | User-defined or API-created alerts |

## Alert Types

| Type | Description | Common Triggers |
|------|-------------|-----------------|
| **Availability** | Device/service up/down | Agent offline, ping failure |
| **Performance** | Resource utilization | High CPU, low memory, disk full |
| **Hardware** | Physical component issues | SMART errors, temperature |
| **Security** | Security-related events | Failed logins, malware detected |
| **Application** | Software issues | Service stopped, event log errors |
| **Patch** | Update status | Missing patches, update failures |
| **Backup** | Backup status | Backup failed, missed schedule |

## Alert Fields

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `AlertID` | int | Unique alert identifier |
| `Code` | int | Alert type code |
| `Source` | string | Alert source (Agent, Device, etc.) |
| `Title` | string | Alert title/summary |
| `Severity` | string | Critical, Warning, Information |
| `Created` | datetime | When alert was generated |
| `SnoozedEndDate` | datetime | Snooze expiration (if snoozed) |
| `DeviceGuid` | string | Associated device GUID |
| `AdditionalInfo` | string | Extra context/details |
| `Archived` | boolean | Whether alert is archived |
| `AlertCategoryID` | string | Category classification |
| `ArchivedDate` | datetime | When alert was archived |
| `TicketID` | int | Linked ticket (if converted) |
| `AlertMessage` | string | Detailed alert message |
| `FolderID` | int | Folder/group reference |

### Device/Customer Fields

| Field | Type | Description |
|-------|------|-------------|
| `CustomerID` | int | Associated customer ID |
| `CustomerName` | string | Customer display name |
| `DeviceName` | string | Device hostname |

## API Patterns

### List All Alerts (Paginated)

```http
GET /api/v3/alerts?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "items": [
    {
      "AlertID": 111111,
      "Code": 205,
      "Source": "Agent",
      "Title": "High CPU Usage",
      "Severity": "Warning",
      "Created": "2024-02-15T10:30:00Z",
      "CustomerID": 12345,
      "CustomerName": "Acme Corporation",
      "DeviceName": "SERVER-DC01",
      "DeviceGuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "AlertMessage": "CPU usage exceeded 90% for 5 minutes",
      "Archived": false,
      "TicketID": null
    }
  ],
  "totalItems": 250,
  "page": 1,
  "itemsInPage": 50,
  "totalPages": 5
}
```

### Get Alert by ID

```http
GET /api/v3/alerts/{alertId}
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "AlertID": 111111,
  "Code": 205,
  "Source": "Agent",
  "Title": "High CPU Usage",
  "Severity": "Warning",
  "Created": "2024-02-15T10:30:00Z",
  "CustomerID": 12345,
  "CustomerName": "Acme Corporation",
  "DeviceName": "SERVER-DC01",
  "DeviceGuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "AlertMessage": "CPU usage has exceeded 90% threshold\n\nCurrent Value: 95%\nThreshold: 90%\nDuration: 5 minutes",
  "AdditionalInfo": "Process: sqlservr.exe consuming 85% CPU",
  "Archived": false,
  "ArchivedDate": null,
  "TicketID": null,
  "SnoozedEndDate": null,
  "AlertCategoryID": "performance"
}
```

### Create Alert (API-Generated)

```http
POST /api/v3/alerts
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "DeviceGuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "Title": "Custom Alert - Database Connection Pool Exhausted",
  "Severity": "Critical",
  "AlertMessage": "Application database connection pool at 100% capacity. New connections being rejected.",
  "AlertCategoryID": "application"
}
```

**Response:**
```json
{
  "ActionID": 111112,
  "AlertID": 111112
}
```

### Delete/Resolve Alert

```http
DELETE /api/v3/alerts/{alertId}
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "ActionID": 111111,
  "Success": true
}
```

## Alert to Ticket Conversion

### Workflow

1. **Review alert** - Understand the issue
2. **Create ticket** - Link to alert for context
3. **Assign technician** - Route for resolution
4. **Resolve issue** - Fix the underlying problem
5. **Close alert** - Delete or archive when resolved

### Create Ticket from Alert

```http
POST /api/v3/tickets
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "TicketTitle": "Alert: High CPU Usage on SERVER-DC01",
  "Description": "Alert ID: 111111\n\nCPU usage has exceeded 90% threshold\n\nCurrent Value: 95%\nThreshold: 90%\nDuration: 5 minutes\n\nProcess: sqlservr.exe consuming 85% CPU",
  "CustomerID": 12345,
  "TicketPriority": "High",
  "TicketType": "Problem"
}
```

## Alert Categorization

### Performance Alerts

| Alert | Threshold | Severity | Action |
|-------|-----------|----------|--------|
| High CPU | > 90% for 5 min | Warning | Investigate processes |
| High Memory | > 95% | Warning | Check for leaks |
| Disk Space Low | < 10% free | Critical | Clean or expand |
| Disk Space Warning | < 20% free | Warning | Plan cleanup |

### Availability Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Agent Offline | No heartbeat 10 min | Critical | Check connectivity |
| Service Stopped | Critical service down | Critical | Restart service |
| Ping Failure | Host unreachable | Critical | Check network |

### Security Alerts

| Alert | Trigger | Severity | Action |
|-------|---------|----------|--------|
| Failed Logins | > 5 failures | Warning | Investigate |
| Malware Detected | AV detection | Critical | Quarantine |
| Firewall Disabled | Windows Firewall off | Warning | Re-enable |

## Common Workflows

### Alert Triage Process

1. **Review new alerts** - Sort by severity
2. **Assess impact** - Determine business effect
3. **Prioritize response** - Critical first
4. **Take action** - Resolve or escalate
5. **Document** - Create ticket if needed
6. **Close** - Delete resolved alerts

### Alert Suppression

When an alert is expected (maintenance, known issue):

1. **Snooze alert** - Temporarily suppress
2. **Set duration** - Define snooze period
3. **Document reason** - Note why suppressed
4. **Review after** - Verify issue resolved

### Bulk Alert Management

For multiple alerts from same issue:

1. **Identify root cause** - Find common source
2. **Create single ticket** - Link all related alerts
3. **Resolve root cause** - Fix underlying issue
4. **Bulk delete** - Remove all related alerts

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid alert ID | Verify alert exists |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Verify permissions |
| 404 | Alert not found | Confirm alert ID |
| 429 | Rate limited | Wait and retry (700 req/min) |

### Alert Processing Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Device not found | Invalid DeviceGuid | Verify device exists |
| Invalid severity | Typo in severity | Use Critical, Warning, Information |
| Missing required field | Incomplete request | Add required fields |

## Best Practices

1. **Respond quickly to critical alerts** - Time is essential
2. **Set appropriate thresholds** - Avoid alert fatigue
3. **Review alert patterns** - Identify recurring issues
4. **Convert to tickets** - Track resolution formally
5. **Document resolutions** - Build knowledge base
6. **Tune alert profiles** - Reduce false positives
7. **Use severity appropriately** - Reserve Critical for urgent issues
8. **Archive rather than delete** - Maintain history for trends

## Alert Monitoring Dashboard

### Key Metrics to Track

| Metric | Purpose |
|--------|---------|
| Open alerts by severity | Current workload |
| Alert volume trend | Identify patterns |
| Mean time to acknowledge | Response efficiency |
| Mean time to resolve | Resolution efficiency |
| Top alerting devices | Problem systems |
| Alert to ticket ratio | Conversion rate |

## Related Skills

- [Atera Agents](../agents/SKILL.md) - Agent-generated alerts
- [Atera Devices](../devices/SKILL.md) - Device monitor alerts
- [Atera Tickets](../tickets/SKILL.md) - Alert to ticket conversion
- [Atera API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
