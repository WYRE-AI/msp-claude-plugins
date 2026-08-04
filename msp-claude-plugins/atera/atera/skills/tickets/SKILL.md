---
name: "Atera Tickets"
description: >
  Atera service desk tickets: ticket fields, statuses, priorities, comments,
  work hours, and billing duration.
when_to_use: >-
  When creating, updating, searching, or managing Atera service desk
  tickets. Use when: atera ticket, service ticket atera, create ticket
  atera, ticket status atera, ticket priority atera, atera service desk,
  ticket comments, work hours atera, billable hours, or resolve ticket
  atera.
---

# Atera Ticket Management

## Overview

Atera tickets are the core unit of service delivery in the RMM/PSA platform. Every client request, incident, and service call flows through the ticketing system. This skill covers comprehensive ticket management including creation, updates, comments, and time tracking.

## Anti-triggers

- **The MSP's system-of-record helpdesk** — plenty of shops run Atera
  for RMM and a separate PSA for service desk. If tickets live
  elsewhere, use `connectwise-psa-tickets`, `autotask-tickets`,
  `halopsa-tickets`, `syncro-tickets`, or `superops-tickets`; a ticket
  created in the wrong system is a ticket nobody is watching.
- **The alert behind the ticket** — alert-to-ticket conversion rules and
  the alert side of that workflow are `atera-alerts`.

## Ticket Status Values

| Status | Description | Business Logic |
|--------|-------------|----------------|
| **Open** | Newly created or reopened ticket | Default for new tickets |
| **Pending** | Awaiting customer response or information | SLA clock may pause |
| **Resolved** | Issue has been fixed | Awaiting customer confirmation |
| **Closed** | Ticket is complete | Final state, no further action |

## Ticket Priority Levels

| Priority | Description | Typical SLA |
|----------|-------------|-------------|
| **Critical** | Complete business outage | 1 hour response |
| **High** | Major productivity impact | 4 hour response |
| **Medium** | Single user/workaround exists | 8 hour response |
| **Low** | Minor issue/enhancement | 24 hour response |

## Ticket Types

| Type | Description |
|------|-------------|
| **Problem** | Standard service issue |
| **Request** | Service request |
| **Incident** | Unplanned interruption |
| **Change** | Planned change |

## Complete Ticket Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `TicketID` | int | System | Auto-generated unique identifier |
| `TicketTitle` | string | Yes | Brief issue summary |
| `Description` | string | No | Detailed description |
| `TicketPriority` | string | No | Low, Medium, High, Critical |
| `TicketStatus` | string | No | Open, Pending, Resolved, Closed |
| `TicketType` | string | No | Problem, Request, Incident, Change |

### Customer/Contact Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `CustomerID` | int | Conditional | Customer reference (required if no EndUserID) |
| `CustomerName` | string | System | Customer display name |
| `EndUserID` | int | Conditional | Contact reference |
| `EndUserEmail` | string | System | Contact email address |
| `EndUserFirstName` | string | System | Contact first name |
| `EndUserLastName` | string | System | Contact last name |

### Assignment Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `TechnicianContactID` | int | No | Assigned technician ID |
| `TechnicianFullName` | string | System | Technician display name |
| `TechnicianEmail` | string | System | Technician email |

### Timeline Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `TicketCreatedDate` | datetime | System | When ticket was created |
| `TicketResolvedDate` | datetime | System | When marked resolved |
| `FirstResponseDate` | datetime | System | First response timestamp |
| `LastActivityDate` | datetime | System | Last update timestamp |
| `DueDate` | datetime | No | SLA due date |

### Source Fields

| Field | Type | Description |
|-------|------|-------------|
| `TicketSource` | string | How ticket was created (Portal, Email, Agent, API) |

## API Patterns

### Create a Ticket

```http
POST /api/v3/tickets
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "TicketTitle": "Unable to access email - multiple users affected",
  "Description": "Sales team (5 users) reporting Outlook disconnected since 9am",
  "EndUserID": 67890,
  "TicketPriority": "High",
  "TicketType": "Problem",
  "TechnicianContactID": 12345
}
```

**Response:**
```json
{
  "ActionID": 54321,
  "TicketID": 54321,
  "TicketTitle": "Unable to access email - multiple users affected"
}
```

### Get Ticket Details

