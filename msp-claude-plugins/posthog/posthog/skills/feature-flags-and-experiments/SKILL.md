---
name: "PostHog Feature Flags & Experiments"
description: >
  Read-only lookups of PostHog early-access feature flags and experiments —
  rollout status, targeting, and configuration. Does not create, update, or
  delete flags or experiments.
when_to_use: >-
  When checking whether a feature flag or early-access feature is live for
  a client, or reviewing an experiment's configuration. Use when: posthog
  feature flag, posthog experiment, early access feature, rollout
  percentage, flag status, feature flag targeting, or a/b test status.
---

# PostHog Feature Flags & Experiments

## Overview

Feature flags gate whether a piece of code runs for a given user or
percentage of traffic. Early-access features are PostHog's primitive for
managing a beta opt-in program — customers who've asked to try something
before general availability. Experiments run a controlled comparison
between variants of a flag against a primary metric. For an MSP, the
recurring question this skill answers is "is this feature actually live
for this client" or "what is this experiment currently testing" — not
turning either on or off.

## Anti-triggers

- **Creating, updating, or deleting a feature flag, early-access feature,
  or experiment** — this skill and this plugin are read-only. See
  [GOVERNANCE.md](../../GOVERNANCE.md), *Tool permission tiers*: feature-flag
  mutations change what code path a live client's production application
  executes, immediately and with no built-in dry run, which is exactly why
  this plugin excludes them at v1. Make the change directly in the PostHog
  UI, with the same care you'd give any production config change.
- **Product usage or error-rate trends** — use `insights-and-dashboards`.
- **Which users are in a targeting cohort** — the cohort itself lives in
  `cohorts-and-events`; this skill only reports what a flag or experiment
  is configured to target.

## Core Concepts

A feature flag has a key, a rollout condition (percentage, specific users,
or property-based targeting), and an enabled/disabled state per condition
group. Early-access features are a distinct PostHog primitive layered on
top of flags, purpose-built for beta programs — a user opts in, and that
opt-in maps to a flag being active for them. Experiments attach two or more
flag variants to a primary metric and report which variant is winning.

## API Patterns

The confirmed read tool family for this domain:

- `early-access-feature-list` — list early-access features and their status
- `early-access-feature-retrieve` — retrieve a single early-access feature

Both are read-only; the corresponding write tools
(`early-access-feature-create`, `early-access-feature-destroy`,
`early-access-feature-partial-update`) and general feature-flag CRUD are
excluded from this plugin — see
[GOVERNANCE.md](../../GOVERNANCE.md). Experiment lookups (list/get) follow
the same read-only pattern. PostHog's own docs carry the exhaustive tool
catalog, including the broader feature-flag API this plugin does not
expose:
[posthog.com/docs/model-context-protocol/tools](https://posthog.com/docs/model-context-protocol/tools).

## Common Workflows

### Confirming a feature is live before a client escalation

A client asks why a beta feature isn't showing up for one of their users:

1. `early-access-feature-list` to find the feature by name
2. `early-access-feature-retrieve` to check its current status and
   targeting configuration
3. Report what's configured — if the fix requires changing rollout
   percentage or targeting, that's a write action outside this plugin's
   surface; hand it to a human with the appropriate PostHog access

### Reviewing active experiments ahead of a QBR

1. List current experiments and their status
2. Pull each experiment's configuration (variants, primary metric) via the
   read tool
3. Summarize what's actively being tested for the client-facing report —
   experiment results themselves are analytics data, so cross-reference
   with `insights-and-dashboards` if the QBR needs the metric outcome, not
   just the configuration

## Gotchas

- **Read-only surface, no exceptions.** Even an emergency flag toggle
  (killing a broken feature) is outside this plugin. Escalate to a human
  with direct PostHog access rather than looking for a workaround tool.
- **"Feature flags" and "early-access features" overlap in name, not in
  tool surface.** The confirmed read tools here are specifically the
  early-access-feature family. PostHog's general feature-flag API has its
  own tools, documented separately — don't assume a flag question is
  automatically answerable through the early-access tools.
- **A flag or experiment's targeting rules don't tell you who's actually in
  them right now** — that's a cohort or event-level question; see
  `cohorts-and-events`.

## Related Skills

- [Insights & Dashboards](../insights-and-dashboards/SKILL.md) — Metric outcomes, including experiment results
- [Cohorts & Events](../cohorts-and-events/SKILL.md) — Who is actually targeted
- [API Patterns](../api-patterns/SKILL.md) — Auth, scopes, and error handling
