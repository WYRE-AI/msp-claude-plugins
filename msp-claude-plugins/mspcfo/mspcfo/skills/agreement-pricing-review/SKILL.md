---
name: "MSPCFO Agreement Pricing Review"
description: >
  Using MSPCFO's profitability data to review managed-services agreements:
  finding underpriced, over-consumed or declining agreements, ranking the
  weakest, working out a defensible annual rate increase toward MSPCFO's
  efficiency target, and drafting a vCIO plan per agreement. Read and
  draft only; changing an agreement happens in the PSA.
when_to_use: >-
  When an MSP is planning price increases, renewals or a vCIO review and
  needs to know which agreements under-recover cost and by how much. Use
  when: agreement profitability, underpriced agreement, agreement health,
  rate increase, annual price increase, renewal pricing, weakest
  agreements, or agreement efficiency.
---

# MSPCFO Agreement Pricing Review

## Overview

An agreement is underpriced when the labor it consumes costs more than
its fee allows for. MSPCFO surfaces this as agreement health
(overutilized, underpriced or declining agreements) and as efficiency on
Client P&L. Its MCP page names two jobs this skill covers: recommending
annual rate increases that move a client toward an efficiency of 1, and
ranking the three weakest agreements with a vCIO plan for each.

Every MSPCFO tool is admin-gated in Conduit while unclassified, and
MSPCFO does not publish tool names. Find the Client P&L and agreement
tools in the live tool list by description; see `mspcfo-api-patterns`
if none appear.

This workflow only reads and drafts. MSPCFO reports on PSA data and the
agreement itself lives in ConnectWise or Autotask. Any price change is
made there, by a person.

## Anti-triggers

- **Portfolio ranking of clients rather than agreements** — use
  `mspcfo-client-profitability`.
- **Which technicians consume the hours** — use
  `mspcfo-technician-utilization`.

## Key concepts

| Term | Meaning |
|---|---|
| Efficiency | MSPCFO's ratio of invoiced labor to the billable value of the labor delivered under the agreement. MSPCFO frames 1 as the target for rate increases; below 1 means more labor value is delivered than billed. It is not a cost measure: check cost recovery (margin) separately before calling an agreement unprofitable or proposing an increase. |
| Overutilized | The agreement consumes more hours than its price supports. |
| Underpriced | The fee is low for the work, even at normal consumption. |
| Declining | Margin is trending down across periods. |

## Common workflows

### Rank the weakest agreements

1. Pull agreement-level profitability or Client P&L for trailing twelve
   months, so seasonal and annual-billing effects even out.
2. Rank by efficiency (lowest first), then weigh by revenue so the list
   reflects money at stake.
3. For the bottom three, record: client, agreement, period, revenue,
   cost, efficiency, and the main driver (hours, scope creep, low price,
   lost add-ons).

### Annual rate-increase recommendation

1. Take this agreement's own invoiced labor and efficiency over trailing
   twelve months from the agreement-level report. Client-level efficiency
   from Client P&L mixes every agreement the client has, so do not use it
   here; if agreement-level figures are not available, say the target
   cannot be determined for this agreement.
2. Work out the invoiced labor needed to reach an efficiency of 1 at
   current consumption. Label this as a derived figure, with the inputs
   shown.
3. Compare it with a normal annual increase. If the gap is large, propose
   a staged path (this year's increase plus a scope or consumption
   change) instead of one shock increase.
4. Draft the recommendation for the account owner: current state, target,
   proposed increase, and the reason in one sentence the client would
   accept.

### vCIO plan per weak agreement

For each weak agreement, choose one primary lever and say why:

- **Reprice** when consumption is normal but the fee is low.
- **Rescope** when the agreement absorbs work it was never priced for
  (projects, out-of-scope users or sites).
- **Reduce consumption** when hours come from recurring, fixable issues:
  standardize, automate or replace the noisy systems.
- **Exit or restructure** only when the other levers cannot close the gap.

## Gotchas

- **Verify in the MSPCFO app** before a number reaches a client or a
  renewal. MSPCFO describes its MCP as early and asks for this.
- **Check agreement mapping first.** Time on the wrong agreement makes a
  healthy agreement look overutilized and hides the real problem.
- **Do not change anything from here.** If the session also has a PSA
  plugin connected, a price or agreement change is a separate, approved
  PSA write, not a step in this review.
- **Keep internal margins internal.** Client-facing drafts talk about
  value, scope and cost of delivery, not the MSP's margin percentage.

## Related Skills

- [API patterns](../api-patterns/SKILL.md)
- [Client profitability](../client-profitability/SKILL.md)
- [Technician utilization](../technician-utilization/SKILL.md)
