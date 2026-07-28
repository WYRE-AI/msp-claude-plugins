---
name: "Dispatch Prioritization"
description: >
  Priority scoring and assignment for an unassigned PSA ticket queue: the
  scoring factors (SLA proximity, client tier, ticket age, technician load,
  skill/category match), how to combine them into an explainable ranked order
  rather than a black-box formula, and the tool-discovery pattern for finding
  which PSA and RMM connectors are actually live before calling any vendor's
  tools.
when_to_use: >-
  When triaging or assigning an unassigned ticket queue and deciding what
  order tickets should be worked in or who should take them. Use when:
  dispatch, triage the queue, assign tickets, who should take this ticket,
  unassigned queue, balance technician load, prioritize tickets.
---

# Dispatch Prioritization

## Overview

An unassigned queue is a prioritization problem, not a first-in-first-out list.
This skill scores each unassigned ticket on a small set of factors and turns that
score into a defensible assignment order — the same judgment a good dispatcher
applies, made explicit and repeatable.

## Discovering available tools first

Because this pack is cross-vendor, never assume which PSA or RMM is connected, or
what its tools are literally named. Before pulling any ticket data:

1. Call `conduit__search_tools` with a query like `"list tickets"` or `"unassigned
   tickets"` to discover which PSA connector(s) are actually live for this org, and
   the exact tool names it exposes (they follow `<vendor-slug>__<tool_name>`, e.g.
   `autotask__search_tickets`, `halopsa__tickets_list`).
2. If an RMM is also useful for scoring (e.g., to weight a ticket tied to a device
   that's also alerting), repeat the discovery for RMM tools
   (`datto-rmm__list_devices`, etc.) rather than assuming one is connected.
3. Only after discovery, call the concrete tools that came back. If the discovery
   call returns no PSA connector at all, stop and say so — there is no queue to
   dispatch without a PSA.

Never fall back to guessing a tool name (e.g., calling `connectwise__search_tickets`
speculatively) — an unrecognized tool call is a worse failure mode than asking the
user which PSA they use.

## Key Concepts

### Priority scoring factors

Score each unassigned ticket on these factors, then combine into a single ranked
order. Exact weights are a judgment call for the org, but in the absence of a
documented local policy, use this relative ordering (highest-impact first):

1. **SLA proximity** — how close the ticket is to breaching (see the
   `sla-escalation-playbooks` skill for how to read this per PSA family). A ticket
   at "breached" or "at risk" outranks everything else below.
2. **Client tier** — a Premium/Platinum client's ticket is worked ahead of an
   otherwise-identical Bronze ticket at the same SLA state, because tier-appropriate
   response time is itself part of the SLA in most contracts.
3. **Ticket age** — how long the ticket has sat unassigned, independent of formal
   SLA. A ticket that's been sitting three days with no SLA clock (e.g., a
   low-priority Syncro ticket with no formal SLA engine) still deserves to move up
   the queue as age accumulates, or it becomes a `board-hygiene` stale-ticket
   problem instead.
4. **Technician load** — don't stack the queue onto whoever is already buried. Pull
   current open-ticket counts per technician where the PSA exposes them (e.g., via a
   resource/agent search filtered by open tickets) and prefer assigning to
   technicians with lower current load, subject to skill match.
5. **Skill/category match** — if the PSA carries category, ticket type, or a
   technician skill/queue mapping, prefer routing to a technician whose queue
   matches the ticket's category over pure load-balancing. A generalist queue can
   ignore this factor.

### Combining factors into an order

A simple, explainable approach that avoids over-engineering a scoring formula:

1. Bucket tickets by SLA state first (breached-resolution, breached-response, at
   risk, healthy) — this is the primary sort key.
2. Within a bucket, sort by client tier, then by age.
3. When proposing an assignee, filter by skill/category match (if available), then
   pick the lowest-load matching technician.

State the ranking logic used in the output so a dispatcher can sanity-check or
override it — this skill produces a proposal, not an automatic assignment, unless
the operator has explicitly asked for tickets to actually be assigned.

## Common Workflows

### Score and rank the unassigned queue

1. Discover PSA tools via `conduit__search_tools` (see above).
2. Pull the unassigned ticket list, scoped to the board/queue in question.
3. For each ticket, resolve priority/status/SLA fields via the PSA's own list tools.
4. Bucket and sort per the ordering above.
5. Return a ranked list with the scoring rationale visible per ticket.

### Propose assignments

1. Run the ranking workflow above.
2. Pull technician roster and current open-ticket counts (resource/agent search,
   filtered by open assigned tickets) if the PSA exposes it. If it doesn't, say so
   and skip load-balancing rather than guessing at technician capacity.
3. Propose one assignee per ticket, in ranked order, with a one-line rationale
   ("breached response SLA, matches Networking queue, lowest current load among
   matching technicians").
4. Do not write the assignment back to the PSA unless the operator explicitly asks
   for it — default to a proposal.

## Error Handling

### No PSA connector discovered

Say so explicitly: "No PSA connector is available through the gateway, so there's no
unassigned queue to prioritize." Do not fabricate tickets.

### PSA connected but technician/resource data unavailable

Proceed with SLA/tier/age scoring only, and note explicitly that the load-balancing
factor was skipped because technician workload data wasn't available.

### Ambiguous or multiple PSAs connected

Ask which PSA/board to scope to rather than silently picking one.

## Best Practices

- Treat missing data (no technician workload, no formal SLA) as a stated gap, not a
  reason to skip the whole factor silently.

## Related Skills

- [SLA Escalation Playbooks](../sla-escalation-playbooks/SKILL.md) — how to read
  breach-risk state per PSA family, the primary sort key here
- [Board Hygiene](../board-hygiene/SKILL.md) — queue-balance across technicians and
  stale-ticket detection for tickets that never got reprioritized after assignment
