---
name: "EOL/EOS Flagging"
description: >
  End-of-life versus end-of-support risk for devices, OS versions, and firmware:
  combining RMM inventory (make, model, OS version, firmware) with general
  lifecycle knowledge, the mandatory verify-against-vendor-lifecycle caveat, what
  qualifies as a finding versus merely "old", and criticality-first
  prioritization of the resulting risk list.
when_to_use: >-
  When identifying devices, OS versions, or firmware approaching or past
  end-of-life or end-of-support, or prioritizing that risk by device
  criticality. Use when: EOL risk, end of life devices, unsupported
  hardware, EOS flagging, is this OS still supported, end of support,
  unsupported OS, legacy hardware risk.
---

# EOL/EOS Flagging

## Overview

End-of-life and end-of-support are two related but distinct events.
End-of-life (EOL) generally means the vendor has stopped selling or
actively developing the product. End-of-support (EOS) — sometimes called
end-of-extended-support — means the vendor stops shipping security patches.
EOS is the harder deadline operationally: a device past EOS is accumulating
unpatched vulnerabilities with no fix coming, regardless of whether it
still "works." This skill flags both, keeps them distinct in the output,
and prioritizes the resulting list by how much it actually matters if a
given device is left running past its date.

This needs two ingredients: **device inventory data** (make, model, OS
version, firmware version — pulled live from whatever RMM is connected) and
**EOL/EOS knowledge** (which dates apply to which OS/hardware — general
knowledge, not something the RMM exposes). The two must be combined
explicitly, and the knowledge half must always carry a verification caveat,
because vendor lifecycle dates do change (extended support gets purchased,
timelines shift) and this skill's knowledge has a cutoff.

This is distinct from `warranty-tracking`: a device can be fully in
warranty and past OS end-of-support (an aging laptop still under a 5-year
warranty but running an OS version no longer patched), or out of warranty
and still fully supported (an older desktop on a current, supported OS with
no active vendor patching risk). Both signals feed `refresh-cycle-planning`,
but they are not the same finding and should not be conflated in a report.

## Discovering available tools first

Never assume which RMM is connected:

1. Call `conduit__search_tools` with a query like `"list devices"`,
   `"device details"`, or `"OS version"` to discover which RMM
   connector(s) are live and their real tool names (e.g.
   `datto-rmm__datto_list_devices`, `ninjaone__list_devices`,
   `ncentral__ncentral_list_devices`, `atera__search_agents`).
2. Pull make/model, OS name and version, and firmware version where exposed
   — the fields vary by RMM, so check what a given platform's device-detail
   tool actually returns before assuming a field exists.
3. Cover all connected RMMs if more than one is present.
4. Only call concrete tools that discovery actually returned.

## Key Concepts

### General EOL/EOS knowledge — with a verification caveat

This skill can reason about EOL/EOS timing for widely-deployed operating
systems and hardware families using general knowledge (e.g., major desktop
and server OS release/support lifecycles, common consumer/business OS
version end-of-support windows, well-known network hardware firmware
support windows). Use that knowledge to flag likely-EOL/EOS devices found
in inventory.

**Always attach an explicit caveat to any EOL/EOS date cited from general
knowledge**: state that the date should be verified against the vendor's
current lifecycle page before it's used to justify a purchase or a hard
deadline in front of a client, because:

- Vendors extend, shorten, or restructure support timelines.
- Paid extended-support programs can push a real deadline later than the
  "standard" EOS date.
- This skill's knowledge has a training cutoff and will not reflect
  lifecycle policy changes announced after that point.

Never present an EOL/EOS date with false precision or as independently
verified fact — frame it as "generally documented as EOL/EOS around
[date/quarter] — confirm against the vendor's current lifecycle page before
treating this as final."

### What counts as an EOL/EOS finding

Flag a device when any of the following is true, and say which applies:

1. **OS past end-of-support** — the installed OS version no longer receives
   security patches from the vendor.
2. **OS approaching end-of-support** — within a lookahead window (default 6
   months if not specified) of its end-of-support date.
3. **Hardware/firmware past or approaching EOL** — the device model itself,
   or its firmware, is past or nearing the vendor's stated end-of-life,
   independent of what OS it's running (relevant for network appliances,
   older server hardware).

Don't flag a device solely because it's "old" — flag it because a specific,
named EOL/EOS date applies or is approaching. Vague "this looks legacy"
judgments are not findings; a named date and source (general knowledge,
caveated) is.

### Prioritizing EOL risk by criticality

Not every EOL/EOS finding carries the same urgency. Combine the EOL/EOS
signal with device role/criticality before ranking:

| Criticality | Examples | Why it matters more/less |
|---|---|---|
| High | Domain controllers, servers running production line-of-business apps, network appliances (firewalls, core switches), anything internet-facing | A patch gap here is a direct breach/outage risk with broad blast radius |
| Medium | Shared workstations, general-purpose servers with limited exposure | Real risk, narrower blast radius |
| Low | Spare/loaner desktops, rarely-used devices, kiosk-style single-purpose endpoints | Same EOL/EOS fact, much smaller practical exposure — still worth tracking, not worth panicking over |

Resolve criticality from whatever signal is available: device role/tags in
the RMM (server vs. workstation), naming convention, or, where connected, a
documentation platform's asset classification. If no criticality signal is
available for a device, say so explicitly and default to treating it as
unclassified rather than guessing — do not silently assume "low" to shrink
the report.

A server past EOS ranks above a spare desktop past EOS even if the desktop
crossed its date first — recency of crossing the date is a secondary sort
key, criticality is primary.

## Common Workflows

### Portfolio-wide EOL/EOS sweep

1. Discover connected RMM(s) via `conduit__search_tools`.
2. Pull device inventory: make, model, OS version, firmware version where
   exposed.
3. Apply general EOL/EOS knowledge (caveated) to classify each device:
   OS past EOS / OS approaching EOS / hardware past-or-approaching EOL /
   no known EOL/EOS risk / insufficient version data to assess.
4. Resolve criticality per device from available RMM/documentation signals.
5. Rank output: high-criticality + past-EOS first, then high-criticality
   approaching-EOS, then medium, then low, with the "insufficient data"
   bucket surfaced separately rather than dropped.

### Single-client EOL/EOS check

1. Discover tools and scope to the requested client/org unit/site.
2. Run the same classify-and-rank steps, scoped to that client.

## Error Handling

### No RMM connector discovered

Say so explicitly: "No RMM connector is available through the gateway, so
there's no device/OS inventory to assess for EOL/EOS risk." Do not
fabricate device data.

### OS/firmware version not exposed by the connected RMM

Report the device with "insufficient version data to assess EOL/EOS risk"
rather than guessing a version from the device model alone.

### Uncertain or disputed EOL/EOS date

If general knowledge is ambiguous about a specific date (e.g., a
less-common OS build or a hardware model with a non-standard support
timeline), say so plainly and recommend direct verification against the
vendor's lifecycle page rather than presenting a guessed date as fact.

## Related Skills

- [Warranty Tracking](../warranty-tracking/SKILL.md) — physical hardware
  coverage status, a distinct signal from OS/firmware support status
- [Refresh Cycle Planning](../refresh-cycle-planning/SKILL.md) — combines
  this skill's EOL/EOS timing with warranty expiration and device age into
  a forward-looking refresh calendar
