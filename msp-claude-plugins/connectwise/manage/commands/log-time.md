---
description: Log a time entry against a ConnectWise PSA ticket
argument-hint: "<ticket_id> <time_start> [time_end] [actual_hours] [notes] [billable] [work_type] [work_role]"
arguments: [ticket_id, time_start, time_end, actual_hours, notes, billable, work_type, work_role]
---

# Log Time to ConnectWise PSA Ticket

Log a time entry against a ConnectWise ticket.

## Prerequisites

- Valid ConnectWise PSA API credentials configured
- User must have time entry creation permissions
- Ticket must exist and be accessible

## Steps

1. **Validate ticket exists**
   ```http
   GET /service/tickets/{id}
   ```
   - Confirm ticket is accessible
   - Get company ID for agreement lookup
   - Note if ticket is closed (warn user)

2. **Resolve work type (if provided)**
   ```http
   GET /time/workTypes?conditions=name='{work_type}'
   ```

3. **Resolve work role (if provided)**
   ```http
   GET /time/workRoles?conditions=name='{work_role}'
   ```

4. **Calculate time values**
   - If `actual_hours` provided, calculate `time_end` from `time_start`
   - If `time_end` provided, calculate `actual_hours` from difference
   - Validate times are logical (end > start)

5. **Check agreement coverage (if billable)**
   ```http
   GET /finance/agreements?conditions=company/id={companyId} and cancelledFlag=false
   ```
   - Warn if no active agreement
   - Show remaining hours if block agreement

6. **Create time entry**
   ```http
   POST /time/entries
   Content-Type: application/json

   {
     "chargeToId": <ticket_id>,
     "chargeToType": "ServiceTicket",
     "member": {"identifier": "<current_user>"},
     "timeStart": "<time_start>",
     "timeEnd": "<time_end>",
     "actualHours": <actual_hours>,
     "notes": "<notes>",
     "billableOption": "<billable>",
     "workType": {"id": <work_type_id>},
     "workRole": {"id": <work_role_id>}
   }
   ```

7. **Return confirmation with totals**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | Ticket ID to log time against |
| time_start | datetime | Yes | - | Start time (YYYY-MM-DD HH:MM or "now") |
| time_end | datetime | No* | - | End time |
| actual_hours | decimal | No* | - | Hours worked (alternative to time_end) |
| notes | string | No | - | Work description |
| billable | string | No | Billable | Billable, DoNotBill, NoCharge |
| work_type | string | No | - | Work type name |
| work_role | string | No | - | Work role name |

*Either `time_end` or `actual_hours` is required

## Examples

### Using Actual Hours

```
/log-time 12345 "2026-02-04 09:00" --actual_hours 1.5 --notes "Troubleshot network connectivity"
```

### Using Start/End Times

```
/log-time 12345 "2026-02-04 10:00" "2026-02-04 11:30" --notes "Remote support session"
```

### Log Time Starting Now

```
/log-time 12345 "now" --actual_hours 0.5 --notes "Quick phone support"
```

### Specify Work Type and Role

```
/log-time 12345 "2026-02-04 14:00" --actual_hours 2.0 --work_type "Remote Support" --work_role "Engineer"
```

### Non-Billable Time

```
/log-time 12345 "2026-02-04 14:00" --actual_hours 0.5 --billable DoNotBill --notes "Internal documentation"
```

### No-Charge Time

```
/log-time 12345 "2026-02-04 15:00" --actual_hours 0.25 --billable NoCharge --notes "Courtesy follow-up"
```

### Full Example

```
/log-time 12345 "2026-02-04 09:00" "2026-02-04 11:30" --notes "Server migration assistance" --work_type "On-site Support" --work_role "Senior Engineer" --billable Billable
```

## Output

### Successful Time Entry

```
Time Entry Logged Successfully

Entry ID:     67890
Ticket:       #12345 - Email not working
Company:      Acme Corporation

Time Details:
  Start:      2026-02-04 09:00
  End:        2026-02-04 10:30
  Duration:   1.5 hours

Billing:
  Status:     Billable
  Work Type:  Remote Support
  Work Role:  Engineer
  Rate:       $150.00/hour
  Amount:     $225.00

Notes:
"Troubleshot network connectivity issues. Identified DNS misconfiguration."

Ticket Time Summary:
  This Entry:  1.5 hours
  Previous:    2.0 hours
  Total:       3.5 hours (3.5 billable)
```

### With Agreement Info

