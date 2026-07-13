---
description: Add a comment to an existing Syncro ticket
argument-hint: "<ticket_id> <comment> [hidden] [do_not_email]"
arguments: [ticket_id, comment, hidden, do_not_email]
---

# Add Syncro Ticket Comment

Add a comment to an existing Syncro ticket, with options for visibility and email notifications.

## Prerequisites

- Valid Syncro API key configured
- Ticket must exist in Syncro
- User must have ticket comment permissions

## Steps

1. **Validate ticket exists**
   - Fetch ticket details to confirm ID
   - Display ticket subject for confirmation

2. **Process comment options**
   - Parse hidden flag for internal notes
   - Parse do_not_email flag for notification control

3. **Add the comment**
   ```bash
   curl -s -X POST \
     "https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/tickets/${ticket_id}/comments?api_key=${SYNCRO_API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "body": "<comment>",
       "hidden": <hidden>,
       "do_not_email": <do_not_email>
     }'
   ```

4. **Confirm and return details**
   - Show comment was added
   - Display visibility status
   - Show ticket URL

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | The Syncro ticket ID |
| comment | string | Yes | - | The comment content |
| hidden | boolean | No | false | Hide from customer portal |
| do_not_email | boolean | No | false | Prevent email notification |

## API Endpoints Used

```
POST /api/v1/tickets/{id}/comments
GET /api/v1/tickets/{id} (for validation)
GET /api/v1/tickets/{id}/comments (for history)
```

## Examples

### Basic Comment

```
/add-ticket-comment 12345 "Customer confirmed issue is resolved"
```

### Internal Note (Hidden from Customer)

```
/add-ticket-comment 12345 "Internal: Need to escalate to vendor" --hidden true
```

### Comment Without Email Notification

```
/add-ticket-comment 12345 "Following up on issue" --do_not_email true
```

### Internal Note Without Email

```
/add-ticket-comment 12345 "Checked server logs - no errors found" --hidden true --do_not_email true
```

### Multi-line Comment

```
/add-ticket-comment 12345 "Troubleshooting steps completed:
1. Restarted email service
2. Cleared mail queue
3. Verified connectivity

Issue appears to be resolved. Monitoring for 24 hours."
```

## Output

```
Comment Added Successfully

Ticket: #12345 - Email not working
Customer: Acme Corporation

Comment:
"Customer confirmed issue is resolved"

Visibility: Customer Visible
Email Sent: Yes

URL: https://acme.syncromsp.com/tickets/12345
```

### Hidden Comment Output

```
Comment Added Successfully

Ticket: #12345 - Email not working
Customer: Acme Corporation

Comment:
"Internal: Need to escalate to vendor"

Visibility: Internal Only (Hidden from customer)
Email Sent: No

URL: https://acme.syncromsp.com/tickets/12345
```

## Error Handling

### Ticket Not Found

```
Error: Ticket not found

Ticket ID 99999 does not exist or you do not have access.

Suggestions:
- Verify the ticket ID is correct
- Use /search-tickets to find the ticket
```

### Empty Comment

```
Error: Comment cannot be empty

Please provide comment content.

Example:
/add-ticket-comment 12345 "Your comment here"
```

### Permission Denied

```
Error: Permission denied (403)

You do not have permission to comment on this ticket.

Contact your Syncro administrator if you need access.
```

### Rate Limiting

```
Rate limited by Syncro API (180 req/min)

Retrying in 5 seconds...
```

### Comment Too Long

```
Error: Comment exceeds maximum length

Syncro comments are limited to 65,535 characters.
Your comment: 70,234 characters

Please shorten your comment and try again.
```

## Tips

### Quick Status Updates

Use hidden comments for quick internal status updates:

```
/add-ticket-comment 12345 "Waiting for parts to arrive" --hidden true
```

### Customer Communication

Public comments automatically email the customer (unless --do_not_email):

```
/add-ticket-comment 12345 "Hi John, we've resolved the email issue. Please let us know if you experience any further problems."
```

### Documentation Best Practices

- Include timestamps for activities
- Reference specific error messages or logs
- Document troubleshooting steps taken
- Use hidden comments for sensitive internal notes

## Related Commands

- `/create-ticket` - Create a new ticket
- `/search-tickets` - Search for tickets
- `/update-ticket` - Update ticket fields
- `/log-time` - Log time against a ticket
