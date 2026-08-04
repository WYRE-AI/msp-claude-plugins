---
name: "Warranty Tracking"
description: >
  Endpoint hardware warranty status across whatever RMM platforms (Datto RMM,
  NinjaOne, N-central, Kaseya VSA, ConnectWise Automate, Atera, SuperOps, Syncro,
  Action1, ImmyBot) and documentation tools (IT Glue, Hudu) are connected: the
  reliability spread between OEM-resolved and hand-entered warranty fields,
  serial/asset-tag cross-referencing when RMM data is missing or stale, and the
  expired / expiring-soon / covered / unknown bucketing.
when_to_use: >-
  When pulling, normalizing, or auditing hardware warranty status across
  connected RMM platforms and documentation tools. Use when: warranty
  status, warranty audit, expired warranty, warranty expiring, is this
  device under warranty, warranty check, out of warranty devices.
---

# Warranty Tracking

## Overview

Warranty status is the single-most load-bearing field in hardware asset
management and the least consistently reliable one across RMM platforms.
Some RMMs resolve warranty directly from the OEM (serial-number lookup
against Dell/HP/Lenovo warranty APIs) and refresh it automatically. Others
expose a warranty field that is purely a manually-entered value someone
typed in once during onboarding and never touched again. Treating both as
equally trustworthy produces confident-sounding reports built on stale data.
This skill covers how to pull warranty data across whatever RMM(s) an org
has connected, how to weigh its reliability, and how to fall back to
documentation platforms (IT Glue, Hudu) when RMM data is missing or looks
stale.

This is endpoint/hardware warranty specifically — physical device coverage
status. It is not network/cloud infrastructure health (see `cloudops-pack`)
and it is not a service-desk ticket about a broken device (see `ops-pack`);
a device can be fully healthy and in active use while still being three
weeks from warranty expiration, which is exactly the case this skill exists
to catch before it becomes a support problem.

## Anti-triggers

- **One platform's own warranty or lifecycle field** — "what does Auvik
  return for warranty," "read N-central's lifecycle record" is that
  connector's API surface; use `auvik-devices` or `ncentral-devices`.
- **ScalePad Lifecycle Manager's warranty product** — LM holds its own
  hardware lifecycle records and warranty pricing; use
  `scalepad-lifecycle-manager` for anything scoped to that tool.
- **Looking up one asset's record** — use `it-glue-configurations` or
  `hudu-assets`; this skill sweeps warranty state across a fleet.

## Discovering available tools first

Never assume which RMM or documentation platform is connected:

1. Call `conduit__search_tools` with a query like `"device warranty"`,
   `"list devices"`, or `"device lifecycle"` to discover which RMM
   connector(s) are actually live for this org and their real tool names
   (e.g. `datto-rmm__datto_list_devices`, `ninjaone__list_devices`,
   `ncentral__ncentral_get_device_lifecycle`, `kaseya-vsa__list_devices`).
2. More than one RMM can be connected (a portfolio spanning multiple
   clients on different platforms, or a client mid-migration between RMMs).
   Cover all connected platforms; don't stop at the first.
3. Separately discover documentation platforms (`itglue__search_configurations`,
   `hudu__*` equivalents) as an optional fallback source, not a primary one —
   RMM inventory is the source of truth for "what devices exist"; documentation
   is the source of truth only when the RMM's own warranty field is empty or
   stale.
4. Only call concrete tools that discovery actually returned.

## Key Concepts

### Warranty data reliability varies by RMM

Different RMM platforms expose warranty with materially different
trustworthiness. Do not treat every non-null warranty field as equally
current:

| Signal | What it means |
|---|---|
| Warranty field populated with a specific expiry date, refreshed automatically from OEM lookup (where the connected RMM supports it, e.g. serial-based Dell/HP/Lenovo API resolution) | High confidence — treat as authoritative |
| Warranty field populated but the RMM has no automated OEM refresh mechanism, or the field was clearly hand-entered (e.g. N-central's lifecycle record, which is explicitly a human-maintained field) | Medium confidence — usable, but flag as "manually maintained, verify if action-critical" rather than presenting it with the same certainty as an OEM-sourced date |
| Warranty field empty or null | No confidence — this is a coverage gap, not a "no warranty" finding. Report it as "warranty unknown," never as "out of warranty" |
| Device present in RMM inventory with no lifecycle/warranty record at all | Worst case — an untracked device is a hidden risk. Surface it explicitly rather than silently omitting it from the report |

Never infer "out of warranty" from an empty field. An empty field means the
data wasn't captured, not that coverage lapsed — conflating the two produces
false alarms that erode trust in the report.

### Cross-referencing documentation platforms

When RMM warranty data is missing or looks stale (e.g., unchanged for
multiple audit cycles, or a purchase date that doesn't match the device's
first-seen date in the RMM), check whether the org has IT Glue or Hudu
connected and search for a matching asset/configuration record there:

1. Match by serial number or asset tag first — the most reliable join key
   across platforms.
2. If the documentation platform has a warranty or purchase-date field for
   the matched asset, use it to fill the gap, and note in the report that
   the figure came from documentation rather than the RMM.
3. If neither source has the data, report the device as "warranty unknown —
   not tracked in RMM or documentation" rather than omitting it. An unknown
   is itself a finding worth surfacing, especially for servers and other
   high-criticality devices.

### Expiring vs. expired

Bucket every device into one of three states, not a binary "in/out of
warranty":

1. **Expired** — warranty end date has passed.
2. **Expiring soon** — warranty end date falls within the lookahead window
   (default 90 days if the caller doesn't specify one; honor an explicit
   window if given).
3. **Covered** — warranty end date is beyond the lookahead window.

Devices with unknown warranty status form a fourth, explicitly-labeled
bucket — never fold them into "expired" or "covered."

## Common Workflows

### Portfolio-wide warranty sweep

1. Discover connected RMM(s) and documentation platform(s) via
   `conduit__search_tools`.
2. Pull device inventory from each connected RMM.
3. Pull warranty/lifecycle data per device from the RMM's own warranty
   field.
4. For devices with missing or stale RMM warranty data, cross-reference
   connected documentation platforms by serial number/asset tag.
5. Bucket every device into expired / expiring-soon / covered / unknown.
6. Return the report ranked: expired first, then expiring-soon (soonest
   first), then unknown (called out separately, not buried), then a
   summary count of covered devices.

### Single-client warranty check

1. Discover tools and scope the RMM query to the requested client/org
   unit/site.
2. Run the same pull-and-bucket steps as above, scoped to that client.
3. Return the same four-bucket structure.

## Error Handling

### No RMM connector discovered

Say so explicitly: "No RMM connector is available through the gateway, so
there's no device inventory to check warranty status against." Do not
fabricate device data.

### RMM connected but warranty/lifecycle fields not exposed

Report device inventory without warranty data and state plainly that
warranty tracking wasn't possible for this platform — do not guess or
interpolate an expiry date.

### Documentation platform connected but no matching asset record

Report the device as "warranty unknown" rather than silently skipping the
cross-reference step or treating the absence as "out of warranty."

## Related Skills

- [EOL/EOS Flagging](../eol-eos-flagging/SKILL.md) — end-of-life/end-of-support
  risk, a distinct signal from warranty coverage (a device can be in
  warranty and still running an EOL OS, or out of warranty and still fully
  supported)
- [Refresh Cycle Planning](../refresh-cycle-planning/SKILL.md) — combines
  warranty expiration with EOL/EOS timing and device age into a forward
  refresh calendar
