---
description: Update fields on an existing SuperOps.ai ticket
argument-hint: "<ticket_id> [status] [priority] [technician_id] [due_date] [category]"
arguments: [ticket_id, status, priority, technician_id, due_date, category]
---

# Update SuperOps.ai Ticket

Update fields on an existing SuperOps.ai ticket including status, priority, technician assignment, and due date.

## Prerequisites

- Valid SuperOps.ai API token configured
- Ticket must exist in SuperOps.ai
- User must have ticket update permissions

## Steps

1. **Validate ticket exists**
   - Query ticket by ID or ticket number
   - Return error if ticket not found
   - Display current ticket state

2. **Validate status transition**
   - Check if status change is allowed
   - Valid transitions:
     - Open -> In Progress, Pending, Resolved, Closed
     - In Progress -> Open, Pending, Resolved, Closed
     - Pending -> Open, In Progress, Resolved, Closed
     - Resolved -> Closed, Open (reopen)
     - Closed -> Open (reopen)

3. **Resolve technician if needed**
   - If technician_id looks like a name/email, search for technician
   - Validate technician exists and has access to ticket's client

4. **Update the ticket**
   ```graphql
   mutation updateTicket($input: UpdateTicketInput!) {
     updateTicket(input: $input) {
       ticketId
       ticketNumber
       subject
       status
       priority
       assignee {
         id
         name
       }
       dueDate
       lastUpdatedTime
     }
   }
   ```

   Variables:
   ```json
   {
     "input": {
       "ticketId": "<ticket_id>",
       "status": "<status>",
       "priority": "<priority>",
       "assignee": { "id": "<technician_id>" },
       "dueDate": "<due_date>"
     }
   }
   ```

5. **Return updated ticket details**
   - Show changed fields
   - Display ticket URL

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | string | Yes | - | Ticket ID or ticket number |
| status | string | No | - | Open, In Progress, Pending, Resolved, Closed |
| priority | string | No | - | Low, Medium, High, Critical |
| technician_id | string | No | - | Technician ID to assign |
| due_date | datetime | No | - | Due date (ISO 8601 format) |
| category | string | No | - | Ticket category |

## Examples

### Update Status

```
/update-ticket TICK-12345 --status "In Progress"
```

### Change Priority

```
/update-ticket TICK-12345 --priority Critical
```

### Assign Technician and Update Status

```
/update-ticket TICK-12345 --status "In Progress" --technician_id tech_789
```

### Set Due Date

```
/update-ticket TICK-12345 --due_date "2026-02-10T17:00:00Z"
```

### Full Update

```
/update-ticket TICK-12345 --status "In Progress" --priority High --technician_id tech_789 --due_date "2026-02-10"
```

## Output

```
Ticket Updated Successfully

Ticket Number: TICK-12345
Subject: Email not working - Outlook disconnected

Changes Applied:
  Status: Open -> In Progress
  Priority: Medium -> High
  Assigned To: (none) -> John Smith
  Due Date: (none) -> 2026-02-10 17:00 UTC

Last Updated: 2026-02-04 14:32:00

URL: https://yourcompany.superops.ai/tickets/abc123-def456
```

## curl Example

```bash
curl -X POST 'https://yourcompany.superops.ai/graphql' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation updateTicket($input: UpdateTicketInput!) { updateTicket(input: $input) { ticketId ticketNumber status priority assignee { id name } lastUpdatedTime } }",
    "variables": {
      "input": {
        "ticketId": "ticket-uuid-here",
        "status": "In Progress",
        "priority": "HIGH",
        "assignee": { "id": "tech-uuid" }
      }
    }
  }'
```

## Error Handling

### Ticket Not Found

```
Ticket not found: "TICK-99999"

Please verify the ticket ID or number is correct.
Use /search-tickets to find the correct ticket.
```

### Invalid Status Transition

```
Invalid status transition: Closed -> In Progress

Valid transitions from "Closed":
- Open (reopen ticket)

Did you mean to reopen the ticket?
```

### Technician Not Found

```
Technician not found: "john.smith"

Did you mean one of these?
- John Smith (ID: tech_123)
- Johnny Smith (ID: tech_456)
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid ticket ID | Verify ticket exists using /search-tickets |
| Invalid status | Use: Open, In Progress, Pending, Resolved, Closed |
| Invalid priority | Use: Low, Medium, High, Critical |
| Permission denied | Check user permissions for this ticket |
| Rate limited | Wait and retry (800 req/min limit) |

## Related Commands

- `/create-ticket` - Create a new ticket
- `/add-ticket-note` - Add a note to ticket
- `/log-time` - Log time entry on ticket
- `/list-assets` - View client assets
