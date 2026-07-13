---
description: Log a time entry against a SuperOps.ai ticket
argument-hint: "<ticket_id> <duration> [description] [billable] [start_time] [work_type]"
arguments: [ticket_id, duration, description, billable, start_time, work_type]
---

# Log Time on SuperOps.ai Ticket

Log a time entry against a SuperOps.ai ticket for billing and tracking purposes.

## Prerequisites

- Valid SuperOps.ai API token configured
- Ticket must exist in SuperOps.ai
- User must have time entry permissions

## Steps

1. **Validate ticket exists**
   - Query ticket by ID or ticket number
   - Return error if ticket not found
   - Show current ticket subject for confirmation

2. **Validate duration**
   - Must be a positive integer
   - Represents minutes (e.g., 30 = 30 minutes)
   - Warn if unusually long (> 480 minutes / 8 hours)

3. **Calculate start time**
   - If start_time not provided, calculate from now minus duration
   - Validate start_time is not in the future
   - Validate start_time is within reasonable range (not older than 30 days)

4. **Log the time entry**
   ```graphql
   mutation addTicketTimeEntry($input: AddTimeEntryInput!) {
     addTicketTimeEntry(input: $input) {
       timeEntryId
       ticketId
       duration
       description
       billable
       startTime
       endTime
       workType
       technician {
         id
         name
       }
       createdTime
     }
   }
   ```

   Variables:
   ```json
   {
     "input": {
       "ticketId": "<ticket_id>",
       "duration": 30,
       "description": "<description>",
       "billable": true,
       "startTime": "2026-02-04T10:00:00Z",
       "workType": "REMOTE_SUPPORT"
     }
   }
   ```

5. **Confirm time entry was logged**
   - Display time entry ID
   - Show total time on ticket
   - Confirm billable status

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | string | Yes | - | Ticket ID or ticket number |
| duration | integer | Yes | - | Duration in minutes |
| description | string | No | - | Work description |
| billable | boolean | No | true | Mark as billable |
| start_time | datetime | No | now - duration | Start time (ISO 8601) |
| work_type | string | No | - | Type of work performed |

## Work Types

Common work types in SuperOps.ai:
- Remote Support
- On-Site Support
- Phone Support
- Email Support
- Project Work
- Internal Work
- Travel Time

## Examples

### Basic Time Entry

```
/log-time TICK-12345 30
```

### With Description

```
/log-time TICK-12345 30 --description "Troubleshot network connectivity issue"
```

### Billable Time with Description

```
/log-time TICK-12345 90 --billable true --description "Server migration work"
```

### Non-Billable Internal Work

```
/log-time TICK-12345 45 --billable false --description "Internal documentation"
```

### With Work Type

```
/log-time TICK-12345 60 --description "On-site printer repair" --work_type "On-Site Support"
```

### With Specific Start Time

```
/log-time TICK-12345 120 --start_time "2026-02-04T09:00:00Z" --description "Morning troubleshooting session"
```

## Output

```
Time Entry Logged Successfully

Ticket: TICK-12345 - Email not working - Outlook disconnected
Client: Acme Corporation

Time Entry Details:
  Entry ID: time_abc123
  Duration: 30 minutes (0.5 hours)
  Billable: Yes
  Work Type: Remote Support
  Start: 2026-02-04 10:00 UTC
  End: 2026-02-04 10:30 UTC

Description:
-----------
Troubleshot network connectivity issue
-----------

Logged By: Jane Technician
Logged At: 2026-02-04 14:32:00

Ticket Time Summary:
  Total Logged: 2.5 hours
  Billable: 2.0 hours
  Non-Billable: 0.5 hours
```

## curl Example

```bash
curl -X POST 'https://yourcompany.superops.ai/graphql' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation addTicketTimeEntry($input: AddTimeEntryInput!) { addTicketTimeEntry(input: $input) { timeEntryId ticketId duration description billable startTime endTime workType technician { id name } createdTime } }",
    "variables": {
      "input": {
        "ticketId": "ticket-uuid-here",
        "duration": 30,
        "description": "Troubleshot network connectivity issue",
        "billable": true,
        "startTime": "2026-02-04T10:00:00Z",
        "workType": "Remote Support"
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

### Invalid Duration

```
Invalid duration: "-30"

Duration must be a positive number of minutes.
Examples:
  30    = 30 minutes
  60    = 1 hour
  90    = 1.5 hours
```

### Duration Warning

```
Warning: Duration of 600 minutes (10 hours) is unusually long.

Are you sure this is correct?
- If working multiple days, consider logging separate entries per day
- Maximum recommended single entry: 480 minutes (8 hours)

Continue anyway? [y/N]
```

### Future Start Time

```
Invalid start time: Start time cannot be in the future.

Current time: 2026-02-04 14:00 UTC
Provided start: 2026-02-04 16:00 UTC

Please provide a past start time or omit to use current time.
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid ticket ID | Verify ticket exists using /search-tickets |
| Invalid duration | Must be positive integer (minutes) |
| Invalid work type | Check available work types in SuperOps.ai |
| Permission denied | Check user permissions for time entry |
| Ticket closed | Some workflows prevent time on closed tickets |
| Rate limited | Wait and retry (800 req/min limit) |

## Best Practices

1. **Log time immediately** - Don't batch at end of day; you'll forget details
2. **Be descriptive** - Include what you did, not just how long
3. **Use correct work types** - Helps with reporting and billing
4. **Mark non-billable appropriately** - Internal work, training, etc.
5. **Log in smaller increments** - Multiple entries are better than one large one
6. **Round consistently** - Follow your organization's rounding policy

## Related Commands

- `/create-ticket` - Create a new ticket
- `/update-ticket` - Update ticket status
- `/add-ticket-note` - Add documentation to ticket
- `/list-assets` - View client assets
