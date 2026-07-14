---
description: List deals/proposals with no forward movement within a window across the full quote-to-close chain, sorted by value
argument-hint: "[window]"
arguments: [window]
---

# Stalled Deals

Lists every deal or proposal with no forward movement within the given
window, tracing the full quote-to-close chain (quote → PandaDoc proposal →
CRM deal) rather than CRM inactivity alone, sorted by value with the stall
point named for each.

## Prerequisites

- WYRE MCP Gateway connected via Conduit (`.mcp.json` → `conduit`)
- At least a CRM connector. Without one, there is no deal list to check for
  stalls.
- Optional: PandaDoc and a quoting/distribution tool (Pax8, Sherweb,
  SalesBuildr, Kaseya Quote Manager). Without them, the report is scoped to
  CRM-only stalled-deal detection, stated explicitly.

## Steps

1. Call `conduit__search_tools` to discover which CRM, proposal, and
   quoting/distribution tools are actually connected for this org.
2. Resolve the window: parse `window` if given (e.g. `14d`, `7d`, `30d`);
   default to `14d` if omitted.
3. Pull open deals from the CRM with no logged activity within the window
   and no future task scheduled.
4. If a proposal and/or quoting tool is connected, run the
   `quote-to-close-tracking` skill's sweep against every flagged deal (and
   any non-terminal proposal/quote not yet linked to a stalled CRM deal) to
   classify the stall into one of the four handoff points.
5. Merge both views into one report, sorted by deal/quote value descending,
   with the stall point named per item — or "CRM inactivity only, chain not
   verifiable" where the proposal/quoting connector isn't present.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|--------------|
| window | string | No | `14d` | No-forward-movement window, e.g. `7d`, `14d`, `30d` |

## Examples

### Default 14-day window

```
/sales-pack:stalled-deals
```

### Custom window

```
/sales-pack:stalled-deals 30d
```

## Output

```
═══════════════════════════════════════════════════════════════════
STALLED DEALS
Window: No forward movement in 14+ days
Total Stalled: [N]  |  Total Value at Stake: $[X]
═══════════════════════════════════════════════════════════════════

SIGNED, NOT MARKED CLOSED-WON (data-hygiene fix)
  [Client] — [Deal] — $[X] — signed [date], deal still shows [stage]

PROPOSAL VIEWED, NOT SIGNED
  [Client] — [Deal] — $[X] — viewed [date], [N] days no signature

PROPOSAL SENT, NOT OPENED
  [Client] — [Deal] — $[X] — sent [date], [N] days no view

QUOTE BUILT, NO PROPOSAL SENT
  [Client] — [Deal] — $[X] — quoted [date]

CRM INACTIVITY ONLY — CHAIN NOT VERIFIABLE
  [Client] — [Deal] — $[X] — no activity [N] days
  [Note: no proposal/quoting connector present for full chain diagnosis]
═══════════════════════════════════════════════════════════════════
```

## Related

- Agent: `pipeline-auditor` — the underlying full-sweep logic this command
  runs against a scoped window
- Command: `/sales-pack:pipeline-pulse` — a lighter, always-current-state
  snapshot without the per-item chain diagnosis
