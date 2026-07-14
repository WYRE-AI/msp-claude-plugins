---
description: List tickets currently breaching or about to breach SLA within a time window, sorted by urgency
argument-hint: "[window]"
arguments: [window]
---

# SLA Breaches

Cross-vendor SLA breach report: lists tickets currently breaching, or about to
breach, SLA within the given window, sorted by urgency (most urgent first).

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with a PSA connector. Without a PSA, there
  is no SLA data to report.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine which
   PSA connector is live and its actual tool names. Do not assume a specific
   vendor's tool surface — resolve it fresh each run, since the org's connected
   vendor can change.

2. **Resolve the window.** Parse `window` (default `24h` if omitted). Accept
   shorthand like `24h`, `4h`, `7d`. The window defines "about to breach" — a ticket
   whose SLA target falls within the window from now counts as at-risk even if it
   hasn't breached yet.

3. **Pull ticket SLA state.** Using the connected PSA's ticket/SLA fields, resolve
   each open ticket's breach-risk state per the shared framework in the
   `sla-escalation-playbooks` skill: healthy, at risk, breached-response, or
   breached-resolution. Resolve priority/status/SLA-profile IDs via the PSA's own
   list tools rather than assuming ID meanings.

4. **Filter and sort.** Include tickets that are currently breached (regardless of
   window) or whose SLA target falls within the requested window. Sort by urgency:
   breached-resolution first, then breached-response, then at-risk ordered by time
   remaining (soonest first).

5. **Attach evidence per ticket.** For each ticket, include: client, contract tier
   (if resolvable), assigned technician (or "unassigned"), and time since last
   activity — the evidence a dispatcher or manager needs to act, per
   `sla-escalation-playbooks`.

6. **Return the sorted list.** If no PSA is connected, or the SLA fields aren't
   exposed by the connected instance, say so explicitly instead of returning an
   empty or fabricated list.

## Arguments

- `window` (optional; default: `24h`) — Time window for "about to breach," e.g.
  `4h`, `24h`, `7d`. Tickets already breached are always included regardless of
  window.

## Examples

### Default 24-hour window

```
/ops-pack:sla-breaches
```

### 7-day look-ahead

```
/ops-pack:sla-breaches 7d
```

### Tight 4-hour window for an active incident day

```
/ops-pack:sla-breaches 4h
```

## Output

```
================================================================================
SLA Breaches — window: [window]
================================================================================

BREACHED - RESOLUTION ([N])
--------------------------------------------------------------------------------
#[ticket] - [summary]
  Client: [client] ([tier])   Assignee: [technician or "unassigned"]
  Overdue by: [N]h   Last activity: [N]h ago

BREACHED - RESPONSE ([N])
--------------------------------------------------------------------------------
[same shape]

AT RISK (within [window]) ([N])
--------------------------------------------------------------------------------
#[ticket] - [summary]
  Client: [client] ([tier])   Assignee: [technician or "unassigned"]
  Breaches in: [time remaining]
================================================================================
```

## Error Handling

- **No PSA connected:** Report plainly that SLA data can't be retrieved without a
  PSA connector, and stop.
- **Invalid window format:** Note the parse failure and fall back to the default
  `24h`, stating that the fallback was used.
- **PSA connected but SLA fields not exposed:** State this explicitly (some
  lighter-weight PSAs, e.g. Syncro, may only expose a due-date proxy rather than a
  formal SLA engine — see `sla-escalation-playbooks` for how each PSA family models
  this) rather than returning an empty list as if there were no risk.

## Related Commands

- `/ops-pack:morning-huddle` - Includes a summarized SLA-risk count as one section
  of the daily kickoff
- `/ops-pack:eod-handoff` - Carries forward open high-priority/SLA-risk tickets into
  the next shift's context
