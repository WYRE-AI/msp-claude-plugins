---
description: Add an action (note, update, or response) to an existing HaloPSA ticket
argument-hint: "<ticket_id> <note> [action_type] [outcome] [hidden] [time_taken]"
arguments: [ticket_id, note, action_type, outcome, hidden, time_taken]
---

# Add Action to HaloPSA Ticket

Add an action (note, update, or response) to an existing HaloPSA ticket with configurable visibility and action type.

## Prerequisites

- Valid HaloPSA OAuth credentials configured
- Ticket must exist in HaloPSA
- User must have action creation permissions

## Steps

1. **Authenticate with OAuth 2.0**
   - Obtain access token using client credentials flow
   - Token endpoint: `{base_url}/auth/token?tenant={tenant}`
   ```bash
   # Get OAuth token
   TOKEN=$(curl -s -X POST "{base_url}/auth/token?tenant={tenant}" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials" \
     -d "client_id={client_id}" \
     -d "client_secret={client_secret}" \
     -d "scope=all" | jq -r '.access_token')
   ```

2. **Validate ticket exists**
   ```bash
   # Verify ticket exists
   curl -s -X GET "{base_url}/api/Tickets/{ticket_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```
   - Return error if ticket not found (404)
   - Display ticket summary for confirmation

3. **Resolve action type**
   ```bash
   # Get available action types
   curl -s -X GET "{base_url}/api/ActionTypes" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```
   - Map action_type text to ID:
     - "note" -> typically ID 1
     - "update" -> typically ID 2
     - "email_response" -> typically ID 3
     - "phone" -> typically ID 4
   - Use system-configured defaults if custom types exist

4. **Create the action**
   ```bash
   # Create action on ticket
   curl -s -X POST "{base_url}/api/Actions" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '[
       {
         "ticket_id": <ticket_id>,
         "note": "<note>",
         "actiontype_id": <resolved_actiontype_id>,
         "outcome": "<outcome>",
         "hiddenfromuser": <hidden>,
         "timetaken": <time_taken>,
         "sendemail": false
       }
     ]'
   ```

5. **Return action confirmation**
   - Action ID
   - Ticket ID and summary
   - Action type used
   - Time logged (if any)

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | The HaloPSA ticket ID |
| note | string | Yes | - | The action/note content |
| action_type | string | No | note | note/update/email_response/phone |
| outcome | string | No | - | Outcome code for the action |
| hidden | boolean | No | false | Hide from client portal |
| time_taken | integer | No | - | Time taken in minutes |

## Examples

### Basic Note

```
/add-action 12345 "Contacted customer, issue reproduced successfully"
```

### Phone Call with Time

```
/add-action 12345 "Called customer to discuss resolution options" --action_type phone --time_taken 15
```

### Internal Note (Hidden)

```
/add-action 12345 "Internal troubleshooting notes - do not share with client" --hidden true
```

### Update with Outcome

```
/add-action 12345 "Issue resolved, VPN connection restored" --action_type update --outcome "Resolved" --time_taken 30
```

### Email Response

```
/add-action 12345 "Sent password reset instructions to user" --action_type email_response
```

## Output

### Success

```
Action Added Successfully

Action ID: 98765
Ticket: #12345 - Email not working
Action Type: Note
Hidden: No
Time Logged: 15 minutes

Ticket URL: https://yourcompany.halopsa.com/tickets?id=12345
```

### With Outcome

```
Action Added Successfully

Action ID: 98766
Ticket: #12345 - Email not working
Action Type: Update
Outcome: Resolved
Hidden: No
Time Logged: 30 minutes

Ticket Status: The ticket status has been updated to "Resolved"

Ticket URL: https://yourcompany.halopsa.com/tickets?id=12345
```

## Error Handling

### Ticket Not Found

```
Ticket not found: #12345

Please verify the ticket ID and try again.
Use /search-tickets to find the correct ticket ID.
```

### Invalid Action Type

```
Invalid action type: "invalid_type"

Available action types:
- note (default)
- update
- email_response
- phone

Use: /add-action 12345 "My note" --action_type note
```

### Authentication Error

```
Authentication failed

Please verify your HaloPSA credentials:
- HALOPSA_CLIENT_ID
- HALOPSA_CLIENT_SECRET
- HALOPSA_BASE_URL
- HALOPSA_TENANT (for cloud-hosted)

Ensure the API application has 'edit:tickets' permission.
```

### Rate Limiting

```
Rate limited by HaloPSA API (429)

HaloPSA allows 500 requests per 3 minutes.
Retrying in 5 seconds...
```

### Permission Denied

```
Permission denied (403)

Your API credentials do not have permission to add actions to tickets.
Contact your HaloPSA administrator to grant 'edit:tickets' scope.
```

## API Reference

### POST /api/Actions

Creates a new action on a ticket.

**Request Body:**
```json
[
  {
    "ticket_id": 12345,
    "note": "Action content here",
    "actiontype_id": 1,
    "outcome": "In Progress",
    "hiddenfromuser": false,
    "timetaken": 15,
    "sendemail": false
  }
]
```

**Response:**
```json
{
  "id": 98765,
  "ticket_id": 12345,
  "note": "Action content here",
  "actiontype_id": 1,
  "who": "Jane Tech",
  "whenraw": "2024-02-15T10:30:00Z"
}
```

## Related Commands

- `/create-ticket` - Create new ticket
- `/update-ticket` - Update ticket fields
- `/show-ticket` - View ticket details
- `/search-tickets` - Search existing tickets
