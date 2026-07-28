---
name: "TimeZest Scheduling"
description: >
  The TimeZest scheduling-request lifecycle: resolving the right agent and
  appointment type, creating a request against a ConnectWise / Autotask /
  Halo ticket, polling its status through to booking, and canceling.
when_to_use: >-
  When booking a technician's time against a PSA ticket through TimeZest, checking status of a
  scheduling request, or canceling a pending request. Use when: timezest book, timezest schedule,
  book a tech, schedule a technician, timezest appointment, send timezest link, or timezest
  cancel.
---

# TimeZest Scheduling

The "book a tech against this PSA ticket" workflow is what TimeZest
exists for. This skill walks the canonical flow: resolve the agent,
resolve the appointment type, create the scheduling request with the
PSA association, then poll for the customer's response.

## API Tools

### Resolve the actors

| Tool | Purpose |
|------|---------|
| `timezest_agents_list` | List available technicians |
| `timezest_agents_get` | Detail for a specific agent |
| `timezest_teams_list` | List teams (round-robin / shared availability) |
| `timezest_teams_get` | Detail for a specific team |
| `timezest_appointment_types_list` | List bookable appointment types |
| `timezest_appointment_types_get` | Detail for one appointment type |
| `timezest_resources_list` | List resources (rooms / shared assets) |

### Manage scheduling requests

| Tool | Purpose |
|------|---------|
| `timezest_scheduling_list` | List recent scheduling requests |
| `timezest_scheduling_get` | Pull current state of one request |
| `timezest_scheduling_create_request` | Create a new request (sends customer link) |
| `timezest_scheduling_cancel` | Cancel a pending request |

## Common Workflows

### Book a tech against a PSA ticket

1. Resolve the technician:
   - If a name was given, call `timezest_agents_list` and match.
   - If a team was given, call `timezest_teams_list`.
2. Resolve the appointment type:
   - Call `timezest_appointment_types_list` and pick the one that
     matches the ticket type (e.g. "Onsite Visit", "Remote Session").
3. Create the request:
   - Call `timezest_scheduling_create_request` with:
     - `agent_id` or `team_id`
     - `appointment_type_id`
     - `associated_entities` linking to the PSA ticket
4. Capture the returned scheduling request ID for follow-up.

### Track a pending request

1. Call `timezest_scheduling_get` with the request ID.
2. Inspect the state to determine: sent / clicked / booked / canceled
   / expired.
3. If the request has been clicked but not booked after a reasonable
   window, surface that to the dispatcher — the link may need to be
   resent.

### Cancel a request

1. Call `timezest_scheduling_get` to confirm current state.
2. Call `timezest_scheduling_cancel` to revoke the customer link.
3. Notify the originator (dispatcher or AM).

### List recent activity

1. Call `timezest_scheduling_list`.
2. Group by status to give dispatch a queue view: how many sent,
   how many waiting on the customer, how many booked today.

## Edge Cases

- **No availability** - If an agent has no slots in the requested
  window, TimeZest still creates a request but the customer will
  see "no times available". Surface the agent's calendar gap to the
  dispatcher.
- **Multiple PSA systems** - One MSP may run more than one PSA in
  parallel. Always set the correct `associated_entities.type`.
- **Cancellation race** - A customer may book a slot in the same
  second a dispatcher cancels. Always re-fetch state after a cancel
  call.

## Best Practices

- Never create a scheduling request without a PSA association.
- Resolve agent and appointment_type by name through list calls in
  the same session; do not cache IDs across days.
- Treat the scheduling request as the source of truth, not the PSA
  ticket - the PSA only sees the booking after it is confirmed.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Auth, polling, and PSA association
