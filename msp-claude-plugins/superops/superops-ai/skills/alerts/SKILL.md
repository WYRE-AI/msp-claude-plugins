---
name: "SuperOps Alerts"
description: >
  Use this skill when working with SuperOps.ai alerts - listing, filtering,
  acknowledging, and resolving alerts from monitored assets. Covers alert
  types, severity levels, status management, and automated alert workflows.
  Essential for MSP technicians handling RMM monitoring through SuperOps.ai.
when_to_use: >-
  When listing, filtering, acknowledging, and resolving alerts from monitored assets. Use when:
  superops alert, alert management, list alerts superops, acknowledge alert, resolve alert
  superops, alert severity, monitoring alert, rmm alert, asset alert, or alert status.
---

# SuperOps.ai Alert Management

## Overview

SuperOps.ai RMM generates alerts when monitored conditions are triggered on managed assets. Alerts can indicate hardware issues, software problems, security events, or custom monitoring conditions. This skill covers alert listing, filtering, acknowledgment, resolution, and automated workflows.

## Alert Severity Levels

| Severity | Description | Typical Response |
|----------|-------------|------------------|
| **Critical** | Immediate attention required | Respond within 15 minutes |
| **High** | Significant issue | Respond within 1 hour |
| **Medium** | Moderate concern | Respond within 4 hours |
| **Low** | Informational | Review during business hours |

## Alert Status Values

| Status | Description |
|--------|-------------|
| **Active** | Alert triggered and unaddressed |
| **Acknowledged** | Alert seen, being worked |
| **Resolved** | Issue fixed, alert closed |
| **Auto-Resolved** | Condition cleared automatically |

## Common Alert Types

| Type | Description | Examples |
|------|-------------|----------|
| **Hardware** | Physical component issues | Disk failure, high temperature |
| **Performance** | Resource utilization | High CPU, low memory, disk space |
| **Security** | Security events | Failed logins, malware detected |
| **Service** | Service state changes | Service stopped, process crashed |
| **Patch** | Update related | Critical patch pending |
| **Connectivity** | Network issues | Agent offline, connectivity lost |
| **Custom** | User-defined monitors | Custom script conditions |

## Key Alert Fields

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `alertId` | ID | Unique identifier |
| `message` | String | Alert message/description |
| `severity` | Enum | Critical, High, Medium, Low |
| `status` | Enum | Active, Acknowledged, Resolved |
| `type` | String | Alert category |
| `createdTime` | DateTime | When alert was triggered |
| `acknowledgedTime` | DateTime | When acknowledged |
| `resolvedTime` | DateTime | When resolved |

### Association Fields

| Field | Type | Description |
|-------|------|-------------|
| `asset` | Asset | Source asset |
| `client` | Client | Associated client |
| `site` | Site | Associated site |
| `monitor` | Monitor | Triggering monitor |
| `ticket` | Ticket | Linked ticket (if any) |

### Resolution Fields

| Field | Type | Description |
|-------|------|-------------|
| `acknowledgedBy` | Technician | Who acknowledged |
| `resolvedBy` | Technician | Who resolved |
| `resolutionNotes` | String | Resolution details |

## GraphQL Operations

### List Alerts

```graphql
query getAlertList($input: ListInfoInput!) {
  getAlertList(input: $input) {
    alerts {
      alertId
      message
      severity
      status
      type
      createdTime
      acknowledgedTime
      resolvedTime
      asset {
        assetId
        name
        status
      }
      client {
        accountId
        name
      }
      site {
        id
        name
      }
      acknowledgedBy {
        id
        name
      }
      ticket {
        ticketId
        ticketNumber
      }
    }
    listInfo {
      totalCount
      hasNextPage
      endCursor
    }
  }
}
```

**Variables - Active Critical Alerts:**
```json
{
  "input": {
    "first": 50,
    "filter": {
      "status": "Active",
      "severity": ["Critical", "High"]
    },
    "orderBy": {
      "field": "createdTime",
      "direction": "DESC"
    }
  }
}
```

**Variables - Alerts by Client:**
```json
{
  "input": {
    "first": 100,
    "filter": {
      "client": {
        "accountId": "client-uuid"
      },
      "status": ["Active", "Acknowledged"]
    }
  }
}
```

**Variables - Alerts by Type:**
```json
{
  "input": {
    "filter": {
      "type": "Disk Space",
      "status": "Active"
    }
  }
}
```

### Get Alerts for Specific Asset

```graphql
query getAlertsForAsset($input: AssetDetailsListInput!) {
  getAlertsForAsset(input: $input) {
    alerts {
      alertId
      message
      severity
      status
      type
      createdTime
      monitor {
        id
        name
        type
      }
    }
    listInfo {
      totalCount
      hasNextPage
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "assetId": "asset-uuid",
    "first": 50,
    "filter": {
      "status": ["Active", "Acknowledged"]
    }
  }
}
```

### Get Single Alert Details

```graphql
query getAlert($input: AlertIdentifierInput!) {
  getAlert(input: $input) {
    alertId
    message
    severity
    status
    type
    createdTime
    acknowledgedTime
    resolvedTime
    asset {
      assetId
      name
      ipAddress
      status
      client {
        accountId
        name
      }
    }
    monitor {
      id
      name
      type
      threshold
      condition
    }
    acknowledgedBy {
      id
      name
      email
    }
    resolvedBy {
      id
      name
      email
    }
    resolutionNotes
    ticket {
      ticketId
      ticketNumber
      status
    }
    history {
      timestamp
      action
      performedBy {
        name
      }
      notes
    }
  }
}
```

