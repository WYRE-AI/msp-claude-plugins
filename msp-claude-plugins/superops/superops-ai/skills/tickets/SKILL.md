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

## Anti-triggers

- **Tickets in another PSA** — `connectwise-psa-tickets`,
  `autotask-tickets`, `halopsa-tickets`, `syncro-tickets`, and
  `atera-tickets` are separate queues. Nothing here reads or writes
  them.
- **The alert that produced the ticket** — use `superops-alerts`.
- **Running the fix on the endpoint** — remediation is
  `superops-runbooks`; a resolved ticket does not imply a fixed machine.

## MCP Tools

| Tool | Tier | Purpose |
|------|------|---------|
| `superops_tickets_list` | read | List tickets |
| `superops_tickets_get` | read | One ticket |
| `superops_tickets_create` | write | Create a ticket |
| `superops_tickets_update` | write | Change status, priority, assignee |
| `superops_tickets_add_note` | write | Add a note |
| `superops_tickets_log_time` | write | Log a worklog entry (`ticketId`, `qty` in the service item's unit, usually hours; optional `serviceItemId`, `billable`, `technicianId`) |
| `superops_technicians_list` / `superops_technicians_get` / `superops_technicians_groups` | read | Resolve an assignee or group |
| `superops_technicians_lookups` | read | Roles, teams, designations, business functions and technician groups as `{id, name}` |

Anything without a typed tool goes through `superops_custom_query` (admin tier; send query documents only, since the tool does not stop a mutation) or `superops_custom_mutation` (arbitrary GraphQL mutation); both are `admin` tier and need human approval. The GraphQL examples in this skill show what those passthrough calls send.

## Ticket Status Values

Status is a tenant-configured string, not an enum. A stock tenant ships with these
values. Read the tenant's own list with `getAllFields(input: "TICKET")`.

| Status | Description |
|--------|-------------|
| **Open** | Newly created or reopened. The default for new tickets |
| **On Hold** | Paused |
| **Waiting on third party** | Blocked on a vendor or other outside party |
| **Resolved** | Issue addressed |
| **Closed** | Ticket complete |

## Ticket Priority Levels

Priority is also a tenant-configured string. Stock values:

| Priority | Description | Typical Response |
|----------|-------------|------------------|
| **Critical** | Business-stopping issue | Immediate response |
| **High** | Major productivity impact | 1-2 hours |
| **Medium** | Single user/workaround exists | 4-8 hours |
| **Low** | Minor issue/enhancement | Next business day |
| **Very Low** | Cosmetic or deferred | When convenient |

## Key Ticket Fields

`createTicket` requires only `subject`, `client` and `source`.
`superops_tickets_create` defaults `source` to `INTEGRATION`. The other fields are
optional but drive routing and reporting:

| Input field | Shape | Tool argument |
|-------------|-------|---------------|
| `client` | `{ accountId }` | `clientId` |
| `technician` | `{ userId }` | `technicianId` |
| `techGroup` | `{ groupId }` | `techGroupId` |
| `requester` | `{ userId }` (a client user) | `requesterId` |
| `site` | `{ id }` | `siteId` |
| `priority`, `status`, `category`, `subcategory`, `requestType` | `String` | same name |

Identifier inputs take IDs only. Resolve names to IDs first with
`superops_clients_search`, `superops_technicians_list` and
`superops_technicians_groups`. On a ticket that is read back, `client`,
`technician`, `techGroup` and `requester` are `JSON`. The human-facing ticket
number is `displayId`.

See [references/fields.md](references/fields.md) for the complete field reference.

## GraphQL Operations

| Operation | Type | Purpose |
|-----------|------|---------|
| `createTicket` | mutation | Create a ticket |
| `getTicketList` | query | List/search tickets (`input: ListInfoInput!`: `page`, `pageSize`, `condition`, `sort`; keep paging only while `listInfo.hasMore` is `true`) |
| `getTicket` | query | Full detail for one ticket |
| `updateTicket` | mutation | Change status, priority, assignee, resolution |

The published schema has no `addTicketNote` or `addTicketTimeEntry` mutation. Add
notes with the typed `superops_tickets_add_note` tool and log time with
`superops_tickets_log_time` (both write tier); the raw equivalent for time is
`createWorklogEntries(input: [CreateWorklogEntryInput!]!)`, which needs the
admin-tier passthrough and human approval. `getTicketList` takes
`input: ListInfoInput!` and returns `listInfo` (`page`, `pageSize`, `hasMore`,
`totalCount`).

See [references/api.md](references/api.md) for the tool arguments, documents and
variables. Every GraphQL example there validates against the schema.

## Common Workflows

### Ticket Creation Flow

1. **Validate the client.** Call `superops_clients_search` and take the
   `accountId`.
2. **Check for duplicates.** Call `superops_tickets_list` with `clientId` and look
   for similar subjects.
3. **Create the ticket.** Call `superops_tickets_create`. Leave `status` unset to
   get the tenant default.

### Ticket Triage Workflow

1. Call `superops_tickets_list` with `status: ["Open"]`. Keep the rows whose
   `technician` is `null`. The tool cannot filter on a missing technician.
2. Assign each ticket with `superops_tickets_update` (`technicianId` or
   `techGroupId`).

### Escalation Workflow

Escalation is a `superops_tickets_update` call that raises `priority` and moves
`techGroupId` to the higher tier. Record the reason with
`superops_tickets_add_note`, because the schema has no escalation-reason field.

See [references/api.md](references/api.md) for both workflows.

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
function validateTicketInput(input, tenantPriorities) {
  const errors = [];

  if (!input.subject || input.subject.trim().length === 0) {
    errors.push('Subject is required');
  }

  if (!input.client?.accountId) {
    errors.push('Client is required');
  }

  // Priority is a tenant-configured string, not an enum: check it against the
  // tenant's list (getAllFields(input: "TICKET")), not a hard-coded set.
  if (input.priority && tenantPriorities && !tenantPriorities.includes(input.priority)) {
    errors.push(`Unknown priority "${input.priority}" for this tenant`);
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
