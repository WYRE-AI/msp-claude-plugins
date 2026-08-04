# TimeZest plugin — governance and safety model

Unofficial. Community-built plugin for the TimeZest API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches TimeZest through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the TimeZest account
the operator is authorised for.

- No TimeZest API token is stored on the technician's machine, in this
  repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who sent the customer that booking link" — TimeZest's own log records
  only the API account.
- Revoking gateway access revokes TimeZest access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change TimeZest state or reach the customer. Safe for autonomous agents. | `timezest_agents_list`, `timezest_agents_get`, `timezest_teams_list`, `timezest_teams_get`, `timezest_appointment_types_list`, `timezest_appointment_types_get`, `timezest_resources_list`, `timezest_scheduling_list`, `timezest_scheduling_get`, `timezest_navigate`, `timezest_back`, `timezest_status` |
| **Write** | Creates a record — and sends the customer an email that cannot be recalled. | `timezest_scheduling_create_request` |
| **Destructive** | Revokes a booking link or cancels a confirmed appointment. Requires explicit per-call human approval. | `timezest_scheduling_cancel` |

`timezest_scheduling_create_request` is the tool to watch. It is a
create, but its blast radius is not a database row: it emails the
**customer** a self-service booking link and, in the default `pod`
trigger mode, fires the PSA workflow that updates the ticket and
notifies whoever the integration is configured to notify. None of that
can be un-sent. Nine of the twelve read tools exist precisely so an
agent can resolve the agent, team, and appointment type *before*
reaching a real person.

`timezest_scheduling_cancel` sits in the destructive tier deliberately.
Against a pending request it revokes the customer's link; against a
booked one it cancels a confirmed appointment, which removes the slot
from the technician's calendar and sends the customer a cancellation.
There is no uncancel — recovery means creating a new request and asking
the customer to book again.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Roster surveys, pipeline queues, stale-request
  sweeps, and PSA-association audits are the intended autonomous use.
- `timezest_scheduling_create_request`: agent drafts the exact call —
  resolved agent or team, appointment type, `associatedEntities`,
  trigger mode — a human approves, then it runs. Do not grant it to
  scheduled or unattended agents; a loop that re-sends booking links is
  visible to the customer as harassment.
- `timezest_scheduling_cancel`: require a named human approver per
  invocation.

## What it cannot reach

- Only the TimeZest account mapped to the operator's gateway identity.
- No filesystem, no shell, no other vendor's data.
- **No PSA credentials.** TimeZest attaches a booking to a ticket and
  triggers the PSA's own configured workflow; it cannot read, update, or
  close that ticket. Anything that changes the ticket is PSA work.
- No calendar credentials of its own. It reflects availability the
  TimeZest tenant has already been configured to see; it cannot read a
  technician's mailbox.
- No push feed. The surface is poll-only.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `timezest_agents_list` / `timezest_agents_get` and
  `timezest_teams_list` / `timezest_teams_get` return MSP staff PII —
  technician names, email addresses, and in some tenants department and
  working-hours detail.
- **Scheduling requests carry end-customer PII.**
  `timezest_scheduling_list` and `timezest_scheduling_get` return the
  customer contact's name and email address alongside the PSA ticket
  reference — which links a named individual to the IT problem they
  reported. Restrict these if your agents run unattended or post output
  into shared channels.
- `timezest_scheduling_create_request` **transmits** PII outward: the
  recipient address you pass is who receives the booking link. A wrong
  address discloses the ticket context to the wrong person and cannot be
  undone.

## Known sharp edges

- **No webhooks — polling only.** Booking state changes arrive only when
  you ask. An agent that reports "not booked yet" is reporting the last
  poll, not the present. Re-fetch before acting on state.
- **Cancellation race.** A customer can book in the same second a
  dispatcher cancels. Always re-fetch with `timezest_scheduling_get`
  after a cancel and reconcile, rather than assuming the cancel won.
- **`generate_url` silently skips the PSA.** A request created in
  `generate_url` trigger mode produces a working booking link but never
  fires the PSA workflow, so the ticket is never updated. It looks like
  a successful booking and reads later as a sync bug.
- **Orphan requests are unfindable.** A request created without an
  `associatedEntities` entry cannot be traced from the PSA side. Treat a
  missing PSA association as a validation failure, not an optional
  field.
- **Wrong appointment type is customer-visible.** Booking a 15-minute
  type for a half-day onsite offers the customer a slot that is far too
  short. Confirm the `duration`, not just the name.
