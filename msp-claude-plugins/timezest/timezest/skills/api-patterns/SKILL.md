---
name: "TimeZest API Patterns"
description: >
  TimeZest MCP fundamentals: Bearer token authentication, the navigation
  pattern, scheduling-request payloads that carry PSA associated_entities
  (ConnectWise / Autotask / Halo ticket IDs), and the polling-only update
  model (no webhooks).
when_to_use: >-
  When authenticating to or calling TimeZest through the MCP tools, building a scheduling-request
  payload, or deciding a polling cadence. Use when: timezest api, timezest authentication, timezest
  bearer, timezest scheduling, timezest mcp, timezest associated entities, or timezest poll.
---

# TimeZest MCP Tools & API Patterns

## Overview

TimeZest provides scheduling-request flows tightly coupled to MSP PSA
systems. A scheduling request is created against a PSA ticket
(ConnectWise / Autotask / Halo), TimeZest sends the customer a
self-service booking link, and the technician's calendar is updated
when the customer picks a slot.

## Connection & Authentication

TimeZest uses an API token passed via header.

| Header | Value |
|--------|-------|
| `X-Timezest-Api-Token` | The raw TimeZest API token |

The gateway maps the environment variable `TIMEZEST_API_TOKEN` onto
the `X-Timezest-Api-Token` header automatically. Internally, the
TimeZest MCP server forwards this to TimeZest as a `Bearer` token — you
do not need to add the `Bearer ` prefix yourself.

```bash
export TIMEZEST_API_TOKEN="your-timezest-token"
```

## Navigation Tools

| Tool | Purpose |
|------|---------|
| `timezest_navigate` | Discover the available domains |
| `timezest_back` | Pop back to the prior context |
| `timezest_status` | Health/status check |

## Functional Tool Surface

Tools follow `timezest_<domain>_<action>`. Domains:

- `agents` (technicians)
- `teams`
- `appointment_types`
- `resources`
- `scheduling` (the primary domain)

## Scheduling Request Payload — `associated_entities`

This is the most important pattern. When you call
`timezest_scheduling_create_request`, the payload carries an
`associated_entities` array that links the booking to a PSA record:

```json
{
  "associated_entities": [
    {
      "type": "ConnectWiseTicket",
      "id": 12345
    }
  ]
}
```

Supported PSA types: ConnectWise tickets, Autotask tickets, Halo
tickets. Always include the PSA association so the tech's PSA shows
the booking.

## Polling, Not Webhooks

TimeZest's MCP surface is poll-only. To track a booking's lifecycle
(sent / clicked / booked / canceled), call
`timezest_scheduling_get` on a cadence. Reasonable cadence:

- Every 1-2 minutes for "active" requests in the first hour.
- Every 10-15 minutes for the rest of the day.
- Stop polling once the request is in a terminal state.

Do not assume a webhook will arrive — none does at the MCP layer.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Bad/missing Bearer token | Re-check `TIMEZEST_API_TOKEN` |
| 403 | Token valid but not authorized for the agent/team | Check token scope |
| 404 | Unknown agent / team / scheduling request | Re-list to confirm |
| 422 | Bad payload (missing PSA association, invalid appointment_type) | Validate input |

## Best Practices

- Always pass a PSA `associated_entities` entry — a booking with no
  PSA association is hard to find later.
- Resolve the agent and appointment_type via list calls before
  creating a request; do not hard-code IDs.
- For "book against this ticket" workflows, accept the PSA ticket ID
  as the primary input and resolve agent/team/appointment from
  context.

## Related Skills

- [scheduling](../scheduling/SKILL.md) - Booking technicians against PSA tickets
