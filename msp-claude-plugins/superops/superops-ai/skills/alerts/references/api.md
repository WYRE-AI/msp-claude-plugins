# SuperOps.ai Alert GraphQL Operations

## List Alerts

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

## Get Alerts for Specific Asset

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

## Get Single Alert Details

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

## Acknowledge Alerts

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

## Resolve Alerts

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

## Create Ticket from Alert

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

## Workflow Examples

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
