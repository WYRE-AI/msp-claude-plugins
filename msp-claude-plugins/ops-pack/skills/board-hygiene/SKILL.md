---
name: "Board Hygiene"
when_to_use: >-
  When performing recurring maintenance on the ticket board rather than
  working an individual ticket. Use when: stale tickets, tickets going cold,
  duplicate tickets, related tickets, waiting on client too long, queue
  balance, board cleanup, board audit, board maintenance.
description: >
  Use this skill for recurring ticket-board maintenance across whatever PSA
  is connected: detecting stale tickets (no activity in N days), finding and
  linking duplicate or related tickets, catching status-transition problems
  (tickets stuck in Waiting-on-Client past a threshold), and checking
  queue balance across technicians. This is board-wide hygiene, distinct
  from working any single ticket.
---

# Board Hygiene

## Overview

A ticket board degrades quietly. Tickets go cold without anyone deciding to abandon
them, duplicates get opened because nobody searched first, "Waiting on Client"
becomes a place tickets go to be forgotten, and workload quietly piles onto whoever
answers fastest. None of this shows up in a single-ticket view — it only shows up
when you look at the board as a whole. This skill is that recurring sweep.

## Key Concepts

### Stale-ticket detection

A ticket is stale when there has been no meaningful activity (status change, note,
technician or client communication — not an automated system touch) for longer than
a threshold appropriate to its current state:

| Ticket state | Suggested staleness threshold |
|---|---|
| Open / In Progress, assigned | 3–5 business days with no activity |
| Unassigned | Shorter — see `dispatch-prioritization`; an unassigned ticket going stale is really a dispatch failure |
| Waiting on Client | See the dedicated threshold below — this is a distinct case |
| Waiting on Vendor / Waiting on Parts | Longer tolerance (5–10 business days), but still worth surfacing past that window |

Thresholds above are defaults to apply when the org hasn't documented its own norm —
state which threshold you used, and prefer an org-documented value if one is
available (e.g., in a connected documentation platform or prior instructions).

Pull the ticket's last-activity timestamp and current status from the connected PSA
(discover the right tool via `conduit__search_tools` if unsure — see the
`dispatch-prioritization` skill for the discovery pattern) rather than relying on
the ticket's creation date, which tells you nothing about staleness.

### Status-transition sanity: Waiting-on-Client

"Waiting on Client" is the status most likely to silently rot a ticket, because the
technician has legitimately handed the ball to the client and has no natural trigger
to check back. Treat a ticket in this status past a threshold (default: 5 business
days, tune to org norm) as requiring one of:

- A client nudge (a follow-up note/email requesting the information or action still
  needed)
- Reassignment back to internal ownership if the client's silence effectively means
  "we'll pick this up when they respond, but someone should own watching for that"
- A close-as-resolved recommendation if enough time has passed that the client
  issue is presumed resolved or abandoned (never do this automatically — recommend
  it, and require explicit confirmation before executing)

See the `stale-ticket-chaser` agent for the workflow that classifies *why* a ticket
stalled and drafts the specific follow-up action.

### Duplicate / related-ticket linking

Flag likely duplicates or related tickets using a combination of signals, since no
PSA API reliably flags this on its own:

- Same client (and ideally same contact) with tickets opened within a short window
  of each other (e.g., same day or overlapping)
- Overlapping keywords in subject/summary (fuzzy match, not exact string match —
  "email down" and "can't send email" are the same incident)
- Tickets referencing the same asset/configuration item, if the PSA links tickets to
  assets

When found, don't auto-merge — recommend linking (via the PSA's native
ticket-linking/related-ticket feature if it has one) or consolidating into a single
ticket with a note explaining the merge, and let a human confirm before executing
anything destructive (closing one of the tickets).

### Queue-balance across technicians

Pull each technician's current open-ticket count (and ideally a rough complexity/
priority weighting, not just raw count) from the PSA's resource/agent data. A
10-ticket queue of quick password resets is not equivalent load to a 4-ticket queue
of active P1 outages. Where the PSA doesn't expose enough detail to weight by
complexity, fall back to raw open-ticket count and say so explicitly rather than
presenting a false precision.

Surface imbalance as an observation, not an automatic reassignment — board hygiene
identifies the imbalance; the `dispatch-coordinator` agent (or a human dispatcher)
decides what, if anything, to move.

### If no PSA is connected

State plainly that board hygiene cannot run without a ticket source: "No PSA is
connected through the gateway, so there's no board to audit." Do not fabricate
ticket counts, staleness, or duplicates.

## Common Workflows

### Full board sweep

1. Discover the connected PSA's tools (`conduit__search_tools` if unsure of names).
2. Pull all open tickets with status, last-activity timestamp, assignee, and client.
3. Bucket into: stale (by the thresholds above), stuck-in-Waiting-on-Client,
   duplicate/related clusters, and per-technician load.
4. Report each bucket with the worst offenders first (oldest stale ticket, longest
   Waiting-on-Client, most load-imbalanced technician).

### Targeted stale-ticket check

1. Pull tickets filtered to Open/In Progress with a last-activity date older than
   the threshold.
2. Return the list sorted by staleness (oldest activity first).

## Error Handling

- **No PSA connected:** stop and say so; do not fabricate board state.
- **Last-activity timestamp not exposed by the PSA:** fall back to last-status-change
  date if available, and note the substitution explicitly — it's a weaker signal
  (a status change isn't necessarily meaningful activity).
- **Technician/resource data unavailable for queue-balance:** report raw open-ticket
  counts if obtainable, or state that queue-balance couldn't be assessed.

## Best Practices

- State the thresholds used (staleness days, Waiting-on-Client days) in every
  report — they're judgment calls, and the reader needs to know what was applied.
- Never auto-close, auto-merge, or auto-reassign as part of a hygiene sweep —
  recommend, don't execute, unless explicitly instructed otherwise.
- Prefer fuzzy/semantic duplicate detection over exact string matching; MSP clients
  rarely describe the same problem the same way twice.
- Surface the worst offenders first — a board hygiene report that buries the ticket
  that's been stuck for six weeks under 40 healthy tickets has failed its purpose.

## Related Skills

- [Dispatch Prioritization](../dispatch-prioritization/SKILL.md) — scoring and
  assigning the unassigned queue; unassigned staleness is a dispatch failure, not
  just a hygiene issue
- [SLA Escalation Playbooks](../sla-escalation-playbooks/SKILL.md) — what to do when
  a stale ticket also happens to be SLA-at-risk
