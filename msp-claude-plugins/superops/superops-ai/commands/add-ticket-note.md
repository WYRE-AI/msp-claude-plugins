---
description: Add a note (internal or public) to an existing SuperOps.ai ticket
argument-hint: "<ticket_id> <note> [type] [notify_customer]"
arguments: [ticket_id, note, type, notify_customer]
---

# Add SuperOps.ai Ticket Note

Add a note (internal or public) to an existing SuperOps.ai ticket for documentation and communication.

## Prerequisites

- Valid SuperOps.ai API token configured
- Ticket must exist in SuperOps.ai
- User must have ticket note permissions

## Steps

1. **Validate ticket exists**
   - Query ticket by ID or ticket number
   - Return error if ticket not found
   - Show current ticket subject for confirmation

2. **Determine note type**
   - Default to internal if not specified
   - Internal notes are only visible to technicians
   - Public notes are visible to the client/requester

3. **Check notification preference**
   - notify_customer only applies to public notes
   - If notify_customer is true and type is internal, warn user
   - Default is false (no notification)

4. **Add the note**
   ```graphql
   mutation addTicketNote($input: AddTicketNoteInput!) {
     addTicketNote(input: $input) {
       noteId
       content
       noteType
       createdTime
       createdBy {
         id
         name
       }
     }
   }
   ```

   Variables:
   ```json
   {
     "input": {
       "ticketId": "<ticket_id>",
       "content": "<note>",
       "isPublic": false,
       "notifyCustomer": false
     }
   }
   ```

5. **Confirm note was added**
   - Display note ID
   - Show note preview
   - Confirm notification status

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | string | Yes | - | Ticket ID or ticket number |
| note | string | Yes | - | Note content (multi-line supported) |
| type | string | No | internal | internal or public |
| notify_customer | boolean | No | false | Send email to customer |

## Examples

### Add Internal Note

```
/add-ticket-note TICK-12345 "Contacted customer, awaiting callback"
```

### Add Internal Note with Type

```
/add-ticket-note TICK-12345 "Checked event logs - found KB5034441 update correlation. Known Outlook cache issue." --type internal
```

### Add Public Note

```
/add-ticket-note TICK-12345 "We've identified the cause of the issue. A technician is working on the fix." --type public
```

### Add Public Note with Customer Notification

```
/add-ticket-note TICK-12345 "Issue resolved by applying patch KB12345. Please confirm everything is working." --type public --notify_customer true
```

### Multi-line Note

```
/add-ticket-note TICK-12345 "Troubleshooting steps completed:
1. Verified network connectivity - OK
2. Checked DNS resolution - OK
3. Tested Outlook profile - FAILED
4. Rebuilt Outlook profile - SUCCESS

Issue appears to be corrupted OST file. Recommended monitoring for 24 hours."
```

## Output

### Internal Note Added

```
Note Added Successfully

Ticket: TICK-12345 - Email not working - Outlook disconnected
Note ID: note_abc123
Type: Internal
Visibility: Technicians only

Content:
---------
Contacted customer, awaiting callback
---------

Created: 2026-02-04 14:45:00
Created By: Jane Technician
```

### Public Note with Notification

```
Note Added Successfully

Ticket: TICK-12345 - Email not working - Outlook disconnected
Note ID: note_xyz789
Type: Public
Visibility: Client and technicians
Customer Notified: Yes (john.smith@acme.com)

Content:
---------
Issue resolved by applying patch KB12345. Please confirm everything is working.
---------

Created: 2026-02-04 14:45:00
Created By: Jane Technician
```

## curl Example

```bash
curl -X POST 'https://yourcompany.superops.ai/graphql' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation addTicketNote($input: AddTicketNoteInput!) { addTicketNote(input: $input) { noteId content noteType createdTime createdBy { id name } } }",
    "variables": {
      "input": {
        "ticketId": "ticket-uuid-here",
        "content": "Contacted customer, awaiting callback",
        "isPublic": false,
        "notifyCustomer": false
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

### Empty Note Content

```
Note content cannot be empty.

Please provide the note content:
/add-ticket-note TICK-12345 "Your note content here"
```

### Notification Warning

```
Warning: notify_customer is set to true but note type is internal.
Internal notes are not visible to customers and cannot be notified.

Did you mean to create a public note?
Use: /add-ticket-note TICK-12345 "note" --type public --notify_customer true
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid ticket ID | Verify ticket exists using /search-tickets |
| Note too long | Notes have a character limit; split into multiple notes |
| Permission denied | Check user permissions for this ticket |
| Ticket closed | Some workflows prevent notes on closed tickets |
| Rate limited | Wait and retry (800 req/min limit) |

## Best Practices

1. **Use internal notes for technical details** - Keep troubleshooting steps and technical info internal
2. **Keep public notes professional** - These are visible to clients
3. **Document thoroughly** - Future technicians will thank you
4. **Use notifications sparingly** - Don't spam customers with every update
5. **Include relevant context** - Reference KB articles, error codes, or related tickets

## Related Commands

- `/create-ticket` - Create a new ticket
- `/update-ticket` - Update ticket status or assignment
- `/log-time` - Log time entry on ticket
- `/list-assets` - View client assets
