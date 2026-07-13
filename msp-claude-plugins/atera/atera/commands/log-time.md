---
description: Log work hours on an Atera ticket
argument-hint: "<ticket_id> <hours> [notes] [date] [billable] [hourly_rate]"
arguments: [ticket_id, hours, notes, date, billable, hourly_rate]
---

# Log Time on Atera Ticket

Log work hours on an Atera ticket for billing and tracking purposes.

## Prerequisites

- Valid Atera API key configured
- Ticket must exist in Atera
- User must have time entry permissions

## Steps

1. **Validate ticket exists**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/tickets/{ticket_id}" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```
   - Verify ticket exists
   - Capture ticket details for confirmation
   - Check if ticket is closed (warn user)

2. **Validate time entry parameters**
   - Validate hours is a positive decimal
   - Parse date if provided, default to today
   - Set billable default to true if not specified

3. **Create time entry**
   ```bash
   curl -s -X POST "https://app.atera.com/api/v3/tickets/{ticket_id}/workhours" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "Hours": <hours>,
       "Notes": "<notes>",
       "Date": "<date>",
       "Billable": <billable>,
       "HourlyRate": <hourly_rate>
     }'
   ```

4. **Return confirmation**
   - Time entry ID
   - Ticket summary
   - Hours logged
   - Billable status
   - Running total for ticket

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | The ticket ID to log time against |
| hours | decimal | Yes | - | Hours worked (e.g., 0.5, 1.25, 2) |
| notes | string | No | - | Description of work performed |
| date | date | No | today | Date of work (YYYY-MM-DD) |
| billable | boolean | No | true | Mark time as billable |
| hourly_rate | decimal | No | - | Override default hourly rate |

## Examples

### Basic Time Entry

```
/log-time 12345 1.5
```

### Time with Notes

```
/log-time 12345 1.5 --notes "Troubleshot network connectivity issue"
```

### Non-Billable Time

```
/log-time 12345 0.5 --billable false --notes "Internal documentation"
```

### Previous Day Entry

```
/log-time 12345 2 --date "2026-02-03"
```

### With Override Rate

```
/log-time 12345 2 --date "2026-02-03" --hourly_rate 150
```

### Full Entry

```
/log-time 12345 1.5 --notes "Resolved printer spooler issue, updated drivers" --billable true --date "2026-02-04" --hourly_rate 125
```

## Output

### Basic Confirmation

```
Time Entry Logged Successfully

Entry ID: 98765
Ticket: #12345 - Email not working
Customer: Acme Corporation

Time Logged:
- Hours: 1.5
- Date: 2026-02-04
- Billable: Yes
- Notes: Troubleshot network connectivity issue

Ticket Total: 3.5 hours (2.5 billable)
```

### With Rate Override

```
Time Entry Logged Successfully

Entry ID: 98766
Ticket: #12345 - Server maintenance
Customer: Acme Corporation

Time Logged:
- Hours: 2.0
- Date: 2026-02-03
- Billable: Yes
- Rate: $150.00/hr
- Amount: $300.00
- Notes: After-hours emergency maintenance

Ticket Total: 5.0 hours
Billable Amount: $625.00
```

### Non-Billable Entry

```
Time Entry Logged Successfully

Entry ID: 98767
Ticket: #12345 - Documentation update
Customer: Acme Corporation

Time Logged:
- Hours: 0.5
- Date: 2026-02-04
- Billable: No
- Notes: Internal documentation

Ticket Total: 1.5 hours (0.5 billable)
```

## Error Handling

### Ticket Not Found

```
Ticket not found: 12345

Please verify the ticket ID and try again.
Use /create-ticket to create a new ticket.
```

### Ticket Closed

```
Warning: Ticket #12345 is closed

Ticket: Email not working
Status: Closed
Closed On: 2026-02-03

Log time anyway? [y/N]
```

### Invalid Hours

```
Invalid hours: "two"

Hours must be a positive number:
- 0.25 (15 minutes)
- 0.5 (30 minutes)
- 1.0 (1 hour)
- 1.5 (1 hour 30 minutes)
- 2.75 (2 hours 45 minutes)
```

### Negative Hours

```
Invalid hours: -1.5

Hours must be a positive number.
```

### Hours Too Large

```
Invalid hours: 24

Maximum time entry is 8 hours.
Split into multiple entries for longer periods.
```

### Invalid Date

```
Invalid date: "yesterday"

Please use YYYY-MM-DD format:
- 2026-02-04
- 2026-02-03
```

### Future Date

```
Warning: Date is in the future: 2026-02-10

Time entries are typically for work already completed.
Proceed anyway? [y/N]
```

### Rate Limit Exceeded

```
Rate limit exceeded (700 req/min)

Waiting 30 seconds before retry...
```

### Insufficient Permissions

```
Permission denied: Cannot log time on ticket 12345

Contact your administrator to verify your permissions.
```

## API Patterns

### Get Ticket Details
```http
GET /api/v3/tickets/{ticketId}
X-API-KEY: {api_key}
```

### Create Work Hours Entry
```http
POST /api/v3/tickets/{ticketId}/workhours
X-API-KEY: {api_key}
Content-Type: application/json

{
  "Hours": 1.5,
  "Notes": "Troubleshot network connectivity issue",
  "Date": "2026-02-04",
  "Billable": true,
  "HourlyRate": 125.00
}
```

### Get Ticket Work Hours
```http
GET /api/v3/tickets/{ticketId}/workhours
X-API-KEY: {api_key}
```

### Response Structure
```json
{
  "WorkHoursID": 98765,
  "TicketID": 12345,
  "TechnicianID": 5678,
  "Hours": 1.5,
  "Notes": "Troubleshot network connectivity issue",
  "Date": "2026-02-04T00:00:00Z",
  "Billable": true,
  "HourlyRate": 125.00,
  "TotalAmount": 187.50,
  "CreatedOn": "2026-02-04T14:30:00Z"
}
```

## Common Time Increments

| Minutes | Hours | Description |
|---------|-------|-------------|
| 15 | 0.25 | Quick check or update |
| 30 | 0.5 | Brief troubleshooting |
| 45 | 0.75 | Standard support call |
| 60 | 1.0 | Extended troubleshooting |
| 90 | 1.5 | Complex issue resolution |
| 120 | 2.0 | Major repair or installation |

## Related Commands

- `/update-ticket` - Update ticket status after logging time
- `/create-ticket` - Create a new ticket to log time against
- `/search-customers` - Find customer information
