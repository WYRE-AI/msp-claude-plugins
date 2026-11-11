# SuperOps.ai Ticket Operations

Every GraphQL document on this page validates against `schema/superops.graphql`
in [superops-mcp](https://github.com/WYRE-AI/superops-mcp) and uses only
operations listed in the published API reference at
<https://developer.superops.com/msp>.

Every everyday ticket action has a typed tool. The GraphQL column shows what each
tool sends, so you can recognise the same operation when you need a field that a
tool does not expose. Send those through `superops_custom_query` or
`superops_custom_mutation` (admin tier, human approval).

## Typed tools

| Tool | Tier | GraphQL it sends | Arguments |
|------|------|------------------|-----------|
| `superops_tickets_list` | read | `getTicketList(input: ListInfoInput!)` | `status[]`, `priority[]`, `clientId`, `technicianId`, `page`, `pageSize` |
| `superops_tickets_get` | read | `getTicket(input: { ticketId })` | `ticketId` |
| `superops_tickets_create` | write | `createTicket(input: CreateTicketInput!)` | `subject`, `clientId` (required); `description`, `source`, `status`, `priority`, `impact`, `urgency`, `category`, `subcategory`, `requestType`, `siteId`, `requesterId`, `techGroupId`, `technicianId` |
| `superops_tickets_update` | write | `updateTicket(input: UpdateTicketInput!)` | `ticketId` (required); `subject`, `status`, `priority`, `impact`, `urgency`, `category`, `subcategory`, `requestType`, `resolutionCode`, `technicianId`, `techGroupId` |
| `superops_tickets_add_note` | write | `createNote(input: { workItem: { workId, module: TICKET }, content, privacyType })` | `ticketId`, `content`, `isPublic` (default `false`, i.e. `PRIVATE`) |
| `superops_tickets_log_time` | write | `createWorklogEntries(input: [CreateWorklogEntryInput!]!)` | `ticketId`, `qty` (required); `billDateTime`, `notes`, `billable`, `afterHours`, `technicianId`, `serviceItemId`, `unitPrice` |

The schema has no `addTicketNote` or `addTicketTimeEntry`. The tools above use
`createNote` and `createWorklogEntries`, which replace them. `createTicketNote`
still exists but is deprecated in favour of `createNote`.

### Examples

```json
{ "tool": "superops_tickets_create", "arguments": {
  "subject": "Email not working",
  "clientId": "<account id>",
  "description": "Several users cannot send or receive since 09:00",
  "priority": "High",
  "requesterId": "<client user id>",
  "techGroupId": "<technician group id>"
} }
```

```json
{ "tool": "superops_tickets_update", "arguments": {
  "ticketId": "<ticket id>", "status": "Resolved", "resolutionCode": "Permanent Fix"
} }
```

```json
{ "tool": "superops_tickets_add_note", "arguments": {
  "ticketId": "<ticket id>", "content": "Rebuilt the Outlook profile; monitoring for 24h.", "isPublic": false
} }
```

```json
{ "tool": "superops_tickets_log_time", "arguments": {
  "ticketId": "<ticket id>", "qty": "0.5", "notes": "Remote troubleshooting", "billable": true
} }
```

`qty` is measured in the service item's unit, usually hours, not in minutes.

## Fields

`Ticket` has these fields: `ticketId`, `displayId` (the human-facing number),
`subject`, `status`, `priority`, `impact`, `urgency`, `category`, `subcategory`,
`cause`, `subcause`, `resolutionCode`, `requestType`, `source`, `approvalStatus`,
`createdTime`, `updatedTime`, the first-response and resolution due/actual/violated
fields, and `worklogTimespent`. These fields are `JSON`: `client`, `site`,
`requester`, `additionalRequester`, `followers`, `techGroup`, `technician`, `sla`
and `customFields`. Select a JSON field by name with no sub-selection.

A ticket has no `ticketNumber` (use `displayId`), no `assignee` (use
`technician`), no `dueDate` and no readable `description`. The description is
write-only on create. Read it back through the ticket conversation.

Status, priority, impact, urgency, category and resolution code are
tenant-configured strings. Stock values:

| Field | Stock values |
|-------|--------------|
| status | Open, On Hold, Resolved, Closed, Waiting on third party |
| priority | Critical, High, Medium, Low, Very Low |
| impact / urgency | High, Medium, Low |
| resolutionCode | Permanent Fix, Workaround, Resolved by Requester, Exception |

To read the tenant's own lists, send this query through `superops_custom_query`.
It returns every option list for the module in one call:

```graphql
query ticketFields {
  getAllFields(input: "TICKET") {
    columnName
    options { value }
    parentField { columnName }
  }
}
```

## Custom queries

### Tickets with no technician (triage)

`superops_tickets_list` cannot filter for a missing technician. To find unassigned
tickets, list the open ones and keep the rows where `technician` is `null`:

```graphql
query getTicketList($input: ListInfoInput!) {
  getTicketList(input: $input) {
    tickets {
      ticketId
      displayId
      subject
      status
      priority
      createdTime
      client
      technician
    }
    listInfo {
      page
      pageSize
      totalCount
      hasMore
    }
  }
}
```

```json
{
  "input": {
    "page": 1,
    "pageSize": 100,
    "condition": { "attribute": "status", "operator": "includes", "value": ["Open"] },
    "sort": [{ "attribute": "createdTime", "order": "ASC" }]
  }
}
```

`getTicketList` returns rows only when `ticketId` is in the selection. If it is
missing, the API returns an empty `tickets` array alongside a correct
`totalCount`.

### Notes and conversation on a ticket

```graphql
query getTicketNoteList($input: TicketIdentifierInput!) {
  getTicketNoteList(input: $input) {
    noteId
    content
    addedOn
    addedBy
    privacyType
  }
}
```

```graphql
query getTicketConversationList($input: TicketIdentifierInput!) {
  getTicketConversationList(input: $input) {
    conversationId
    content
    time
    user
    type
  }
}
```

```json
{ "input": { "ticketId": "<ticket id>" } }
```

The live schema marks `getTicketConversationList` as deprecated in favour of the
paged `getTicketConversationsList`. The published docs do not list the paged
version yet, but the old query still answers.

### Worklog entries

```graphql
query getWorklogEntries($input: GetWorklogEntriesInput!) {
  getWorklogEntries(input: $input) {
    entries {
      itemId
      qty
      billable
      billDateTime
      notes
      technician
      workItem
    }
    listInfo {
      page
      pageSize
      totalCount
      hasMore
    }
  }
}
```

```json
{ "input": { "module": "TICKET", "listInfo": { "page": 1, "pageSize": 50 } } }
```

## Workflow: escalation

Escalation is a `superops_tickets_update` call that raises `priority` and moves
`techGroupId`, followed by `superops_tickets_add_note` with the reason. The
schema has no escalation-reason field.

```json
{ "tool": "superops_tickets_update", "arguments": {
  "ticketId": "<ticket id>", "priority": "Critical", "techGroupId": "<tier-2 group id>"
} }
```

Call `superops_technicians_groups` to find group IDs.