### Acknowledge Alerts

```graphql
mutation acknowledgeAlerts($input: AcknowledgeAlertsInput!) {
  acknowledgeAlerts(input: $input) {
    success
    acknowledgedCount
    alerts {
      alertId
      status
      acknowledgedTime
      acknowledgedBy {
        id
        name
      }
    }
  }
}
```

**Variables - Single Alert:**
```json
{
  "input": {
    "alertIds": ["alert-uuid"],
    "notes": "Investigating disk space issue on server"
  }
}
```

**Variables - Bulk Acknowledge:**
```json
{
  "input": {
    "alertIds": ["alert-1", "alert-2", "alert-3"],
    "notes": "Bulk acknowledgment - scheduled maintenance window"
  }
}
```

### Resolve Alerts

```graphql
mutation resolveAlerts($input: ResolveAlertInput!) {
  resolveAlerts(input: $input)
}
```

**Variables:**
```json
{
  "input": {
    "alertIds": ["alert-uuid"],
    "resolutionNotes": "Cleared temp files, disk space now at 45% free"
  }
}
```

### Create Ticket from Alert

```graphql
mutation createTicketFromAlert($input: CreateTicketFromAlertInput!) {
  createTicketFromAlert(input: $input) {
    ticketId
    ticketNumber
    subject
    status
    alert {
      alertId
      status
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "alertId": "alert-uuid",
    "subject": "Critical: Low disk space on ACME-SERVER01",
    "priority": "HIGH",
    "techGroup": {
      "name": "Service Desk"
    },
    "additionalNotes": "Auto-generated from monitoring alert"
  }
}
```

## Common Workflows

### Alert Triage Workflow

```graphql
# Step 1: Get all active critical alerts
query getCriticalAlerts {
  getAlertList(input: {
    filter: {
      status: "Active",
      severity: "Critical"
    },
    orderBy: { field: "createdTime", direction: "ASC" }
  }) {
    alerts {
      alertId
      message
      asset { name }
      client { name }
      createdTime
    }
  }
}

# Step 2: Acknowledge alert being worked
mutation acknowledgeAlert {
  acknowledgeAlerts(input: {
    alertIds: ["alert-uuid"],
    notes: "Investigating issue"
  })
}

# Step 3: Create ticket if needed
mutation createTicket {
  createTicketFromAlert(input: {
    alertId: "alert-uuid",
    priority: "CRITICAL"
  })
}

# Step 4: Resolve when fixed
mutation resolveAlert {
  resolveAlerts(input: {
    alertIds: ["alert-uuid"],
    resolutionNotes: "Issue resolved - rebooted service"
  })
}
```

### Alert Summary Dashboard

```graphql
query getAlertSummary {
  criticalAlerts: getAlertList(input: {
    filter: { status: "Active", severity: "Critical" }
  }) {
    listInfo { totalCount }
  }
  highAlerts: getAlertList(input: {
    filter: { status: "Active", severity: "High" }
  }) {
    listInfo { totalCount }
  }
  acknowledgedAlerts: getAlertList(input: {
    filter: { status: "Acknowledged" }
  }) {
    listInfo { totalCount }
  }
  recentResolved: getAlertList(input: {
    filter: { status: "Resolved" },
    first: 10,
    orderBy: { field: "resolvedTime", direction: "DESC" }
  }) {
    alerts {
      alertId
      message
      resolvedTime
      asset { name }
    }
  }
}
```

### Client Alert Report

```graphql
query getClientAlertReport($clientId: ID!, $startDate: DateTime!, $endDate: DateTime!) {
  getAlertList(input: {
    filter: {
      client: { accountId: $clientId },
      createdTime: {
        gte: $startDate,
        lte: $endDate
      }
    }
  }) {
    alerts {
      alertId
      message
      severity
      status
      type
      createdTime
      resolvedTime
      asset { name }
    }
    listInfo { totalCount }
  }
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Alert not found | Invalid alert ID | Verify alert exists |
| Already resolved | Alert already closed | Check current status |
| Permission denied | Insufficient access | Check user permissions |
| Asset offline | Cannot verify resolution | Note in resolution |
| Rate limit exceeded | Over 800 req/min | Implement backoff |

### Status Transition Rules

```javascript
// Valid alert status transitions
const validTransitions = {
  'Active': ['Acknowledged', 'Resolved'],
  'Acknowledged': ['Resolved', 'Active'],  // Can un-acknowledge
  'Resolved': ['Active'],  // Can reopen if issue returns
  'Auto-Resolved': ['Active']  // Can reopen
};

function canTransition(currentStatus, newStatus) {
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}
```

## Best Practices

1. **Acknowledge promptly** - Show clients issues are being tracked
2. **Create tickets for complex issues** - Link alert to ticket for tracking
3. **Document resolutions** - Helps with recurring issues
4. **Use bulk operations** - Efficient handling of multiple alerts
5. **Set up auto-resolution** - Let transient issues clear themselves
6. **Filter by severity** - Focus on critical alerts first
7. **Monitor acknowledgment time** - Track response SLAs
8. **Review alert patterns** - Identify recurring problems

## Related Skills

- [SuperOps.ai Assets](../assets/SKILL.md) - Asset details
- [SuperOps.ai Tickets](../tickets/SKILL.md) - Create tickets from alerts
- [SuperOps.ai Runbooks](../runbooks/SKILL.md) - Automated remediation
- [SuperOps.ai Clients](../clients/SKILL.md) - Client associations
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
