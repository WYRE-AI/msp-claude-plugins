---
description: List upcoming contract and subscription renewals within a window, sorted by date
argument-hint: "[window]"
arguments: [window]
---

# Renewals

Lists every upcoming PSA contract/agreement renewal and marketplace subscription
renewal within a forward-looking window, sorted chronologically with a
recommended lead time per renewal.

## Prerequisites

- WYRE MCP Gateway connected via Conduit (`.mcp.json` → `conduit`)
- At least one PSA connector (Autotask, HaloPSA, ConnectWise, or Syncro) or one
  marketplace distributor connector (Pax8 or Sherweb) — either alone still
  produces a partial calendar, with the other source stated as unavailable

## Steps

1. Call `conduit__search_tools` to discover which PSA and distributor tools
   are actually connected for this org.
2. Resolve the window: parse `window` if given (e.g. `90d`, `30d`, `6m`);
   default to `90d` if omitted.
3. Pull PSA contract/agreement term end dates falling inside the window from
   whichever PSA(s) are connected.
4. Pull marketplace subscription renewal/commitment dates falling inside the
   window from whichever of Pax8/Sherweb are connected.
5. Assign a recommended lead time per entry based on contract type, value, and
   whether it auto-renews, then merge both sources into one chronologically
   sorted calendar grouped by urgency (this week / this month / this quarter).

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|--------------|
| window | string | No | `90d` | Forward-looking window, e.g. `30d`, `90d`, `6m` |

## Examples

### Default 90-day window

```
/finance-pack:renewals
```

### Custom window

```
/finance-pack:renewals 30d
```

## Output

```
═══════════════════════════════════════════════════════════════════
RENEWAL CALENDAR
Window: Next 90 days ([start date] – [end date])
Total Renewals: [N]  |  Total Value at Stake: $[X]
═══════════════════════════════════════════════════════════════════

THIS WEEK
  [Client] — [Item] — [Source] — Renews [date] — Recommended action-start: now

THIS MONTH
  [Client] — [Item] — [Source] — Renews [date] — Recommended action-start: [date]

THIS QUARTER
  [Client] — [Item] — [Source] — Renews [date] — Recommended action-start: [date]

AT RISK — NO RECENT RENEWAL ACTIVITY
  [Client] — [Item] — Renews [date] — no PSA activity found

UNABLE TO VERIFY
  [Vendor family not connected, if any]
═══════════════════════════════════════════════════════════════════
```

## Related

- Agent: `renewal-calendar-builder` — the underlying calendar-building logic this command runs
- Command: `/finance-pack:month-end-recon` — for reconciling billing accuracy on contracts once renewed
