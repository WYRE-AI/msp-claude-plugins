---
name: "PostHog Insights & Dashboards"
description: >
  PostHog saved insights (trends, funnels, retention, and similar analytics
  queries) and the dashboards that group them into a single view. Read-only:
  running and retrieving existing insights and dashboards, not authoring
  them.
when_to_use: >-
  When looking up product-analytics results, usage trends, error-rate
  trends, or dashboard contents in PostHog. Use when: posthog insight,
  posthog dashboard, product analytics, usage trends, error tracking,
  weekly active users, funnel, retention, QBR dashboard, or analytics
  review.
---

# PostHog Insights & Dashboards

## Overview

An insight is a saved analytics query in PostHog — a trend, funnel,
retention curve, or similar chart — that PostHog computes on demand. A
dashboard groups several insights into one view, typically the thing a
client-facing analyst screenshots for a report. For an MSP, this is the
surface for answering "how is the client's product actually being used" and
"is the error rate climbing" without opening PostHog directly.

This skill is read-only: it retrieves insights and dashboards that already
exist. It cannot create, edit, or delete either.

## Anti-triggers

- **Creating, editing, or deleting an insight or dashboard** — this plugin
  ships read-only at v1 by design; see
  [GOVERNANCE.md](../../GOVERNANCE.md), *Tool permission tiers*, for why.
  Build or change the insight in the PostHog UI directly.
- **Feature flag or experiment status** — use
  `feature-flags-and-experiments`.
- **Raw event or cohort lookups** — use `cohorts-and-events`.
- **Auth, key scopes, or rate-limit behavior** — use `api-patterns`.

## Core Concepts

Insights come in several types — trends (metrics over time), funnels
(step-by-step conversion), retention (cohort return behavior), paths, and
others — each computed against the project's event stream. A dashboard is
an ordered collection of insights with its own name and description; the
same insight can appear on more than one dashboard.

Insight results can be served from a cached computation rather than
recomputed on every request. Treat a result's timestamp as "as of," not as
"live right now" — for a fast-moving metric during an incident, re-run the
underlying query rather than trusting a cached dashboard tile.

## API Patterns

The confirmed read tool family for this domain:

- `dashboard-get` — retrieve a single dashboard by ID
- `dashboards-get-all` — list dashboards in the connected project
- Insight run/read — execute or retrieve the result of a saved insight

This plugin exposes only these read tools. PostHog's own docs carry the
exhaustive, versioned tool catalog:
[posthog.com/docs/model-context-protocol/tools](https://posthog.com/docs/model-context-protocol/tools).

## Common Workflows

### SOC analyst checking error-tracking before an escalation

A client reports intermittent failures. Before opening an incident:

1. `dashboards-get-all` to find the client's error-tracking or
   observability dashboard
2. `dashboard-get` on that dashboard to pull its current insight tiles
3. Run the relevant error-rate insight directly if the dashboard tile looks
   stale, and compare against the incident's reported timeframe

### vCIO pulling usage trends for a QBR

Ahead of a quarterly business review, pull the metrics that support a
renewal or expansion conversation:

1. `dashboards-get-all` to locate the client's product-usage or adoption
   dashboard
2. `dashboard-get` to retrieve its insights
3. Summarize month-over-month trend direction for the metrics the QBR deck
   needs — active users, feature adoption, retention — rather than dumping
   raw numbers

### Post-deployment health check

After a client ships a release, confirm nothing regressed:

1. Retrieve the insight or dashboard tracking the release's target metric
   (error rate, conversion, latency-adjacent proxy metrics PostHog tracks)
2. Compare the post-release window against the prior period
3. Flag anything outside the client's normal variance for human follow-up
   — this skill reports, it does not remediate

## Gotchas

- **Read-only surface.** There is no tool here to create or update an
  insight or dashboard, even to fix an obviously broken one.
- **Cached results can lag.** A dashboard tile's "last computed" time may
  be older than the question being asked; re-run the insight directly when
  recency matters.
- **Large projects have many dashboards.** Prefer a targeted lookup by name
  or ID over listing everything and scanning — `dashboards-get-all` returns
  every dashboard in the project, not just the relevant one.

## Related Skills

- [Feature Flags & Experiments](../feature-flags-and-experiments/SKILL.md) — Flag and experiment status
- [Cohorts & Events](../cohorts-and-events/SKILL.md) — Raw event and segment lookups
- [API Patterns](../api-patterns/SKILL.md) — Auth, scopes, and error handling
