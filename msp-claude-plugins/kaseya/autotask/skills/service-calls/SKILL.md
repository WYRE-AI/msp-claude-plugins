---
name: "Autotask Service Calls"
description: >
  Autotask Service Call data model - the ServiceCall / ServiceCallTicket /
  ServiceCallTicketResource three-layer structure - covering fields, status codes, and how
  tickets and technicians (resources) are linked to scheduled work.
when_to_use: >-
  When creating, scheduling, updating, or completing service calls linked to tickets. Use when:
  autotask service call, service call, schedule service call, create service call, complete
  service call, close service call, service call ticket, service call resource, assign technician
  service call, schedule visit, planned work autotask, or dispatch technician.
---

# Autotask Service Call Management

## Overview

Service Calls in Autotask are used to schedule and plan work against tickets. They represent a planned visit or block of work — linking one or more tickets to a time slot and assigning technicians. This skill covers the full lifecycle: creating service calls, linking tickets, assigning resources, and completing/closing them.

## Anti-triggers

- **The underlying request being worked** — a service call schedules
  tickets, it does not replace them; use `autotask-tickets`.
- **Hours actually worked** — a service call is a plan; billable time
  is logged separately with `autotask-time-entries`.
- **Multi-phase planned work with dependencies** — use
  `autotask-projects`.

## Service Call Status Codes

| Status ID | Name | Description |
|-----------|------|-------------|
| **1** | New | Freshly created, not yet dispatched |
| **2** | In Progress | Technician is actively working |
| **5** | Complete | Work completed |

> **Instance note:** Status picklist values are instance-specific. Use `autotask_get_field_info` with `entityType: "ServiceCalls"` to confirm valid values for your Autotask instance.

## Data Model

Service Calls have a three-layer structure:

```
ServiceCall
  └── ServiceCallTicket(s)        ← links a Ticket to the ServiceCall
        └── ServiceCallTicketResource(s)  ← assigns a Technician to that ticket
```

- A single `ServiceCall` can cover **multiple tickets**
- Each `ServiceCallTicket` can have **multiple resources** (technicians)
- Resources can have a `roleID` to specify their role for billing purposes

## Complete Field Reference

### ServiceCall Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated ID |
| `description` | string | Yes | Description of the service call |
| `status` | int | No | Status picklist ID (default: 1 = New) |
| `startDateTime` | datetime | Yes | Scheduled start (ISO 8601) |
| `endDateTime` | datetime | Yes | Scheduled end (ISO 8601) |
| `duration` | decimal | System | Calculated from start/end |
| `companyID` | int | No | Company this service call is for |
| `companyLocationID` | int | No | Site/location within the company |
| `complete` | boolean | No | Set `true` to mark complete |
| `createDate` | datetime | System | When the service call was created |
| `creatorResourceID` | int | System | Who created the service call |
| `lastModifiedDateTime` | datetime | System | Last update timestamp |

### ServiceCallTicket Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated ID |
| `serviceCallID` | int | Yes | The parent service call |
| `ticketID` | int | Yes | The linked ticket |

### ServiceCallTicketResource Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated ID |
| `serviceCallTicketID` | int | Yes | The parent service call ticket |
| `resourceID` | int | Yes | The technician (resource) to assign |
| `roleID` | int | No | Role for billing rate determination |

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `autotask_get_service_call` | Get a service call by ID |
| `autotask_search_service_calls` | Search by company, status, or date range |
| `autotask_create_service_call` | Create a new service call |
| `autotask_update_service_call` | Update details, times, or status |
| `autotask_delete_service_call` | Delete a service call |
| `autotask_search_service_call_tickets` | Find tickets linked to a service call |
| `autotask_create_service_call_ticket` | Link a ticket to a service call |
| `autotask_delete_service_call_ticket` | Remove a ticket from a service call |
| `autotask_search_service_call_ticket_resources` | Find technicians assigned to a service call ticket |
| `autotask_create_service_call_ticket_resource` | Assign a technician to a service call ticket |
| `autotask_delete_service_call_ticket_resource` | Remove a technician assignment |

## Common Workflows

### Create a Service Call and Link a Ticket

```
1. autotask_create_service_call
   → description, startDateTime, endDateTime, companyID

2. autotask_create_service_call_ticket
   → serviceCallID (from step 1), ticketID

3. autotask_create_service_call_ticket_resource
   → serviceCallTicketID (from step 2), resourceID, roleID
```

### Complete a Service Call

Two equivalent approaches:
```
# Option A: Set complete flag
autotask_update_service_call → serviceCallId, complete: true

# Option B: Update status
autotask_update_service_call → serviceCallId, status: 5
```

### Find All Tickets for a Service Call

```
autotask_search_service_call_tickets → serviceCallId: <id>
```

### Find All Service Calls for a Ticket

```
autotask_search_service_call_tickets → ticketId: <id>
```

### Find Upcoming Service Calls for a Company

```
autotask_search_service_calls → companyId: <id>, startAfter: "2026-03-22T00:00:00Z"
```

## API Patterns

### Create Service Call

```http
POST /v1.0/ServiceCalls
Content-Type: application/json
```

```json
{
  "description": "On-site visit - network troubleshooting",
  "status": 1,
  "startDateTime": "2026-03-25T09:00:00Z",
  "endDateTime": "2026-03-25T12:00:00Z",
  "companyID": 12345
}
```

### Link Ticket to Service Call

```http
POST /v1.0/ServiceCallTickets
Content-Type: application/json
```

```json
{
  "serviceCallID": 99001,
  "ticketID": 54321
}
```

### Assign Technician

```http
POST /v1.0/ServiceCallTicketResources
Content-Type: application/json
```

```json
{
  "serviceCallTicketID": 88001,
  "resourceID": 29744150,
  "roleID": 5
}
```

### Update / Complete Service Call

```http
PATCH /v1.0/ServiceCalls
Content-Type: application/json
```

```json
{
  "id": 99001,
  "complete": true
}
```

### Query Service Calls

```http
POST /v1.0/ServiceCalls/query
Content-Type: application/json
```

**Upcoming service calls for a company:**
```json
{
  "filter": [
    { "op": "eq", "field": "companyID", "value": 12345 },
    { "op": "gte", "field": "startDateTime", "value": "2026-03-22T00:00:00Z" }
  ],
  "pageSize": 25
}
```

**Open service calls (not complete):**
```json
{
  "filter": [
    { "op": "noteq", "field": "status", "value": 5 }
  ]
}
```

## Error Handling

| Code | Cause | Resolution |
|------|-------|------------|
| 400 | Missing required fields | Ensure `description`, `startDateTime`, `endDateTime` are provided |
| 400 | Invalid datetime format | Use ISO 8601 format: `2026-03-25T09:00:00Z` |
| 404 | Service call not found | Confirm the ID exists |
| 404 | Ticket not found | Confirm ticket ID before linking |

## Best Practices

1. **Always link at least one ticket** — A service call with no linked tickets has no billable context
2. **Assign resources after linking tickets** — `ServiceCallTicketResource` requires a `ServiceCallTicketID`, not a `ServiceCallID`
3. **Set `companyID` on the service call** — Helps with scheduling views and reporting
4. **Use `autotask_get_field_info`** to discover instance-specific status picklist values before creating service calls
5. **Complete promptly** — Mark service calls complete when work is done so scheduling boards stay accurate

## Related Skills

- [Autotask Tickets](../tickets/SKILL.md) - Ticket management
- [Autotask Time Entries](../time-entries/SKILL.md) - Time tracking and billing
- [Autotask API Patterns](../api-patterns/SKILL.md) - Query builder and authentication
