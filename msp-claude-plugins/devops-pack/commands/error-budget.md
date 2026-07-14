---
description: Run the reliability scorecard for one service, or every connected service if omitted - error-budget burn rate where an SLO is defined, trend reporting otherwise
argument-hint: "[service]"
arguments: [service]
---

# Error Budget

Cross-vendor reliability scorecard: computes error-budget burn rate for any
service with a discoverable SLO target, and degrades gracefully to raw
error-rate/uptime trend reporting for services with none — ranked worst
first — pulled from whatever observability tools the org has connected
through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least one observability
  connector (Sentry, Datadog, Grafana, or BetterStack). Without one, there is
  no reliability data to score.
- Optional: an incident-management connector (Rootly, PagerDuty, BetterStack)
  to cross-reference incidents against sharp budget-burn events. Skipped
  with an explicit note if not connected.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which observability connector(s) are live and what services/monitors each
   covers. Never assume a specific vendor's tool surface.

2. **Resolve scope.** If `service` is given, scope to it. If omitted, score
   every service/monitor discoverable across connected observability tools.

3. **Check for a formal SLO** per service — a configured SLO object in
   Datadog/Grafana, or a target supplied ad hoc for this run. Never fabricate
   a target that wasn't configured or explicitly supplied.

4. **Compute burn rate** for services with a discoverable/supplied SLO:
   budget consumed so far in the period vs. what should be consumed at this
   point if pace were even. Classify: healthy, at-risk, or exhausted.

5. **Fall back to trend reporting** for services with no SLO: current-period
   SLI vs. a trailing baseline of equal length. Classify: improving, flat, or
   degrading. State explicitly that this is a trend report, not a burn-rate
   calculation.

6. **Cross-reference incidents**, if an incident-management connector is
   available, for any service showing a sharp burn/degradation, to attach an
   explanation.

7. **Rank worst-first**: exhausted > at-risk (formal) > degrading trend (no
   SLO) > healthy/flat > improving. Tag each service with which method (burn
   rate vs. trend) produced its classification.

8. **Return the scorecard.**

## Arguments

- `service` (optional) — Name of a specific service/monitor to score. If
  omitted, every connected observability tool's discoverable services are
  scored and ranked together.

## Examples

### Scorecard across everything connected

```
/devops-pack:error-budget
```

### Scorecard for one service

```
/devops-pack:error-budget checkout-api
```

## Output

```
================================================================================
Reliability Scorecard — [scope]
================================================================================
Method key: BR = formal burn rate, TR = trend report (no SLO)

Rank  Service           Method  Status      Detail
--------------------------------------------------------------------------------
1     [service]         BR      Exhausted   Burn rate [X]x, [Y]% of budget consumed
2     [service]         TR      Degrading   Error rate [X]% vs [Y]% baseline

WORST OFFENDER DETAIL
--------------------------------------------------------------------------------
[Formula/inputs, contributing incidents if any, recommended next step]

NO SLO DEFINED
--------------------------------------------------------------------------------
[Services scored via trend fallback + what a formal SLO would require]

UNABLE TO SCORE
--------------------------------------------------------------------------------
[Service - reason, or omit section if none]
================================================================================
```

## Error Handling

- **No observability connector connected:** Report plainly that reliability
  status can't be computed without one, and stop rather than fabricating
  uptime or error-rate figures.
- **`service` given but not found across any connected observability tool:**
  State this explicitly rather than guessing or substituting a similarly
  named service.
- **No SLO defined and none supplied:** Fall back to trend reporting per the
  steps above — never invent a target to force a burn-rate number.
- **Insufficient historical data for a baseline:** State this explicitly
  rather than reporting a trend built on too little data as solid.

## Related Commands

- `/devops-pack:postmortem` - Deep dive on an incident that materially burned
  a service's budget
- `/devops-pack:oncall-brief` - Carries forward a degrading service as a
  watch item even before it pages
