---
name: "TimeZest Appointment Types"
description: >
  TimeZest appointment types: the types configured for a tenant, each
  type's duration, and how to match a type to the work described on a
  ConnectWise / Autotask / Halo ticket.
when_to_use: >-
  When choosing which TimeZest appointment type a booking should use. Use
  when: timezest appointment type, which appointment type, timezest onsite vs remote, appointment
  duration, list appointment types, or timezest service type.
---

# TimeZest Appointment Types

An appointment type defines what kind of meeting a TimeZest booking is
— its name, its duration, and the availability rules behind it.
Picking the wrong type produces a customer-facing mistake: a 15-minute
"Quick Call" type used for a half-day onsite books a slot that is far
too short.

## Domain & Tools

Enter the domain with `timezest_navigate` to `appointment_types`.

| Tool | Purpose |
|------|---------|
| `timezest_appointment_types_list` | List all appointment types available for scheduling |
| `timezest_appointment_types_get` | Get full detail for one type by `appointmentTypeId` |

`timezest_appointment_types_list` accepts `pageSize` (1–100, default
50) and a `filter` TQL string (e.g. `active:true`).

Each appointment type carries at least:

- `id` — the `appointmentTypeId` used in a scheduling request
- `name` — e.g. "Onsite Visit", "Remote Session", "Discovery Call"
- `duration` — slot length in minutes
- `description` — optional free-text detail

## Matching a Type to the Work

| Ticket / intent | Typical appointment type |
|-----------------|--------------------------|
| Remote support session | "Remote Session" |
| Field dispatch to the customer site | "Onsite Visit" |
| Scoping or pre-sales conversation | "Discovery Call" |
| Short follow-up | "Quick Call" |

These names are tenant-configured — always read the actual list
rather than assuming a naming convention.

## Common Workflows

### Pick the type for a booking

1. `timezest_navigate` to `appointment_types`.
2. Call `timezest_appointment_types_list` with `active:true`.
3. Match the type whose `name` and `duration` fit the ticket's work.
4. If the customer-facing description matters, call
   `timezest_appointment_types_get` to read the full `description`.
5. Carry the resolved `appointmentTypeId` into
   `timezest_scheduling_create_request`.

### Audit available types

1. List all types with `pageSize: 100`.
2. Report each type's name, duration, and active status so a
   dispatcher knows the menu before booking.

## Edge Cases

- **No clear match** — If no configured type fits the work, surface
  the full list to the dispatcher rather than booking a mismatched
  type. A wrong duration is visible to the customer.
- **Duration mismatch** — Always confirm `duration` matches the
  expected work length; type names can be misleading.
- **Inactive types** — Filter `active:true`; deactivated types still
  appear in an unfiltered list but cannot be booked.

## Best Practices

- Resolve the appointment type by name and duration through a `list`
  call every session — do not cache the ID.
- When `timezest_scheduling_create_request` is called without an
  appointment type, the MCP server elicits a choice; pre-resolving it
  here avoids that round-trip and keeps the booking deterministic.
- Never substitute a similarly named type — confirm name and
  duration both fit.

## Related Skills

- [scheduling](../scheduling/SKILL.md) — Booking technicians against PSA tickets
- [agents-and-teams](../agents-and-teams/SKILL.md) — Resolving the technician or team
