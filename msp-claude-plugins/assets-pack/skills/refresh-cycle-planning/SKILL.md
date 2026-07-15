---
name: "Refresh Cycle Planning"
when_to_use: >-
  When building a forward-looking hardware refresh calendar or deciding
  which devices need replacing this year versus later. Use when: refresh
  planning, hardware refresh calendar, what needs replacing, capital
  planning for hardware, replacement schedule, budget for new hardware,
  which devices to replace next.
description: >
  Use this skill when building a forward-looking hardware refresh calendar
  by combining warranty expiration, EOL/EOS timing, and device age across
  whatever RMM platforms and documentation tools are connected through the
  gateway. Covers how to bucket devices into replace-now, plan-this-year,
  and monitor tiers so refresh conversations happen proactively — ahead of
  a failure or a forced EOL migration — rather than reactively after
  something breaks. Always use conduit__search_tools to discover which
  tools are actually connected before assuming a specific vendor.
---

# Refresh Cycle Planning

## Overview

Most MSPs discover a hardware refresh need reactively: a device fails, or a
client gets stuck on an OS that just hit end-of-support with no migration
path, and the replacement conversation happens under time pressure with no
budget lead time. This skill exists to move that conversation earlier — by
combining three signals that are each individually useful but collectively
much stronger — into a forward-looking calendar the account team can use in
a quarterly business review or a capital-planning conversation, well before
any of the underlying risk becomes urgent.

The three input signals, each covered by a sibling skill:

1. **Warranty expiration** (`warranty-tracking`) — when hardware coverage
   lapses.
2. **EOL/EOS timing** (`eol-eos-flagging`) — when the OS or hardware itself
   stops being supported.
3. **Device age** — how long the device has been in service, pulled from
   RMM first-seen/enrollment date or purchase date where available.

No single signal is sufficient on its own. A device can be young with an
expired warranty (a warranty that was never worth much to begin with on a
low-end model), old but still fully supported and under an extended
warranty, or mid-life but running an OS that's about to lose support
regardless of hardware condition. This skill's job is to weigh all three
together into one defensible tier per device, not to rank on whichever
signal happens to be loudest.

This is not a procurement or quoting skill — it produces a planning
calendar and tiered priority list, not a purchase order. Handing the output
to a quoting/sales workflow (e.g. `sales-pack`) or a PSA opportunity is a
separate, deliberate next step, not something this skill does
automatically.

## Discovering available tools first

Never assume which RMM or documentation platform is connected:

1. Call `conduit__search_tools` to discover connected RMM(s) (for device
   inventory, age, and warranty/lifecycle fields) and documentation
   platforms (IT Glue, Hudu — for warranty fallback data and, where
   tracked, purchase-date/asset records).
2. Cover all connected RMMs if more than one is present.
3. Only call concrete tools that discovery actually returned.

## Key Concepts

### Combining the three signals into a tier

Bucket every device into exactly one of three tiers. State the reasoning
per device — a tier assignment without a visible rationale isn't
actionable for whoever has to defend the capital ask.

| Tier | Criteria (any one is sufficient to qualify; more than one raises confidence) | What it means |
|---|---|---|
| **Replace now** | Warranty already expired on a high-criticality device, OR OS/hardware already past EOS, OR device age is well beyond the org's typical refresh cycle (commonly 4-5 years for desktops/laptops, longer for servers — use the org's own documented policy if known, otherwise state the assumption) with an additional risk signal present | Active risk today — should move to procurement discussion this cycle, not wait for the next planning window |
| **Plan this year** | Warranty expiring within the next 6-12 months, OR OS/hardware approaching EOS within the next 6-12 months, OR device age approaching the typical refresh threshold without an immediate second risk signal | Not urgent today, but should be budgeted and scheduled within the current planning year so it doesn't slide into "replace now" under time pressure |
| **Monitor** | None of the above thresholds met — warranty and EOL/EOS both comfortably out, device age within normal range | No action needed; keep it in the sweep for the next planning cycle |

