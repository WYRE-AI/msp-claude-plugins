---
name: "SuperOps Tickets"
description: >
  Use this skill when working with SuperOps.ai tickets - creating, updating,
  searching, or managing service desk operations. Covers ticket fields,
  statuses, priorities, assignments, notes, time entries, and workflow automations.
  Includes business logic for validation and common MSP workflows.
  Essential for MSP technicians handling service delivery through SuperOps.ai PSA.
when_to_use: >-
  When creating, updating, searching, or managing service desk operations. Use when: superops
  ticket, service ticket superops, create ticket superops, ticket status superops, ticket
  priority, superops service desk, ticket triage, escalate ticket, resolve ticket superops, ticket
  notes superops, or time entry ticket.
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

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ticketId` | ID | System | Auto-generated unique identifier |
| `ticketNumber` | String | System | Human-readable ticket number |
| `subject` | String | Yes | Brief issue summary |
| `description` | String | No | Detailed description |
| `ticketType` | Enum | No | Incident, Service Request, Problem, Change |
| `requestType` | Enum | No | Classification type |
| `source` | Enum | No | How ticket was created (email, portal, phone) |

### Assignment Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client` | ClientIdentifier | Yes | Client/account reference |
| `site` | SiteIdentifier | No | Site within client |
| `requester` | RequesterIdentifier | No | Person who reported |
| `assignee` | TechnicianIdentifier | No | Assigned technician |
| `techGroup` | TechGroupIdentifier | No | Technician group |

### Classification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `priority` | Enum | No | Critical, High, Medium, Low |
| `impact` | Enum | No | Impact level |
| `urgency` | Enum | No | Urgency level |
| `category` | CategoryIdentifier | No | Service category |

## GraphQL Operations

### Create a Ticket

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

### List Tickets

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

### Get Single Ticket

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

### Update a Ticket

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

### Add Ticket Note

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

### Add Time Entry

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

```graphql
# 1. Get unassigned tickets
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

### Escalation Workflow

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
6. **Document thoroughly** - Future technicians will thank you
7. **Use internal notes for technical details** - Keep public notes professional

## Related Skills

- [SuperOps.ai Clients](../clients/SKILL.md) - Client and contact management
- [SuperOps.ai Assets](../assets/SKILL.md) - Asset inventory
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Alert management
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
