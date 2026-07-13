---
description: Update fields on an existing Syncro ticket
argument-hint: "<ticket_id> [status] [priority] [problem_type] [user_id] [due_date]"
arguments: [ticket_id, status, priority, problem_type, user_id, due_date]
---

# Update Syncro Ticket

Update fields on an existing Syncro ticket including status, priority, problem type, and assignment.

## Prerequisites

- Valid Syncro API key configured
- Ticket must exist in Syncro
- User must have ticket update permissions

## Steps

1. **Validate ticket exists**
   - Fetch current ticket details
   - Confirm ticket ID is valid
   - Display current values before update

2. **Resolve field values**
   - Validate status against allowed values
   - Validate priority against allowed values
   - Look up user_id if assignee provided by name
   - Parse and validate due_date format

3. **Build update payload**
   - Only include fields that are being changed
   - Preserve existing values for unchanged fields

4. **Execute the update**
   ```bash
   curl -s -X PUT \
     "https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/tickets/${ticket_id}?api_key=${SYNCRO_API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "<status>",
       "priority": "<priority>",
       "problem_type": "<problem_type>",
       "user_id": <user_id>,
       "due_date": "<due_date>"
     }'
   ```

5. **Confirm update and return details**
   - Show updated ticket details
   - Highlight changed fields
   - Provide ticket URL

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ticket_id | integer | Yes | The Syncro ticket ID to update |
| status | string | No | New, In Progress, Resolved, Closed |
| priority | string | No | Low, Medium, High, Urgent |
| problem_type | string | No | Problem type category |
| user_id | integer | No | Technician user ID to assign |
| due_date | datetime | No | Due date for the ticket |

## API Endpoints Used

```
PUT /api/v1/tickets/{id}
GET /api/v1/tickets/{id} (for validation)
GET /api/v1/ticket_statuses (for status lookup)
GET /api/v1/users (for assignee lookup)
```

## Examples

### Update Status

```
/update-ticket 12345 --status "In Progress"
```

### Update Priority

```
/update-ticket 12345 --priority High
```

### Assign to Technician

```
/update-ticket 12345 --user_id 567
```

### Set Due Date

```
/update-ticket 12345 --due_date "2026-02-10"
```

### Multiple Updates

```
/update-ticket 12345 --status "In Progress" --priority High --due_date "2026-02-10"
```

## Output

```
Ticket #12345 Updated Successfully

Changes Applied:
- Status: New -> In Progress
- Priority: Medium -> High
- Due Date: (none) -> 2026-02-10

Current Ticket Details:
  Subject: Email not working
  Customer: Acme Corporation
  Status: In Progress
  Priority: High
  Assigned To: Jane Technician
  Due Date: 2026-02-10

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

### Invalid Status

```
Error: Invalid status value

"Pending" is not a valid status.

Available statuses:
- New
- In Progress
- Resolved
- Closed
- On Hold
- Waiting for Customer
```

### Invalid Priority

```
Error: Invalid priority value

"Critical" is not a valid priority.

Available priorities:
- Low
- Medium
- High
- Urgent
```

### Permission Denied

```
Error: Permission denied (403)

You do not have permission to update this ticket.

Contact your Syncro administrator if you need access.
```

### Rate Limiting

```
Rate limited by Syncro API (180 req/min)

Retrying in 5 seconds...
```

### No Changes Specified

```
Warning: No changes specified

Please provide at least one field to update:
- --status
- --priority
- --problem_type
- --user_id
- --due_date
```

## Related Commands

- `/create-ticket` - Create a new ticket
- `/search-tickets` - Search for tickets
- `/add-ticket-comment` - Add a comment to a ticket
- `/log-time` - Log time against a ticket
