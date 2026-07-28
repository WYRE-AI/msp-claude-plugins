---
name: "Margin Analysis"
description: >
  Per-client and per-service-line margin computation for an MSP: revenue from
  PSA billing or accounting invoices, cost of goods from Pax8/Sherweb
  wholesale pricing, and estimated labor from PSA time entries × a loaded
  technician rate. Covers the full-margin / gross-margin-only /
  cost-data-unavailable reporting tiers and why a missing cost input is
  flagged rather than interpolated from portfolio averages.
when_to_use: >-
  When ranking clients or service lines by profitability, or investigating
  whether a client is profitable at all. Use when: margin analysis, client
  profitability, which clients make money, unprofitable clients, cost to
  serve, margin by client, margin erosion, service line profitability,
  contract margin, realized rate.
---

# Margin Analysis

## Overview

Revenue is visible in every PSA and accounting system; cost is not. MSPs
routinely know what they bill a client but not what it actually costs to serve
them, because cost has two very different components with very different data
quality: **cost of goods** (marketplace subscription costs from Pax8/Sherweb —
usually complete and precise) and **cost of labor** (technician time actually
spent — usually incomplete, because not every MSP enforces disciplined time
entry against every ticket).

This skill computes margin at the client or service-line level using whatever
cost data is actually available, and is explicit and conservative about what it
could not compute — a margin number built on a guessed labor cost is worse than
no margin number, because it will be trusted and acted on.

```
Margin = Revenue − Cost
Margin % = (Revenue − Cost) / Revenue × 100

Revenue = billed amount from PSA/accounting invoices for the period
Cost    = marketplace wholesale cost (Pax8/Sherweb) + estimated labor cost
          (PSA time entries × loaded technician rate, when available)
```

## Connected Systems

| System | Role | Required? |
|--------|------|-----------|
| PSA (Autotask/HaloPSA/ConnectWise/Syncro) or accounting (QBO/Xero) | Revenue — billed amount per client/service line | Yes (at least one) |
| Pax8 / Sherweb | Cost of goods — marketplace wholesale cost per subscription | Optional — recommended |
| PSA time entries (Autotask/HaloPSA/ConnectWise/Syncro) | Cost of labor — hours logged per client, for estimating labor cost | Optional |

Revenue is the only hard requirement. Everything else is a cost input that
improves accuracy but is not mandatory — this skill must still produce useful
output with only revenue and zero cost data, by explicitly reporting "cost data
unavailable" rather than fabricating a margin figure.

## Workflow

### Step 1: Discover what's connected

Call `conduit__search_tools` and search for `"invoice"`, `"subscription"`, and
`"time entr"` to determine which revenue and cost sources are live for this
org. Proceed with whatever combination exists.

### Step 2: Pull revenue per client

