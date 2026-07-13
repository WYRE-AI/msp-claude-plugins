---
description: Close a ConnectWise PSA ticket with resolution notes
argument-hint: "<ticket_id> <resolution> [status] [time_minutes] [time_notes] [billable]"
arguments: [ticket_id, resolution, status, time_minutes, time_notes, billable]
---

# Close ConnectWise PSA Ticket

Close a ConnectWise ticket with resolution notes and optional time entry.

## Prerequisites

- Valid ConnectWise PSA API credentials configured
- User must have ticket update permissions
- Ticket must exist and be accessible
- A valid closed status must exist on the ticket's board

## Steps

1. **Validate ticket exists and get current state**
   ```http
   GET /service/tickets/{id}
   ```
   - Confirm ticket is accessible
   - Get current board ID for status lookup
   - Check if ticket is already closed

2. **Resolve closed status**
   ```http
   GET /service/boards/{boardId}/statuses?conditions=closedStatus=true
   ```
   - If status parameter provided, validate it's a closed status
   - Otherwise, use board's default closed status

3. **Add resolution note**
   ```http
   POST /service/tickets/{id}/notes
   Content-Type: application/json

   {
     "text": "<resolution>",
     "resolutionFlag": true,
     "internalAnalysisFlag": false,
     "customerUpdatedFlag": true,
     "processNotifications": true
   }
   ```

4. **Log time entry (if time_minutes provided)**
   ```http
   POST /time/entries
   Content-Type: application/json

   {
     "chargeToId": <ticket_id>,
     "chargeToType": "ServiceTicket",
     "timeStart": "<current_datetime>",
     "timeEnd": "<current_datetime + time_minutes>",
     "actualHours": <time_minutes / 60>,
     "notes": "<time_notes or resolution>",
     "billableOption": "<Billable or DoNotBill>"
   }
   ```

5. **Update ticket status to closed**
   ```http
   PATCH /service/tickets/{id}
   Content-Type: application/json

   [
     {"op": "replace", "path": "/status/id", "value": <closed_status_id>},
     {"op": "replace", "path": "/resolution", "value": "<resolution>"}
   ]
   ```

6. **Return closure confirmation**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | ConnectWise ticket ID to close |
| resolution | string | Yes | - | Resolution notes |
| status | string | No | Board default | Closed status name |
| time_minutes | integer | No | - | Final time entry in minutes |
| time_notes | string | No | - | Notes for time entry |
| billable | boolean | No | true | Mark time as billable |

## Examples

### Basic Closure

```
/close-ticket 12345 "Password reset completed and verified with user"
```

### With Time Entry

```
/close-ticket 12345 "Server patched and rebooted successfully" --time_minutes 30 --time_notes "Applied security patches"
```

### Non-Billable Time

```
/close-ticket 12345 "Hardware replaced under warranty" --time_minutes 60 --billable false
```

### Specific Closed Status

```
/close-ticket 12345 "Issue resolved" --status "Completed"
```

### Full Closure with All Options

```
/close-ticket 12345 "Configured new email account and tested send/receive functionality" --status "Completed" --time_minutes 45 --time_notes "Email configuration and testing" --billable true
```

## Output

### Basic Closure

```
Ticket #12345 Closed Successfully

Resolution:
"Password reset completed and verified with user"

Final State:
  Company:    Acme Corporation
  Summary:    Password reset request
  Board:      Service Desk
  Status:     Closed
  Priority:   Medium (3)

Closed By:   Jane Technician
Closed At:   2026-02-04 15:30:00

Total Time:  1.5 hours

URL: https://na.myconnectwise.net/v4_6_release/services/system_io/Service/fv_sr100_request.rails?service_recid=12345
```

### With Time Entry

