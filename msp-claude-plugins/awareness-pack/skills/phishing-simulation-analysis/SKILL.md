---
name: "Phishing Simulation Analysis"
description: >
  Phishing-simulation campaign analysis: click-rate trend direction across
  campaigns, repeat-clicker identification with remedial-training
  cross-reference, and optional enrichment that correlates simulated failures
  with real-world phishing incidents from a connected email-security tool as a
  compounding risk signal.
when_to_use: >-
  When reviewing phishing simulation results, click-rate trends, or
  identifying repeat clickers. Use when: phishing simulation results, click
  rate, repeat clickers, phishing test analysis, who keeps clicking phishing
  tests, simulation trend, phishing campaign performance.
---

# Phishing Simulation Analysis

## Overview

A phishing-simulation campaign is only as useful as the trend and pattern
analysis built on top of its raw click data. A single campaign's click rate
tells you almost nothing on its own; the trend across campaigns, and which
specific users click repeatedly, are what actually drive training
prioritization. This skill covers how to build that analysis across
whatever simulation platform is connected, and how to optionally enrich it
with real-world phishing-incident data when a technical security tool is
also available — treating that enrichment as a bonus, never a requirement.

## Anti-triggers

- **Building or sending a simulated campaign** — templates, landing pages,
  recipient tracking, and phish-prone percentage are the vendor's surface;
  use `knowbe4-phishing`.
- **Real-world attack targeting rather than simulated tests** — Very
  Attacked People reports and attack-index scoring describe genuine inbound
  campaigns; use `proofpoint-people`. This skill reasons about controlled
  tests, and never merges the two into one click rate.

## Step Zero: Confirm What's Connected

Call `conduit__search_tools` for phishing-simulation and click-data tools
before assuming a specific vendor. KnowBe4 is the primary simulation
platform in this marketplace. Proofpoint (`proofpoint__list_vap_users` and
related tools) and Checkpoint Avanan (`avanan__list_threats` and related
tools) both carry phishing-click or "Very Attacked Person" style signal
alongside their core email-security function — where connected, they are
secondary/optional sources of real-world click and attack-targeting data,
not replacements for a dedicated simulation platform's controlled test
results. Simulated-click data (from a simulation platform) and real-click
data (from an email-security tool) are different things; never merge them
into one number without labeling which is which.

## Key Concepts

### Click-rate trend over time

Pull click rate per campaign, ordered chronologically, and report the
trend direction (improving, flat, worsening) rather than a single
snapshot number. A 12% click rate is meaningless without knowing whether
last quarter's was 8% or 20%. Where the platform supports it, break the
trend down by org and by training-module topic (e.g. invoice fraud vs.
credential harvest) — a flat overall trend can hide a specific topic that's
getting worse.

### Repeat-clicker identification

A repeat clicker is a user who has clicked (or otherwise failed — entered
credentials, opened an attachment) more than one simulated-phishing
campaign, especially across consecutive campaigns or within a short window.
Repeat clickers are the highest-value population for this skill to surface:
they represent concentrated risk that a blended org-level click rate
dilutes into invisibility. Report:

- Count of distinct campaigns each repeat clicker has failed
- Most recent failure date
- Whether the user has completed the training modules assigned as a
  consequence of prior failures (cross-reference with
  `training-completion-tracking` — a repeat clicker who also hasn't
  completed remedial training is a distinct, higher-priority case from one
  who clicked but did complete the follow-up training)

### Optional enrichment: correlating with real-world incidents

Where a technical email-security or incident-response tool is connected
(e.g. via secops-pack's stack — Proofpoint, Avanan, Mimecast, Abnormal,
Ironscales, SpamTitan, or CIPP for M365 sign-in/mailbox-rule signals), check
whether any repeat clicker also appears in real-world phishing-related
findings: an actual credential-harvest click, a BEC-pattern indicator, or an
account-compromise signal tied to the same user. A user who repeatedly
clicks simulated phishing *and* has a real security incident on record is a
compounding risk signal worth flagging distinctly and prominently — but this
correlation step is enrichment, not a requirement. Do not treat the absence
of a connected incident-response tool as a reason to skip or degrade the
core simulation analysis; simply note that real-incident correlation wasn't
available. This skill does not perform incident response itself — if a real
incident is found during this correlation step, hand off detection/response
detail to secops-pack's `bec-response` or `containment-playbooks` skills
where that pack is installed, rather than duplicating that logic here.

## Common Workflows

### Portfolio-wide click-rate trend

1. Discover the connected simulation platform(s) via `conduit__search_tools`.
2. Pull campaign history per client, ordered chronologically, with per-org
   click/fail rate.
3. Compute trend direction per client (improving / flat / worsening) across
   at least the last 3 campaigns where available; note when fewer than 3
   campaigns exist and the trend is therefore low-confidence.
4. Rank clients by worst current click rate and by worsening trend
   separately — a client with a low but worsening rate deserves different
   attention than one with a high but improving rate.

### Repeat-clicker sweep

1. Pull per-user click/fail history across all available campaigns for the
   client or portfolio in scope.
2. Identify users with 2+ failures, sorted by failure count then recency.
3. Cross-reference remedial-training completion for each repeat clicker via
   `training-completion-tracking`.
4. If a technical email-security/incident tool is connected, check each
   repeat clicker against real-world phishing/BEC findings for that user and
   flag any match prominently as a compounding risk signal.

## Error Handling

### No simulation platform connected

State plainly that no phishing-simulation data is available — do not
infer a click rate from unrelated signals (e.g. spam-filter volume).

### Fewer than 3 campaigns of history

Report the click rate(s) available but label trend analysis as
low-confidence or "insufficient history for a trend" rather than asserting
a direction from one or two data points.

### No technical incident-response tool connected for correlation

Proceed with the core simulation analysis in full. Note explicitly that
real-world incident correlation wasn't performed because no
email-security/incident-response connector was found — this is an
unavailable enrichment, not a failed check.

## Related Skills

- [Training Completion Tracking](../training-completion-tracking/SKILL.md) —
  whether repeat clickers have completed their remedial training.
- [Risk Scoring](../risk-scoring/SKILL.md) — folds click-rate and
  repeat-clicker findings from this skill into a single explainable
  per-user/per-org risk score.