```http
GET /api/v3/tickets/{ticketId}
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "TicketID": 54321,
  "TicketTitle": "Unable to access email - multiple users affected",
  "TicketStatus": "Open",
  "TicketPriority": "High",
  "TicketType": "Problem",
  "CustomerID": 12345,
  "CustomerName": "Acme Corporation",
  "EndUserID": 67890,
  "EndUserFirstName": "John",
  "EndUserLastName": "Smith",
  "EndUserEmail": "john.smith@acme.com",
  "TechnicianContactID": 11111,
  "TechnicianFullName": "Jane Tech",
  "TicketCreatedDate": "2024-02-15T09:00:00Z",
  "TicketSource": "Email"
}
```

### Update a Ticket

```http
POST /api/v3/tickets/{ticketId}
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "TicketStatus": "Resolved",
  "TicketPriority": "Medium"
}
```

### List All Tickets (Paginated)

```http
GET /api/v3/tickets?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "items": [...],
  "totalItems": 2847,
  "page": 1,
  "itemsInPage": 50,
  "totalPages": 57
}
```

### Get Tickets Modified After Date

```http
GET /api/v3/tickets/statusmodified?modifiedAfter=2024-02-01T00:00:00Z
X-API-KEY: {api_key}
```

### Get Ticket Comments

```http
GET /api/v3/tickets/{ticketId}/comments
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "items": [
    {
      "CommentID": 11111,
      "TicketID": 54321,
      "CommentText": "Initial triage: Checking Exchange connectivity",
      "CommentDate": "2024-02-15T09:15:00Z",
      "CreatorContactID": 12345,
      "IsInternal": true
    }
  ]
}
```

### Create Ticket Comment

```http
POST /api/v3/tickets/{ticketId}/comments
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "CommentText": "Identified root cause - Exchange certificate expired",
  "IsInternal": false
}
```

### Get Billable Duration

```http
GET /api/v3/tickets/{ticketId}/billableduration
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "TotalBillableDuration": 3600,
  "TotalBillableHours": 1.0
}
```

### Get Work Hours

```http
GET /api/v3/tickets/{ticketId}/workhours
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "items": [
    {
      "WorkHourID": 22222,
      "TicketID": 54321,
      "TechnicianContactID": 12345,
      "StartDate": "2024-02-15T09:00:00Z",
      "EndDate": "2024-02-15T10:30:00Z",
      "Duration": 5400,
      "IsBillable": true,
      "Notes": "Initial investigation and resolution"
    }
  ]
}
```

## Common Workflows

### Ticket Creation Flow

1. **Receive request** - Via portal, email, phone, or API
2. **Validate customer** - Ensure customer exists in system
3. **Set priority** - Based on impact and urgency
4. **Assign technician** - Route to appropriate team member
5. **Send acknowledgment** - Notify customer of ticket creation

### Ticket Resolution Flow

1. **Investigate issue** - Document findings in comments
2. **Implement fix** - Perform remediation steps
3. **Log time** - Record billable/non-billable hours
4. **Update status** - Set to Resolved
5. **Notify customer** - Send resolution summary

### Status Transition Validation

```
Open ──────────────────────────────> Closed
  │                                     ↑
  ↓                                     │
Pending ──────────────> Resolved ──────┘
  │                         ↑
  └─────────────────────────┘
```

**Rules:**
- Cannot skip directly from Open to Closed (must resolve first)
- Resolved tickets can be reopened to Open
- Pending can transition to any status

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid ticket ID | Verify ticket exists |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Verify permissions |
| 404 | Ticket not found | Confirm ticket ID |
| 429 | Rate limited | Wait and retry (700 req/min limit) |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Title required | Missing TicketTitle | Add title to request |
| Invalid priority | Typo in priority value | Use Low, Medium, High, or Critical |
| Customer not found | Invalid EndUserID | Verify contact exists |

## Best Practices

1. **Use descriptive titles** - Include affected system and symptom
2. **Set accurate priority** - Use impact/urgency matrix
3. **Document thoroughly** - Add comments for all actions
4. **Log time promptly** - Don't batch at end of day
5. **Update status regularly** - Keep customers informed
6. **Use internal notes** - Separate technical details from customer-facing
7. **Link related tickets** - Reference previous issues

## Related Skills

- [Atera Customers](../customers/SKILL.md) - Customer and contact management
- [Atera Alerts](../alerts/SKILL.md) - Alert to ticket conversion
- [Atera API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
