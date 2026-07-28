---
name: "TimeZest PSA Integration"
description: >
  Wiring a TimeZest scheduling request into a PSA: the associatedEntities
  payload shapes for ConnectWise, Autotask, and Halo tickets, the difference
  between the pod and generate_url trigger modes, and the causes of bookings
  that complete but never update the PSA ticket.
when_to_use: >-
  When linking a TimeZest scheduling request to a PSA ticket, or diagnosing a booking that
  did not sync back. Use when: timezest psa, associated entities,
  link to connectwise ticket, link to autotask ticket, link to halo ticket, timezest pod mode,
  timezest generate url, booking didnt sync to psa, or orphan scheduling request.
---

# TimeZest PSA Integration

TimeZest exists to couple customer scheduling to the MSP's PSA. The
booking page is incidental — the value is that a confirmed slot lands
on the ConnectWise / Autotask / Halo ticket, on the technician's PSA
calendar, and in the billing record. Two parts of the scheduling
request payload carry that coupling: `associatedEntities` and
`triggerMode`.

## `associatedEntities` — the PSA link

Every `timezest_scheduling_create_request` call should carry an
`associatedEntities` array. Each entry links the booking to one PSA
record:

```json
{
  "associatedEntities": [
    {
      "type": "connectwise",
      "id": "88421",
      "number": "88421"
    }
  ]
}
```

| Field | Required | Meaning |
|-------|----------|---------|
| `type` | Yes | PSA system — one of `connectwise`, `autotask`, `halo` |
| `id` | Yes | The PSA entity ID |
| `number` | No | Human-readable ticket reference |

A scheduling request created with **no** `associatedEntities` is an
orphan — nobody can find the booking from the PSA side later. Always
attach the association.

## `triggerMode` — pod vs generate_url

| Mode | What it does | Use when |
|------|--------------|----------|
| `pod` | Fires the configured PSA workflow on booking — updates the ticket, logs activity, delivers the link via the PSA's notification path | Normal ticket-driven bookings |
| `generate_url` | Returns a `bookingUrl` for the dispatcher to paste manually; no PSA workflow fires | Ad-hoc links, custom emails, testing |

`pod` is the right default for any booking tied to a ticket.
`generate_url` against a ticket is usually a mistake worth confirming.

## Common Workflows

### Build a PSA-linked booking

1. Identify the PSA system the ticket lives in (`connectwise`,
   `autotask`, or `halo`) — critical when the MSP runs more than one
   PSA in parallel.
2. Build the `associatedEntities` entry with `type`, `id`, and
   `number` when known.
3. Set `triggerMode: "pod"` unless the dispatcher specifically wants a
   manual link.
4. Pass both into `timezest_scheduling_create_request`.

### Audit requests for PSA association

1. Call `timezest_scheduling_list`.
2. Inspect each request's `associatedEntities` and bucket:
   - **clean** — one association, plausible type, has a `number`
   - **orphan** — no association at all
   - **suspect** — association present but the `type` looks wrong for
     the MSP's PSA mix
3. Pull `timezest_scheduling_get` for any orphan or suspect request.

### Diagnose a booking that did not sync

1. `timezest_scheduling_get` the request — confirm it is `booked`.
2. Check `triggerMode`: a `generate_url` request never fires the PSA
   workflow, so the ticket was never meant to update automatically.
3. Check `associatedEntities`: a missing or wrong-`type` association
   means the workflow had nothing to update.
4. Remediation: re-create with a corrected payload, or add a manual
   PSA note so the booking is not lost.

## Edge Cases

- **Multiple PSAs** — One MSP may run ConnectWise and Autotask side by
  side. The `type` enum must match the ticket's actual system.
- **Cross-system ID mismatch** — A ConnectWise ticket ID linked as
  `autotask` resolves to nothing. Verify the pairing.
- **generate_url on a ticket** — Produces a working link but no PSA
  update. Flag and confirm intent.

## Best Practices

- Never create a scheduling request without a PSA `associatedEntities`
  entry.
- Default `triggerMode` to `pod` for ticket-driven bookings.
- Always include `number` when known — it makes the request findable
  by humans.
- Treat the scheduling request as the source of truth until the `pod`
  workflow confirms the PSA was updated.

## Related Skills

- [scheduling](../scheduling/SKILL.md) — Booking technicians against PSA tickets
- [api-patterns](../api-patterns/SKILL.md) — Auth, navigation, polling cadence
