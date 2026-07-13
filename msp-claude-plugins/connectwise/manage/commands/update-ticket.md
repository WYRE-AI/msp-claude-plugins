---
description: Update fields on an existing ConnectWise PSA ticket
argument-hint: "<ticket_id> [status] [priority] [board] [type] [subtype] [owner] [summary]"
arguments: [ticket_id, status, priority, board, type, subtype, owner, summary]
---

# Update ConnectWise PSA Ticket

Update fields on an existing ConnectWise ticket including status, priority, board, and assignment.

## Prerequisites

- Valid ConnectWise PSA API credentials configured
- User must have ticket update permissions
- Target status/board must be valid for current ticket context

## Steps

1. **Validate ticket exists**
   ```http
   GET /service/tickets/{id}
   ```
   - Confirm ticket is accessible
   - Get current board ID for status validation

2. **Resolve field values to IDs**

   If status provided:
   ```http
   GET /service/boards/{boardId}/statuses?conditions=name='{status}'
   ```

   If priority provided:
   ```http
   GET /service/priorities?conditions=name contains '{priority}'
   ```

   If board provided:
   ```http
   GET /service/boards?conditions=name='{board}'
   ```

   If owner provided:
   ```http
   GET /system/members?conditions=identifier='{owner}'
   ```

   If type provided:
   ```http
   GET /service/boards/{boardId}/types?conditions=name='{type}'
   ```

   If subtype provided:
   ```http
   GET /service/boards/{boardId}/subtypes?conditions=name='{subtype}'
   ```

3. **Build patch payload**
   ```json
   [
     {"op": "replace", "path": "/status/id", "value": <status_id>},
     {"op": "replace", "path": "/priority/id", "value": <priority_id>},
     {"op": "replace", "path": "/board/id", "value": <board_id>},
     {"op": "replace", "path": "/owner/id", "value": <owner_id>},
     {"op": "replace", "path": "/type/id", "value": <type_id>},
     {"op": "replace", "path": "/subType/id", "value": <subtype_id>},
     {"op": "replace", "path": "/summary", "value": "<summary>"}
   ]
   ```

4. **Apply update**
   ```http
   PATCH /service/tickets/{id}
   Content-Type: application/json
   ```

5. **Return updated ticket summary**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | ConnectWise ticket ID to update |
| status | string | No | - | New status name |
| priority | string/int | No | - | Priority name or 1-4 |
| board | string | No | - | Target service board name |
| type | string | No | - | Ticket type name |
| subtype | string | No | - | Ticket subtype name |
| owner | string | No | - | Member identifier to assign |
| summary | string | No | - | New ticket summary/title |

## Examples

### Update Status

```
/update-ticket 12345 --status "In Progress"
```

### Change Priority

```
/update-ticket 12345 --priority 2
```

```
/update-ticket 12345 --priority "Priority 1 - Critical"
```

### Reassign Ticket

```
/update-ticket 12345 --owner jsmith
```

### Move to Different Board

```
/update-ticket 12345 --board "Escalations"
```

### Multiple Updates

```
/update-ticket 12345 --status "In Progress" --priority 2 --owner jsmith
```

### Change Type and Subtype

```
/update-ticket 12345 --type "Incident" --subtype "Hardware"
```

### Update Summary

```
/update-ticket 12345 --summary "Email not working - Exchange server issue"
```

### Full Update

```
/update-ticket 12345 --status "In Progress" --priority 1 --owner jsmith --board "Escalations" --type "Incident" --summary "Critical: Email outage affecting all users"
```

## Output

### Successful Update

```
Ticket #12345 Updated Successfully

Changes Applied:
  Status:   New -> In Progress
  Priority: Medium (3) -> High (2)
  Owner:    Unassigned -> John Smith (jsmith)

Current State:
  Company:  Acme Corporation
  Summary:  Email not working for multiple users
  Board:    Service Desk
  Status:   In Progress
  Priority: High (2)
  Owner:    John Smith (jsmith)

URL: https://na.myconnectwise.net/v4_6_release/services/system_io/Service/fv_sr100_request.rails?service_recid=12345
```

### Board Change

```
Ticket #12345 Moved Successfully

Changes Applied:
  Board:  Service Desk -> Escalations
  Status: In Progress -> New (reset due to board change)

Note: Status was reset to "New" as the previous status does not exist on the Escalations board.

Current State:
  Company:  Acme Corporation
  Summary:  Email not working for multiple users
  Board:    Escalations
  Status:   New
  Priority: High (2)

URL: https://na.myconnectwise.net/v4_6_release/services/system_io/Service/fv_sr100_request.rails?service_recid=12345
```

## API Authentication

```bash
# Base64 encode credentials: company+publicKey:privateKey
AUTH=$(echo -n "${CW_COMPANY}+${CW_PUBLIC_KEY}:${CW_PRIVATE_KEY}" | base64)

# Build JSON patch payload
PATCH_DATA='[
  {"op": "replace", "path": "/status/id", "value": 2},
  {"op": "replace", "path": "/priority/id", "value": 1}
]'

# Make API request
curl -s -X PATCH \
  "https://${CW_HOST}/v4_6_release/apis/3.0/service/tickets/${TICKET_ID}" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json" \
  -d "${PATCH_DATA}"
```

## Error Handling

### Ticket Not Found

```
Error: Ticket #99999 not found

The ticket may have been deleted or you may not have permission to access it.
```

### Invalid Status for Board

```
Error: Status "Completed" is not valid for board "Service Desk"

Available statuses for this board:
- New
- In Progress
- Waiting on Customer
- Waiting on Vendor
- Closed

Use one of the statuses above or move the ticket to a different board first.
```

### Invalid Board

```
Error: Service board not found: "Invalid Board"

Available boards:
- Service Desk (ID: 1)
- Managed Services (ID: 2)
- Escalations (ID: 3)
- Projects (ID: 4)
```

### Invalid Priority

```
Error: Priority not found: "Urgent"

Available priorities:
- Priority 1 - Critical (ID: 1)
- Priority 2 - High (ID: 2)
- Priority 3 - Medium (ID: 3)
- Priority 4 - Low (ID: 4)

You can also use just the number (1-4).
```

### Member Not Found

```
Error: Member not found: "invaliduser"

Did you mean one of these?
- jsmith (John Smith)
- jsmithson (Jane Smithson)
- bsmith (Bob Smith)
```

### No Changes Provided

```
Error: No changes specified

Please provide at least one field to update:
  --status     - Change ticket status
  --priority   - Change priority level
  --board      - Move to different board
  --owner      - Reassign ticket
  --type       - Change ticket type
  --subtype    - Change ticket subtype
  --summary    - Update ticket summary

Example: /update-ticket 12345 --status "In Progress"
```

### Permission Denied

```
Error: Permission denied

You do not have permission to update tickets on the "Escalations" board.
Contact your ConnectWise administrator.
```

### Closed Ticket

```
Warning: Ticket #12345 is closed

Updating a closed ticket may affect reporting.
Proceed with update? [Y/n]
```

## Related Commands

- `/get-ticket` - View ticket details
- `/add-note` - Add note to ticket
- `/close-ticket` - Close the ticket
- `/log-time` - Log time against ticket
- `/search-tickets` - Search for tickets
