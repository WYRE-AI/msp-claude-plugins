---
name: "Training Completion Tracking"
description: >
  Security-awareness training completion across whatever training/awareness
  platform is connected: assignment-overdue versus cadence-overdue detection,
  per-campaign and per-org completion-rate calculation, ranking clients that
  have fallen behind a contracted cadence, and the unmeasured-versus-0%
  distinction.
when_to_use: >-
  When checking whether users or clients have completed required security
  awareness training, or when a portfolio-wide training compliance snapshot
  is needed. Use when: training completion, overdue training, who hasn't
  finished training, training compliance, training audit, is this client
  current on training, quarterly phishing simulation due, annual awareness
  training status.
---

# Training Completion Tracking

## Overview

Training completion is the leading indicator for the human-layer side of
security posture: an org whose users are behind on required training is an
org whose users are more likely to fall for the next real phishing attempt.
This skill covers how to pull training-campaign completion state across
whatever security-awareness platform is connected, turn it into a per-org
completion rate, and flag clients falling behind their contracted cadence —
without assuming a specific vendor's data model.

## Step Zero: Confirm What's Connected

Call `conduit__search_tools` with a query like `"training campaign"` or
`"training completion"` before assuming a specific vendor is available.
KnowBe4 is the primary training/phishing-simulation platform in this
marketplace and, where connected, is the strongest source for this skill —
it exposes campaign-level enrollment and completion data directly (e.g.
`knowbe4__list_users`, `knowbe4__list_campaigns`). Proofpoint and Checkpoint
Avanan both carry secondary awareness/phishing-simulation features alongside
their core email-security function; where connected, treat them as
additional or corroborating sources, not a replacement for a dedicated
training platform. If no training/awareness connector is found for a
client, say so explicitly rather than reporting a completion rate of 0% —
"unmeasured" and "0% complete" are very different findings and must not be
conflated.

## Key Concepts

### What "overdue" means

A user or org is overdue when a training assignment has passed its due date
without a completion recorded, or when the org has no active/recent campaign
covering a training requirement that a defined cadence calls for. Distinguish
between:

- **Assignment overdue** — a specific training module or campaign was
  assigned to a user with a due date, and that date has passed with no
  completion recorded. This is the clearest, most defensible overdue signal
  when the platform exposes due dates.
- **Cadence overdue** — no assignment exists at all, but the org's
  contracted or expected cadence (e.g. "quarterly phishing simulation,
  annual awareness module") implies one should have run by now. This
  requires knowing the cadence — pull it from documentation (IT Glue/Hudu),
  the PSA contract, or ask, rather than inventing a default cadence and
  presenting it as fact. If no cadence is known, report completion status
  without an overdue judgment and say why.

### Per-org completion rate

Completion rate = completed assignments / total assignments for the
relevant campaign or requirement, per org. Report this per campaign as well
as an org-level rollup across all active campaigns — a single blended
percentage can hide the difference between "everyone did the quarterly
phishing sim" and "nobody did the annual compliance module."

### Flagging clients falling behind cadence

1. Establish the expected cadence per client, where known (contract terms,
   documentation, or explicit user input). If unknown, do not assume a
   default — flag cadence as unconfirmed for that client.
2. Compare the most recent completed campaign date (or, for a
   currently-running campaign, its due date) against the expected cadence
   interval.
3. Flag any client whose most recent relevant campaign is older than the
   cadence interval, or who has no campaign of that type at all in the
   connected platform's history.
4. Rank flagged clients by how far past cadence they are, not just a binary
   flag — a client 400 days overdue on annual training is a different
   priority than one 20 days overdue.

## Common Workflows

### Portfolio-wide overdue sweep

1. Discover the connected training platform(s) via `conduit__search_tools`.
2. For each client (or org/group, depending on the platform's tenancy
   model), pull active and recent campaigns and per-user completion status.
3. Compute per-org completion rate per campaign, and flag any user with an
   assignment past its due date.
4. Where cadence is known, flag clients whose most recent relevant campaign
   predates the expected interval.
5. Present clients with zero connected training tooling as unmeasured,
   separate from — not blended into — the ranked overdue list.

### Single-client training snapshot

1. Resolve the client against the connected platform's org/group model.
2. Pull all campaigns scoped to that client and completion status per user.
3. Report completion rate per campaign, list of overdue users by name (or
   ID if names aren't exposed), and cadence status if known.

## Error Handling

### No training/awareness connector found

State plainly that no training-completion data is available — do not report
a 0% completion rate, which implies data was checked and everyone failed.
"No security-awareness training platform connected for this client" is the
correct output.

### Connector present but campaign has no due dates

Report completion rate without an "overdue" classification for that
campaign, and note that overdue detection requires due-date data the
platform didn't return for this campaign.

### Cadence unknown

Report completion status without a cadence-compliance verdict, and note
explicitly that cadence wasn't available (documentation, contract, or user
input) rather than assuming a default like "quarterly."

## Best Practices

- Tool names follow `<vendor-slug>__<tool_name>` (e.g.
  `knowbe4__list_campaigns`) — discover them via `conduit__search_tools`
  rather than guessing.
- Where Proofpoint or Avanan phishing-simulation data is available
  alongside KnowBe4, note it as corroborating context in this skill, but
  hand off correlation with real-world click data to the
  `phishing-simulation-analysis` skill rather than duplicating that logic
  here.

## Related Skills

- [Phishing Simulation Analysis](../phishing-simulation-analysis/SKILL.md) —
  click-rate trends and repeat-clicker identification, the companion metric
  to training completion.
- [Risk Scoring](../risk-scoring/SKILL.md) — combines this skill's
  completion data with phishing-simulation performance into a single
  explainable per-user/per-org risk score.
