---
description: Phishing-simulation results and click-rate trend for a given window
argument-hint: "[window]"
arguments: [window]
---

# Phishing Results

Cross-vendor phishing-simulation results report: click-rate trend and
named repeat clickers over the given window, pulled from whatever
phishing-simulation platform the org has connected, with optional
correlation against real-world click signal from a connected email-security
tool where available.

## Prerequisites

- Conduit gateway connected (`conduit`) with at least one
  phishing-simulation connector. Without one, there is no simulation data to
  report.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which phishing-simulation connector is live and its actual tool names
   (e.g. `knowbe4__list_campaigns`). Also check for a connected
   email-security tool with phishing-adjacent signal (`proofpoint__list_vap_users`,
   `avanan__list_threats`) as optional enrichment — never assume it's
   present.

2. **Resolve the window.** Parse `window` (default `90d` if omitted). Accept
   shorthand like `30d`, `90d`, `180d`. Pull all campaigns whose run date
   falls within the window.

3. **Compute click-rate trend** across the campaigns in the window, ordered
   chronologically, per the `phishing-simulation-analysis` skill. Label
   trend direction as Improving / Flat / Worsening, or "insufficient
   history" if fewer than 3 campaigns fall within the window.

4. **Identify repeat clickers** — users with 2+ failures within the window
   — sorted by failure count then recency. Cross-reference remedial-training
   completion for each.

5. **Correlate with real-world signal where available.** If an
   email-security tool with phishing-adjacent data is connected, check each
   repeat clicker for a matching real-world finding and flag any match as a
   compounding risk signal. If not connected, note explicitly that this
   enrichment wasn't performed.

## Arguments

- `window` (optional; default: `90d`) — Time window for the phishing-results
  report, e.g. `30d`, `90d`, `180d`.

## Examples

### Default 90-day window

```
/awareness-pack:phishing-results
```

### 180-day window for a full trend view

```
/awareness-pack:phishing-results 180d
```

### Tight 30-day window after a recent campaign

```
/awareness-pack:phishing-results 30d
```

## Output

```
================================================================================
Phishing Results — window: [window]
================================================================================

CLICK-RATE TREND
--------------------------------------------------------------------------------
[client] — [N] campaigns in window — latest: [X]%   Trend: [Improving/Flat/Worsening/Insufficient history]

REPEAT CLICKERS ([N], sorted by failures then recency)
--------------------------------------------------------------------------------
[user] ([client]) — [N] failures, most recent [date]
  Remedial training complete: [yes/no]   Real-world incident match: [yes — summary / no / not checked]

TOTAL SUMMARY
--------------------------------------------------------------------------------
Campaigns analyzed: [N]   Repeat clickers: [N]   Compounding-risk matches: [N]
================================================================================
```

## Error Handling

- **No phishing-simulation connector connected:** Report plainly that a
  phishing-results report can't be produced without one, and stop rather
  than fabricating click data.
- **Invalid window format:** Note the parse failure and fall back to the
  default `90d`, stating that the fallback was used.
- **Fewer than 3 campaigns in window:** Report available click-rate data but
  label trend as "insufficient history" rather than asserting a direction.
- **No email-security connector for real-world correlation:** Proceed with
  the core simulation report and note that real-world correlation wasn't
  performed.

## Related Commands

- `/awareness-pack:training-status [client]` — training completion,
  the companion metric to phishing-simulation performance
- `/awareness-pack:risk-report [client]` — combines this data with
  training completion into a single human risk score
