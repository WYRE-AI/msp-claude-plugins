---
name: "HaloPSA Tickets"
description: "HaloPSA service desk tickets: ticket fields, statuses, priorities and ticket types, actions (notes and time entries), attachments, SLA behaviour, and the creation and status-transition workflows with their validation rules."
when_to_use: >-
  When creating, updating, searching, or otherwise managing HaloPSA service desk work.
  Use when: halopsa
  ticket, halo ticket, service ticket halopsa, create ticket halopsa, ticket status halo, ticket
  priority halo, halopsa service desk, halo helpdesk, ticket actions, ticket notes halopsa, or
  halopsa sla.
---

# HaloPSA Ticket Management

Tickets are the core unit of service delivery in HaloPSA. The API uses array-wrapped payloads for all write operations (`POST /api/Tickets` with `[{...}]`). Status, priority, and ticket type IDs are instance-configurable -- always query `/api/Status`, `/api/Priority`, and `/api/TicketType` to get valid values.

## Anti-triggers

A HaloPSA ticket type is often named "Incident", which collides with two
other meanings of the word. The routing test is what the operator does
next: answer a client under an SLA clock and bill the time (this skill),
page a responder, or approve a remediation on a compromised endpoint.

- **An on-call service incident** — something is broken and a human must
  be woken up; the deliverable is acknowledgement and restoration, not a
  client-visible action and a time entry. Use `pagerduty-incidents` or
  `rootly-incidents`.
- **A confirmed security incident** — malware or intrusion with a
  remediation to approve. Use `huntress-incidents`, or
  `sentinelone-alerts` for raw EDR detections.
- **Tickets in another PSA or helpdesk** — the vocabulary is nearly
  identical but the field models are not (Halo wraps every write in an
  array and uses instance-configurable status IDs). Use
  `freshdesk-ticketing`, `connectwise-psa-tickets`, or `autotask-tickets`.
- **Whether the work is covered and at what rate** — contract type,
  prepaid-hour balances, and the SLA attached to the agreement are
  `halopsa-contracts`; this skill only reads the resulting SLA fields on
  the ticket.
- **The device the ticket is about** — asset and CI records are
  `halopsa-assets`; the client, site, or end user are `halopsa-clients`.
- **A ticket raised in an RMM's own helpdesk** — Atera, NinjaOne,
  Syncro, and SuperOps each ship a queue alongside the agent, and a
  shop running Halo for service desk often still has tickets sitting
  there. Use `atera-tickets`, `ninjaone-rmm-tickets`,
  `syncro-tickets`, or `superops-tickets`.

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
