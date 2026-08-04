---
name: "Autotask Tickets"
description: >
  Autotask ticket lifecycle: status/priority codes and transition rules,
  the ticket field schema, SLA calculation and clock behavior, escalation
  rules, ticket metrics, and the MCP tool surface (create, update, search,
  history, notes) for MSP service desk operations.
when_to_use: >-
  When creating, updating, searching, or managing service desk operations. Use when: autotask
  ticket, service ticket, create ticket autotask, ticket queue, ticket status, ticket priority,
  autotask service desk, ticket triage, escalate ticket, resolve ticket, ticket notes, time entry
  ticket, sla calculation, ticket metrics, ticket kpi, ticket history, ticket audit trail, status
  transition, who changed, or when did ticket.
---

# Autotask Ticket Management

## Overview

Autotask tickets are the core unit of service delivery in the PSA. Every client request, incident, problem, and change flows through the ticketing system. This skill covers comprehensive ticket management including business logic, SLA calculations, escalation rules, and performance metrics.

## Anti-triggers

- **The status, priority, and queue IDs configured in your tenant** —
  the tables below are Autotask defaults and are routinely customised;
  fetch the real values with `autotask-picklists`.
- **Note bodies, attachments, or charges hanging off a ticket** — use
  `autotask-ticket-notes-attachments`.
- **Structured multi-phase work** — project Tasks are a separate entity
  from Tickets; use `autotask-projects`.
- **Tickets in Kaseya's other PSAs** — BMS
  (`kaseya-bms-api-patterns`) and VSA (`kaseya-vsa-api-patterns`) each
  have their own ticket objects that do not sync with Autotask.

## Ticket Status Codes

Based on the Autotask API, these are the standard ticket status values:

| Status ID | Name | Description | Business Logic |
|-----------|------|-------------|----------------|
| **1** | NEW | Newly created ticket | Default for new tickets, SLA clock starts |
| **2** | IN_PROGRESS | Actively being worked | Resource should be assigned |
| **5** | COMPLETE | Issue resolved | Requires resolution field, stops SLA |
| **6** | WAITING_CUSTOMER | Awaiting customer response | SLA clock may pause |
| **13** | WAITING_MATERIALS | Waiting for parts/equipment | SLA clock may pause |
| **14** | ESCALATED | Escalated to higher tier | Requires escalation reason |

### Status Transition Rules

```
NEW (1) ──────────────────────────────> COMPLETE (5)
   │                                        ↑
   ↓                                        │
IN_PROGRESS (2) ──────────────────────────>─┤
   │         │                              │
   │         ↓                              │
   │    WAITING_CUSTOMER (6) ──────────────>─┤
   │         │                              │
   │         ↓                              │
   │    WAITING_MATERIALS (13) ────────────>─┘
   │
   ↓
ESCALATED (14) ─────> IN_PROGRESS (2) ────> COMPLETE (5)
```

**Validation Rules:**
- Completing directly from NEW generates a warning
- COMPLETE requires resolution field
- ESCALATED requires escalation reason
- IN_PROGRESS should have assigned resource

## Ticket Priority Levels

| Priority ID | Name | Response SLA | Resolution SLA | Business Context |
|-------------|------|--------------|----------------|------------------|
| **4** | CRITICAL | 1 hour | 4 hours | Complete business outage |
| **3** | HIGH | 2 hours | 8 hours | Major productivity impact |
| **2** | MEDIUM | 4 hours | 24 hours | Single user/workaround exists |
| **1** | LOW | 8 hours | 72 hours | Minor issue/enhancement |

**Note:** In Autotask, lower numbers = lower priority. Priority 4 is most urgent.

## Ticket Field Reference

Core fields to know: `title`, `companyID`, `status`, `priority`, `queueID` (all required on create); `contactID`, `issueType`/`subIssueType`, `assignedResourceID` + `assignedResourceRoleID` (must be set together), `dueDateTime`, and `resolution` (required when completing).

See [references/fields.md](references/fields.md) for the complete field reference (core, classification, assignment, SLA/timeline, contract/billing, and resolution fields).

## SLA Calculation Logic

### Default SLA Times by Priority

```typescript
const SLA_DEFAULTS = {
  CRITICAL: { response: 1, resolution: 4 },   // hours
  HIGH:     { response: 2, resolution: 8 },
  MEDIUM:   { response: 4, resolution: 24 },
  LOW:      { response: 8, resolution: 72 }
};
```

