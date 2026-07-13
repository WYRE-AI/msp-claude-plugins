---
description: Add a note or comment to an existing Autotask ticket
argument-hint: "<ticket_id> <note> [type] [publish]"
arguments: [ticket_id, note, type, publish]
---

# Add Note to Autotask Ticket

Add an internal or public note to an existing Autotask ticket for documentation and communication.

## Prerequisites

- Valid Autotask API credentials configured
- Ticket must exist and be accessible
- User must have ticket note creation permissions

## Steps

1. **Validate ticket exists**
   - Use `autotask-mcp/autotask_get_ticket_details` to verify ticket
   - Display ticket summary for confirmation

2. **Determine note type**
   - Internal notes (default): Visible only to technicians
   - Public notes: Visible to customer on portal

3. **Set publish options**
   - none: Note saved but not published
   - portal: Published to customer portal
   - email: Sent via email to ticket contact

4. **Create the note**
   - Use `autotask-mcp/autotask_create_ticket_note` to add note
   - Include note type and publish settings

5. **Confirm note creation**
   - Display note ID and timestamp
   - Show ticket URL for reference

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | Ticket ID to add note to |
| note | string | Yes | - | Note content (multi-line supported) |
| type | string | No | internal | "internal" or "public" |
| publish | string | No | none | "none", "portal", or "email" |

## Examples

### Basic Internal Note

```
/add-note 12345 "Contacted customer, awaiting callback"
```

### Internal Note with Explicit Type

```
/add-note 12345 "Restarted email services, monitoring for recurrence" --type internal
```

### Public Note to Portal

```
/add-note 12345 "Issue resolved by applying security patch KB12345. Please restart Outlook to complete the fix." --type public --publish portal
```

### Public Note via Email

```
/add-note 12345 "We have scheduled a technician visit for tomorrow at 2pm. Please ensure someone is available to provide access." --type public --publish email
```

### Multi-line Note

```
/add-note 12345 "Troubleshooting steps completed:
1. Verified DNS settings - OK
2. Checked firewall rules - Found issue
3. Added exception for mail server
4. Tested mail flow - Working

Monitoring for 30 minutes before closing."
```

## Output

```
Note Added Successfully

Ticket: T20240215.0042 (ID: 12345)
Company: Acme Corporation
Title: Email not working

Note Details:
  Note ID: 98765
  Type: Internal
  Published: None
  Created: 2026-02-04 14:32:00
  Author: John Technician

Note Content:
  Contacted customer, awaiting callback

URL: https://ww5.autotask.net/Mvc/ServiceDesk/TicketDetail.mvc?ticketId=12345
```

### Public Note Output

```
Note Added and Published

Ticket: T20240215.0042 (ID: 12345)
Company: Acme Corporation

Note Details:
  Note ID: 98766
  Type: Public
  Published: Customer Portal
  Created: 2026-02-04 14:35:00
  Author: John Technician

Note Content:
  Issue resolved by applying security patch KB12345.
  Please restart Outlook to complete the fix.

Customer Notification: Sent to customer portal
```

## Error Handling

### Ticket Not Found

```
Error: Ticket not found: 12345

Please verify the ticket ID and try again.
Use /search-tickets to find the correct ticket ID.
```

### Empty Note

```
Error: Note content cannot be empty

Please provide note content:
/add-note 12345 "Your note content here"
```

### Invalid Note Type

```
Error: Invalid note type: "private"

Valid note types:
- internal (visible to technicians only)
- public (visible to customer)
```

### Invalid Publish Option

```
Error: Invalid publish option: "sms"

Valid publish options:
- none (save without publishing)
- portal (publish to customer portal)
- email (email to ticket contact)
```

### Permission Denied

```
Error: Permission denied

You do not have permission to add notes to this ticket.
Contact your Autotask administrator for access.
```

### Email Publish Without Contact

```
Warning: No contact associated with ticket

Email publish requested but ticket has no contact.
Note will be saved but not emailed.

Add a contact to the ticket first, or use --publish portal instead.
```

## Note Type Reference

| Type | Visibility | Use Case |
|------|------------|----------|
| internal | Technicians only | Technical details, internal coordination |
| public | Customer visible | Status updates, resolution details |

## Publish Option Reference

| Option | Behavior |
|--------|----------|
| none | Note saved, no notification |
| portal | Note visible on customer portal |
| email | Email sent to ticket contact |

## MCP Tool Usage

This command uses the following autotask-mcp tools:
- `autotask_get_ticket_details` - Verify ticket exists
- `autotask_create_ticket_note` - Create the note

## Related Commands

- `/create-ticket` - Create new ticket
- `/update-ticket` - Update ticket fields
- `/search-tickets` - Search existing tickets
- `/my-tickets` - List your assigned tickets
