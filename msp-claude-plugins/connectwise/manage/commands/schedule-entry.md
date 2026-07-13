---
description: Create a schedule entry/appointment in ConnectWise PSA
argument-hint: "<name> <start_date> <end_date> [member] [ticket_id] [type] [location] [reminder_minutes] [status]"
arguments: [name, start_date, end_date, member, ticket_id, type, location, reminder_minutes, status]
---

# Create ConnectWise PSA Schedule Entry

Create a schedule entry/appointment in ConnectWise, optionally linked to a ticket.

## Prerequisites

- Valid ConnectWise PSA API credentials configured
- User must have schedule creation permissions
- Member must have schedule access

## Steps

1. **Validate date/time inputs**
   - Parse start_date and end_date
   - Validate end_date is after start_date
   - Check for schedule conflicts (if enabled)

2. **Resolve member (if provided)**
   ```http
   GET /system/members?conditions=identifier='{member}'
   ```
   - Default to current authenticated user if not specified

3. **Validate ticket (if ticket_id provided)**
   ```http
   GET /service/tickets/{ticket_id}
   ```
   - Confirm ticket exists and is accessible

4. **Resolve schedule type (if provided)**
   ```http
   GET /schedule/types?conditions=name='{type}'
   ```

5. **Resolve schedule status (if provided)**
   ```http
   GET /schedule/statuses?conditions=name='{status}'
   ```

6. **Create schedule entry**
   ```http
   POST /schedule/entries
   Content-Type: application/json

   {
     "name": "<name>",
     "dateStart": "<start_date>",
     "dateEnd": "<end_date>",
     "member": {"identifier": "<member>"},
     "objectId": <ticket_id>,
     "type": {"id": <type_id>},
     "where": {"id": <location_id>},
     "status": {"id": <status_id>},
     "reminder": {
       "minutes": <reminder_minutes>
     }
   }
   ```

7. **Return confirmation with calendar details**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Entry name/subject |
| start_date | datetime | Yes | - | Start date and time |
| end_date | datetime | Yes | - | End date and time |
| member | string | No | Current user | Member identifier |
| ticket_id | integer | No | - | Associated ticket ID |
| type | string | No | - | Schedule type |
| location | string | No | - | Location/address |
| reminder_minutes | integer | No | - | Minutes before reminder |
| status | string | No | - | Schedule status |

## Examples

### Basic Schedule Entry

```
/schedule-entry "Server Maintenance" "2026-02-10 09:00" "2026-02-10 12:00"
```

### Linked to Ticket

```
/schedule-entry "Server Maintenance" "2026-02-10 09:00" "2026-02-10 12:00" --ticket_id 12345
```

### On-site Appointment

```
/schedule-entry "On-site Support" "2026-02-11 14:00" "2026-02-11 17:00" --location "123 Main St, Anytown, USA" --type "Service"
```

### Schedule for Another Member

```
/schedule-entry "Customer Meeting" "2026-02-12 10:00" "2026-02-12 11:00" --member jsmith
```

### With Reminder

```
/schedule-entry "Project Kickoff" "2026-02-15 09:00" "2026-02-15 10:00" --reminder_minutes 30
```

### Tentative Appointment

```
/schedule-entry "Potential Site Visit" "2026-02-20 13:00" "2026-02-20 16:00" --status "Tentative"
```

### Full Example

```
/schedule-entry "Quarterly Review Meeting" "2026-02-28 14:00" "2026-02-28 15:30" --member jsmith --type "Meeting" --location "Customer Site - 456 Oak Ave" --reminder_minutes 60 --status "Firm"
```

## Output

### Successful Creation

```
Schedule Entry Created Successfully

Entry ID:       34567
Name:           Server Maintenance
Type:           Service

Time:
  Start:        2026-02-10 09:00
  End:          2026-02-10 12:00
  Duration:     3 hours

Member:         Jane Technician (jtechnician)
Status:         Firm

Linked Ticket:  #12345 - Server maintenance required
Company:        Acme Corporation

Calendar URL:   https://na.myconnectwise.net/v4_6_release/services/system_io/Schedule/fv_sch200_schedule.rails

iCal Export:    Available (use --export-ical)
```

### With Location

```
Schedule Entry Created Successfully

Entry ID:       34568
Name:           On-site Support
Type:           Service

Time:
  Start:        2026-02-11 14:00
  End:          2026-02-11 17:00
  Duration:     3 hours

Member:         Jane Technician (jtechnician)
Status:         Firm

Location:
  Address:      123 Main St, Anytown, USA

  Directions:   https://maps.google.com/?q=123+Main+St,+Anytown,+USA

Reminder:       30 minutes before (2026-02-11 13:30)
```

### With Ticket Link

