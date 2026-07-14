---
description: Pipeline snapshot - total pipeline value, stalled-deal count, deals closing this period, and biggest movers since last check
argument-hint: ""
arguments: []
---

# Pipeline Pulse

Cross-vendor pipeline snapshot meant for a quick check-in: total pipeline
value (raw and quality-adjusted), stalled-deal count, deals closing this
period, and the biggest movers since the last check — pulled from whatever
CRM the org has connected through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least a CRM connector.
  Without a CRM, there is no pipeline to report on.
- Optional: PandaDoc and/or a quoting/distribution tool (Pax8, Sherweb,
  SalesBuildr, Kaseya Quote Manager). If connected, stalled-deal counts are
  cross-checked against quote-to-close chain status; if not, the pulse is
  CRM-only and says so.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which CRM connector is live and what its actual tool names are (e.g.
   `hubspot__list_deals`). Never assume a specific vendor's tool surface. If
   a proposal or quoting tool is also present, discover those too — they're
   optional enrichment, not required.

2. **Pull total pipeline value.** Sum all open deal amounts. Compute raw and
   quality-adjusted coverage per the `pipeline-health` skill if a revenue
   target is available; otherwise report raw value only and note the missing
   target.

3. **Pull stalled-deal count.** Using the `pipeline-health` skill's default
   threshold (no logged activity in 14+ days, no future task scheduled),
   count and total the value of stalled deals.

4. **Pull deals closing this period.** Count and sum the value of open deals
   with a close date in the current month/quarter (state which period was
   used).

5. **Identify biggest movers.** Deals that changed stage, amount, or close
   date most significantly since the prior snapshot, if a prior run's data
   is available (e.g. from a prior `/sales-pack:pipeline-pulse` output the
   operator provides for comparison). If no baseline is available, state
   that plainly and report current-state figures without a delta.

6. **Assemble and return the pulse**, in the order: total pipeline value →
   stalled-deal count → closing this period → biggest movers. Lead with
   whichever section has the most urgent finding if one clearly dominates
   (e.g., a large deal newly stalled).

## Arguments

This command takes no arguments — it always reports the full pipeline scoped
to whatever CRM is connected. Use `/sales-pack:stalled-deals [window]` for a
deeper, window-scoped stalled-deal view with quote-to-close diagnosis.

## Examples

### Basic Usage

```
/sales-pack:pipeline-pulse
```

## Output

```
================================================================================
Pipeline Pulse — [Date]
================================================================================

PIPELINE VALUE
--------------------------------------------------------------------------------
Total open pipeline:    $[X] raw / $[Y] quality-adjusted
Coverage:                [ratio, or "no target available"]

STALLED DEALS
--------------------------------------------------------------------------------
Stalled (14+ days no activity): [N] deals, $[X] total value
Threshold applied:               [stated threshold]

CLOSING THIS PERIOD
--------------------------------------------------------------------------------
Deals closing [this month/quarter]: [N], $[X] total value

BIGGEST MOVERS
--------------------------------------------------------------------------------
[List of deals with the most significant stage/amount/close-date change since
last check, or:]
No baseline available for comparison — reporting current state only.
================================================================================
```

## Error Handling

- **No CRM connected:** Report plainly that a pipeline pulse can't be
  produced without a CRM connector, and stop rather than fabricating
  figures.
- **CRM connected but no revenue target available:** Report raw pipeline
  value and note the missing target rather than inventing a coverage ratio.
- **No proposal/quoting connector present:** Note plainly that stalled-deal
  figures reflect CRM activity only, not full quote-to-close status.

## Related Commands

- `/sales-pack:stalled-deals [window]` - Deeper, window-scoped stalled-deal
  view with quote-to-close chain diagnosis
- `/sales-pack:warm-leads` - Currently-warm leads with routing
  recommendations