Contract SLA terms override these defaults when present. See [references/examples.md](references/examples.md) for the due-date calculation function.

### SLA Clock Behavior

| Status | SLA Clock |
|--------|-----------|
| NEW | Running |
| IN_PROGRESS | Running |
| WAITING_CUSTOMER | **Paused** (configurable) |
| WAITING_MATERIALS | **Paused** (configurable) |
| ESCALATED | Running |
| COMPLETE | **Stopped** |

## Escalation Rules

### Escalation Levels

| Level | Trigger | Action |
|-------|---------|--------|
| 1 | SLA 0-4 hours overdue | Notify assigned resource |
| 2 | SLA 4-8 hours overdue | Notify team lead |
| 3 | SLA 8+ hours overdue | Notify management |

Automatic escalation triggers: an SLA violation (overdue `dueDateTime`), a stale `WAITING_CUSTOMER` status (no activity for 7+ days), and CRITICAL-priority tickets with no `assignedResourceID`. See [references/examples.md](references/examples.md) for the rule-check implementation.

## Ticket Metrics & KPIs

Key metrics: average resolution time (`completedDate` − `createDate` for COMPLETE tickets), SLA compliance rate (completed-on-time or still-within-SLA, divided by tickets with a due date), and escalation count. See [references/examples.md](references/examples.md) for the calculation function and a sample status/priority distribution report.

## MCP Tool Reference

### Create a Ticket

```
Tool: autotask_create_ticket
Args: {
  "companyID": 12345,
  "title": "Unable to access email - multiple users affected",
  "description": "Sales team (5 users) reporting Outlook showing disconnected since 9am.",
  "queueID": 8,
  "priority": 3,
  "status": 1,
  "contactID": 67890
}
```

**Required:** `companyID`, `title`, `status`, `priority`, `queueID`

### Update a Ticket

```
Tool: autotask_update_ticket
Args: {
  "ticketId": 54321,
  "status": 2,
  "assignedResourceID": 29744150,
  "assignedResourceRoleID": 29683459
}
```

**Only fields provided will be changed.** Common update scenarios:

| Scenario | Fields to Set |
|----------|--------------|
| Assign technician | `assignedResourceID` + `assignedResourceRoleID` (both required together) |
| Change status | `status` (see status codes above) |
| Complete ticket | `status: 5` (resolution via ticket note) |
| Escalate | `status: 14` |
| Update priority | `priority` |
| Change due date | `dueDateTime` (ISO 8601 format) |
| Reassign contact | `contactID` |

### Search Tickets

```
Tool: autotask_search_tickets
Args: {
  "companyId": 12345,
  "status": 1,
  "assignedResourceId": 29744150,
  "searchTerm": "email",
  "pageSize": 25
}
```

**Filters:** `companyId`, `status`, `priority`, `queueId`, `assignedResourceId`, `searchTerm`, `pageSize`

### Get Ticket Details

```
Tool: autotask_get_ticket_details
Args: { "ticketId": 54321 }
```

### Get Ticket History (Audit Trail)

Use this to answer **status transition** and **change attribution** questions — e.g. "when did this ticket move from In Progress to Waiting Customer?", "who changed the priority?", "how long did it sit in NEW before someone picked it up?". Each row is one audited field change on the ticket.

```
Tool: autotask_search_ticket_history
Args: { "ticketId": 54321, "pageSize": 100 }
```

**Required:** `ticketId` (Autotask does not support unscoped history queries — there is no way to ask "show me every status transition across all tickets" without enumerating ticket IDs and looping). `pageSize` defaults to 50, max 500.

Returns an array of history entries. Field set is picklist-dependent; common fields include `id`, `ticketID`, `resourceID` (who made the change), `dateChanged`, and field-specific before/after columns. For status transitions, look for changes where the audited field is `status` and compare the before/after picklist IDs against the status codes table above.

**Workflow for "find tickets that went from status X to status Y":**
1. `autotask_search_tickets` with the relevant filters (company, date range, current status) to get candidate ticket IDs.
2. For each candidate, call `autotask_search_ticket_history` and look for a status-field change where old=X and new=Y.
3. This is a fan-out pattern. On large tenants, scope the initial search tightly (by company, date, or assigned resource) before looping.

