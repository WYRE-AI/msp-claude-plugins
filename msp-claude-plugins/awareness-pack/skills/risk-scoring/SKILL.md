---
name: "Human Risk Scoring"
description: >
  Explainable per-user and per-org human risk scoring from training-completion
  status, phishing-simulation failure history, and optional real-world
  click/attack-targeting signal: the weighted factor table, three-tier
  bucketing, per-org rollup as a distribution rather than a blended number,
  and graceful degradation when only some inputs are connected.
when_to_use: >-
  When ranking users or clients by human-layer security risk, or building a
  culture/awareness risk score. Use when: human risk score, riskiest users,
  security culture score, awareness risk ranking, who is our biggest human
  risk, human risk report, security awareness scorecard.
---

# Human Risk Scoring

## Overview

A human risk score turns training-completion and phishing-simulation
signal into one comparable number per user (and rolled up per org), so an
MSP can prioritize remedial attention the same way `tenant-exposure-ranker`
in secops-pack prioritizes technical exposure. The design goal here is the
same discipline that pack applies: an explainable ranked comparison with
visible inputs, never an opaque score a reviewer has to take on faith.

## Step Zero: Confirm What's Connected

Call `conduit__search_tools` to determine which inputs are actually
available before scoring anything. This skill's inputs, from strongest to
weakest available data:

1. **Training completion** (from `training-completion-tracking`) — whether
   the user is current on required training, and how overdue they are if not.
2. **Phishing-simulation performance** (from `phishing-simulation-analysis`)
   — click/fail history and repeat-clicker status.
3. **Real-world click-through data** (optional) — from a connected
   email-security tool (Proofpoint, Avanan) exposing actual click or
   attack-targeting signal, where available.

Not every input will be available for every client. Score with whatever
subset is connected, and always state explicitly which inputs were used for
a given score — a score computed from training data alone is a different,
less complete signal than one that also incorporates simulation and
real-click data, and the output must make that difference visible rather
than presenting both as equally authoritative.

## Key Concepts

### A simple, explainable scoring approach

Avoid building an opaque composite score. Instead, use a small number of
weighted factors, each independently visible in the output:

| Factor | Signal | Relative weight |
|---|---|---|
| Training overdue | Overdue assignment(s), and how overdue (days past due) | Highest — an overdue user is a known, current gap |
| Repeat phishing-sim failures | 2+ simulated-phishing failures, weighted higher for more recent and more frequent failures | High |
| Single/no phishing-sim failure | 0–1 failures in available history | Neutral to low, depending on completeness of history |
| Real-world click/attack-targeting signal (optional) | A real click, credential-harvest event, or "attacked person" designation from a connected email-security tool | Compounding — when present alongside repeat sim failures, this pushes the user into the highest risk tier rather than just adding linearly |

Do not fabricate a precise numeric weight scheme (e.g. "37% + 28% + ...")
unless the operator has asked for one and supplied real weights — a
three-tier bucket (Low / Elevated / High risk) driven by the factor table
above is more honest about the precision this data actually supports than a
false-precision single percentage. If a numeric score is wanted, keep the
formula visible in the output rather than presenting a bare number.

### Per-user vs. per-org rollup

Score individual users first — this is where the actionable remediation
lives (assign this specific person to retraining, flag this specific
account for closer monitoring). Roll up to an org-level score as a
distribution summary (e.g. "12% of users High risk, 30% Elevated, 58% Low")
rather than a single blended org score that hides which specific users
drive it. A per-org score is useful for portfolio-level prioritization, but
it should always be paired with the underlying distribution and the list of
highest-risk individuals, not presented alone.

### Graceful degradation when phishing-simulation data isn't available

If no phishing-simulation platform is connected for a client, do not block
scoring — degrade to training-completion-only scoring:

1. Score users purely on training-overdue status and severity (days
   overdue, number of overdue modules).
2. Label the output explicitly as "training-completion-only score —
   no phishing-simulation data connected" so it is never mistaken for the
   fuller score.
3. If a phishing-simulation platform is later connected, re-run to get the
   fuller score rather than blending partial-era data with full-era data
   silently.

The same degradation logic applies if training data isn't available but
simulation data is — score on simulation performance alone and label
accordingly. A score with zero connected inputs cannot be produced; say so
explicitly rather than returning an empty or fabricated ranking.

## Common Workflows

### Per-user risk scoring for a client

1. Discover connected inputs via `conduit__search_tools`.
2. Pull training-completion status via `training-completion-tracking`.
3. Pull phishing-simulation history via `phishing-simulation-analysis`,
   if connected.
4. Pull real-click/attack-targeting signal from a connected email-security
   tool, if available, as compounding-risk enrichment.
5. Apply the factor table to bucket each user into Low / Elevated / High
   risk, with the specific triggering factors shown per user.
6. Rank users within the client by risk tier, highest first.

### Portfolio-wide human risk ranking

1. Run the per-user workflow above for every client in scope.
2. Roll up to a per-org risk distribution and an overall org risk tier.
3. Rank orgs by proportion of High-risk users (not raw count, so a large
   org isn't penalized purely for having more users) and surface the
   specific highest-risk individuals per org for remediation follow-up.
4. Present orgs with zero connected training/awareness tooling as
   unmeasured, separate from the ranked list — a silent 0-risk score for an
   unmeasured org is a data gap, not a clean bill of health.

## Error Handling

### No training or simulation data connected at all

State plainly that no human-risk scoring is possible for this client — do
not produce a fabricated Low-risk score by default.

### Only training data available

Produce a training-completion-only score, explicitly labeled as such.

### Only simulation data available

Produce a simulation-only score, explicitly labeled as such, and note that
training-overdue status wasn't available as an input.

### Real-click enrichment unavailable

Proceed with training + simulation scoring; note that real-world
click-through enrichment wasn't available rather than treating its absence
as a scoring failure.

## Related Skills

- [Training Completion Tracking](../training-completion-tracking/SKILL.md) —
  the primary input for training-overdue severity.
- [Phishing Simulation Analysis](../phishing-simulation-analysis/SKILL.md) —
  the primary input for click-rate and repeat-clicker severity.
