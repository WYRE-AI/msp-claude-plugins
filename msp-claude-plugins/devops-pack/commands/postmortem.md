---
description: Draft a blameless postmortem for a given incident (by ID or name), or the most recent significant incident within a time window
argument-hint: "[incident] [window]"
arguments: [incident, window]
---

# Postmortem

Cross-vendor blameless postmortem: reconstructs a resolved incident's
timeline from the incident-management tool's event log plus correlated
observability and deploy data, separates root cause from contributing
factors, and drafts action items — pulled from whatever incident-management,
observability, and platform tools the org has connected through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with an incident-management
  connector (Rootly, PagerDuty, or BetterStack). Without one, there is no
  incident record to build a postmortem from.
- Optional: an observability connector (Sentry, Datadog, Grafana) and a
  platform/deploy connector (GitHub, Vercel, Netlify, Cloudflare, Supabase,
  Neon). Sections that depend on them are skipped with an explicit note if
  not connected — not silently omitted.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which incident-management connector is live, and whether observability or
   platform/deploy connectors are also connected. Never assume a specific
   vendor's tool surface.

2. **Resolve the incident.** If `incident` is given, resolve it by ID or name
   against the connected incident-management tool. If omitted, resolve
   `window` (default `24h`) and select the most significant incident within
   it by severity/duration — state which one was selected and why. If two
   candidates are similarly significant, ask which one to draft.

3. **Pull the incident record and full event/action log** — severity,
   status, affected service(s), all available lifecycle timestamps, and
   every note/action taken. This is the backbone response timeline.

4. **Pull correlated observability data**, if connected, for a padded window
   around the incident (starting before the earliest known signal), noting
   the source's native timezone.

5. **Pull correlated deploy/release history**, if a platform connector is
   connected, for the same window. Flag any deploy shortly before onset as a
   correlation worth noting — not asserted causation without corroborating
   evidence.

6. **Normalize timestamps** to one stated timezone and merge all sources into
   a single chronological sequence, tagged by source and by type (evidence
   vs. response).

7. **Draft root cause and contributing factors separately.** Label an
   unconfirmed root cause explicitly as a hypothesis, with the evidence that
   would confirm or rule it out.

8. **Draft action items** tied to both the root-cause fix and the
   contributing-factor fixes — specific and assignable, not vague.

9. **Report evidence gaps** for any relevant connector not connected or that
   returned no data for the window.

10. **Return the assembled postmortem.**

## Arguments

- `incident` (optional) — Incident ID or name to draft a postmortem for. If
  omitted, the most recent significant incident within `window` is selected.
- `window` (optional; default: `24h`) — Time window to search for a recent
  significant incident when `incident` is not given, e.g. `4h`, `24h`, `7d`.
  Ignored if `incident` is given.

## Examples

### Postmortem for a specific incident by ID

```
/devops-pack:postmortem INC-482
```

### Most recent significant incident in the default 24h window

```
/devops-pack:postmortem
```

### Most recent significant incident in the last 7 days

```
/devops-pack:postmortem "" 7d
```

## Output

```
================================================================================
Postmortem — [Incident Title / ID]
================================================================================
Severity: [level]   Affected: [service(s)]   Window analyzed: [start]-[end] ([tz])
Systems queried: [list]   Evidence gaps: [list, or "none"]

SUMMARY
--------------------------------------------------------------------------------
[2-3 sentences]

TIMELINE
--------------------------------------------------------------------------------
[ts] [Evidence/Response] [source]: [event]
...

ROOT CAUSE
--------------------------------------------------------------------------------
[Confirmed, or "(Hypothesis, unconfirmed)" + supporting/disconfirming evidence]

CONTRIBUTING FACTORS
--------------------------------------------------------------------------------
- [condition]

ACTION ITEMS
--------------------------------------------------------------------------------
[#] [description] - ties to [root cause/contributing factor N] - [owner] - [priority]
================================================================================
```

## Error Handling

- **No incident-management connector connected:** Report plainly that a
  postmortem can't be drafted without one, and stop.
- **`incident` given but not found:** State that the incident could not be
  resolved against the connected tool, and stop rather than guessing.
- **No significant incident found in `window`:** State this explicitly rather
  than fabricating one; suggest widening the window.
- **Observability/platform connector not connected:** Note the resulting
  evidence gap explicitly in the report rather than presenting a thinner
  timeline as complete.

## Related Commands

- `/devops-pack:oncall-brief` - Often the source of the incident being
  postmortemed
- `/devops-pack:error-budget` - Whether this incident represents meaningful
  error-budget burn worth escalating beyond the individual postmortem
