---
name: "MSPCFO Client Profitability"
description: >
  Reading MSPCFO's Client P&L, Client Segments and Market Segments reports
  to find which clients make or lose money, why, and what to do about it:
  margin ranking, flagged clients, segment comparison, separating real
  margin problems from PSA data problems, and preparing the profitability
  section of a client review.
when_to_use: >-
  When an MSP owner, CFO, service manager or vCIO asks which clients are
  profitable, why a client's margin dropped, or needs margin figures for a
  client review. Use when: client profitability, client p&l, unprofitable
  clients, flagged clients, client margin, client segments, market
  segments, or which clients lose money.
---

# MSPCFO Client Profitability

## Overview

MSPCFO's headline job is showing which clients make or lose money once
labor cost is set against revenue. Its public MCP page lists **Client
P&L**, **Client Segments** and **Market Segments** among the reports its
MCP draws on. This skill turns those reports into answers an MSP can act
on: a ranked list, the reason behind each outlier, and a next step.

All MSPCFO tools are admin-gated in Conduit while they are unclassified.
If the MSPCFO tools are missing from the session, follow
`mspcfo-api-patterns` instead of improvising. MSPCFO does not publish
tool names: pick the tool whose description matches Client P&L or the
segment reports from the live tool list.

## Anti-triggers

- **Whether one agreement is priced right, or a rate increase** — use
  `mspcfo-agreement-pricing-review`.
- **Why a client's labor hours are high by technician** — use
  `mspcfo-technician-utilization`.

## Key concepts

| Term | Meaning for this workflow |
|---|---|
| Client P&L | Revenue against cost for a client over a period. MSPCFO's figures, not a recomputation. |
| Margin | What is left after cost. Compare percentages across clients, absolute values for impact. |
| Flagged client | A client earning well below the portfolio average. MSPCFO's monthly summary ranks these by financial impact; rank the same way. |
| Client / Market Segments | Groupings of clients (by size, vertical or MSPCFO's segmentation). Use them to tell a client problem from a segment problem. |
| Efficiency | MSPCFO's ratio of invoiced labor to the billable value of the labor delivered. Its MCP page frames a target efficiency of 1 for rate-increase work; below 1 means more labor value is delivered than billed. It is not a cost measure, so read it alongside margin. |

## Common workflows

### Rank the portfolio

1. Pull Client P&L for a stated period: last full quarter or trailing six
   or twelve months. Avoid a single month.
2. Rank by margin percentage, then reorder the bottom of the list by
   absolute dollars lost. A small client at negative 40% matters less
   than a large one at 5%.
3. Show period, revenue, cost and margin for each client, and mark
   clients with too little revenue in the period to judge.

### Explain one client's margin

1. Pull that client's P&L for the current and the comparable prior
   period.
2. Separate the drivers: revenue change (lost services, credits),
   labor-hours change, or cost-rate change.
3. If hours drove it, hand the detail to the technician-utilization
   workflow to see whose time and which work.
4. Check for data causes before calling it a pricing problem: time logged
   to the wrong client or agreement, project work in the managed-services
   P&L, unbilled or missing time, a one-off large project.

### Segment comparison

1. Pull Client Segments or Market Segments for the same period.
2. If the whole segment runs thin, the fix is packaging or pricing for
   that segment. If one client is the outlier in a healthy segment, the
   fix is that client.

### Profitability section for a client review

Combine the client's P&L trend, its agreement health (see the agreement
pricing workflow) and one or two concrete drivers. End with a single
recommended action. Keep internal margin percentages out of anything the
client sees unless the account owner decides otherwise.

## Gotchas

- **Check figures against the MSPCFO app** before a number leaves the
  team. MSPCFO describes its MCP as early and asks for exactly this.
- **Short periods lie.** Quarterly or annual billing, or one big project,
  swings a single month. State the period every time.
- **Bad data looks like a bad client.** A loss-making client is often a
  time-entry or agreement-mapping problem in the PSA. Say which you think
  it is and why.
- **Do not recompute MSPCFO's metrics** with your own formula and present
  them as MSPCFO's. If you derive something, label it as derived.

## Related Skills

- [API patterns](../api-patterns/SKILL.md)
- [Agreement pricing review](../agreement-pricing-review/SKILL.md)
- [Technician utilization](../technician-utilization/SKILL.md)
