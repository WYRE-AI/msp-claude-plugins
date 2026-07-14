---
description: Daily kickoff report - SLA-at-risk count, unassigned queue size, yesterday's closed vs. opened, and any overnight escalations
argument-hint: ""
arguments: []
---

# Morning Huddle

Cross-vendor daily kickoff report meant to run first thing: SLA-at-risk count,
unassigned queue size, yesterday's closed-vs-opened tickets, and any overnight
escalations — pulled from whatever PSA (and, where connected, RMM/security tools)
the org has connected through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least a PSA connector. Without a
  PSA, there is no board to report on.
- Optional: RMM and security/monitoring connectors. Sections that depend on them are
  skipped with an explicit note if not connected — not silently omitted.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine which PSA
   connector is live and what its actual tool names are (e.g.
   `autotask__search_tickets`, `halopsa__tickets_list`). Never assume a specific
   vendor's tool surface. If a RMM or security connector is also present, discover
   those too — they're optional enrichment, not required.

2. **Confirm connectivity.** Call the connected PSA's test/status tool if one is
   available (e.g. `halopsa__status`) to confirm the connection is live before
   pulling data.

3. **Pull SLA-at-risk count.** Using the breach-risk states defined in the
   `sla-escalation-playbooks` skill, pull tickets currently at-risk or breached.
   Report the count by state (at risk / breached-response / breached-resolution),
   and name the two or three worst offenders.

4. **Pull unassigned queue size.** Count tickets currently unassigned, and flag the
   oldest one's age — an aging unassigned ticket is itself a signal worth surfacing
   at huddle time.

5. **Pull yesterday's closed vs. opened.** Count tickets closed and tickets opened
   in the prior 24 hours (or since the last business day if run on a Monday), scoped
   to the connected PSA's timezone/business-hours convention where known.

6. **Pull overnight escalations.** Any ticket that transitioned to a breached or
   escalated state, or received an after-hours note/action, since the last huddle.
   If a security/monitoring connector (e.g. Huntress, PagerDuty, Rootly) is present,
   include any overnight incidents or pages relevant to the service desk. If none of
   these are connected, state plainly that overnight security/incident context isn't
   available rather than omitting the section.

7. **Assemble and return the digest**, in the order: SLA risk → unassigned queue →
   yesterday's throughput → overnight escalations. Lead with whichever section has
   the most urgent finding if one clearly dominates (e.g., an active breach).

## Arguments

This command takes no arguments — it always reports the full board scoped to
whatever PSA/board is connected. Use `/ops-pack:sla-breaches` for a window-scoped
SLA-only view.

## Examples

### Basic Usage

```
/ops-pack:morning-huddle
```

## Output

```
================================================================================
Morning Huddle — [Date]
================================================================================

SLA RISK
--------------------------------------------------------------------------------
Breached - resolution:  [N]  (worst: #[ticket], [client], overdue [N]h)
Breached - response:    [N]
At risk:                [N]

UNASSIGNED QUEUE
--------------------------------------------------------------------------------
Unassigned tickets:     [N]
Oldest unassigned:      #[ticket] ([N] hours/days old)

YESTERDAY'S THROUGHPUT
--------------------------------------------------------------------------------
Opened:                 [N]
Closed:                 [N]
Net change:             [+/-N]

OVERNIGHT ESCALATIONS
--------------------------------------------------------------------------------
[List of tickets that breached, escalated, or received after-hours action, or:]
No overnight escalations detected.
[Or, if no security/monitoring connector present:]
Overnight security/incident context unavailable — no security or monitoring
connector detected through the gateway.
================================================================================
```

## Error Handling

- **No PSA connected:** Report plainly that a morning huddle can't be produced
  without a PSA connector, and stop rather than fabricating figures.
- **PSA connected but connectivity check fails:** Report the connectivity failure
  and stop rather than returning stale or partial data as if it were current.
- **Optional connector (RMM/security) not connected:** Note its absence in the
  relevant section rather than omitting the section header entirely.

## Related Commands

- `/ops-pack:sla-breaches` - Deeper, window-scoped SLA breach detail
- `/ops-pack:eod-handoff` - End-of-day counterpart to this command
