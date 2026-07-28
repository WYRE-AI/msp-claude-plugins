---
name: "SuperOps Tickets"
description: >
  SuperOps.ai service desk ticketing: ticket fields, status and priority
  enums, client/site/requester/assignee associations, notes, time entries,
  and the GraphQL mutations and queries behind them. Includes triage and
  escalation workflows, input validation rules, and common ticket API errors.
when_to_use: >-
  When creating, updating, searching, or managing service desk operations in SuperOps.ai.
  Use when: superops ticket, service ticket superops, create ticket superops, ticket status
  superops, ticket priority, superops service desk, ticket triage, escalate ticket, resolve
  ticket superops, ticket notes superops, or time entry ticket.
---

# SuperOps.ai Ticket Management

## Overview

SuperOps.ai tickets are the core unit of service delivery in the PSA. Every client request, incident, and service task flows through the ticketing system. This skill covers comprehensive ticket management including creation, updates, notes, time entries, and workflow automation using the GraphQL API.

## Ticket Status Values

| Status | Description | Business Logic |
|--------|-------------|----------------|
| **Open** | Newly created or reopened | Default for new tickets |
| **In Progress** | Actively being worked | Technician assigned |
| **Pending** | Waiting for external action | SLA clock may pause |
| **Resolved** | Issue addressed | Awaiting confirmation |
| **Closed** | Ticket complete | No further action |

## Ticket Priority Levels

| Priority | Description | Typical Response |
|----------|-------------|------------------|
| **Critical** | Business-stopping issue | Immediate response |
| **High** | Major productivity impact | 1-2 hours |
| **Medium** | Single user/workaround exists | 4-8 hours |
| **Low** | Minor issue/enhancement | Next business day |

## Key Ticket Fields

Only two fields are required on create: `subject` (String) and `client`
(ClientIdentifier). The rest are optional but drive routing and reporting:

| Field | Type | Purpose |
|-------|------|---------|
| `assignee` / `techGroup` | Identifier | Routing to a technician or queue |
| `requester` | RequesterIdentifier | Person who reported (accepts `email`) |
| `priority` | Enum | Critical, High, Medium, Low |
| `ticketType` | Enum | Incident, Service Request, Problem, Change |
| `category` | CategoryIdentifier | Service category |

Identifier inputs are objects, not scalars — `client` takes `{ "accountId": ... }`,
`techGroup` and `category` accept `{ "name": ... }`, `requester` accepts `{ "email": ... }`.

See [references/fields.md](references/fields.md) for the complete field reference.

## GraphQL Operations

| Operation | Type | Purpose |
|-----------|------|---------|
| `createTicket` | mutation | Create a ticket |
| `getTicketList` | query | List/search tickets with filter, orderBy, cursor paging |
| `getTicket` | query | Full detail for one ticket |
| `updateTicket` | mutation | Change status, priority, assignee, resolution |
| `addTicketNote` | mutation | Internal (`isPublic: false`) or client-visible note |
| `addTicketTimeEntry` | mutation | Log time (`duration` in minutes, `billable` flag) |

`getTicketList` returns a `listInfo` block (`totalCount`, `hasNextPage`, `endCursor`)
for cursor pagination; `first` controls page size.

See [references/api.md](references/api.md) for the full operation catalog with
request shapes and variable examples.

## Common Workflows

### Ticket Creation Flow

1. **Validate client exists** - Query client by name or ID
2. **Check for duplicates** - Search recent tickets with similar subject
3. **Set defaults:**
   - Status: Open
   - Priority: Medium (if not specified)
4. **Create ticket** - Use createTicket mutation
5. **Send acknowledgment** - Note auto-reply to requester

### Ticket Triage Workflow

1. Query `getTicketList` filtered to `status: ["Open"]` with `assignee: null`,
   ordered by `priority` descending.
2. Assign each ticket via `updateTicket` (set `assignee` and `status: "In Progress"`).

### Escalation Workflow

Escalation is an `updateTicket` call that raises `priority` and reassigns
`techGroup` to the higher tier, with an `escalationReason` recording why.

See [references/api.md](references/api.md) for both workflow queries.

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Client not found | Invalid client ID | Verify client exists |
| Invalid status transition | Workflow rule violation | Check allowed transitions |
| Required field missing | Missing subject/client | Add required fields |
| Permission denied | Insufficient access | Check user permissions |
| Rate limit exceeded | Over 800 req/min | Implement backoff |

### Validation Patterns

```javascript
// Validate before creating ticket
function validateTicketInput(input) {
  const errors = [];

  if (!input.subject || input.subject.trim().length === 0) {
    errors.push('Subject is required');
  }

  if (!input.client?.accountId) {
    errors.push('Client is required');
  }

  if (input.priority && !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(input.priority)) {
    errors.push('Invalid priority level');
  }

  return errors;
}
```

## Best Practices

1. **Validate before creating** - Search for duplicates, verify client
2. **Use descriptive subjects** - Include who's affected and symptoms
3. **Set accurate priority** - Use impact/urgency matrix
4. **Log time immediately** - Don't batch at end of day
5. **Update status promptly** - Keeps queues accurate
6. **Use internal notes for technical details** - Keep public notes professional

## Related Skills

- [SuperOps.ai Clients](../clients/SKILL.md) - Client and contact management
- [SuperOps.ai Assets](../assets/SKILL.md) - Asset inventory
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Alert management
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
