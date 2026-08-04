---
name: "Error Budget Tracking"
description: >
  Error-budget and burn-rate assessment from whatever observability tools
  (Sentry, Datadog, Grafana, BetterStack) are connected: SLI, SLO, error
  budget, and burn rate applied practically, how to compute burn rate from
  available SLI data and the thresholds that make it actionable, what
  separates a budget-threatening trend from noise, and the fallback to raw
  trend reporting against a trailing baseline when no formal SLO is defined.
when_to_use: >-
  When assessing whether a service is burning through its error budget too
  fast, reviewing uptime or error-rate trends, or reporting reliability
  status against an SLO. Use when: error budget, burn rate, SLO status,
  reliability scorecard, uptime review, are we meeting our SLOs, error rate
  trend, how reliable is this service.
---

# Error Budget Tracking

## Overview

An error budget turns "is this service reliable enough" from a vague feeling
into a number: given a target (e.g., 99.9% uptime, or a max acceptable error
rate), the budget is the amount of unreliability you're allowed before you've
spent it. Burn rate is how fast you're spending it. This skill computes both
from whatever observability data is actually available, and — just as
importantly — knows when there isn't enough to compute a formal burn rate at
all, and falls back to something honest instead of a fabricated number.

## Anti-triggers

- **Contractual SLAs on service-desk tickets** — a response or resolution
  target on a client agreement is a different measurement from an SLO burn
  rate; use `sla-escalation-playbooks` in ops-pack.
- **Vendor-computed response metrics** — MTTA, MTTR, and incident counts are
  already calculated by the platform; use `pagerduty-analytics`.
- **Configuring the checks behind the SLI** — check types, heartbeats, and
  monitor groups are `betterstack-monitors`.

## Discovering available tools first

This pack is cross-vendor. Before pulling any observability data:

1. Call `conduit__search_tools` to discover which observability connectors
   are live — Sentry (error rate/issue volume), Datadog or Grafana
   (uptime/latency SLIs, dashboards, monitors), BetterStack (uptime checks,
   status pages). Tool names follow `<vendor-slug>__<tool_name>`, e.g.
   `sentry__list_issues`, `datadog__list_monitors`, `betterstack__list_monitors`.
2. Also check whether an SLO is formally defined anywhere reachable (a
   Datadog/Grafana SLO object, a documented target) versus needing to be
   inferred or asked for.
3. Only call the concrete tools discovery returns. If no observability
   connector at all is available, say so — there is no data to compute
   reliability trend from, formal or informal.

## Key Concepts

### SLO, SLI, and error budget, applied practically

- **SLI (Service Level Indicator)** — the measured signal: error rate,
  uptime percentage, latency percentile. This is what the observability tool
  actually reports.
- **SLO (Service Level Objective)** — the target for that SLI over a period,
  e.g. "99.9% uptime over 30 days" or "error rate under 0.1% over 7 days."
- **Error budget** — the allowed amount of failure implied by the SLO: at
  99.9% over 30 days, the budget is roughly 43 minutes of downtime (or
  equivalent error volume) for the period. Budget remaining = allowed
  failure minus failure incurred so far in the period.
- **Burn rate** — how fast the budget is being consumed relative to a steady
  pace that would exactly exhaust it by period end. A burn rate of 1.0 means
  "on pace to exactly exhaust the budget at period end." A burn rate
  meaningfully above 1.0 (commonly used thresholds: 2x sustained, or a sharp
  spike like 10x+ over a short window) signals the budget will be exhausted
  before the period ends if the current pace continues.

### Computing burn rate from available data

The formal calculation needs three things: a defined SLO target, a
measurement period, and current SLI data over that period. When all three
are available:

1. Compute allowed-failure budget for the period from the SLO target.
2. Compute actual failure incurred so far in the period from the SLI data
   (error count/rate from Sentry, downtime from Datadog/Grafana/BetterStack
   uptime checks).
3. Burn rate ≈ (budget consumed so far / budget that should be consumed at
   this point in the period if pace were even). A value materially above 1.0
   means the budget is being spent faster than a linear pace would allow.
4. State the formula and the source data explicitly in the output — a burn
   rate number without its inputs isn't verifiable or useful to challenge.