```
Ticket #12345 Closed Successfully

Resolution:
"Server patched and rebooted successfully"

Time Entry Added:
  Duration:   30 minutes (0.5 hours)
  Notes:      Applied security patches
  Billable:   Yes
  Work Type:  Remote Support

Final State:
  Company:    Acme Corporation
  Summary:    Server maintenance required
  Board:      Managed Services
  Status:     Completed
  Priority:   Medium (3)

Closed By:   Jane Technician
Closed At:   2026-02-04 16:00:00

Time Summary:
  Previous:   2.0 hours
  This Entry: 0.5 hours
  Total:      2.5 hours (all billable)

URL: https://na.myconnectwise.net/v4_6_release/services/system_io/Service/fv_sr100_request.rails?service_recid=12345
```

## API Authentication

```bash
# Base64 encode credentials: company+publicKey:privateKey
AUTH=$(echo -n "${CW_COMPANY}+${CW_PUBLIC_KEY}:${CW_PRIVATE_KEY}" | base64)

# Add resolution note
curl -s -X POST \
  "https://${CW_HOST}/v4_6_release/apis/3.0/service/tickets/${TICKET_ID}/notes" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Resolution notes here",
    "resolutionFlag": true,
    "customerUpdatedFlag": true,
    "processNotifications": true
  }'

# Log time entry
curl -s -X POST \
  "https://${CW_HOST}/v4_6_release/apis/3.0/time/entries" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "chargeToId": '"${TICKET_ID}"',
    "chargeToType": "ServiceTicket",
    "timeStart": "2026-02-04T15:00:00Z",
    "timeEnd": "2026-02-04T15:30:00Z",
    "actualHours": 0.5,
    "notes": "Final work notes",
    "billableOption": "Billable"
  }'

# Update status to closed
curl -s -X PATCH \
  "https://${CW_HOST}/v4_6_release/apis/3.0/service/tickets/${TICKET_ID}" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json" \
  -d '[
    {"op": "replace", "path": "/status/id", "value": 5},
    {"op": "replace", "path": "/resolution", "value": "Resolution notes here"}
  ]'
```

## Error Handling

### Ticket Not Found

```
Error: Ticket #99999 not found

The ticket may have been deleted or you may not have permission to access it.
```

### Ticket Already Closed

```
Warning: Ticket #12345 is already closed

Current Status: Closed
Closed On:      2026-02-04 10:00:00
Resolution:     "Issue resolved by restarting service"

Reopen and close again? [Y/n]
Update resolution only? [u]
Cancel? [c]
```

### Empty Resolution

```
Error: Resolution notes are required

Please provide resolution details:
/close-ticket 12345 "Describe how the issue was resolved"
```

### Invalid Closed Status

```
Error: Status "In Progress" is not a closed status

Available closed statuses for this board:
- Closed
- Completed
- Cancelled

Example: /close-ticket 12345 "Resolution" --status "Completed"
```

### No Closed Status on Board

```
Error: No closed status found on board "Projects"

This board may not support ticket closure. Contact your ConnectWise administrator
to add a closed status or move the ticket to a different board first.
```

### Time Entry Validation

```
Error: Invalid time entry

time_minutes must be a positive number.
Example: /close-ticket 12345 "Resolution" --time_minutes 30
```

### Agreement Validation

```
Warning: Time entry may not be covered by agreement

Company: Acme Corporation
Agreement: Managed Services (Block Hours)
Remaining Hours: 0.25 hours
Time to Log: 0.5 hours

This will exceed the agreement by 0.25 hours (billed as overage).

Proceed? [Y/n]
Log as non-billable? [n]
Cancel? [c]
```

### Permission Denied

```
Error: Permission denied

You do not have permission to close tickets on the "Escalations" board.
Contact your ConnectWise administrator.
```

### SLA Warning

```
Warning: Closing ticket #12345 past SLA

Resolution SLA Due:  2026-02-04 14:00:00
Current Time:        2026-02-04 16:30:00
SLA Breach:          2 hours 30 minutes

Proceed with closure? [Y/n]
```

## Related Commands

- `/get-ticket` - View ticket details before closing
- `/update-ticket` - Update ticket fields
- `/add-note` - Add note without closing
- `/log-time` - Log time without closing
- `/search-tickets` - Find tickets to close
