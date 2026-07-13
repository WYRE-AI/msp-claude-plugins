---
description: Create a calendar appointment in Syncro
argument-hint: "<subject> <start_time> <end_time> [customer_id] [ticket_id] [user_id] [location] [notes]"
arguments: [subject, start_time, end_time, customer_id, ticket_id, user_id, location, notes]
---

# Create Syncro Appointment

Create a calendar appointment for scheduled work, optionally linked to a ticket or customer.

## Prerequisites

- Valid Syncro API key configured
- User must have appointment creation permissions
- Calendar access enabled

## Steps

1. **Validate input**
   - Parse and validate start_time
   - Parse and validate end_time
   - Ensure end_time is after start_time

2. **Resolve optional fields**
   - Validate customer_id if provided
   - Validate ticket_id if provided
   - Look up user_id or use current user

3. **Create the appointment**
   ```bash
   curl -s -X POST \
     "https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/appointments?api_key=${SYNCRO_API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "subject": "<subject>",
       "start_at": "<start_time>",
       "end_at": "<end_time>",
       "customer_id": <customer_id>,
       "ticket_id": <ticket_id>,
       "user_id": <user_id>,
       "location": "<location>",
       "notes": "<notes>"
     }'
   ```

4. **Confirm and return details**
   - Show appointment created
   - Display calendar link
   - Show associated ticket/customer if linked

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| subject | string | Yes | - | Appointment subject/title |
| start_time | datetime | Yes | - | Start date and time |
| end_time | datetime | Yes | - | End date and time |
| customer_id | integer | No | - | Associated customer |
| ticket_id | integer | No | - | Associated ticket |
| user_id | integer | No | current | Assigned technician |
| location | string | No | - | Appointment location |
| notes | string | No | - | Additional notes |

## API Endpoints Used

```
POST /api/v1/appointments
GET /api/v1/users (for user validation)
GET /api/v1/customers/{id} (for customer validation)
GET /api/v1/tickets/{id} (for ticket validation)
```

## Examples

### Basic Appointment

```
/create-appointment "Server Maintenance" "2026-02-10 09:00" "2026-02-10 11:00"
```

### With Customer

```
/create-appointment "Server Maintenance" "2026-02-10 09:00" "2026-02-10 11:00" --customer_id 12345
```

### Linked to Ticket

```
/create-appointment "On-site Support" "2026-02-11 14:00" "2026-02-11 16:00" --ticket_id 9876
```

### With Location

```
/create-appointment "On-site Support" "2026-02-11 14:00" "2026-02-11 16:00" --ticket_id 9876 --location "123 Main St, Suite 100"
```

### With Notes

```
/create-appointment "Weekly Check-in" "2026-02-12 10:00" "2026-02-12 10:30" --notes "Remote meeting - Teams link in ticket"
```

### Assign to Another Tech

```
/create-appointment "Network Install" "2026-02-13 08:00" "2026-02-13 17:00" --customer_id 12345 --user_id 567
```

### Full Details

```
/create-appointment "Server Migration" "2026-02-15 08:00" "2026-02-15 18:00" --customer_id 12345 --ticket_id 9876 --location "456 Tech Park Dr" --notes "Full day on-site. Contact John at ext 123."
```

## Output

### Basic Appointment

```
Appointment Created Successfully

Subject: Server Maintenance
Date: Monday, February 10, 2026
Time: 9:00 AM - 11:00 AM (2 hours)
Assigned To: Jane Technician

URL: https://acme.syncromsp.com/appointments/11111
Calendar: https://acme.syncromsp.com/calendar
```

### With Customer and Ticket

```
Appointment Created Successfully

Subject: On-site Support
Date: Tuesday, February 11, 2026
Time: 2:00 PM - 4:00 PM (2 hours)
Assigned To: Jane Technician

Customer: Acme Corporation
  Contact: John Smith
  Phone: (555) 123-4567

Linked Ticket: #9876 - Email not working
Location: 123 Main St, Suite 100

Notes:
Bring replacement network cables.

URL: https://acme.syncromsp.com/appointments/11112
Calendar: https://acme.syncromsp.com/calendar
```

### With Another Tech

```
Appointment Created Successfully

Subject: Network Install
Date: Thursday, February 13, 2026
Time: 8:00 AM - 5:00 PM (9 hours)
Assigned To: Bob Installer

Customer: Acme Corporation

URL: https://acme.syncromsp.com/appointments/11113
Calendar: https://acme.syncromsp.com/calendar

Note: Bob Installer has been assigned. They will receive a notification.
```

## Error Handling

### Invalid Date Format

```
Error: Invalid date/time format

"Feb 10" is not a valid date format.

Expected format: YYYY-MM-DD HH:MM
Examples:
- 2026-02-10 09:00
- 2026-02-10 14:30
```

### End Time Before Start Time

```
Error: Invalid time range

End time (09:00) cannot be before start time (11:00).

Please ensure end_time is after start_time.
```

### Past Date

```
Warning: Appointment in the past

The specified time (2026-02-01 09:00) is in the past.

Create anyway? This is typically for documenting past work.
```

### Invalid Customer ID

```
Error: Customer not found

Customer ID 99999 does not exist or you do not have access.

Suggestions:
- Verify the customer ID is correct
- Use /get-customer --query "name" to find the ID
```

### Invalid Ticket ID

```
Error: Ticket not found

Ticket ID 99999 does not exist or you do not have access.

Suggestions:
- Verify the ticket ID is correct
- Use /search-tickets to find the ticket
```

### Invalid User ID

```
Error: User not found

User ID 999 does not exist or is inactive.

Use the Syncro web interface to find valid user IDs.
```

### Schedule Conflict

```
Warning: Schedule conflict detected

Jane Technician already has an appointment:
- "Client Meeting" from 9:00 AM - 10:00 AM

Create anyway? This will create an overlapping appointment.
```

### Permission Denied

```
Error: Permission denied (403)

You do not have permission to create appointments.

Contact your Syncro administrator if you need access.
```

### Rate Limiting

```
Rate limited by Syncro API (180 req/min)

Retrying in 5 seconds...
```

## Date/Time Format Reference

| Format | Example | Notes |
|--------|---------|-------|
| YYYY-MM-DD HH:MM | 2026-02-10 09:00 | 24-hour format (recommended) |
| YYYY-MM-DD H:MM | 2026-02-10 9:00 | Without leading zero |
| ISO 8601 | 2026-02-10T09:00:00 | Full ISO format |

## Tips

### Quick Meeting Scheduling

For a 30-minute meeting:

```
/create-appointment "Quick Call" "2026-02-10 10:00" "2026-02-10 10:30" --customer_id 12345
```

### Full-Day On-Site

For all-day appointments:

```
/create-appointment "On-Site Work" "2026-02-10 08:00" "2026-02-10 17:00" --customer_id 12345 --location "Client Site"
```

### Linking to Tickets

Always link appointments to tickets for proper time tracking:

```
/create-appointment "Scheduled Work" "2026-02-10 14:00" "2026-02-10 16:00" --ticket_id 9876
```

### Team Scheduling

Schedule work for another technician:

```
/create-appointment "Installation" "2026-02-10 09:00" "2026-02-10 12:00" --user_id 567 --customer_id 12345
```

### Recurring Appointments

For recurring work, create individual appointments or use Syncro's web interface for recurring patterns.

## Related Commands

- `/create-ticket` - Create a ticket for the appointment
- `/get-customer` - Get customer contact details
- `/search-tickets` - Find tickets to link
- `/update-ticket` - Update ticket with appointment info
