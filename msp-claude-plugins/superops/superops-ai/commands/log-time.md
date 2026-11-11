---
description: Log a worklog (time) entry against a SuperOps.ai ticket
argument-hint: "<ticket_id> <hours> [notes] [billable] [bill_date_time] [service_item_id]"
arguments: [ticket_id, hours, notes, billable, bill_date_time, service_item_id]
---

# Log Time on SuperOps.ai Ticket

Log a worklog entry against a ticket for billing and tracking.

## How this runs through Conduit

Use the typed tool `superops_tickets_log_time` (write tier). It sends
`createWorklogEntries` with one entry. The schema has no `addTicketTimeEntry`
mutation.

SuperOps records a **quantity** in the service item's unit, usually hours. It
does not record a start time, an end time or a minute count. Convert minutes to
hours before you send them: 30 minutes is `"0.5"`.

## Steps

1. **Confirm the ticket.** Call `superops_tickets_get` and show the subject.
2. **Check the quantity.** It must be positive. Warn above 8 hours, because
   multi-day work belongs in one entry per day.
3. **Log the entry.**

   ```json
   {
     "ticketId": "<ticket_id>",
     "qty": "0.5",
     "notes": "<notes>",
     "billable": true,
     "billDateTime": "2026-02-04T10:00:00Z"
   }
   ```

   `billDateTime` defaults to now. `technicianId` defaults to the API token's
   user. `serviceItemId` sets the service catalog item billed against, and
   `afterHours` flags after-hours work.
4. **Report** the returned entry: `itemId`, `qty`, `billable`, `billDateTime` and
   `status`.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | string | Yes | - | Ticket ID |
| hours | number | Yes | - | Quantity in the service item's unit, usually hours |
| notes | string | No | - | Work description |
| billable | boolean | No | true | Billable or not |
| bill_date_time | datetime | No | now | When the work was done (ISO 8601) |
| service_item_id | string | No | - | Service catalog item to bill against |

## Examples

```
/log-time 88213 0.5
/log-time 88213 1.5 --notes "Server migration work"
/log-time 88213 0.75 --billable false --notes "Internal documentation"
```

## Output

```
Worklog entry logged on ticket #1042 - Email not working
  Quantity: 0.5 (hours)
  Billable: Yes
  Bill date: 2026-02-04T10:00:00Z
  Notes: Troubleshot network connectivity issue
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Ticket not found | Look it up with `superops_tickets_list` |
| Quantity not positive | Ask for a positive number of hours |
| Service item rejected | Leave `serviceItemId` unset to use the default |
| Rate limited | Wait and retry (800 req/min limit) |

## Best Practices

1. **Log time immediately** - Details fade by the end of the day
2. **Be descriptive** - Say what you did, not just how long it took
3. **Mark non-billable work** - Internal work, training and similar
4. **Round consistently** - Follow your organization's rounding policy

## Related Commands

- `/create-ticket` - Create a new ticket
- `/update-ticket` - Update ticket status
- `/add-ticket-note` - Add documentation to a ticket
