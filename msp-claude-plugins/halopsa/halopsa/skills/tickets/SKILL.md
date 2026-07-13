---
name: "halopsa-tickets"
description: "Use this skill when working with HaloPSA tickets - creating, updating, searching, or managing service desk operations. Covers ticket fields, statuses, priorities, ticket types, actions, attachments, SLAs, and workflows. Essential for MSP technicians handling service delivery through HaloPSA."
when_to_use: >-
  When creating, updating, searching, or managing service desk operations. Use when: halopsa
  ticket, halo ticket, service ticket halopsa, create ticket halopsa, ticket status halo, ticket
  priority halo, halopsa service desk, halo helpdesk, ticket actions, ticket notes halopsa, or
  halopsa sla.
---

# HaloPSA Ticket Management

Tickets are the core unit of service delivery in HaloPSA. The API uses array-wrapped payloads for all write operations (`POST /api/Tickets` with `[{...}]`). Status, priority, and ticket type IDs are instance-configurable -- always query `/api/Status`, `/api/Priority`, and `/api/TicketType` to get valid values.

## Core API Operations

### Create Ticket

```http
POST /api/Tickets
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "summary": "Unable to access email - multiple users affected",
    "details": "<p>Sales team (5 users) reporting Outlook disconnected since 9am.</p>",
    "client_id": 123,
    "site_id": 456,
    "user_id": 789,
    "tickettype_id": 1,
    "status_id": 1,
    "priority_id": 2,
    "category_1": "Email",
    "agent_id": 101,
    "team_id": 5
  }
]
```

### Get / Search Tickets

```http
GET /api/Tickets/54321                                    # single ticket
GET /api/Tickets/54321?includedetails=true&includeactions=true  # with related data
GET /api/Tickets?client_id=123&open_only=true             # open tickets for client
GET /api/Tickets?search=email%20not%20working              # text search
GET /api/Tickets?page_no=1&page_size=50&orderdesc=true     # paginated
```

### Update Ticket

```http
POST /api/Tickets
```

```json
[{ "id": 54321, "status_id": 2, "agent_id": 101 }]
```

Resolve with resolution note:

```json
[{ "id": 54321, "status_id": 8, "resolution": "Cleared Outlook cache and repaired Office installation." }]
```

### Add Action (Note / Time Entry)

```http
POST /api/Actions
```

Internal note:

```json
[{ "ticket_id": 54321, "note": "<p>Root cause: KB5034441 update.</p>", "actiontype_id": 0, "hiddenfromuser": true }]
```

Client-visible note with email:

```json
[{ "ticket_id": 54321, "note": "<p>We've identified the cause and are working on a fix.</p>", "actiontype_id": 0, "hiddenfromuser": false, "emailto": "john@acme.com" }]
```

Time entry:

```json
[{ "ticket_id": 54321, "note": "<p>Troubleshooting email connectivity.</p>", "timetaken": 30, "charge": true, "actiontype_id": 0, "agent_id": 101 }]
```

### Attachments

```http
POST /api/Attachment          # multipart/form-data: file, ticket_id, filename, isimage
GET  /api/Attachment?ticket_id=54321   # list attachments
```

## Ticket Creation Workflow (with Validation)

1. **Validate client** -- `GET /api/Clients/{client_id}`. If not found: stop and report error.
2. **Check active contract** -- `GET /api/ClientContract?client_id={id}&active_only=true`. If no active contract: stop and notify, or proceed per org policy.
3. **Search for duplicates** -- `GET /api/Tickets?client_id={id}&open_only=true&search={summary_keywords}`. If duplicate found: link tickets via action note instead of creating new ticket.
4. **Create ticket** -- `POST /api/Tickets` with defaults: `status_id=1`, `priority_id=3` (if unspecified).
5. **Verify creation** -- confirm response contains `id`. If 400 error: check required fields (`client_id`, `summary`, `tickettype_id`).
6. **Route and notify** -- assign team based on category/client config, send acknowledgment action.

### Status Transition Validation

Before changing status, verify:
- **To Resolved/Closed (8/9)**: `resolution` field is required. Warn if moving directly from New without In Progress step.
- **To In Progress (2)**: `agent_id` should be assigned. Warn if missing.
- **Any transition**: query `/api/Status` to confirm target status is valid for your instance.

## Best Practices

- **Search before creating** -- always check for duplicate open tickets for the same client
- **Use `hiddenfromuser: true`** for technical notes; keep client-facing notes professional
- **Log time entries as work happens** -- attach `timetaken` and `charge` to action notes
- **Monitor SLA states proactively** -- tickets with `slahold=false` approaching `deadlinedate` need escalation

## Reference Files

- [FIELDS.md](./FIELDS.md) -- complete ticket field reference (core, classification, assignment, timeline, SLA, contract fields)
- [ERRORS.md](./ERRORS.md) -- API error codes and validation error resolution
- [REFERENCE.md](./REFERENCE.md) -- status codes, priority levels, action types, SLA states, status transition flow

## Related Skills

- [HaloPSA Clients](../clients/SKILL.md) -- client and contact management
- [HaloPSA Contracts](../contracts/SKILL.md) -- service agreements and billing
- [HaloPSA Assets](../assets/SKILL.md) -- asset tracking
- [HaloPSA API Patterns](../api-patterns/SKILL.md) -- authentication and queries
