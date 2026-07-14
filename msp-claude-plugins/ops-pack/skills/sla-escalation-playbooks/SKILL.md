---
name: "SLA Escalation Playbooks"
when_to_use: >-
  When a ticket is approaching or has breached its SLA response or resolution
  target and the operator needs to know how — and to whom — to escalate it.
  Use when: SLA breach, SLA at risk, escalate this ticket, who do I notify,
  breach notification, response time risk, resolution target missed, "what's
  about to breach".
description: >
  Use this skill when triaging SLA pressure on whatever PSA is connected
  through the gateway. Covers how to read breach-risk state across the major
  PSA families (Autotask, HaloPSA, ConnectWise Manage, Syncro, Kaseya BMS),
  a common escalation decision framework that sits on top of those different
  data models, how escalation severity and audience change by contract tier,
  and what evidence to gather before paging someone. Resolve status/priority/
  SLA IDs via the connected PSA's own list tools (e.g.
  autotask__list_ticket_priorities, halopsa__tickets_list) — never hardcode
  tenant-specific IDs. If no PSA is connected, this skill degrades to general
  escalation guidance and says so explicitly.
---

# SLA Escalation Playbooks

## Overview

SLA breaches are the single most reliable predictor of a client escalation call. This
skill is the judgment layer on top of whatever SLA/priority data your connected PSA
returns: it tells you when a ticket's breach risk crosses a threshold that warrants
action, who should be notified at that threshold, what evidence to attach to the
escalation, and how the response changes for a Platinum client versus a break-fix
client on the same board.

This skill does not re-teach any single PSA's ticket API. It assumes you already know
how to fetch a ticket and its SLA fields via the connected vendor's tools (or via
`conduit__search_tools` if you don't yet know which tools are available) — what it
adds is the cross-vendor decision logic for what to do with that data once you have
it.

## Key Concepts

### How each PSA family models SLA state

Every PSA expresses "how close is this ticket to breaching" differently. Resolve the
concrete field/tool names for the connected instance before relying on any of this —
these are the *shapes* to expect, not literal API contracts:

| PSA family | SLA/priority model | Where breach risk lives |
|---|---|---|
| **Autotask** | Numeric ticket priority (1–4) plus a Service Level Agreement linked to the client's contract, driving separate first-response and resolution due-date fields on the ticket | `autotask__get_ticket_details` / `autotask__search_tickets` — look for resolution plan / due-date fields; `autotask__list_ticket_priorities` resolves the priority label |
| **HaloPSA** | SLA profile assigned per ticket (often derived from client + priority), with explicit response and resolution target timestamps and a breach flag | `halopsa__tickets_get` returns `deadlinedate` / SLA hold state; `halopsa__tickets_list` can be filtered/sorted by SLA proximity |
| **ConnectWise Manage/PSA** | SLA record tied to board + priority, combined with Impact/Urgency fields; boards often carry their own escalation status flag | Ticket record's SLA/status fields — confirm the board's escalation flag naming, it is board-configurable |
| **Syncro** | Lighter-weight: ticket "Due Date" plus priority, no separate formal SLA engine in most instances | Ticket due-date field and priority; treat due-date proximity as the SLA proxy |
| **Kaseya BMS** | Service Desk SLA tied to the client's Service Level Agreement, with response/resolution timers per ticket | Ticket SLA timer fields exposed by the connected Kaseya BMS tools |

If the org has more than one PSA connected (rare, but happens during a PSA migration),
scope explicitly to one board/instance per run and say which one you used.

### The common escalation decision framework

Regardless of which PSA is behind the numbers, normalize every ticket to a single
**breach-risk state** before deciding what to do:

1. **Healthy** — comfortably inside both response and resolution targets.
2. **At risk** — inside target but less than ~25% of the allotted window remains
   (tune this threshold to the org's own norms if documented; state the threshold you
   used).
3. **Breached — response** — first-response target missed; no technician has
   substantively engaged yet.
4. **Breached — resolution** — resolution target missed; ticket has had engagement
   but is not resolved.

Escalation action scales with state:

| State | Default action |
|---|---|
| Healthy | No action |
| At risk | Internal nudge to the assigned technician (or to the dispatcher if unassigned) |
| Breached — response | Escalate to team lead/service manager; internal note logged on the ticket |
| Breached — resolution | Escalate to service manager and, per contract tier below, to the client |

### Evidence to gather before escalating

Never escalate on the SLA timer alone — attach the context a manager or client
contact will actually need:

- Ticket age and full status-transition history (when did it last move, and to what)
- Assigned technician (or confirmation it's unassigned) and their current open-ticket
  count, if the PSA exposes technician workload
- Last client-visible communication timestamp and its content
- Whether the ticket is waiting on the client (see `board-hygiene` skill) — a breach
  caused by a non-responsive client is a different conversation than one caused by an
  idle queue
- Contract/SLA tier for the client (see below)

### Escalation by contract tier

Contract tier changes *who* gets notified and *whether the client is proactively
contacted*, not whether the breach itself matters:

| Tier (typical naming) | On "at risk" | On "breached" |
|---|---|---|
| Premium / Platinum / fully-managed | Team lead notified at "at risk"; account manager loop-in on breach | Proactive client contact before the client notices, with a remediation ETA |
| Standard / Managed | Team lead notified on breach only | Client contact only if they ask, but the internal note documents the breach for QBR reporting |
| Bronze / Block-hours / break-fix | Internal reassignment only | Client contact per the ticket's own status, no proactive SLA-specific comms (these contracts often don't carry a formal SLA at all) |

Confirm actual tier-to-contract mapping against the PSA's contract/agreement records
(or `client-360-briefer`-style client context if the org also has the `wyre-gateway`
plugin's agents available) rather than assuming — tier names vary a lot by MSP.

### If no PSA is connected

This skill cannot compute breach state without a source of ticket/SLA truth. If
`conduit__search_tools` (or a direct attempt at a PSA tool call) shows no PSA
connector present, say so explicitly and stop rather than guessing: "No PSA is
connected, so SLA state can't be verified. Here is the general escalation framework
above — apply it manually once ticket data is available." Do not fabricate SLA
figures or invent a ticket's breach state.

## Best Practices

- Always resolve priority/status/SLA-profile IDs via the connected PSA's own list
  tools before interpreting a ticket — these are tenant-configurable and vary
  instance to instance.
- State the breach-risk threshold you used (e.g., "less than 25% of window
  remaining") so the reader can recalibrate if their org's norm differs.
- Distinguish "breached because nobody worked it" from "breached because the client
  hasn't responded" — the remediation and the notification target are different.
- Log the escalation itself as a ticket note/action where the PSA supports it, so the
  audit trail lives with the ticket, not just in chat.
- Never invent a contract tier or SLA target — pull it from the PSA/contract record,
  or state plainly that it's unknown.

## Related Skills

- [Dispatch Prioritization](../dispatch-prioritization/SKILL.md) — scoring and
  assigning the unassigned queue, of which SLA proximity is one factor
- [Board Hygiene](../board-hygiene/SKILL.md) — stale and stuck-ticket detection,
  including distinguishing "waiting on client" from a real SLA risk
