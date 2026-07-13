---
description: Log time against tickets or projects in Autotask PSA
argument-hint: "<target> <hours> <summary> [date] [billing-code] [billable] [internal-notes] [submit]"
arguments: [target, hours, summary, date, billing-code, billable, internal-notes, submit]
---

# Log Time Entry in Autotask

Log time worked against a ticket or project for billing and resource tracking.

## Prerequisites

- Valid Autotask API credentials configured
- Ticket or project must exist in Autotask
- User must have time entry permissions
- Resource record must be linked to API user

## Steps

1. **Resolve target entity**
   - If starts with "T" (e.g., T20240215.0001), look up ticket ID
   - If numeric, determine if ticket or project
   - If project, optionally resolve task ID

2. **Validate hours**
   - Ensure positive numeric value
   - Round to nearest quarter hour (0.25)
   - Warn if hours > 8 (overtime)
   - Block if hours > 24

3. **Determine billability**
   - Check explicit --billable flag
   - Check billing code billability
   - Check contract terms
   - Default based on work type

4. **Check budget limits**
   - Query project/contract budget status
   - Warn if at 90%+ of budget
   - Require approval if exceeding budget

5. **Get billing rate**
   - Check contract rate
   - Check resource rate
   - Check role rate
   - Apply default rate

6. **Create time entry**
   ```json
   POST /v1.0/TimeEntries
   {
     "ticketID": <resolved_ticket_id>,
     "resourceID": <current_resource_id>,
     "dateWorked": "<date>",
     "hoursWorked": <rounded_hours>,
     "summaryNotes": "<summary>",
     "internalNotes": "<internal_notes>",
     "billingCodeID": <resolved_billing_code>,
     "isBillable": <billable_status>,
     "approvalStatus": <0_or_1>
   }
   ```

7. **Return entry details**
   - Time entry ID
   - Billing amount calculated
   - Approval status
   - Budget impact summary

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| target | string | Yes | - | Ticket number or project ID |
| hours | decimal | Yes | - | Hours worked (rounded to 0.25) |
| summary | string | Yes | - | Client-visible work summary |
| date | string | No | Today | Date in YYYY-MM-DD format |
| billing-code | string/int | No | - | Billing category |
| billable | boolean | No | Auto | Override billable determination |
| internal-notes | string | No | - | Private notes for team |
| submit | boolean | No | false | Submit for approval |

## Examples

### Basic Time Entry

```
/time-entry T20240215.0042 1.5 "Troubleshot email delivery issues"
```

### Full Details with Approval

```
/time-entry T20240215.0042 2.25 "Configured new email accounts and tested delivery" --date 2024-02-15 --billing-code "Remote Support" --submit
```

### Non-Billable Internal Work

```
/time-entry T20240215.0042 0.5 "Internal documentation update" --billable false --internal-notes "Updated KB article"
```

### Project Time Entry

```
/time-entry 12345 4.0 "Network design - Phase 2 planning" --billing-code "Project Work"
```

### Yesterday's Time

```
/time-entry T20240215.0042 1.0 "Follow-up testing" --date 2024-02-14
```

## Output

### Success

```
✅ Time Entry Logged Successfully

Entry ID: 98765
Target: Ticket T20240215.0042 - Email not working
Company: Acme Corporation
Date: 2024-02-15
Hours: 1.50 (rounded from 1.5)
Summary: Troubleshot email delivery issues

Billing Details:
  Billable: Yes
  Rate: $150.00/hr
  Amount: $225.00
  Billing Code: Remote Support

Approval Status: Draft (not submitted)
Contract: Managed Services Agreement
Budget Impact: 45.5 / 50.0 hours used this month (91%)

⚠️ Warning: Contract is at 91% of monthly hour allocation
```

### With Submission

```
✅ Time Entry Logged & Submitted

Entry ID: 98765
...
Approval Status: Submitted (awaiting manager approval)
```

## Error Handling

### Ticket Not Found

```
❌ Ticket not found: T20240215.9999

Suggestions:
- Verify the ticket number is correct
- Check if ticket may have been merged or deleted
- Search for tickets: /search-tickets "your search term"
```

### Budget Exceeded

```
⚠️ Budget Warning: Entry exceeds project budget

Project Budget: 100.0 hours
Currently Used: 98.0 hours
This Entry: 4.0 hours
New Total: 102.0 hours (102%)

Options:
1. Reduce hours to stay within budget (2.0 hours available)
2. Create entry anyway (requires manager approval)
3. Cancel

Choice [1/2/3]:
```

### Invalid Hours

```
❌ Invalid hours value: 25

Hours must be:
- A positive number
- Less than or equal to 24
- Will be rounded to nearest 0.25

Examples: 0.25, 0.5, 1.0, 1.5, 2.75, 8.0
```

### Future Date

```
❌ Cannot log time for future date: 2024-02-20

Current date is 2024-02-15.
Time entries must be for today or earlier.
```

### Entry Already Approved

```
❌ Cannot modify: Entry 98765 is already approved

Approved entries cannot be edited.
Contact your manager to reverse approval if changes are needed.
```

## Billing Code Reference

Common billing codes (varies by Autotask instance):

| Code | Description | Typically Billable |
|------|-------------|-------------------|
| Remote Support | Phone/remote assistance | Yes |
| On-Site Support | In-person service | Yes |
| Project Work | Project-related tasks | Yes |
| Travel | Travel time | Depends |
| Administrative | Internal admin work | No |
| Training | Internal/external training | Depends |
| Sales/Pre-Sales | Sales activities | No |

Query available billing codes:
```
/list-billing-codes
```

## Approval Workflow

```
Draft (0) ──[/time-entry --submit]──> Submitted (1)
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
                   Approved (2)                          Rejected (3)
                        │                                     │
                        ▼                                     ▼
               Included in Billing               Returned for Correction
```

## Best Practices

1. **Log immediately** - Don't batch entries at end of day
2. **Be specific** - Write summaries clients can understand
3. **Use billing codes** - Enables better reporting
4. **Check budget first** - Avoid surprise overages
5. **Submit weekly** - Keep approval queue moving
6. **Separate internal notes** - Keep billing summaries clean

## Related Commands

- `/search-tickets` - Find tickets to log time against
- `/create-ticket` - Create a ticket first
- `/list-time-entries` - View logged time entries
- `/approve-time` - Approve pending time entries (managers)
- `/time-report` - Generate time utilization reports