Devices with insufficient data on all three signals (no warranty data, no
resolvable EOL/EOS status, no age data) go into an explicit **insufficient
data** bucket — never default an unknown device into "monitor," since that
silently hides a coverage gap as if it were a clean bill of health.

### Building the calendar

Once devices are tiered, lay them out on a forward timeline rather than
just three flat lists:

1. For **replace now** devices, no date is needed — they're already
   actionable.
2. For **plan this year** devices, attach the specific driving date (the
   warranty expiration date or EOL/EOS date that put them in this tier) so
   the calendar shows *when* in the year the pressure actually lands, not
   just that it lands sometime this year.
3. Group by month or quarter where enough devices share a similar window —
   this is what makes the output a "calendar" rather than a list, and lets
   an account team see clustering (e.g., "40 devices from the 2021 refresh
   batch all cross warranty expiration in Q3").
4. Note any clustering explicitly — a cluster is itself a planning signal
   (batch replacement often gets better vendor pricing than one-off
   replacements) and worth calling out even if the tier logic alone
   wouldn't otherwise group them.

### Cost/budget framing

This skill does not have pricing data and should not invent per-device
replacement costs. Where the org has connected a distribution/quoting tool
(covered by other packs, e.g. `sales-pack`), note that a cost estimate
would need to come from there. Where no pricing source is available, report
device counts per tier and let the reader attach their own budget
assumptions rather than fabricating a dollar figure.

## Common Workflows

### Portfolio-wide refresh calendar

1. Discover connected RMM(s) and documentation platform(s) via
   `conduit__search_tools`.
2. Run (or reuse recent output from) `warranty-tracking` and
   `eol-eos-flagging` across the same device inventory.
3. Pull device age from RMM enrollment/first-seen date or documentation
   purchase-date records where available.
4. Tier every device per the rules above, with visible rationale.
5. Lay tiered devices onto a forward calendar, grouping by month/quarter
   and calling out clusters.
6. Return the calendar led by "replace now," then "plan this year" grouped
   by timing, then a device-count summary of "monitor," then the
   "insufficient data" bucket named explicitly.

### Refresh calendar for a specific window

1. Discover tools and run the same pull/tier steps.
2. Scope the "plan this year" output to the requested window (e.g. next 12
   months, next 6 months) rather than a fixed calendar-year assumption —
   honor whatever window the caller specifies.
3. Devices whose driving date falls outside the requested window still get
   evaluated for "replace now" (which is window-independent) but are
   excluded from the "plan this year" section if their driving date falls
   beyond it.

## Error Handling

### No RMM connector discovered

Say so explicitly: "No RMM connector is available through the gateway, so
there's no device inventory to build a refresh calendar from." Do not
fabricate device data.

### Warranty or EOL/EOS data unavailable for some/all devices

Proceed with whichever signals are available (e.g., age alone) and state
plainly which signals were missing and for how many devices — a
partially-informed tier is still useful as long as the gap is visible, not
hidden behind a confident-looking tier label.

### No org-documented refresh-cycle policy

Default to commonly-used industry assumptions (e.g., 4-5 years for
desktops/laptops) and state explicitly that this is a default assumption,
not the org's own policy — invite confirmation of the actual policy rather
than presenting the default as authoritative.

## Best Practices

- Always discover tools before calling them — never hardcode a vendor's
  tool name.
- Never assign a tier without a visible, specific rationale per device.
- Keep "insufficient data" as its own bucket — don't let missing data
  default a device into "monitor."
- Call out clustering explicitly; it's a planning signal, not just a
  formatting convenience.
- This skill plans; it doesn't quote or procure — hand tiered output to a
  quoting/sales workflow as a deliberate next step, not an automatic one.

## Related Skills

- [Warranty Tracking](../warranty-tracking/SKILL.md) — one of the three
  input signals this skill combines
- [EOL/EOS Flagging](../eol-eos-flagging/SKILL.md) — the second input
  signal, including criticality weighting that carries forward into tiering