```
Schedule Entry Created Successfully

Entry ID:       34569
Name:           Server Maintenance
Type:           Service

Time:
  Start:        2026-02-10 09:00
  End:          2026-02-10 12:00
  Duration:     3 hours

Linked Ticket:
  ID:           #12345
  Summary:      Server maintenance required
  Company:      Acme Corporation
  Contact:      John Smith (john.smith@acme.com)
  Priority:     Medium (3)
  Status:       Scheduled

Note: Ticket status updated to "Scheduled"
```

## API Authentication

```bash
# Base64 encode credentials: company+publicKey:privateKey
AUTH=$(echo -n "${CW_COMPANY}+${CW_PUBLIC_KEY}:${CW_PRIVATE_KEY}" | base64)

# Create schedule entry
curl -s -X POST \
  "https://${CW_HOST}/v4_6_release/apis/3.0/schedule/entries" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Server Maintenance",
    "dateStart": "2026-02-10T09:00:00Z",
    "dateEnd": "2026-02-10T12:00:00Z",
    "member": {"identifier": "jtechnician"},
    "objectId": 12345,
    "type": {"id": 1},
    "status": {"id": 1}
  }'

# Get schedule types
curl -s -X GET \
  "https://${CW_HOST}/v4_6_release/apis/3.0/schedule/types" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json"

# Get schedule statuses
curl -s -X GET \
  "https://${CW_HOST}/v4_6_release/apis/3.0/schedule/statuses" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json"
```

## Error Handling

### Missing Required Fields

```
Error: Missing required fields

Required:
- name: Schedule entry name/subject
- start_date: Start date and time
- end_date: End date and time

Example:
/schedule-entry "Meeting Name" "2026-02-10 09:00" "2026-02-10 10:00"
```

### Invalid Date Format

```
Error: Invalid date format "02/10/2026"

Supported formats:
- YYYY-MM-DD HH:MM (e.g., 2026-02-10 09:00)
- YYYY-MM-DDTHH:MM:SS (e.g., 2026-02-10T09:00:00)

Example: /schedule-entry "Meeting" "2026-02-10 09:00" "2026-02-10 10:00"
```

### End Before Start

```
Error: End time must be after start time

Start: 2026-02-10 10:00
End:   2026-02-10 09:00

Please check your date/time values.
```

### Schedule Conflict

```
Warning: Schedule conflict detected

Existing entry for Jane Technician:
  2026-02-10 08:00 - 10:00: Morning standup meeting

Your entry:
  2026-02-10 09:00 - 12:00: Server Maintenance

Options:
- Create anyway (overlap): [Y]
- Adjust start time to 10:00: [a]
- Cancel: [c]
```

### Member Not Found

```
Error: Member not found: "invaliduser"

Did you mean one of these?
- jsmith (John Smith)
- jtechnician (Jane Technician)
- bwilson (Bob Wilson)
```

### Ticket Not Found

```
Error: Ticket #99999 not found

The ticket may have been deleted or you may not have permission to access it.
Create entry without ticket link? [Y/n]
```

### Invalid Schedule Type

```
Error: Schedule type not found: "InvalidType"

Available types:
- Service
- Sales
- Meeting
- Training
- Holiday
- Vacation
- Sick
- Personal

Example: /schedule-entry "Name" "start" "end" --type "Service"
```

### Invalid Schedule Status

```
Error: Schedule status not found: "Maybe"

Available statuses:
- Firm
- Tentative

Example: /schedule-entry "Name" "start" "end" --status "Tentative"
```

### Past Date Warning

```
Warning: Schedule entry is in the past

Start: 2026-02-01 09:00 (3 days ago)

Create past schedule entry? [Y/n]
```

### Permission Denied

```
Error: Permission denied

You do not have permission to create schedule entries.
Contact your ConnectWise administrator.
```

### Member Permission Denied

```
Error: Cannot schedule for member "jsmith"

You do not have permission to create schedule entries for other members.
Create for yourself instead? [Y/n]
```

### Reminder Validation

```
Error: Invalid reminder value "-30"

Reminder must be a positive number of minutes.
Example: --reminder_minutes 30 (30 minutes before)

Common reminder times:
- 15 minutes
- 30 minutes
- 60 minutes (1 hour)
- 1440 minutes (1 day)
```

## Schedule Types Reference

| Type | Description |
|------|-------------|
| Service | Service ticket appointment |
| Sales | Sales call or meeting |
| Meeting | Internal or customer meeting |
| Training | Training session |
| Holiday | Company holiday |
| Vacation | Personal time off |
| Sick | Sick leave |
| Personal | Personal appointment |

## Schedule Status Reference

| Status | Description |
|--------|-------------|
| Firm | Confirmed appointment |
| Tentative | Pending confirmation |

## Related Commands

- `/get-ticket` - View ticket to schedule appointment for
- `/update-ticket` - Update ticket status after scheduling
- `/log-time` - Log time against ticket after completion
- `/search-tickets` - Find tickets needing scheduling