```
Time Entry Logged Successfully

Entry ID:     67891
Ticket:       #12345 - Email not working
Company:      Acme Corporation

Time Details:
  Start:      2026-02-04 14:00
  End:        2026-02-04 15:00
  Duration:   1.0 hours

Agreement Coverage:
  Agreement:  Managed Services - Block Hours
  Used:       1.0 hours from block
  Remaining:  15.5 hours (after this entry)
  Expires:    2026-03-01

Notes:
"Applied configuration changes and verified resolution."
```

## API Authentication

```bash
# Base64 encode credentials: company+publicKey:privateKey
AUTH=$(echo -n "${CW_COMPANY}+${CW_PUBLIC_KEY}:${CW_PRIVATE_KEY}" | base64)

# Create time entry
curl -s -X POST \
  "https://${CW_HOST}/v4_6_release/apis/3.0/time/entries" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "chargeToId": '"${TICKET_ID}"',
    "chargeToType": "ServiceTicket",
    "timeStart": "2026-02-04T09:00:00Z",
    "timeEnd": "2026-02-04T10:30:00Z",
    "actualHours": 1.5,
    "notes": "Work description here",
    "billableOption": "Billable",
    "workType": {"id": 1},
    "workRole": {"id": 1}
  }'
```

## Error Handling

### Ticket Not Found

```
Error: Ticket #99999 not found

The ticket may have been deleted or you may not have permission to access it.
```

### Invalid Time Format

```
Error: Invalid time format "02/04/2026"

Supported formats:
- YYYY-MM-DD HH:MM (e.g., 2026-02-04 09:00)
- YYYY-MM-DDTHH:MM:SS (e.g., 2026-02-04T09:00:00)
- "now" (current time)

Example: /log-time 12345 "2026-02-04 09:00" --actual_hours 1.5
```

### Missing Duration

```
Error: Either time_end or actual_hours is required

Examples:
  /log-time 12345 "2026-02-04 09:00" "2026-02-04 10:30"
  /log-time 12345 "2026-02-04 09:00" --actual_hours 1.5
```

### End Before Start

```
Error: End time must be after start time

Start: 2026-02-04 10:00
End:   2026-02-04 09:00

Please check your time values.
```

### Future Time Warning

```
Warning: Time entry is in the future

Start: 2026-02-05 09:00 (tomorrow)

Log future time entry? [Y/n]
```

### Invalid Work Type

```
Error: Work type not found: "Invalid Type"

Available work types:
- Remote Support (ID: 1)
- On-site Support (ID: 2)
- Phone Support (ID: 3)
- Project Work (ID: 4)

Example: /log-time 12345 "now" --actual_hours 1 --work_type "Remote Support"
```

### Invalid Work Role

```
Error: Work role not found: "Invalid Role"

Available work roles:
- Engineer (ID: 1)
- Senior Engineer (ID: 2)
- Technician (ID: 3)
- Consultant (ID: 4)
```

### Invalid Billable Option

```
Error: Invalid billable option "Bill"

Valid options:
- Billable    - Time will be billed to customer
- DoNotBill   - Time tracked but not billed
- NoCharge    - Time marked as no charge

Example: /log-time 12345 "now" --actual_hours 1 --billable DoNotBill
```

### No Agreement Warning

```
Warning: No active agreement for Acme Corporation

Time will be billed at Time & Materials rates.
Work Type: Remote Support
Rate: $175.00/hour
Estimated: $262.50

Proceed? [Y/n]
Mark as non-billable? [n]
```

### Agreement Hours Exceeded

```
Warning: Agreement hours will be exceeded

Agreement: Managed Services - Block Hours
Remaining: 0.5 hours
Logging:   1.5 hours
Overage:   1.0 hours (billed at T&M rates)

Proceed? [Y/n]
Split entry? [s] (0.5h covered, 1.0h T&M)
Mark as non-billable? [n]
```

### Closed Ticket Warning

```
Warning: Ticket #12345 is closed

Adding time to closed tickets may affect reporting.
Log time anyway? [Y/n]
```

### Permission Denied

```
Error: Permission denied

You do not have permission to log time against tickets on the "Escalations" board.
Contact your ConnectWise administrator.
```

### Overlapping Time Entry

```
Warning: Overlapping time entry detected

Existing entry: 2026-02-04 09:00 - 10:30 (Ticket #12340)
New entry:      2026-02-04 09:30 - 11:00 (Ticket #12345)

Create overlapping entry? [Y/n]
Adjust start time to 10:30? [a]
Cancel? [c]
```

## Related Commands

- `/get-ticket` - View ticket details and existing time entries
- `/close-ticket` - Close ticket with final time entry
- `/update-ticket` - Update ticket fields
- `/add-note` - Add note to ticket
