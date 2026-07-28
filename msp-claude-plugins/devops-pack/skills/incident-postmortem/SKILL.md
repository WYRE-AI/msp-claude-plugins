---
name: "Incident Postmortem"
description: >
  Assembling a blameless postmortem grounded in systems of record: timeline
  reconstruction merging the incident tool's event log with correlated
  observability anomalies (Sentry error spikes, Datadog/Grafana metric
  anomalies, including precursor signal that predates formal detection) and
  deploy history from connected platform connectors, all normalized to one
  stated timezone; the root-cause versus contributing-factor distinction and
  the test for telling them apart; and how to label a root cause that is
  still only a hypothesis.
when_to_use: >-
  When assembling a blameless postmortem or post-incident review from a
  resolved (or resolving) incident — reconstructing the timeline, separating
  contributing factors from root cause, and correlating incident-tool events
  with observability and deploy data. Use when: incident postmortem, write a
  postmortem, incident retro, incident retrospective, what happened during
  the outage, post-incident review, blameless postmortem, root cause
  analysis.
---

# Incident Postmortem

## Overview

A postmortem is a reconstruction exercise, not a summary of memory. The value
of a blameless postmortem comes entirely from how well it's grounded in
actual system records — timestamps from the incident tool, error spikes from
the observability stack, and the deploy that shipped twenty minutes before
things went wrong. A postmortem built from what the on-call engineer
remembers is faster to write and far less useful: it misses precursor
signals, gets timestamps wrong across timezones, and tends to converge on
whatever explanation feels intuitive rather than what the evidence actually
shows.

This skill assembles that reconstruction from the systems of record, and
structures the analysis so contributing factors don't get collapsed into a
single "root cause" that oversimplifies what actually happened.

## Discovering available tools first

This pack is cross-vendor. Before pulling any incident or observability data:

1. Call `conduit__search_tools` to discover which incident-management
   connector is live (e.g. `rootly__get_incident`, `pagerduty__list_incidents`,
   `betterstack__list_incidents`) and pull the specific incident's record —
   by ID if given, or by resolving the most significant incident within a
   given time window if not.
2. Discover which observability connectors are live (Sentry, Datadog,
   Grafana) and which platform/deploy connectors are live (GitHub, Vercel,
   Netlify, Cloudflare, Supabase, Neon) — these are optional but each one
   that's connected sharpens the timeline.
3. Only call the concrete tools that discovery returns. Do not assume, for
   example, that Sentry is connected just because it's a common pairing —
   confirm it via discovery first.

If discovery returns no incident-management connector at all, say so
plainly — there is no incident record to build a postmortem from. If
observability/deploy connectors aren't connected, proceed with what the
incident tool alone provides and note the gap explicitly (see Error
Handling).

## Key Concepts

### Timeline reconstruction

Build the timeline from multiple sources, merged and normalized to one
timezone, not from a single source treated as complete:

1. **Incident tool event log** — the backbone: detection/trigger time,
   acknowledgment, escalations, status transitions, and any notes or action
   items logged during the incident. This is the response timeline.
2. **Observability anomalies** — error-rate spikes (Sentry), metric anomalies
   (Datadog/Grafana) in the window surrounding the incident, including any
   that predate the formal detection time — precursor signal is often the
   most valuable part of a postmortem timeline, because it shows how much
   earlier the problem was detectable versus when it was actually detected.
3. **Deploy history** — GitHub (or the relevant platform connector — Vercel,
   Netlify, Cloudflare, Supabase, Neon) deploy/release events in the window.
   A deploy landing shortly before onset is not proof of causation by itself,
   but it is one of the highest-value correlations to surface explicitly.

Normalize every timestamp to a single stated timezone (state the choice
explicitly at the top of the report) — incident tools, observability
platforms, and CI/deploy systems very often log in different timezones
(UTC vs. local), and silently mixing them corrupts the sequence.

### Root cause vs. contributing factors

These are not the same thing, and collapsing them into one produces a
postmortem that either oversimplifies ("the root cause was a bad deploy") or
scatters blame without a clear technical throughline.

- **Root cause** — the proximate technical failure: the specific thing that
  broke. A null check missing on a new code path. A connection pool sized
  below actual concurrent load. A DNS record that didn't propagate before
  cutover.
- **Contributing factors** — conditions that made the root cause possible, or
  that extended its impact or detection time. These are usually process or
  system properties, not the bug itself: no alerting on the metric that would
  have caught it earlier, no canary/staged rollout so the bad deploy hit 100%
  of traffic at once, no automated rollback on error-rate spike, a runbook
  that didn't exist for this failure mode.

A useful test: if you fixed only the root cause and changed nothing else,
would a structurally similar incident still be likely later? If yes, the
contributing factors are where the durable prevention work lives — the root
cause fix stops this specific incident from recurring, the contributing-factor
fixes stop the next one like it.

### Hypothesis structure when root cause isn't fully confirmed

Not every incident resolves with a confirmed root cause at postmortem time.
When the evidence supports a strong hypothesis but not full confirmation,
say so explicitly — label it "Root Cause (hypothesis, unconfirmed)" rather
than presenting a guess with the same confidence as a confirmed finding.
State what evidence would confirm or rule it out, so the postmortem stays
honest about its own certainty and leaves a clear next step if confirmation
matters (e.g., for a recurring pattern or a client-facing report).

## Common Workflows

### Draft a postmortem for a known incident

1. Discover tools via `conduit__search_tools`.
2. Pull the incident record by ID: title, severity, status, all available
   lifecycle timestamps, affected service(s).
3. Pull the incident tool's event/action log for the full response timeline.
4. Discover and pull correlated observability data (error spikes, metric
   anomalies) for a padded window around the incident (start well before
   the earliest known signal, through resolution).
5. Discover and pull deploy/release history for the same window from any
   connected platform connector.
6. Normalize all timestamps to one stated timezone and merge into a single
   chronological sequence, tagged by source and type (evidence vs. response).
7. Draft the root cause (confirmed or hypothesis) and separately list
   contributing factors.
8. Draft action items tied specifically to contributing factors, not just the
   root cause fix.

### Draft a postmortem for an unspecified recent incident (time window given)

1. Discover the incident-management connector and pull incidents within the
   given window (default `24h` if none given).
2. If more than one incident falls in the window, pick the most significant
   by severity/duration and say which one was selected and why; ask if
   ambiguous between two similarly significant incidents.
3. Proceed with the known-incident workflow above.

## Error Handling

### No incident-management connector discovered

Say so explicitly: "No incident-management connector is available through
the gateway, so there's no incident record to build a postmortem from." Do
not fabricate an incident.

### Incident found, but no observability or deploy connector

Proceed with a response-timeline-only postmortem built from the incident
tool's own event log, and note explicitly in the report that no correlated
observability or deploy evidence was available — this narrows what the
timeline can show about precursor signals or deploy correlation, and the
report should say so rather than presenting a thinner timeline as complete.

### Ambiguous incident (no ID given, multiple candidates in window)

Ask which incident to draft, or state clearly which one was selected by
default (highest severity / longest duration) and why.

## Related Skills

- [On-Call Handoff](../oncall-handoff/SKILL.md) — often the source of the
  incident being postmortemed; a postmortem can also feed the "last-shift
  history" section of the next handoff
- [Error Budget Tracking](../error-budget-tracking/SKILL.md) — whether this
  incident represents meaningful error-budget burn worth escalating beyond
  the individual postmortem
