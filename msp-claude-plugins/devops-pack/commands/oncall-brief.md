---
description: Generate the current on-call handoff brief - what's paging, what's escalated without an owner, last-shift history, and known-flaky alerts to watch
argument-hint: ""
arguments: []
---

# On-Call Brief

Cross-vendor on-call handoff brief: currently paging/unresolved incidents,
anything escalated without an owner, last-shift incident history, and
known-flaky alerts worth watching — pulled from whatever incident-management
tool (and, where connected, observability tool) the org has connected
through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least one incident-management
  connector (Rootly, PagerDuty, or BetterStack). Without one, there is no
  pager state to report on.
- Optional: an observability connector (Sentry, Datadog, Grafana) for the
  watch-list section. Skipped with an explicit note if not connected — not
  silently omitted.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which incident-management connector is live and its actual tool names
   (e.g. `rootly__get_oncall_handoff_summary`, `pagerduty__list_incidents`,
   `betterstack__list_incidents`). Never assume a specific vendor's tool
   surface. If an observability connector is also present, discover it too —
   it's optional enrichment, not required.

2. **Pull currently open/unresolved incidents**, with status, severity, and
   current owner (or explicitly "unassigned").

3. **Identify escalations without an owner** — anything that crossed a
   secondary/manager escalation tier but has no currently assigned
   responder or documented next step. This is the highest-priority item to
   surface, since it means someone may already be waiting on a response.

4. **Pull last-shift incident history** (default window: since the last
   known handoff, or the trailing 12 hours if no prior handoff timestamp is
   discoverable — state whichever window was actually used), summarized one
   line per incident.

5. **Identify known-flaky alerts** — repeated firings within the shift with
   no distinct root cause or corroborating incident. Do not label a
   single one-off firing as known-flaky.

6. **Check for observability watch items**, if a connector is available — any
   anomaly trending toward an incident that hasn't yet paged. If no
   observability connector is connected, state that plainly rather than
   reporting "nothing to watch."

7. **Assemble and return the brief**, in order: currently paging → escalated
   without owner → last-shift history → known-flaky/watch list.

## Arguments

This command takes no arguments — it always reports the full current on-call
state for whatever incident-management tool is connected. Use
`/devops-pack:postmortem` for a deep dive on a specific incident.

## Examples

### Basic Usage

```
/devops-pack:oncall-brief
```

## Output

```
================================================================================
On-Call Brief — [Date/time]
================================================================================

CURRENTLY PAGING / UNRESOLVED ([N])
--------------------------------------------------------------------------------
[Incident] - [severity] - [status] - [owner or "unassigned"]

ESCALATED, NO OWNER ([N])
--------------------------------------------------------------------------------
[Incident] - escalated to [tier] at [time] - no current owner

LAST SHIFT SUMMARY (window: [window])
--------------------------------------------------------------------------------
[N] incidents, [N] resolved, [N] carried forward
[One line per incident]

KNOWN-FLAKY / WATCH LIST
--------------------------------------------------------------------------------
[Alert] - fired [N] times, no distinct root cause
[Or, if no observability connector present:]
Watch-list unavailable - no observability connector detected through the
gateway.
================================================================================
```

## Error Handling

- **No incident-management connector connected:** Report plainly that a
  brief can't be produced without one, and stop rather than fabricating
  figures.
- **Incident-management connector connected but connectivity check fails:**
  Report the connectivity failure and stop rather than returning stale data
  as if it were current.
- **Observability connector not connected:** Note its absence in the
  watch-list section rather than omitting the section header entirely.

## Related Commands

- `/devops-pack:postmortem` - Deep-dive postmortem for a specific incident
  surfaced in this brief
- `/devops-pack:error-budget` - Reliability scorecard for services referenced
  in this brief