### What counts as budget-threatening vs. noise

Not every error spike or downtime blip threatens the budget. Distinguish:

- **Noise** — a brief spike that self-resolves and represents a small
  fraction of the total budget for the period (e.g., a 2-minute blip against
  a 43-minute monthly budget). Worth noting, not escalating.
- **Budget-threatening** — a sustained elevated rate (burn rate meaningfully
  above 1.0 sustained over hours, not minutes), or a single event large
  enough to consume a significant fraction of the remaining period budget in
  one incident. Both warrant escalation — the first because it will exhaust
  the budget on the current trajectory, the second because it already has.

A single data point is never enough to call something a trend — look at the
trajectory over at least several data points or a meaningful fraction of the
measurement window before characterizing something as budget-threatening
rather than a transient blip.

### Degrading gracefully when no formal SLO is defined

Most connected services will not have a formally defined SLO object sitting
in Datadog or Grafana, and that's normal, not a failure state. When no SLO
target is discoverable and the user hasn't stated one:

1. **Do not fabricate a target.** Don't assume "99.9%" or any other number
   as if it were agreed policy.
2. **Fall back to raw trend reporting.** Report the raw SLI instead of a
   derived burn rate: current error rate vs. the trailing baseline (e.g.,
   prior 7-day average), or current uptime percentage vs. trailing baseline,
   with the trend direction (improving / flat / degrading) stated plainly.
3. **Say explicitly that this is a trend report, not a burn-rate
   calculation**, and what would be needed to compute a real burn rate (a
   stated SLO target and period) — so the gap is visible rather than
   papered over with an invented number.
4. If the user supplies a target ad hoc ("we want 99.9% uptime"), treat that
   as the SLO for this run and compute burn rate normally, but note that
   it's an ad hoc target, not one formally configured in the connected tool.

## Common Workflows

### Compute error-budget status for a service with a formal SLO

1. Discover tools via `conduit__search_tools`.
2. Retrieve the SLO target and current-period SLI data from the connected
   tool that defines it (Datadog/Grafana SLO object, or BetterStack uptime
   history against a stated target).
3. Compute budget consumed, budget remaining, and burn rate per the formula
   above.
4. Classify: healthy (burn rate ≈ 1.0 or below), at-risk (sustained burn rate
   above 1.0), or exhausted (budget already spent for the period).
5. Report with the formula, inputs, and classification stated explicitly.

### Report reliability trend for a service with no formal SLO

1. Discover tools via `conduit__search_tools`.
2. Pull the raw SLI available (Sentry error rate, Datadog/Grafana metric,
   BetterStack uptime) for the current period and a trailing baseline period
   of the same length.
3. Compare current vs. baseline and state the trend direction.
4. Report explicitly as a trend report, not a burn-rate calculation, and
   note what a formal SLO would need to be defined to upgrade this to one.

### Rank multiple services by budget health (scorecard)

1. Discover tools and enumerate connected services/monitors.
2. For each service, run the appropriate workflow above (formal SLO burn
   rate where available, trend report otherwise) — do not force every
   service into the same calculation type if their available data differs.
3. Rank worst-first: exhausted > at-risk (formal) > degrading trend (no SLO)
   > healthy/flat > improving. State which classification type applied to
   each service so the ranking logic is auditable.

## Error Handling

### No observability connector discovered

Say so explicitly: "No observability connector is available through the
gateway, so reliability status can't be computed for any service." Do not
fabricate uptime or error-rate figures.

### Observability connected, but no SLO defined and no target given

Fall back to raw trend reporting per the graceful-degradation rules above —
never invent a target to force a burn-rate number.

### Insufficient historical data for a trend or baseline

State this explicitly (e.g., "only 2 days of history available, insufficient
for a reliable 7-day baseline comparison") rather than reporting a trend
built on too little data as if it were solid.

## Related Skills

- [Incident Postmortem](../incident-postmortem/SKILL.md) — a single incident
  that materially burns the budget is worth cross-referencing in the
  postmortem's impact section
- [On-Call Handoff](../oncall-handoff/SKILL.md) — a service trending toward
  budget exhaustion is a reasonable "watch this" item to carry into the next
  handoff even before it pages
