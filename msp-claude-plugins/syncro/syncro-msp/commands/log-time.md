---
description: Log a time entry against a Syncro ticket
argument-hint: "<ticket_id> <duration> [notes] [billable] [timer_started_at] [product_id]"
arguments: [ticket_id, duration, notes, billable, timer_started_at, product_id]
---

# Log Time to Syncro Ticket

Log a time entry against a Syncro ticket for billing and tracking purposes.

## Prerequisites

- Valid Syncro API key configured
- Ticket must exist in Syncro
- User must have time entry permissions

## Steps

1. **Validate ticket exists**
   - Fetch ticket details to confirm ID
   - Display ticket subject for confirmation
   - Get customer billing info

2. **Parse duration**
   - Accept minutes (e.g., "30") or HH:MM format (e.g., "1:30")
   - Calculate start time if not provided

3. **Resolve optional fields**
   - Look up product_id if provided
   - Set billable flag (default: true)
   - Calculate timer_started_at from duration

4. **Create time entry**
   ```bash
   curl -s -X POST \
     "https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/tickets/${ticket_id}/timer_entries?api_key=${SYNCRO_API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "duration_minutes": <duration>,
       "notes": "<notes>",
       "billable": <billable>,
       "timer_started_at": "<start_time>",
       "product_id": <product_id>
     }'
   ```

5. **Confirm and return details**
   - Show time entry created
   - Display billable status and amount
   - Show ticket total time

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | Ticket ID to log time against |
| duration | string | Yes | - | Minutes or HH:MM format |
| notes | string | No | - | Work description/notes |
| billable | boolean | No | true | Mark as billable |
| timer_started_at | datetime | No | calculated | Start time of work |
| product_id | integer | No | - | Product/service ID for billing |

## API Endpoints Used

```
POST /api/v1/tickets/{id}/timer_entries
GET /api/v1/tickets/{id} (for validation)
GET /api/v1/products (for product lookup)
```

## Examples

### Basic Time Entry (Minutes)

```
/log-time 12345 30
```

### Time Entry with Notes

```
/log-time 12345 30 --notes "Troubleshot network connectivity issue"
```

### Using HH:MM Format

```
/log-time 12345 "1:30" --notes "Server migration work"
```

### Non-Billable Time

```
/log-time 12345 45 --billable false --notes "Internal documentation"
```

### With Specific Start Time

```
/log-time 12345 60 --timer_started_at "2026-02-04 09:00" --notes "Morning support call"
```

### With Product/Service

```
/log-time 12345 30 --product_id 789 --notes "Remote support session"
```

## Output

```
Time Entry Logged Successfully

Ticket: #12345 - Email not working
Customer: Acme Corporation

Time Entry:
  Duration: 30 minutes
  Notes: Troubleshot network connectivity issue
  Billable: Yes
  Start: 2026-02-04 10:30 AM
  End: 2026-02-04 11:00 AM

Ticket Totals:
  This Entry: 0.5 hours
  Total Time: 2.5 hours
  Total Billable: 2.0 hours

URL: https://acme.syncromsp.com/tickets/12345
```

### Non-Billable Output

```
Time Entry Logged Successfully

Ticket: #12345 - Email not working
Customer: Acme Corporation

Time Entry:
  Duration: 45 minutes
  Notes: Internal documentation
  Billable: No (non-billable)
  Start: 2026-02-04 10:15 AM
  End: 2026-02-04 11:00 AM

Ticket Totals:
  This Entry: 0.75 hours
  Total Time: 3.25 hours
  Total Billable: 2.0 hours (unchanged)

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

### Invalid Duration Format

```
Error: Invalid duration format

"abc" is not a valid duration.

Accepted formats:
- Minutes: 30, 45, 60, 90
- HH:MM: 0:30, 1:00, 1:30, 2:00

Examples:
/log-time 12345 30 --notes "Quick fix"
/log-time 12345 "1:30" --notes "Extended work"
```

### Invalid Product ID

```
Error: Product not found

Product ID 999 does not exist.

Use the Syncro web interface to find valid product IDs,
or omit the --product_id parameter to use the default.
```

### Permission Denied

```
Error: Permission denied (403)

You do not have permission to log time on this ticket.

Contact your Syncro administrator if you need access.
```

### Rate Limiting

```
Rate limited by Syncro API (180 req/min)

Retrying in 5 seconds...
```

### Zero Duration

```
Error: Duration must be greater than zero

Please specify a duration:
/log-time 12345 30 --notes "Your work notes"
```

## Duration Format Reference

| Input | Interpreted As |
|-------|----------------|
| 15 | 15 minutes |
| 30 | 30 minutes |
| 60 | 60 minutes (1 hour) |
| 90 | 90 minutes (1.5 hours) |
| "0:15" | 15 minutes |
| "0:30" | 30 minutes |
| "1:00" | 60 minutes |
| "1:30" | 90 minutes |
| "2:00" | 120 minutes |

## Tips

### Logging Time Retroactively

Specify the start time for past work:

```
/log-time 12345 60 --timer_started_at "2026-02-03 14:00" --notes "Yesterday's support call"
```

### Quick Billable Time

For quick billable entries, just provide duration and notes:

```
/log-time 12345 15 --notes "Password reset"
```

### Internal/Administrative Time

Use non-billable for internal work:

```
/log-time 12345 30 --billable false --notes "Documentation and cleanup"
```

## Related Commands

- `/create-ticket` - Create a new ticket
- `/search-tickets` - Search for tickets
- `/update-ticket` - Update ticket fields
- `/add-ticket-comment` - Add a comment to a ticket
