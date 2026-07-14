---
description: Generate an end-of-day handoff summary - open high-priority tickets, items awaiting next-shift action, and overnight on-call context if available
argument-hint: ""
arguments: []
---

# EOD Handoff

Cross-vendor end-of-day handoff summary: open high-priority tickets, anything
explicitly awaiting the next shift's action, and overnight on-call context where a
connector supports it — built from whatever PSA (and optional incident/on-call
tooling) the org has connected through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with a PSA connector. Without a PSA, there
  is no board to hand off.
- Optional: PagerDuty, Rootly, or similar on-call/incident tooling. If not
  connected, the overnight on-call section is skipped with an explicit note rather
  than omitted silently.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine which
   PSA connector is live, and whether an on-call/incident connector (e.g.
   PagerDuty, Rootly) is also present. Resolve actual tool names fresh each run.

2. **Pull open high-priority tickets.** Using the connected PSA's priority field
   (resolved via its own list tool, e.g. `autotask__list_ticket_priorities`), pull
   tickets at the top priority tier(s) that remain open at end of day. Include
   status, assignee, and a one-line current-state summary drawn from the most
   recent note/action.

3. **Identify items explicitly awaiting next-shift action.** This is distinct from
   the full high-priority list — surface tickets where the last action indicates
   something specific needs to happen and hasn't yet (e.g., "escalated, awaiting
   Tier 2 pickup," "client callback scheduled for tomorrow AM," "SLA breaches
   overnight if not picked up"). Cross-reference SLA state from
   `sla-escalation-playbooks` — anything that will breach before the next shift's
   typical start time belongs here even if it isn't otherwise flagged.

4. **Pull overnight on-call context, if available.** If an on-call/incident tool is
   connected, pull who is currently on call and any active or recent incidents
   relevant to the service desk. If nothing is connected, state plainly that
   overnight on-call context isn't available through the gateway rather than
   omitting the section.

5. **Assemble the handoff**, ordered: open high-priority tickets → items needing
   explicit next-shift action → overnight on-call context. This is a handoff
   document, not a full board report — keep it to what the next shift actually
   needs to act on, not everything that happens to be open.

## Arguments

This command takes no arguments — it always reports the full high-priority and
action-needed set for the connected PSA at time of run.

## Examples

### Basic Usage

```
/ops-pack:eod-handoff
```

## Output

```
================================================================================
End-of-Day Handoff — [Date]
================================================================================

OPEN HIGH-PRIORITY TICKETS ([N])
--------------------------------------------------------------------------------
#[ticket] - [summary]
  Client: [client]   Assignee: [technician or "unassigned"]
  Status: [status]   Last update: [one-line summary of most recent note]

AWAITING NEXT-SHIFT ACTION ([N])
--------------------------------------------------------------------------------
#[ticket] - [summary]
  What's needed: [specific action - e.g. "Tier 2 pickup", "callback scheduled 9am"]
  SLA context: [e.g. "breaches at 6:15am if not picked up"]

OVERNIGHT ON-CALL CONTEXT
--------------------------------------------------------------------------------
On call: [name/rotation]
Active/recent incidents: [list, or "none"]
[Or, if no on-call/incident connector present:]
Overnight on-call context unavailable — no on-call/incident connector detected
through the gateway.
================================================================================
```

## Error Handling

- **No PSA connected:** Report plainly that an EOD handoff can't be produced
  without a PSA connector, and stop.
- **No high-priority or action-needed tickets found:** Report the empty state
  explicitly ("no open high-priority tickets" / "nothing flagged for next-shift
  action") rather than omitting the section — a clean handoff is itself useful
  information.
- **On-call/incident connector not connected:** Note its absence in the relevant
  section rather than omitting the section header.

## Related Commands

- `/ops-pack:morning-huddle` - Following morning's counterpart; the next shift's
  kickoff should be read alongside the prior day's handoff
- `/ops-pack:sla-breaches` - Deeper SLA-only detail behind the "awaiting next-shift
  action" section here
