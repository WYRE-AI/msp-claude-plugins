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
   - Parse `start_date` and `end_date` in the user's timezone and convert both to UTC ISO 8601
   - Check `end_date` is after `start_date`

2. **Resolve the member**
   - `cw_search_members` with `conditions: "identifier = '<member>'"` (or by name)
   - The member is required and never defaulted: if none was given, ask

3. **Resolve what the time is booked against** (`objectId` is required)
   - With `ticket_id`: `cw_get_ticket` to confirm it exists; its ID becomes `objectId`
   - Without one: ask for the service ticket, project ticket or activity to book against. `cw_create_schedule_entry` cannot create a booking that is not linked to one, so stop rather than book without it

4. **Resolve the schedule type and status**
   - `cw_list_schedule_types` (use the `S`/Service type for a service ticket)
   - `cw_list_schedule_statuses` if a status such as Tentative or Firm was named

5. **Check for conflicts**
   - `cw_search_schedule_entries` with `conditions: "member/id = <id> and dateStart < [<end>] and dateEnd > [<start>]"`
   - If anything overlaps, show it and ask before booking (`allowScheduleConflictsFlag: true` only on explicit request)

6. **Create the entry**
   - `cw_create_schedule_entry` with `objectId`, `typeId`, `memberId`, `dateStart`, `dateEnd`, and optional `name`, `statusId`, `whereId`, `reminderId`
   - `location`: `whereId` is a service location (On-Site, In-house, Remote), not an address. Map the request to one of those if it names one. The entry has no free-text address field, so tell the user an address cannot be saved on it (put it in the ticket notes instead)
   - `reminder_minutes`: `reminderId` values have no list endpoint. Use the `reminderId` from an existing entry (`cw_search_schedule_entries`) whose reminder matches the requested interval. If no entry shows that interval, tell the user it cannot be set rather than using some other entry's ID

7. **Report** the entry ID and the booked time in the user's local timezone

To move or re-assign an existing booking, use `cw_update_schedule_entry` instead of creating a second one. See the `connectwise-psa-scheduling` skill for the full model.


## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Entry name/subject |
| start_date | datetime | Yes | - | Start date and time |
| end_date | datetime | Yes | - | End date and time |
| member | string | No | Current user | Member identifier |
| ticket_id | integer | Yes* | - | Ticket to book against. *Required unless the user names another project ticket or activity |
| type | string | No | - | Schedule type |
| location | string | No | - | Service location (On-Site, In-house, Remote); not a street address |
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

## Authentication

Through Conduit no credentials are handled here: the ConnectWise PSA connection (company ID, public/private key, client ID, server URL) is stored in Conduit and injected on every call. `cw_create_schedule_entry` is `write` tier; the lookups are `read`.


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
