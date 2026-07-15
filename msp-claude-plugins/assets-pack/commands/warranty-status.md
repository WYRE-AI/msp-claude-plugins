---
description: Warranty status snapshot — expired, expiring-soon, and unknown-coverage devices for one client or the whole portfolio
argument-hint: "[client]"
arguments: [client]
---

# Warranty Status

Cross-vendor warranty status snapshot: expired, expiring-soon, covered, and
unknown-coverage devices, pulled from whatever RMM platforms (and, as a
fallback, IT Glue/Hudu) the org has connected through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least one RMM connector.
  Without an RMM, there is no device inventory to check warranty against.
- Optional: IT Glue or Hudu, used as a fallback source when RMM warranty
  data is missing or stale. Skipped with an explicit note if not connected,
  not silently omitted.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which RMM connector(s) are live and their actual tool names (e.g.
   `datto-rmm__datto_list_devices`, `ninjaone__list_devices`,
   `ncentral__ncentral_get_device_lifecycle`). Never assume a specific
   vendor's tool surface. If IT Glue or Hudu is also connected, discover
   those too — they're a fallback source, not required.

2. **Resolve scope.** If `client` was provided, scope the device pull to
   that client/org unit/site. If omitted, run portfolio-wide across every
   client visible through the connected RMM(s).

3. **Pull device inventory and warranty data** per the `warranty-tracking`
   skill: device inventory from each connected RMM, then warranty/lifecycle
   fields, graded by reliability (OEM-resolved vs. manually-maintained vs.
   missing).

4. **Cross-reference documentation platforms** for devices with missing or
   stale RMM warranty data, if IT Glue or Hudu is connected, matching by
   serial number or asset tag. Label any figure sourced this way.

5. **Bucket every device**: expired, expiring-soon (default 90-day
   lookahead), covered, or unknown. Never fold unknown into either extreme.

6. **Return the snapshot**, ranked: expired first, then expiring-soon
   (soonest first), then unknown (visible, not omitted), then a covered
   summary count.

## Arguments

- `client` (optional) — Client/org name to scope the snapshot to. Omit for
  a portfolio-wide snapshot across every client visible through the
  connected RMM(s).

## Examples

### Portfolio-wide snapshot

```
/assets-pack:warranty-status
```

### Single client

```
/assets-pack:warranty-status "Acme Corp"
```

## Output

```
================================================================================
Warranty Status — [Client name or "Portfolio-wide"]
================================================================================

EXPIRED ([N])
--------------------------------------------------------------------------------
[Model] ([serial]) - [client/site]
  Expired: [date]   Source: [RMM name / documentation platform]

EXPIRING SOON - within 90 days ([N])
--------------------------------------------------------------------------------
[same shape, soonest first]

WARRANTY UNKNOWN ([N])
--------------------------------------------------------------------------------
[Model] ([serial]) - [client/site]
  No warranty data in RMM; [no matching documentation record / documentation
  platform not connected]

COVERED
--------------------------------------------------------------------------------
[N] devices with confirmed active warranty coverage
================================================================================
```

## Error Handling

- **No RMM connected:** Report plainly that warranty status can't be
  checked without an RMM connector, and stop rather than fabricating
  figures.
- **RMM connected but no warranty/lifecycle fields exposed:** Report device
  inventory without warranty data and state that plainly.
- **Client name doesn't match any known client:** Say so and list the
  clients that were found, rather than silently returning an empty report.

## Related Commands

- `/assets-pack:eol-report [client]` - EOL/EOS risk report, a distinct
  signal from warranty coverage
- `/assets-pack:refresh-calendar [window]` - Combines this data with
  EOL/EOS and device age into a forward refresh plan
