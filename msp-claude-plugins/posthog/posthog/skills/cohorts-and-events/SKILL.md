---
name: "PostHog Cohorts & Events"
description: >
  PostHog cohorts (saved user/group segments), raw analytics events, and
  timeline annotations. Read-only lookups — listing and retrieving existing
  records, not defining new segments or emitting events.
when_to_use: >-
  When looking up a saved user segment, raw event activity, or a timeline
  annotation in PostHog. Use when: posthog cohort, posthog event, posthog
  annotation, user segment, event query, cohort membership, or deploy
  marker.
---

# PostHog Cohorts & Events

## Overview

A cohort is a saved segment of users or groups — static (a fixed list) or
dynamic (defined by a rule that PostHog re-evaluates). Events are the raw
analytics stream: every tracked interaction, tied to a person or
`distinct_id`, carrying whatever properties the client's application sent.
Annotations are timestamped notes on a project's timeline — deploys,
incidents, config changes — used to explain a shift in a metric. This skill
covers looking these up, not defining them.

## Anti-triggers

- **Aggregated trend or funnel analysis** — don't hand-aggregate raw events
  into a trend; use `insights-and-dashboards`, which is what PostHog's own
  computed insights are for.
- **Feature-flag targeting rules** — a cohort can target a flag, but this
  skill only covers listing and retrieving cohorts and events themselves;
  use `feature-flags-and-experiments` for what a flag or experiment is
  configured to target.
- **Auth, scopes, or rate-limit behavior** — use `api-patterns`.

## Core Concepts

Cohorts group people or groups by shared property or behavior. Events carry
an event name, a `distinct_id`, a timestamp, and a properties payload whose
shape depends entirely on what the client's application instruments —
PostHog imposes no fixed schema on event properties. Annotations are
lightweight, timestamped, and scoped to a project (or a specific insight),
and exist specifically so a human reviewing a metric later can see "what
changed here."

## API Patterns

The confirmed read tool family for this domain:

- Cohorts: list, retrieve
- Events / Annotations: list, retrieve

This plugin exposes only these read tools; there is no cohort-definition,
event-ingestion, or annotation-authoring tool in this plugin's surface.
PostHog's own docs carry the exhaustive tool catalog:
[posthog.com/docs/model-context-protocol/tools](https://posthog.com/docs/model-context-protocol/tools).

## Common Workflows

### SOC analyst checking recent error events for a client's app

1. List events scoped to the relevant event name (e.g. an error or
   exception event the client's app emits) and a bounded, recent date range
2. Retrieve individual events for detail if a pattern needs closer
   inspection
3. Cross-reference against `insights-and-dashboards` if the client already
   has an error-tracking dashboard — don't re-derive a trend PostHog has
   already computed

### vCIO correlating a reported slowdown with a recent deploy

1. List annotations on the relevant project or insight for the reported
   time window
2. Match a deploy or config-change annotation against the metric shift the
   client is asking about
3. Report the correlation, not a causal claim — this skill surfaces
   timeline markers, it doesn't establish root cause

### Confirming a specific user's cohort membership before escalating a bug

1. Retrieve the cohort in question
2. Check whether the reported user/`distinct_id` matches the cohort's
   current membership
3. Note that dynamic cohorts re-evaluate — membership can have changed
   since the client last checked

## Gotchas

- **Event properties may carry PII.** Whether an event contains emails,
  user IDs, or other identifying data depends entirely on what the client's
  application sends — this plugin has no way to know in advance. Treat
  event and cohort output as potentially sensitive by default; see
  [GOVERNANCE.md](../../GOVERNANCE.md), *Data handling*.
- **Bound event queries by date.** Event volume in an active project can be
  large; an unbounded pull is a way to exhaust rate limits and return more
  data than the question needs.
- **Dynamic cohort membership is a moving target.** A cohort defined by a
  rule re-evaluates over time — "who's in this cohort" answered now may not
  match what it was when an incident happened.

## Related Skills

- [Insights & Dashboards](../insights-and-dashboards/SKILL.md) — Computed trends and funnels
- [Feature Flags & Experiments](../feature-flags-and-experiments/SKILL.md) — What a cohort targets
- [API Patterns](../api-patterns/SKILL.md) — Auth, scopes, and error handling
