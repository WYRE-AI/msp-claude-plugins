# SuperOps.ai Ticket GraphQL Operations

## Create a Ticket

```graphql
mutation createTicket($input: CreateTicketInput!) {
  createTicket(input: $input) {
    ticketId
    ticketNumber
    subject
    status
    priority
    createdTime
    client {
      accountId
      name
    }
    assignee {
      id
      name
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "subject": "Unable to access email - Outlook disconnected",
    "description": "User reports Outlook showing disconnected status since 9am. Webmail works fine.",
    "client": {
      "accountId": "abc123"
    },
    "priority": "HIGH",
    "requester": {
      "email": "john.smith@acme.com"
    },
    "techGroup": {
      "name": "Service Desk"
    },
    "category": {
      "name": "Email"
    }
  }
}
```

## List Tickets

```graphql
query getTicketList($input: ListInfoInput!) {
  getTicketList(input: $input) {
    tickets {
      ticketId
      ticketNumber
      subject
      status
      priority
      createdTime
      lastUpdatedTime
      client {
        accountId
        name
      }
      assignee {
        id
        name
      }
      requester {
        id
        name
        email
      }
    }
    listInfo {
      totalCount
      hasNextPage
      endCursor
    }
  }
}
```

**Variables with Filters:**
```json
{
  "input": {
    "first": 50,
    "filter": {
      "status": ["Open", "In Progress"],
      "priority": ["Critical", "High"],
      "client": {
        "accountId": "abc123"
      }
    },
    "orderBy": {
      "field": "createdTime",
      "direction": "DESC"
    }
  }
}
```

## Get Single Ticket

```graphql
query getTicket($input: TicketIdentifierInput!) {
  getTicket(input: $input) {
    ticketId
    ticketNumber
    subject
    description
    status
    priority
    impact
    urgency
    createdTime
    lastUpdatedTime
    client {
      accountId
      name
    }
    site {
      id
      name
    }
    requester {
      id
      name
      email
      phone
    }
    assignee {
      id
      name
      email
    }
    techGroup {
      id
      name
    }
    category {
      id
      name
    }
    customFields {
      name
      value
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "ticketId": "ticket-uuid-here"
  }
}
```

## Update a Ticket

```graphql
mutation updateTicket($input: UpdateTicketInput!) {
  updateTicket(input: $input) {
    ticketId
    ticketNumber
    status
    priority
    assignee {
      id
      name
    }
    lastUpdatedTime
  }
}
```

**Variables - Assign and Change Status:**
```json
{
  "input": {
    "ticketId": "ticket-uuid-here",
    "status": "In Progress",
    "assignee": {
      "id": "tech-uuid"
    },
    "priority": "HIGH"
  }
}
```

**Variables - Resolve Ticket:**
```json
{
  "input": {
    "ticketId": "ticket-uuid-here",
    "status": "Resolved",
    "resolution": "Cleared Outlook cache and repaired Office installation. Email flow restored."
  }
}
```

## Add Ticket Note

```graphql
mutation addTicketNote($input: AddTicketNoteInput!) {
  addTicketNote(input: $input) {
    noteId
    content
    createdTime
    isPublic
    createdBy {
      id
      name
    }
  }
}
```

**Variables - Internal Note:**
```json
{
  "input": {
    "ticketId": "ticket-uuid-here",
    "content": "Checked event logs - found KB5034441 update correlation. Known Outlook cache issue.",
    "isPublic": false
  }
}
```

**Variables - Public Note (visible to client):**
```json
{
  "input": {
    "ticketId": "ticket-uuid-here",
    "content": "We've identified the cause of the issue. A technician is working on the fix and will have it resolved within the hour.",
    "isPublic": true
  }
}
```

## Add Time Entry

```graphql
mutation addTicketTimeEntry($input: AddTimeEntryInput!) {
  addTicketTimeEntry(input: $input) {
    timeEntryId
    ticketId
    duration
    description
    technician {
      id
      name
    }
    createdTime
  }
}
```

**Variables:**
```json
{
  "input": {
    "ticketId": "ticket-uuid-here",
    "duration": 30,
    "description": "Troubleshooting Outlook connectivity, cleared cache, repaired Office installation",
    "workType": "Remote Support",
    "billable": true
  }
}
```

## Workflow Examples

### Ticket Triage — get unassigned tickets

```graphql
query getUnassignedTickets($input: ListInfoInput!) {
  getTicketList(input: $input) {
    tickets {
      ticketId
      ticketNumber
      subject
      priority
      client { name }
      createdTime
    }
  }
}
```

Variables:
```json
{
  "input": {
    "filter": {
      "status": ["Open"],
      "assignee": null
    },
    "orderBy": {
      "field": "priority",
      "direction": "DESC"
    }
  }
}
```

### Escalation

```graphql
mutation escalateTicket($input: UpdateTicketInput!) {
  updateTicket(input: $input) {
    ticketId
    status
    priority
    techGroup { name }
  }
}
```

Variables:
```json
{
  "input": {
    "ticketId": "ticket-uuid",
    "priority": "CRITICAL",
    "techGroup": {
      "name": "Tier 2 Support"
    },
    "escalationReason": "Complex Exchange hybrid configuration issue"
  }
}
```