To fetch a single history entry by its ID:
```
Tool: autotask_get_ticket_history
Args: { "historyId": 987654 }
```

### Add a Ticket Note

```
Tool: autotask_create_ticket_note
Args: {
  "ticketId": 54321,
  "title": "Status Update",
  "description": "Identified root cause as KB5034441 update. Applying fix.",
  "noteType": 1,
  "publish": 0
}
```

`noteType`: 1=Internal, 2=External. `publish`: 0=No, 1=Yes (visible to client portal).

## API Patterns

### Creating a Ticket with Business Validation

```http
POST /v1.0/Tickets
Content-Type: application/json
```

```json
{
  "companyID": 12345,
  "title": "Unable to access email - multiple users affected",
  "description": "Sales team (5 users) reporting Outlook showing disconnected since 9am. Webmail working.",
  "queueID": 8,
  "priority": 3,
  "status": 1,
  "issueType": 5,
  "subIssueType": 12,
  "contactID": 67890,
  "dueDateTime": "2024-02-15T17:00:00Z"
}
```

### Query Builder Patterns

**Open tickets for company with includes:**
```json
{
  "filter": [
    {"field": "companyID", "op": "eq", "value": 12345},
    {"field": "status", "op": "noteq", "value": 5}
  ],
  "includeFields": ["Company.companyName", "AssignedResource.firstName", "AssignedResource.lastName"]
}
```

**Tickets created today (CORRECT — must use gte + lt range):**
```json
{
  "filter": [
    {"field": "createDate", "op": "gte", "value": "2026-04-13T00:00:00Z"},
    {"field": "createDate", "op": "lt", "value": "2026-04-14T00:00:00Z"}
  ]
}
```

> **Warning:** Using only today's date returns **zero results**. You MUST use a range: `gte` today AND `lt` tomorrow. See the api-patterns skill for the full explanation and dynamic date computation.

See [references/api.md](references/api.md) for additional query patterns (SLA-breached tickets, date-range queries) and the full status-update / note-creation request bodies (complete-with-resolution, escalate-with-reason, internal vs external notes).

## Common Workflows

### Ticket Creation Flow

1. **Validate company exists** and has active contract
2. **Check for duplicates** - search open tickets with similar title
3. **Auto-set defaults:**
   - Status → NEW (1)
   - Priority → MEDIUM (2) if not specified
4. **Calculate SLA** based on priority and contract
5. **Route to queue** based on issue type
6. **Send acknowledgment** to contact

### Status Transition Validation

Before transitioning a ticket, validate required fields per target status: COMPLETE requires `resolution` (and warns if skipping the IN_PROGRESS step), ESCALATED requires `escalationReason`, and IN_PROGRESS warns if no `assignedResourceID` is set. See [references/examples.md](references/examples.md) for the validation function.

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid field value | Verify picklist IDs for your instance |
| 400 | Status transition not allowed | Check workflow rules |
| 401 | Unauthorized | Verify API credentials |
| 403 | Insufficient permissions | Check resource security level |
| 404 | Entity not found | Confirm ticket/company exists |
| 409 | Conflict/Locked | Ticket being edited by another user |
| 429 | Rate limited | Implement exponential backoff |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| CompanyID required | Missing company | All tickets need a company |
| QueueID invalid | Queue not found | Query `/v1.0/Queues` for valid IDs |
| Resolution required | Completing without resolution | Add resolution text |
| Status transition invalid | Invalid workflow | Check allowed transitions |

## Best Practices

1. **Validate before creating** - Search for duplicates, verify company/contract
2. **Use descriptive titles** - Include who's affected and symptoms
3. **Set accurate priority** - Use impact/urgency matrix, not everything is Critical
4. **Log time immediately** - Don't batch at end of day
5. **Update status promptly** - Keeps queues accurate for reporting
6. **Use internal notes for technical details** - Keep external notes professional
7. **Monitor SLA metrics** - Address breaches before they escalate

## Related Skills

- [Autotask CRM](../crm/SKILL.md) - Company and contact management
- [Autotask Contracts](../contracts/SKILL.md) - Service agreements and billing
- [Autotask Time Entries](../time-entries/SKILL.md) - Time tracking and billing
- [Autotask API Patterns](../api-patterns/SKILL.md) - Query builder and authentication
