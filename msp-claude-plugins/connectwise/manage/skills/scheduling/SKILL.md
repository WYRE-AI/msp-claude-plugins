---
name: "ConnectWise PSA Scheduling"
description: >
  ConnectWise PSA schedule entries through Conduit: booking a member's time
  against a service ticket, project ticket or activity
  (cw_create_schedule_entry), finding and moving bookings
  (cw_search_schedule_entries, cw_update_schedule_entry), schedule types and
  statuses, UTC date handling, and the difference between a booking and a time
  entry.
when_to_use: >-
  When booking, moving or reviewing technician time on the ConnectWise PSA schedule (dispatch).
  Use when: schedule a tech, book an engineer, dispatch, schedule entry, calendar connectwise,
  who is booked tomorrow, reschedule appointment, or on-site visit connectwise.
---

# ConnectWise PSA Scheduling

## Overview

A schedule entry is a **forward booking** of a member's time against a service ticket, project ticket or sales activity. It is not a record of work done: that is a time entry (`connectwise-psa-time-entries`). Dispatchers create entries; technicians later log time against the same ticket.

## Anti-triggers

- **Logging hours already worked** — use `connectwise-psa-time-entries` (`cw_create_time_entry`, `cw_update_time_entry`).
- **Customer self-booking links** — use TimeZest (`timezest-scheduling`) if the MSP runs it.

## MCP Tools

| Tool | Tier | Purpose |
|------|------|---------|
| `cw_list_schedule_types` | read | Type IDs; use the `S` (Service) type for a service ticket |
| `cw_list_schedule_statuses` | read | Status IDs such as Tentative or Firm |
| `cw_search_schedule_entries` | read | Bookings, by `conditions` such as `member/id = 147 and dateStart >= [2026-09-22T00:00:00Z]` |
| `cw_search_members` / `cw_get_member` | read | Resolve the technician's member ID |
| `cw_create_schedule_entry` | write | Book time: `objectId`, `typeId`, `memberId`, `dateStart`, `dateEnd` required |
| `cw_update_schedule_entry` | write | Move, re-assign, firm up or mark done |

## Workflows

### Book a technician on a ticket

1. `cw_get_ticket` to confirm the ticket and its company.
2. Resolve the member with `cw_search_members`. The member is **never** defaulted; confirm who is being booked.
3. `cw_list_schedule_types` (Service type for a service ticket) and, if the user named one, `cw_list_schedule_statuses`.
4. Check the member's existing bookings for the window with `cw_search_schedule_entries`.
5. Convert the requested local time to UTC, then `cw_create_schedule_entry` with `objectId` (the ticket ID), `typeId`, `memberId`, `dateStart`, `dateEnd`, and optional `statusId`, `whereId` (On-Site, Remote, ...), `name`.
6. If the booking is refused as a conflict, show the overlapping entry and let the user pick another time, or explicitly approve a double booking; only then retry with `allowScheduleConflictsFlag: true`.

### Who is booked tomorrow

Work out tomorrow's start and end in the user's time zone and convert both to UTC. Then `cw_search_schedule_entries` with `conditions: "dateStart < [<end UTC>] and dateEnd > [<start UTC>]"`, so bookings that start today and run into tomorrow are included, ordered by `dateStart asc`, then group by member.

### Reschedule

Find the entry with `cw_search_schedule_entries`, confirm the new time, and `cw_update_schedule_entry` with the new `dateStart`/`dateEnd`.

## Gotchas

- **Dates are UTC.** `'2026-09-22T02:00:00Z'` is 10:00 in Perth. Always convert and echo the local time back to the user.
- **Conflicts are refused by default.** Set `allowScheduleConflictsFlag` only when the user explicitly wants a double booking.
- **Reminder IDs** have no list endpoint; read a `reminderId` off an existing entry with `cw_search_schedule_entries`.
- **A booking is not billable time.** Closing the ticket without a time entry bills nothing, however many schedule entries it has.
