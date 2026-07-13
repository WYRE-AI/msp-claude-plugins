---
description: Retrieve detailed ticket information from ConnectWise PSA
argument-hint: "<ticket_id> [include_notes] [include_time] [include_configs] [include_tasks]"
arguments: [ticket_id, include_notes, include_time, include_configs, include_tasks]
---

# Get ConnectWise PSA Ticket

Retrieve detailed ticket information including status, notes, time entries, and configuration items.

## Prerequisites

- Valid ConnectWise PSA API credentials configured
- User must have ticket read permissions

## Steps

1. **Validate ticket exists**
   - Fetch ticket by ID
   - Handle 404 if ticket not found
   - Check user has access to view ticket

2. **Retrieve base ticket information**
   ```http
   GET /service/tickets/{id}
   ```
   - Include company, contact, status, priority, board details
   - Parse SLA information if available

3. **Fetch ticket notes (if include_notes=true)**
   ```http
   GET /service/tickets/{id}/notes?pageSize=100&orderBy=dateCreated desc
   ```
   - Retrieve all notes with author and timestamp
   - Distinguish internal vs external notes

4. **Fetch time entries (if include_time=true)**
   ```http
   GET /service/tickets/{id}/timeentries?pageSize=100&orderBy=timeStart desc
   ```
   - Calculate total hours logged
   - Show billable vs non-billable breakdown

5. **Fetch configurations (if include_configs=true)**
   ```http
   GET /service/tickets/{id}/configurations?pageSize=100
   ```
   - List associated assets/devices
   - Include configuration type and status

6. **Fetch tasks (if include_tasks=true)**
   ```http
   GET /service/tickets/{id}/tasks?pageSize=100&orderBy=sequence
   ```
   - Show task list with completion status
   - Include estimated vs actual time

7. **Format and return comprehensive ticket view**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | ConnectWise ticket ID |
| include_notes | boolean | No | true | Include ticket notes |
| include_time | boolean | No | false | Include time entries |
| include_configs | boolean | No | false | Include configuration items |
| include_tasks | boolean | No | false | Include service tasks |

## Examples

### Basic Usage

```
/get-ticket 12345
```

### With Time Entries

```
/get-ticket 12345 --include_time true
```

### Full Details

```
/get-ticket 12345 --include_time true --include_configs true --include_tasks true
```

### Minimal (No Notes)

```
/get-ticket 12345 --include_notes false
```

## Output

```
================================================================================
Ticket #12345 - Email not working for multiple users
================================================================================

Company:        Acme Corporation
Contact:        John Smith (john.smith@acme.com)
Phone:          (555) 123-4567

Board:          Service Desk
Status:         In Progress
Priority:       High (2)
Type:           Incident
Subtype:        Email

Created:        2026-02-04 09:23:00 by Jane Doe
Last Updated:   2026-02-04 14:45:00

SLA Information:
  Response Due:   2026-02-04 10:23:00 (Met)
  Resolution Due: 2026-02-04 17:23:00 (2h 38m remaining)

Assigned To:    Jane Technician

--------------------------------------------------------------------------------
Description
--------------------------------------------------------------------------------
Multiple users in the sales department are unable to send or receive email.
Issue started at approximately 9am this morning after the mail server update.

================================================================================
Notes (3)
================================================================================

[INTERNAL] 2026-02-04 14:45 - Jane Technician
Identified issue with mail flow rules created during migration. Working on fix.

[EXTERNAL] 2026-02-04 11:30 - Jane Technician
Hi John, We've identified the issue and are working on a resolution. I'll update
you within the hour.

[INTERNAL] 2026-02-04 10:15 - Jane Technician
Initial triage: Confirmed mail queue is backing up. Checking mail flow rules.

================================================================================

Quick Actions:
- Update ticket: /update-ticket 12345
- Add note: /add-note 12345
- Log time: /log-time 12345
- Close ticket: /close-ticket 12345
```

### With Time Entries

```
================================================================================
Time Entries (2 entries, 2.5 hours total)
================================================================================

2026-02-04 10:00-11:30 (1.5h) - Jane Technician [Billable]
  Work Type: Remote Support
  Notes: Initial troubleshooting and triage of email issue

2026-02-04 14:00-15:00 (1.0h) - Jane Technician [Billable]
  Work Type: Remote Support
  Notes: Identified and documented root cause

Summary:
  Billable:     2.5 hours
  Non-Billable: 0.0 hours
  Total:        2.5 hours

================================================================================
```

### With Configuration Items

```
================================================================================
Configuration Items (2)
================================================================================

1. ACME-EXCH01 (Server)
   Type:     Server - Exchange
   Status:   Active
   Serial:   SN123456789

2. ACME-DC01 (Server)
   Type:     Server - Domain Controller
   Status:   Active
   Serial:   SN987654321

================================================================================
```

### With Tasks

```
================================================================================
Tasks (3)
================================================================================

[x] 1. Initial triage and reproduction
       Estimated: 0.5h | Actual: 0.5h

[x] 2. Identify root cause
       Estimated: 1.0h | Actual: 1.0h

[ ] 3. Apply fix and verify resolution
       Estimated: 1.0h | Actual: -

Progress: 2/3 tasks complete (67%)

================================================================================
```

## API Authentication

```bash
# Base64 encode credentials: company+publicKey:privateKey
AUTH=$(echo -n "${CW_COMPANY}+${CW_PUBLIC_KEY}:${CW_PRIVATE_KEY}" | base64)

# Make API request
curl -s -X GET \
  "https://${CW_HOST}/v4_6_release/apis/3.0/service/tickets/${TICKET_ID}" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json"
```

## Error Handling

### Ticket Not Found

```
Error: Ticket #99999 not found

The ticket may have been deleted or you may not have permission to view it.
```

### Access Denied

```
Error: Access denied for ticket #12345

You do not have permission to view tickets on the "Escalations" board.
Contact your ConnectWise administrator.
```

### Rate Limited

```
Rate limited by ConnectWise API

Retrying in 5 seconds...
Successfully retrieved ticket #12345
```

### Invalid Ticket ID

```
Error: Invalid ticket ID "abc"

Ticket ID must be a numeric value.
Example: /get-ticket 12345
```

## Related Commands

- `/search-tickets` - Search for tickets
- `/update-ticket` - Update ticket fields
- `/add-note` - Add note to ticket
- `/close-ticket` - Close the ticket
- `/log-time` - Log time against ticket
