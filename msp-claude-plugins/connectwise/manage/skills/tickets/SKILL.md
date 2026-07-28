---
name: "connectwise-manage-tickets"
description: >
  ConnectWise PSA ticket management: ticket fields, service boards, statuses,
  priorities, SLAs, ticket notes, and workflow automation. Essential for MSP
  technicians handling service delivery through ConnectWise PSA.
when_to_use: >-
  When creating, updating, searching, or managing service desk operations. Use when: connectwise
  ticket, connectwise psa ticket, service ticket connectwise, create ticket connectwise, ticket
  board, ticket status connectwise, ticket priority, connectwise service desk, ticket triage,
  escalate ticket, resolve ticket, ticket notes, sla calculation, or ticket workflow.
---

# ConnectWise PSA Ticket Management

Tickets are the core unit of service delivery in ConnectWise PSA. Every client request, incident, and change flows through `POST /service/tickets`. This skill covers creating, searching, updating, and closing tickets with proper SLA handling.

> For complete field definitions see [FIELDS.md](./FIELDS.md). For status values, priorities, SLA tables, and note types see [REFERENCE.md](./REFERENCE.md).

## Core API Operations

### Create a Ticket

```http
POST /service/tickets
Content-Type: application/json

{
  "summary": "Unable to access email - multiple users affected",
  "board": {"id": 1},
  "company": {"id": 12345},
  "contact": {"id": 67890},
  "priority": {"id": 2},
  "status": {"name": "New"},
  "initialDescription": "Sales team (5 users) reporting Outlook disconnected since 9am. Webmail working."
}
```

Required fields: `summary`, `board`, `company`. Use `initialDescription` for the first note with full details.

### Get / Update a Ticket

```http
GET /service/tickets/{id}
```

```http
PATCH /service/tickets/{id}
Content-Type: application/json

{"status": {"name": "In Progress"}, "owner": {"id": 123}}
```

### Add a Note

```http
POST /service/tickets/{ticketId}/notes
Content-Type: application/json

{
  "text": "Identified the issue as a DNS configuration problem.",
  "internalAnalysisFlag": true,
  "resolutionFlag": false
}
```

Set `resolutionFlag: true` for resolution notes visible to the customer on close.

### Search Tickets

```http
GET /service/tickets?conditions=company/id=12345 and status/name!="Closed"&orderBy=priority/id asc
```

## Common Query Patterns

```
# Open tickets for a company
conditions=company/id=12345 and closedFlag=false

# High priority open tickets
conditions=priority/id<=2 and closedFlag=false

# Tickets by date range
conditions=dateEntered>=[2024-01-01] and dateEntered<[2024-02-01]

# SLA-breached tickets
conditions=_info/sla_resolve_by<[2024-02-15T12:00:00Z] and closedFlag=false

# My assigned tickets
conditions=resources contains "jsmith" and closedFlag=false
```

## Workflow: Ticket Closure with Validation

Follow these checkpoints before closing any ticket:

1. **Verify resolution exists** — `GET /service/tickets/{id}` and confirm `resolution` field is populated. If empty, add a resolution note first (`resolutionFlag: true`).
2. **Check time entries** — `GET /time/entries?conditions=chargeToId={id} and chargeToType="ServiceTicket"`. Ensure all work is logged.
3. **Confirm status is Completed** — Tickets must pass through `Completed` before `Closed`. Set status to `Completed` first if still `In Progress` or waiting.
4. **Close the ticket:**
   ```http
   PATCH /service/tickets/{id}
   Content-Type: application/json

   {
     "status": {"name": "Closed"},
     "closedFlag": true,
     "resolution": "DNS records corrected; email service restored for all affected users."
   }
   ```
5. **Validate closure** — `GET /service/tickets/{id}` and confirm `closedFlag: true` and `closedDate` is populated.

> If any checkpoint fails, stop and resolve the issue before proceeding. Closing without a resolution note will leave the ticket incomplete in reports.

## Best Practices

1. **Always specify board** — determines available statuses, workflows, and SLA rules.
2. **Set accurate priority** — use impact/urgency; Priority 1 = highest (business down). See [REFERENCE.md](./REFERENCE.md) for the matrix.
3. **Search before creating** — check for duplicates with `conditions=company/id={id} and summary contains "keyword"`.
4. **Update status promptly** — keeps SLA clocks accurate and queues reliable.

## Related Skills

- [ConnectWise Companies](../companies/SKILL.md) — Company management
- [ConnectWise Contacts](../contacts/SKILL.md) — Contact management
- [ConnectWise Time Entries](../time-entries/SKILL.md) — Time tracking
- [ConnectWise API Patterns](../api-patterns/SKILL.md) — Query syntax and auth
