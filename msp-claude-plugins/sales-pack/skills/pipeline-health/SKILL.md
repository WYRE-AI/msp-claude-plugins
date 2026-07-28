---
name: "Pipeline Health"
description: >
  CRM pipeline health assessment against whatever CRM is discovered through
  the gateway: stage-velocity norms derived from closed-won deals,
  activity-based stalled-deal detection, raw and quality-adjusted pipeline
  coverage against a revenue target, and the CRM-less degradation rule
  (report nothing rather than fabricate figures).
when_to_use: >-
  When assessing the health of an open sales pipeline in a connected CRM —
  whether deals are moving at a healthy pace, which ones have stalled, and
  whether total pipeline value is enough to cover a revenue target. Use when:
  pipeline health, pipeline review, stalled deals, deal velocity, pipeline
  coverage, is our pipeline healthy, which deals are stuck, sales pipeline
  audit.
---

# Pipeline Health

## Overview

An open pipeline is healthy only if deals are actually moving through it. A
pipeline can look reassuring at a glance — a large total value, a comfortable
multiple of quota — while actually being a graveyard of deals nobody has
touched in six weeks. This skill turns "how's the pipeline looking" from a
vibe check into a repeatable read: stage velocity against a baseline,
explicit stalled-deal detection, and a coverage ratio that distinguishes real
momentum from stale inventory.

This skill covers pipeline health as read from the CRM alone — deal stage,
amount, age, and activity recency. It does not follow a deal's proposal or
quote artifacts outside the CRM; for that handoff (quote sent → proposal
sent/viewed/signed → deal marked closed-won), use the
[`quote-to-close-tracking`](../quote-to-close-tracking/SKILL.md) skill, which
builds on top of this one's stalled-deal detection.

## Discovering available tools first

Never assume HubSpot (or any specific CRM) is connected just because it is
the primary CRM this pack is written against. Before pulling any deal data:

1. Call `conduit__search_tools` with a query like `"list deals"` or
   `"pipeline"` to discover which CRM connector is actually live for this
   org, and the exact tool names it exposes (they follow
   `<vendor-slug>__<tool_name>`, e.g. `hubspot__list_deals`,
   `hubspot__search_deals`).
2. If more than one CRM is connected (uncommon, but possible during a
   migration), ask which one to scope to rather than silently picking one.
3. If discovery returns no CRM connector at all, stop and say so — there is
   no pipeline to assess without a CRM. Do not fabricate deals or degrade to
   a generic answer.

Never fall back to guessing a tool name speculatively — an unrecognized tool
call is a worse failure mode than asking the user which CRM they use.

## Key Concepts

### Stage-velocity norms

Every pipeline has an implicit "how long should a deal sit in this stage"
expectation, even if it's never been written down. In the absence of an
org-documented norm, use recently closed-won deals (last 90 days) to
establish a baseline: average days spent in each stage before advancing.
Compare currently open deals against that baseline — a deal sitting in a
stage 2x (or more) longer than the closed-won baseline for that stage is a
early-warning candidate, distinct from a hard stall (see below).

If fewer than roughly 5 closed-won deals exist in the lookback window, there
isn't enough sample to trust a computed baseline — say so explicitly and fall
back to a generic MSP-sales rule of thumb (discovery/qualification: 1–2
weeks; proposal/quote sent: 1–3 weeks; negotiation: 1–2 weeks) rather than
presenting a thin-sample average as authoritative.

### Stalled-deal detection

A stalled deal is defined by **inactivity**, not merely by time-in-stage —
a deal can sit in "Negotiation" for three weeks with active back-and-forth
and be perfectly healthy, while a deal with no logged activity in 14 days is
a problem regardless of stage. Default staleness threshold: **no logged
activity (note, call, meeting, email) in 14 or more calendar days, and no
future task/follow-up scheduled.** State whichever threshold was actually
applied if the operator asks for something other than the default.

Rank stalled deals by a combination of dollar value and days since last
activity — a $60,000 deal stalled for 10 days deserves more attention than a
$2,000 deal stalled for 30.

### Pipeline coverage ratio

Coverage = total open pipeline value ÷ revenue target for the period. A
target may come from a documented quota (if the CRM or a connected
source exposes one) or a user-supplied figure; if neither is available, report
raw pipeline value and state plainly that a coverage ratio couldn't be
computed without a target.

Raw coverage overstates health because it counts stale deals at full value.
Report a **quality-adjusted coverage** figure alongside raw coverage,
discounting stalled deals (per the detection above) by 50% — a pipeline that
looks like 3x coverage but is half stalled deals is not actually 3x covered.

### Degrading gracefully with no CRM connected

If `conduit__search_tools` returns no CRM connector, do not attempt a
degraded pipeline report from other tool families (a PSA is not a substitute
for a CRM here) — state plainly that pipeline health cannot be assessed
without a connected CRM, and stop. This differs from optional-signal
degradation elsewhere in this pack (e.g. warm-lead-routing falling back to
CRM-only signals when intent tools aren't connected) — a CRM is the one
required input for this skill specifically, not an optional enrichment.

## Common Workflows

### Full pipeline sweep

1. Discover the connected CRM via `conduit__search_tools` (see above).
2. Pull all open deals: name, amount, stage, pipeline, close date, creation
   date, associated company, and owner.
3. Pull the most recent logged activity date per deal (note/call/meeting/
   email) and any scheduled future task.
4. Establish the stage-velocity baseline from closed-won deals in the last 90
   days (or fall back to the generic rule of thumb — see above).
5. Flag stalled deals (14+ days no activity, no future task).
6. Compute raw and quality-adjusted pipeline coverage if a target is
   available; otherwise report raw value only and note the missing target.
7. Return the sweep: coverage summary first, then stalled deals ranked by
   value and staleness, then any deals with a past-due close date (a forecast
   integrity problem worth flagging alongside stalls).

### Single-deal health check

1. Discover the connected CRM.
2. Pull the specific deal's stage, amount, age-in-stage, and last activity.
3. Compare age-in-stage against the stage-velocity baseline for that stage.
4. Report: on-pace / slow / stalled, with the evidence (days in stage vs.
   baseline, days since last activity) shown, not just the verdict.

## Error Handling

### No CRM connector discovered

Say so explicitly: "No CRM connector is available through the gateway, so
there's no pipeline to assess." Do not fabricate deals or a coverage figure.

### CRM connected but no revenue target available

Report raw pipeline value and stalled-deal findings normally; state plainly
that a coverage ratio could not be computed without a target, rather than
inventing or assuming one.

### Too few closed-won deals to establish a stage-velocity baseline

Say so, and fall back to the generic MSP rule-of-thumb thresholds stated
above rather than presenting a thin-sample average as if it were reliable.

### Multiple CRMs connected

Ask which one (or whether to run and merge both) rather than silently
picking one.

## Best Practices

- Treat "no activity" and "long time in stage" as related but distinct
  signals — report both, don't collapse them into one number.
- Always show the threshold or baseline actually used, so a sales manager can
  sanity-check or override the read.

## Related Skills

- [Quote-to-Close Tracking](../quote-to-close-tracking/SKILL.md) — follows a
  stalled or healthy deal's proposal/quote artifacts outside the CRM to find
  exactly where in the handoff chain it's stuck
- [Warm Lead Routing](../warm-lead-routing/SKILL.md) — upstream of this skill,
  for deals that haven't yet been created in the CRM