Pull billed amounts for the analysis period from whichever accounting/PSA
billing source is connected (`qbo__list_invoices`, `xero__list_invoices`, or
the PSA's invoice/billing-item search tool). Sum to a per-client revenue total
for the period. Where service-line-level margin is requested rather than
whole-client margin, keep revenue broken out by line description/service
rather than collapsing to a single total.

### Step 3: Pull cost of goods (if connected)

Pull active subscriptions from Pax8/Sherweb (`pax8__list_subscriptions` or the
Sherweb equivalent) for the same client, and sum wholesale unit cost × quantity
to a per-client cost-of-goods total for the period. This is the most reliable
cost input available — treat it as ground truth once fetched.

### Step 4: Estimate cost of labor (if time-entry data is connected — treat as an estimate, always)

Pull time entries for the client for the period from the PSA
(`autotask__search_time_entries` or the connected PSA's equivalent). Sum
logged hours. Multiply by a loaded technician rate to estimate labor cost.

**The loaded rate must come from context, not be invented:**

- If the user or prior context supplies a blended/loaded hourly rate, use it.
- If the PSA exposes a billing rate or cost rate per resource, use that as the
  best available proxy and say so.
- If no rate is available from any source, do **not** invent one. Report hours
  logged as a fact, mark estimated labor cost as "not computed — no loaded
  rate available," and exclude it from the margin calculation rather than
  silently defaulting to an arbitrary number.

Time-entry data is inherently an underestimate of true cost-to-serve when time
tracking discipline is inconsistent — note this caveat in the report whenever
labor cost is included, so the reader doesn't over-trust a number built on
incomplete logging.

### Step 5: Compute margin, flagging what's missing

For each client (or service line):

- **Full data (revenue + COGS + labor)** — compute margin and margin %
  normally.
- **Revenue + COGS only** — compute a "gross margin (excludes labor)" figure
  and label it as such. Do not present it as full margin.
- **Revenue only** — do not compute a margin figure. Report revenue and state
  "cost data unavailable — margin cannot be computed" rather than guessing or
  omitting the client from the report entirely.

Never interpolate a missing cost component from portfolio averages or silently
skip a client with incomplete data — both produce a false sense of coverage.
Every client in scope appears in the output, with its data-completeness state
explicit.

### Step 6: Rank and flag

Sort clients by margin % ascending (worst first) among those with a computed
margin. List clients with incomplete cost data in a separate section, not
interleaved with ranked results, so the ranking itself is never built on an
apples-to-oranges mix of full-margin and gross-margin-only figures. Flag any
client with negative margin (operating at a loss) prominently regardless of
where they sort.

## Report Format

```
═══════════════════════════════════════════════════════════════════
MARGIN ANALYSIS
Period: [Month/Quarter Year]
Cost inputs available: COGS [✓ / not connected] | Labor [✓ / not connected]
Generated: [Date]
═══════════════════════════════════════════════════════════════════

RANKED — FULL MARGIN (Revenue − COGS − Labor)
  1. [Client] — Revenue $[X] − COGS $[X] − Labor $[X] = Margin $[X] ([X]%)
  ...
  N. [Client] — Margin $[X] ([X]%)  ⚠ NEGATIVE MARGIN — operating at a loss

RANKED — GROSS MARGIN ONLY (Revenue − COGS, labor not available)
  [Client] — Revenue $[X] − COGS $[X] = Gross Margin $[X] ([X]%)
  [Note: excludes labor cost — not directly comparable to full-margin clients above]

COST DATA UNAVAILABLE
  [Client] — Revenue $[X] — no COGS or labor data connected; margin not computed

SUMMARY
  Clients with full margin computed:   [N]
  Clients with gross margin only:      [N]
  Clients with no cost data:           [N]
  Clients operating at a loss:         [N]
═══════════════════════════════════════════════════════════════════
```

## Graceful Degradation

| Missing / Unavailable | Handling |
|---|---|
| No accounting/PSA billing connected | Cannot run — no revenue source. State this explicitly. |
| No Pax8/Sherweb connected | Compute margin on labor only if available, or report revenue-only; never omit COGS silently from a "full margin" label. |
| No PSA time entries connected | Compute gross margin (revenue − COGS) and label it as such; do not present as full margin. |
| No loaded/blended labor rate available anywhere | Report hours logged as a fact; exclude labor cost from margin math rather than guessing a rate. |
| Client has revenue but zero rows in every cost source | Report revenue and mark "cost data unavailable" — do not drop the client from the report. |

## Related Skills

- [`agreement-reconciliation`](../agreement-reconciliation/SKILL.md) — confirm billed revenue is accurate before trusting it as a margin input
- [`license-true-up`](../license-true-up/SKILL.md) — confirm marketplace cost inputs reflect actual provisioned/deployed seats, not stale subscription data
- [`shared/skills/billing-reconciliation`](../../../shared/skills/billing-reconciliation/SKILL.md) — margin math reference for Pax8-cost-vs-sell-price comparisons at the subscription level
