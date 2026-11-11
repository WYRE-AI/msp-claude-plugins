# SuperOps AI Expanded Commands PRD

> Version: 1.0.0
> Created: 2026-02-04
> Status: Draft

> **Historical.** This draft was written before the plugin was anchored on the
> SuperOps schema. Its GraphQL uses operations and fields that do not exist,
> such as `addTicketNote`, cursor paging and `alertId`. Do not copy it. The
> commands under `commands/` and the `references/api.md` files under `skills/`
> are the current, schema-validated versions (#270).

## Overview

This PRD defines 8 additional slash commands for the SuperOps AI Claude Code plugin. These commands extend the existing `/create-ticket` and `/search-tickets` functionality to provide comprehensive ticket lifecycle management, RMM alert handling, script execution, and asset management.

## API Information

- **Endpoint:** `https://{subdomain}.superops.ai/graphql`
- **Authentication:** Bearer token (Authorization header)
- **Rate Limit:** 800 requests/minute
- **Protocol:** GraphQL (mutations and queries)

## Commands Summary

| Priority | Command | Description |
|----------|---------|-------------|
| P0 | `/update-ticket` | Update ticket fields (status, priority, technician) |
| P0 | `/add-ticket-note` | Add a note to an existing ticket |
| P0 | `/log-time` | Log time entry against a ticket |
| P1 | `/list-alerts` | List active RMM alerts |
| P1 | `/acknowledge-alert` | Acknowledge an RMM alert |
| P1 | `/resolve-alert` | Resolve an RMM alert |
| P1 | `/run-script` | Run a script on an asset |
| P2 | `/get-asset` | Get detailed asset information |

---

## Command Specifications

### 1. /update-ticket

**Description:** Update fields on an existing SuperOps ticket including status, priority, technician assignment, and custom fields.

**Priority:** P0 - Core workflow command

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticket_id` | string | Yes | The SuperOps ticket ID to update |
| `status` | string | No | New status (e.g., "Open", "In Progress", "Resolved") |
| `priority` | string | No | Priority level: "Low", "Medium", "High", "Critical" |
| `technician_id` | string | No | Technician ID to assign |
| `due_date` | datetime | No | New due date for the ticket |
| `category` | string | No | Ticket category |

#### GraphQL Mutation

```graphql
mutation UpdateTicket($input: UpdateTicketInput!) {
  updateTicket(input: $input) {
    ticket {
      id
      ticketNumber
      subject
      status
      priority
      assignedTechnician {
        id
        name
      }
      dueDate
      updatedAt
    }
    errors {
      field
      message
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "id": "ticket_123",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "technicianId": "tech_456",
    "dueDate": "2026-02-10T17:00:00Z"
  }
}
```

#### Example Usage

```
/update-ticket TICK-12345 --status "In Progress" --priority High

/update-ticket TICK-12345 --technician_id tech_789 --due_date "2026-02-10"
```

#### Why It's Valuable

Technicians frequently need to update ticket status as they work. This command eliminates navigating the SuperOps UI to make common updates, keeping technicians in their IDE or terminal workflow.

---

### 2. /add-ticket-note

**Description:** Add a note (internal or public) to an existing SuperOps ticket.

**Priority:** P0 - Core workflow command

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticket_id` | string | Yes | The SuperOps ticket ID |
| `note` | string | Yes | The note content (supports multi-line) |
| `type` | string | No | Note type: "internal" (default) or "public" |
| `notify_customer` | boolean | No | Send notification to customer (default: false) |

#### GraphQL Mutation

```graphql
mutation AddTicketNote($input: AddTicketNoteInput!) {
  addTicketNote(input: $input) {
    note {
      id
      content
      noteType
      createdAt
      createdBy {
        id
        name
      }
    }
    errors {
      field
      message
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "ticketId": "ticket_123",
    "content": "Contacted customer, awaiting callback",
    "noteType": "INTERNAL",
    "notifyCustomer": false
  }
}
```

#### Example Usage

```
/add-ticket-note TICK-12345 "Contacted customer, awaiting callback" --type internal

/add-ticket-note TICK-12345 "Issue resolved by applying patch KB12345" --type public --notify_customer true
```

#### Why It's Valuable

Documentation is critical in MSP workflows. Quick note addition without leaving the current context encourages better ticket hygiene and knowledge capture.

---

### 3. /log-time

**Description:** Log a time entry against a SuperOps ticket for billing and tracking purposes.

**Priority:** P0 - Core workflow command

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticket_id` | string | Yes | The ticket ID to log time against |
| `duration` | integer | Yes | Duration in minutes |
| `description` | string | No | Work description/notes |
| `billable` | boolean | No | Mark as billable (default: true) |
| `start_time` | datetime | No | Start time (defaults to now minus duration) |
| `work_type` | string | No | Type of work performed |

#### GraphQL Mutation

```graphql
mutation LogTimeEntry($input: CreateTimeEntryInput!) {
  createTimeEntry(input: $input) {
    timeEntry {
      id
      duration
      description
      billable
      startTime
      endTime
      workType
      ticket {
        id
        ticketNumber
      }
      technician {
        id
        name
      }
    }
    errors {
      field
      message
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "ticketId": "ticket_123",
    "duration": 30,
    "description": "Troubleshot network connectivity issue",
    "billable": true,
    "startTime": "2026-02-04T10:00:00Z",
    "workType": "REMOTE_SUPPORT"
  }
}
```

#### Example Usage

```
/log-time TICK-12345 30 --description "Troubleshot network connectivity issue"

/log-time TICK-12345 90 --billable true --description "Server migration work"

/log-time TICK-12345 45 --billable false --description "Internal documentation"
```

#### Why It's Valuable

Accurate time tracking directly impacts MSP revenue. Quick time logging reduces lost billable hours and improves reporting accuracy.

---

### 4. /list-alerts

**Description:** List active RMM alerts across all clients or filtered by criteria.

**Priority:** P1 - RMM integration command

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | string | No | Filter by client ID |
| `severity` | string | No | Filter by severity: "Low", "Medium", "High", "Critical" |
| `status` | string | No | Filter: "active", "acknowledged", "resolved" (default: "active") |
| `asset_id` | string | No | Filter by specific asset |
| `limit` | integer | No | Maximum results (default: 25, max: 100) |

#### GraphQL Query

```graphql
query ListAlerts($filter: AlertFilterInput, $pagination: PaginationInput) {
  alerts(filter: $filter, pagination: $pagination) {
    nodes {
      id
      alertType
      severity
      status
      message
      createdAt
      acknowledgedAt
      asset {
        id
        name
        assetType
      }
      client {
        id
        name
      }
    }
    pageInfo {
      hasNextPage
      totalCount
    }
  }
}
```

**Variables:**
```json
{
  "filter": {
    "status": "ACTIVE",
    "severity": "CRITICAL",
    "clientId": "client_123"
  },
  "pagination": {
    "first": 25
  }
}
```

#### Example Usage

```
/list-alerts

/list-alerts --client_id client_123 --severity Critical

/list-alerts --status active --limit 50
```

#### Why It's Valuable

Alert visibility is critical for proactive MSP operations. Quick alert access enables faster response times and better prioritization.

---

### 5. /acknowledge-alert

**Description:** Acknowledge an RMM alert to indicate a technician is aware and investigating.

**Priority:** P1 - RMM integration command

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `alert_id` | string | Yes | The alert ID to acknowledge |
| `note` | string | No | Note explaining acknowledgment |

#### GraphQL Mutation

```graphql
mutation AcknowledgeAlert($input: AcknowledgeAlertInput!) {
  acknowledgeAlert(input: $input) {
    alert {
      id
      status
      acknowledgedAt
      acknowledgedBy {
        id
        name
      }
      acknowledgmentNote
    }
    errors {
      field
      message
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "alertId": "alert_123",
    "note": "Investigating disk space issue"
  }
}
```

#### Example Usage

```
/acknowledge-alert alert_9876 --note "Investigating disk space issue"

/acknowledge-alert alert_9876
```

#### Why It's Valuable

Acknowledgment prevents duplicate work by signaling that an alert is being handled. This improves team coordination and reduces alert fatigue.

---

### 6. /resolve-alert

**Description:** Resolve an RMM alert and optionally create a ticket or add resolution notes.

**Priority:** P1 - RMM integration command

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `alert_id` | string | Yes | The alert ID to resolve |
| `resolution_note` | string | No | Note explaining the resolution |
| `create_ticket` | boolean | No | Create a ticket from this alert (default: false) |
| `ticket_subject` | string | No | Subject if creating ticket |

#### GraphQL Mutation

```graphql
mutation ResolveAlert($input: ResolveAlertInput!) {
  resolveAlert(input: $input) {
    alert {
      id
      status
      resolvedAt
      resolvedBy {
        id
        name
      }
      resolutionNote
    }
    ticket {
      id
      ticketNumber
      subject
    }
    errors {
      field
      message
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "alertId": "alert_123",
    "resolutionNote": "Disk space cleared by removing temp files",
    "createTicket": true,
    "ticketSubject": "Server disk space issue - resolved"
  }
}
```

#### Example Usage

```
/resolve-alert alert_9876 --resolution_note "Disk space cleared by removing temp files"

/resolve-alert alert_9876 --create_ticket true --ticket_subject "Server disk space issue - resolved"

/resolve-alert alert_9876
```

#### Why It's Valuable

Quick alert resolution maintains accurate system status and clears noise from alert dashboards. Optional ticket creation ensures documentation of work performed.

---

### 7. /run-script

**Description:** Execute a script on a remote asset via SuperOps RMM.

**Priority:** P1 - RMM integration command

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `asset_id` | string | Yes | The asset ID to run the script on |
| `script_id` | string | Yes | The script ID from script library |
| `parameters` | string | No | JSON string of script parameters |
| `run_as` | string | No | Execution context: "system", "user" (default: "system") |
| `timeout` | integer | No | Timeout in seconds (default: 300) |

#### GraphQL Mutation

```graphql
mutation RunScript($input: RunScriptInput!) {
  runScript(input: $input) {
    execution {
      id
      status
      startedAt
      asset {
        id
        name
      }
      script {
        id
        name
      }
    }
    errors {
      field
      message
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "assetId": "asset_123",
    "scriptId": "script_456",
    "parameters": {
      "path": "C:\\Temp",
      "days": 30
    },
    "runAs": "SYSTEM",
    "timeout": 300
  }
}
```

#### GraphQL Query (Check Execution Status)

```graphql
query GetScriptExecution($id: ID!) {
  scriptExecution(id: $id) {
    id
    status
    startedAt
    completedAt
    exitCode
    output
    errorOutput
  }
}
```

#### Example Usage

```
/run-script asset_123 script_clear_temp --parameters '{"days": 30}'

/run-script asset_123 script_restart_service --run_as system --timeout 120

/run-script asset_123 script_disk_cleanup
```

#### Why It's Valuable

Remote script execution is essential for MSP automation and remediation. Quick script invocation from the command line enables rapid response to issues without navigating the RMM console.

---

### 8. /get-asset

**Description:** Retrieve detailed asset information including hardware specs, installed software, and recent activity.

**Priority:** P2 - Supporting lookup command

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `asset_id` | string | No* | Asset ID to look up |
| `query` | string | No* | Search by asset name or serial |
| `client_id` | string | No | Filter by client ID |
| `include_software` | boolean | No | Include installed software (default: false) |
| `include_alerts` | boolean | No | Include recent alerts (default: false) |

*Either `asset_id` or `query` is required

#### GraphQL Query

```graphql
query GetAsset($id: ID, $filter: AssetFilterInput) {
  asset(id: $id, filter: $filter) {
    id
    name
    assetType
    serialNumber
    manufacturer
    model
    operatingSystem
    osVersion
    lastSeenAt
    ipAddress
    macAddress
    client {
      id
      name
    }
    hardware {
      cpu
      cpuCores
      ramGB
      diskTotalGB
      diskFreeGB
    }
    software @include(if: $includeSoftware) {
      name
      version
      publisher
      installedAt
    }
    recentAlerts @include(if: $includeAlerts) {
      id
      alertType
      severity
      createdAt
    }
  }
}
```

**Variables:**
```json
{
  "id": "asset_123",
  "includeSoftware": true,
  "includeAlerts": true
}
```

#### Example Usage

```
/get-asset asset_12345

/get-asset --query "ACME-WS-001"

/get-asset asset_12345 --include_software true --include_alerts true

/get-asset --query "Dell" --client_id client_789
```

#### Why It's Valuable

Asset context is critical for troubleshooting. Quick asset lookup provides hardware specs, warranty info, and configuration details without leaving the workflow.

---

## Implementation Notes

### Authentication

All commands use the SuperOps GraphQL API with Bearer token authentication:

```
Authorization: Bearer {api_token}
Content-Type: application/json
```

### Rate Limiting

SuperOps enforces 800 requests per minute. Commands should:
- Implement exponential backoff on 429 responses
- Cache frequently accessed data (clients, technicians, scripts)
- Batch GraphQL queries when possible using aliases

### GraphQL Best Practices

```graphql
# Use aliases to batch multiple queries
query BatchLookup {
  ticket: ticket(id: "ticket_123") {
    id
    subject
    status
  }
  asset: asset(id: "asset_456") {
    id
    name
    assetType
  }
}
```

### Error Handling

GraphQL errors appear in the response `errors` array:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Ticket not found",
      "path": ["updateTicket"],
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

Common error codes to handle:
- `NOT_FOUND` - Invalid entity IDs (404 equivalent)
- `UNAUTHORIZED` - Permission denied (403 equivalent)
- `RATE_LIMITED` - Rate limit exceeded (429 equivalent)
- `VALIDATION_ERROR` - Invalid input (400 equivalent)
- `INTERNAL_ERROR` - Server error (500 equivalent)

### Pagination

SuperOps uses cursor-based pagination for lists:

```graphql
query ListTickets($cursor: String, $first: Int) {
  tickets(after: $cursor, first: $first) {
    nodes {
      id
      subject
    }
    pageInfo {
      hasNextPage
      endCursor
      totalCount
    }
  }
}
```

### Caching Strategy

- Cache technician list for 15 minutes
- Cache client lookups for 5 minutes
- Cache script library for 30 minutes
- Cache ticket statuses/priorities for 1 hour

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Command adoption | 50% of users using 3+ commands within 30 days |
| Time saved per operation | 25+ seconds vs. UI |
| Error rate | < 5% of command invocations |
| Alert response time | 20% improvement in MTTA |
| Time entry capture rate | 15% improvement in logged time |

---

## Dependencies

- SuperOps AI subscription with API access
- Valid API token with appropriate permissions
- GraphQL endpoint access enabled for tenant

## References

- [SuperOps API Documentation](https://developer.superops.ai/)
- [SuperOps GraphQL Explorer](https://developer.superops.ai/graphql-explorer)
- [SuperOps Knowledge Base](https://support.superops.ai/)
