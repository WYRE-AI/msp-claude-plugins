---
description: EOL/EOS risk report — devices, OS versions, and firmware approaching or past end-of-life/end-of-support, prioritized by criticality
argument-hint: "[client]"
arguments: [client]
---

# EOL Report

Cross-vendor end-of-life/end-of-support risk report: devices, OS versions,
and firmware approaching or past EOL/EOS, prioritized by criticality, pulled
from whatever RMM platforms the org has connected through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least one RMM connector.
  Without an RMM, there is no device/OS inventory to assess.
- Optional: IT Glue or Hudu, used for device-criticality context where the
  RMM itself doesn't tag device role. Skipped with an explicit note if not
  connected.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which RMM connector(s) are live and their actual tool names. Never
   assume a specific vendor's tool surface. If a documentation platform is
   also connected, discover it too for criticality context.

2. **Resolve scope.** If `client` was provided, scope the device pull to
   that client/org unit/site. If omitted, run portfolio-wide.

3. **Pull device, OS, and firmware inventory** per the `eol-eos-flagging`
   skill: make, model, OS version, firmware version where exposed.

4. **Classify each device** against general EOL/EOS knowledge: OS past EOS,
   OS approaching EOS (default 6-month lookahead), hardware/firmware
   past-or-approaching EOL, no known near-term risk, or insufficient
   version data. Attach a verification caveat to every cited date — general
   knowledge of EOL/EOS timing can drift from current vendor lifecycle
   pages.

5. **Resolve criticality** per device from RMM role/tags or connected
   documentation platform's asset classification. Mark devices with no
   resolvable signal as unclassified rather than defaulting to low.

6. **Return the report**, ranked: high-criticality past-EOS/EOL first, then
   high-criticality approaching, then medium, then low, with unclassified
   and insufficient-data buckets surfaced explicitly rather than dropped.

## Arguments

- `client` (optional) — Client/org name to scope the report to. Omit for a
  portfolio-wide report across every client visible through the connected
  RMM(s).

## Examples

### Portfolio-wide report

```
/assets-pack:eol-report
```

### Single client

```
/assets-pack:eol-report "Acme Corp"
```

## Output

```
================================================================================
EOL/EOS Risk Report — [Client name or "Portfolio-wide"]
================================================================================

HIGH CRITICALITY - PAST END-OF-SUPPORT/LIFE ([N])
--------------------------------------------------------------------------------
[Model] - [client/site]
  OS/Firmware: [version]   [EOL/EOS] date: [date, generally documented —
  verify against current vendor lifecycle page]
  Criticality basis: [role/tag/documentation source]

HIGH CRITICALITY - APPROACHING (within 6 months) ([N])
--------------------------------------------------------------------------------
[same shape]

MEDIUM CRITICALITY - PAST / APPROACHING ([N])
--------------------------------------------------------------------------------
[same shape]

LOW CRITICALITY - PAST / APPROACHING ([N])
--------------------------------------------------------------------------------
[same shape]

UNCLASSIFIED CRITICALITY ([N])
--------------------------------------------------------------------------------
[devices with no resolvable role/criticality signal]

INSUFFICIENT DATA ([N])
--------------------------------------------------------------------------------
[devices with no exposed OS/firmware version]
================================================================================
```

## Error Handling

- **No RMM connected:** Report plainly that EOL/EOS risk can't be assessed
  without an RMM connector, and stop rather than fabricating figures.
- **OS/firmware version not exposed:** Report the device under insufficient
  data rather than guessing a version from the device model.
- **Client name doesn't match any known client:** Say so and list the
  clients that were found.

## Related Commands

- `/assets-pack:warranty-status [client]` - Warranty coverage, a distinct
  signal from EOL/EOS support status
- `/assets-pack:refresh-calendar [window]` - Combines this data with
  warranty and device age into a forward refresh plan
