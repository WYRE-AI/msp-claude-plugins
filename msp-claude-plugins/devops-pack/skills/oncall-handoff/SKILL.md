---
name: "On-Call Handoff"
when_to_use: >-
  When constructing or reviewing an on-call shift handoff — surfacing what's
  currently paging or unresolved, what happened during the last shift, and
  what the incoming responder needs to know before they take the pager. Use
  when: on-call handoff, shift handoff, what's open right now, oncall
  summary, taking over on-call, end of shift, who's on call, handing off the
  pager.
description: >
  Use this skill when assembling a proper on-call handoff across whatever
  incident-management tool (Rootly, PagerDuty, BetterStack) is connected
  through the gateway. Covers what belongs in a handoff — currently paging
  or unresolved incidents, last-shift incident history and status,
  known-flaky alerts worth flagging, and anything escalated but not yet
  actioned — and, critically, how to use conduit__search_tools to discover
  which incident-management tool is actually connected before assuming a
  specific vendor's tool names. Do not hardcode a vendor's tool surface;
  discover it first.
---

# On-Call Handoff

## Overview

A shift handoff is a state-transfer problem, not a status update. The outgoing
responder holds context that only exists in their head — which alert fired
three times and turned out to be noise, which open incident is waiting on a
vendor callback, which service has been flaky all week even though nothing
paged. A good handoff makes that context explicit and durable so the incoming
responder starts the shift at full context instead of rebuilding it from
scratch, or worse, missing it entirely.

This skill produces that handoff from whatever incident-management tool is
actually connected, plus whatever corroborating alert/monitor state is
available, rather than from the outgoing responder's memory alone.

## Discovering available tools first

This pack is cross-vendor. Never assume which incident-management tool is
connected, or what its tools are literally named, before checking:

1. Call `conduit__search_tools` with a query like `"on-call handoff"`,
   `"list incidents"`, or `"current on-call"` to discover which
   incident-management connector(s) are actually live for this org, and the
   exact tool names exposed (they follow `<vendor-slug>__<tool_name>`, e.g.
   `rootly__get_oncall_handoff_summary`, `rootly__list_incidents`,
   `pagerduty__list_incidents`, `betterstack__list_incidents`).
2. If an observability tool (Sentry, Datadog, Grafana) is also connected, a
   second discovery pass can surface corroborating signal — e.g., an error
   rate spike that hasn't yet paged but is worth flagging to the incoming
   responder as "watch this."
3. Only after discovery, call the concrete tools that came back. If discovery
   returns no incident-management connector at all, say so plainly — there is
   no pager state to hand off without one.

Never fall back to guessing a tool name speculatively — an unrecognized tool
call is a worse failure mode than asking the user which incident-management
tool they use.

## Key Concepts

### What belongs in a handoff

A complete handoff covers four categories, in priority order:

1. **Currently paging / unresolved** — anything open right now: active
   incidents, unacknowledged alerts, anything mid-investigation. This is the
   incoming responder's immediate to-do list, not background reading.
2. **Last-shift history and status** — incidents that fired and resolved
   during the outgoing shift, with a one-line outcome each. This isn't for
   action, it's for context — "we've had three DB connection-pool alerts
   today" changes how the incoming responder reads the fourth one.
3. **Known-flaky alerts to watch** — alerts that fired and were dismissed as
   noise, or that fire repeatedly without a real underlying issue. These
   don't belong in "currently paging," but silently dropping them from the
   handoff means the incoming responder re-diagnoses a known non-issue from
   scratch, or worse, dismisses a real one because "that alert's always
   noisy."
4. **Escalated but not yet actioned** — anything that crossed an escalation
   tier (secondary/manager paged) but doesn't yet have an owner or a next
   step. This is the highest-risk category to drop silently, because it
   means someone is already waiting on a response that hasn't happened.

### Distinguishing "resolved" from "quiet"

An incident tool showing zero open incidents is not the same as "nothing to
hand off." A service that alerted five times and self-recovered each time is
quieter on paper than a single ongoing incident, but it's a stronger signal
that something needs attention before it becomes a real outage. Don't let an
empty open-incidents list stand in for the whole handoff — always check
last-shift history even when nothing is currently open.

### Known-flaky vs. genuinely resolved

Before labeling an alert "known-flaky," confirm it actually has a pattern —
multiple firings with no corroborating incident, ideally across more than one
shift. A single alert that fired once and cleared is not yet "known-flaky,"
it's just resolved; mislabeling it downgrades attention on something that
might recur meaningfully. When in doubt, report it under last-shift history
rather than the known-flaky category.

## Common Workflows

### Build a shift handoff

1. Discover the connected incident-management tool via `conduit__search_tools`
   (see above).
2. Pull current open/unresolved incidents and their status, severity, and
   assigned responder (if any).
3. Pull incident history for the outgoing shift window (default: since the
   last handoff, or the last 12–24 hours if no prior handoff timestamp is
   available — state which window was used).
4. Identify known-flaky alerts: incidents/alerts in the shift history that
   were dismissed, auto-resolved, or repeated with no distinct root cause.
5. Identify anything escalated (secondary/manager tier reached) without a
   currently assigned owner or documented next step.
6. If an observability tool is connected, pull any anomaly that hasn't yet
   triggered a formal incident but is trending toward one (e.g., a rising
   error rate or latency SLI) and flag it as a watch item, clearly separated
   from actual incidents.
7. Assemble the handoff in priority order: currently paging → escalated
   without owner → last-shift history → known-flaky watch list.

### Confirm a handoff before taking the pager

1. Run the build workflow above.
2. Read back the "currently paging" and "escalated without owner" sections
   explicitly to the incoming responder before considering the handoff
   complete — these are the two categories where a miss has immediate
   consequences.

## Error Handling

### No incident-management connector discovered

Say so explicitly: "No incident-management connector is available through
the gateway, so there's no pager state to hand off." Do not fabricate
incidents or invent an empty-shift summary.

### Incident tool connected but no explicit handoff-summary tool

Some vendors expose a purpose-built handoff tool (e.g.
`rootly__get_oncall_handoff_summary`); others don't. If none is available,
assemble the handoff manually from list-incidents plus current-on-call tools
rather than skipping the handoff.

### Observability tool not connected

Proceed with the incident-management-only handoff and note explicitly that
no corroborating observability signal was available for the watch-list
section, rather than omitting the section or fabricating a "no anomalies"
result.

### Multiple incident-management tools connected

Ask which schedule/service scope to hand off rather than silently merging or
picking one.

## Best Practices

- Always discover tools before calling them — never hardcode a vendor's tool
  name.
- Lead with what requires immediate action (currently paging, escalated
  without owner) before background context (history, known-flaky).
- Treat missing data (no observability connector, no formal handoff tool) as
  a stated gap, not a reason to skip the section silently.
- Don't let a quiet current-incident list stand in for a full handoff — always
  check shift history too.

## Related Skills

- [Incident Postmortem](../incident-postmortem/SKILL.md) — deeper
  reconstruction once an incident from the handoff needs a full retrospective
- [Error Budget Tracking](../error-budget-tracking/SKILL.md) — the
  service-health trend context that complements a handoff's incident-specific
  view
