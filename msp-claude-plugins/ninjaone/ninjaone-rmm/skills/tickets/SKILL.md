---
name: "NinjaOne Tickets"
description: >
  NinjaOne's built-in ticketing system, which integrates with device monitoring:
  ticket creation and updates, core/status/metadata fields, status and priority
  values with SLA targets, log entry types, device linkage, tagging patterns, and
  error codes.
when_to_use: >-
  When creating, updating, searching, or working the NinjaOne ticket queue. Use when:
  ninjaone ticket, ninjarmm ticket, ninja ticket create, ninja ticket search, ticket
  status ninja, or ninja service ticket.
---

# NinjaOne Ticket Management

## Overview

NinjaOne includes a built-in ticketing system that integrates with device monitoring. Tickets can be manually created or auto-generated from alerts, providing a complete service desk solution.

## Anti-triggers

- **The MSP's real service desk** — most MSPs running NinjaOne keep their
  ticket queue in a PSA and use NinjaOne ticketing only for
  monitoring-generated work, or not at all. If the ticket has a contract,
  an SLA, and billable time against it, it is in the PSA: use
  `autotask-tickets`, `connectwise-psa-tickets`, `halopsa-tickets`,
  `syncro-tickets`, or `atera-tickets`. Check which system holds the queue
  before assuming this one.
- **How to prioritise, categorise, and route an incoming ticket** — this
  skill covers the NinjaOne ticket API; the triage practice itself is
  vendor-agnostic, so use `shared-ticket-triage`.
- **Pulling device and alert context onto a ticket** — that is a
  cross-tool lookup; use `shared-incident-correlation`.
- **The alert that would become a ticket** — use `ninjaone-alerts`.

## API Endpoints

### Create Ticket

```http
POST /api/v2/ticketing/ticket
Content-Type: application/json
Authorization: Bearer {token}
```

```json
{
  "clientId": 123,
  "subject": "Server disk space critical",
  "description": "C: drive on SERVER-01 is at 95% capacity",
  "priority": "HIGH",
  "status": "OPEN",
  "assignedTechnicianId": 456,
  "deviceId": 789,
  "tags": ["disk", "server", "critical"]
}
```

### Update Ticket

```http
PUT /api/v2/ticketing/ticket/{ticketId}
Content-Type: application/json
```

```json
{
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "assignedTechnicianId": 456
}
```

### Get Ticket Log Entries

```http
GET /api/v2/ticketing/ticket/{ticketId}/log-entry
```

Returns all log entries (comments, status changes, time entries) for a ticket.

## Ticket Fields

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated ID |
| `subject` | string | Yes | Brief issue summary |
| `description` | text | No | Detailed description |
| `clientId` | integer | Yes | Organization ID |
| `deviceId` | integer | No | Related device |

### Status Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Current ticket status |
| `priority` | string | Urgency level |
| `assignedTechnicianId` | integer | Assigned tech |

### Metadata

| Field | Type | Description |
|-------|------|-------------|
| `tags` | array | Categorization tags |
| `createTime` | datetime | Creation timestamp |
| `updateTime` | datetime | Last modified |

## Status Values

| Status | Description |
|--------|-------------|
| `OPEN` | New ticket, awaiting triage |
| `IN_PROGRESS` | Actively being worked |
| `WAITING` | Waiting for customer/vendor |
| `ON_HOLD` | Paused pending action |
| `RESOLVED` | Issue resolved |
| `CLOSED` | Ticket complete |

## Priority Levels

| Priority | Description | SLA Target |
|----------|-------------|------------|
| `CRITICAL` | Business down | Immediate |
| `HIGH` | Major impact | 1 hour |
| `MEDIUM` | Moderate impact | 4 hours |
| `LOW` | Minor issue | 24 hours |
| `NONE` | No urgency | Best effort |

## Log Entries

Log entries track all ticket activity:

### Entry Types

| Type | Description |
|------|-------------|
| `COMMENT` | Public or private comment |
| `STATUS_CHANGE` | Status transition |
| `ASSIGNMENT` | Technician assignment change |
| `TIME_ENTRY` | Logged work time |

### Log Entry Structure

```json
{
  "id": 123,
  "type": "COMMENT",
  "content": "Investigated and found corrupted index",
  "public": false,
  "createdBy": {
    "id": 456,
    "name": "John Tech"
  },
  "createTime": "2024-02-15T14:30:00Z"
}
```

## Common Workflows

### Create Ticket from Alert

1. Receive alert notification
2. Get device and organization context
3. Create ticket with device linked
4. Add alert details to description
5. Set priority based on alert severity
6. Assign to appropriate technician

### Ticket Resolution Flow

1. Update status to IN_PROGRESS
2. Add log entries documenting work
3. Log time entries for billing
4. Update status to RESOLVED
5. Add resolution notes
6. Close ticket

### Escalation Workflow

1. Review ticket age and SLA
2. Update priority if needed
3. Reassign to senior tech
4. Add escalation note
5. Notify stakeholders

## Integration with Devices

Link tickets to devices for context:

```json
{
  "subject": "Outlook crashes repeatedly",
  "deviceId": 12345,
  "description": "User reports Outlook crashes when opening attachments"
}
```

Benefits:
- Quick access to device details
- View device alerts in ticket context
- Run remote actions from ticket

## Tags for Categorization

```json
{
  "tags": [
    "email",
    "outlook",
    "crash",
    "user-reported"
  ]
}
```

Common tag patterns:
- Issue type: `hardware`, `software`, `network`
- Application: `outlook`, `office`, `vpn`
- Source: `user-reported`, `alert`, `scheduled`
- Priority override: `vip`, `urgent`

## Best Practices

1. **Use descriptive subjects** - Include who, what, where
2. **Log all work** - Essential for billing and knowledge
3. **Update status promptly** - Keeps queues accurate

## Error Handling

| Code | Description | Resolution |
|------|-------------|------------|
| 400 | Invalid request | Check required fields |
| 404 | Ticket not found | Verify ticket ID |
| 403 | Access denied | Check organization permissions |
| 422 | Validation error | Review field values |

## Related Skills

- [Devices](../devices/SKILL.md) - Device context
- [Alerts](../alerts/SKILL.md) - Alert-to-ticket flow
- [Organizations](../organizations/SKILL.md) - Client context
- [API Patterns](../api-patterns/SKILL.md) - Authentication
