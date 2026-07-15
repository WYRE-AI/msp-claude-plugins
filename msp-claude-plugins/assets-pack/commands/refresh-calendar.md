---
description: Forward-looking hardware refresh calendar for the given window — replace-now / plan-this-year / monitor tiers
argument-hint: "[window]"
arguments: [window]
---

# Refresh Calendar

Cross-vendor forward-looking hardware refresh calendar: combines warranty
expiration, EOL/EOS timing, and device age into a replace-now /
plan-this-year / monitor plan, pulled from whatever RMM platforms (and, as
a fallback, IT Glue/Hudu) the org has connected through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least one RMM connector.
  Without an RMM, there is no device inventory to build a calendar from.
- Optional: IT Glue or Hudu, used for warranty fallback data and, where
  tracked, purchase-date records. Skipped with an explicit note if not
  connected.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which RMM connector(s) are live and their actual tool names. Never
   assume a specific vendor's tool surface. If a documentation platform is
   also connected, discover it too.

2. **Resolve the window.** Parse `window` (default `12mo` if omitted).
   Accept shorthand like `6mo`, `12mo`, `24mo`. The window scopes the
   "plan this year" section — "replace now" devices are always included
   regardless of window, since that tier is time-independent.

3. **Pull device inventory, warranty data, EOL/EOS classification, and age**
   per the `refresh-cycle-planning` skill (reusing the same approach as
   `warranty-tracking` and `eol-eos-flagging` for the first two signals),
   scoped to the whole portfolio.

4. **Tier every device** into replace-now / plan-this-year / monitor, with
   a stated rationale citing which signal(s) drove the tier. Route devices
   with no resolvable signal on any input into an explicit
   insufficient-data bucket — never default them into monitor.

5. **Lay tiered devices onto a calendar** grouped by month/quarter within
   the requested window, attaching the specific driving date to each
   "plan this year" device. Call out any clustering explicitly.

6. **Return the calendar**, led by replace-now, then plan-this-year grouped
   by timing, then a monitor summary count, then the insufficient-data
   bucket named explicitly.

## Arguments

- `window` (optional; default: `12mo`) — Forward planning window for the
  "plan this year" section, e.g. `6mo`, `12mo`, `24mo`. Replace-now devices
  are always included regardless of window.

## Examples

### Default 12-month calendar

```
/assets-pack:refresh-calendar
```

### 6-month near-term calendar

```
/assets-pack:refresh-calendar 6mo
```

### 24-month calendar for a longer capital-planning cycle

```
/assets-pack:refresh-calendar 24mo
```

## Output

```
================================================================================
Hardware Refresh Calendar — window: [window]
================================================================================

REPLACE NOW ([N])
--------------------------------------------------------------------------------
[Model] - [client/site]
  Driving signal(s): [e.g. "warranty expired + OS past EOS"]
  Criticality: [tier, if known]

PLAN THIS YEAR ([N])
--------------------------------------------------------------------------------
Q[N] [Year] ([N] devices)
  [Model] - [client/site] - Driving date: [date] ([signal])
  ...
[Cluster note if applicable: "N devices share this window — candidate for
bulk replacement"]

MONITOR
--------------------------------------------------------------------------------
[N] devices with no near-term refresh signal

INSUFFICIENT DATA ([N])
--------------------------------------------------------------------------------
[devices with no resolvable warranty, EOL/EOS, or age signal]
================================================================================
```

## Error Handling

- **No RMM connected:** Report plainly that a refresh calendar can't be
  built without an RMM connector, and stop rather than fabricating figures.
- **Invalid window format:** Note the parse failure and fall back to the
  default `12mo`, stating that the fallback was used.
- **Warranty or EOL/EOS data unavailable for some devices:** Proceed with
  whichever signals are available and state which were missing and for how
  many devices, rather than silently narrowing the report.

## Related Commands

- `/assets-pack:warranty-status [client]` - One of the two input signals
  behind this calendar
- `/assets-pack:eol-report [client]` - The other input signal, including
  the criticality weighting that carries into tiering here
