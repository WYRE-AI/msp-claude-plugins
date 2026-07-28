---
name: "Network Health Sweep"
description: >
  A normalized device and network health sweep across whatever
  network-monitoring tools (Auvik, Meraki, Domotz) are connected: each vendor
  family's data model and native status fields mapped into one
  Down/Degraded/Unknown/Healthy taxonomy, default interface error and
  utilization thresholds, topology-change detection, and why an offline
  Domotz collector renders its devices "unknown" rather than "down".
when_to_use: >-
  When running a portfolio-wide or single-client network health check across
  whatever network monitoring tools are connected. Use when: network health,
  network audit, device down, device offline, interface errors, interface
  utilization, topology change, network status review, is the network okay.
---

# Network Health Sweep

## Overview

"Is the network healthy" is a portfolio question, not a single-device question.
This skill runs a normalized health check across every connected
network-monitoring tool and rolls the result up into one ranked view — the same
sweep a senior network engineer would run by hand across each vendor's console,
made explicit, repeatable, and vendor-agnostic.

This is infrastructure-substrate health: is the network itself up, are
interfaces clean, has the topology changed unexpectedly. It is not ticket
triage (see `ops-pack`) and it is not application-layer reliability (see
`devops-pack`, if connected) — this skill only answers whether the wires,
switches, firewalls, and access points a client depends on are functioning.

## Discovering available tools first

Because this pack is cross-vendor, never assume which network-monitoring tool
is connected, or what its tools are literally named:

1. Call `conduit__search_tools` with a query like `"list devices"`,
   `"network health"`, or `"device status"` to discover which
   network-monitoring connector(s) are actually live for this org, and the
   exact tool names each exposes (they follow `<vendor-slug>__<tool_name>`,
   e.g. `auvik__devices_list`, `meraki__list_networks`,
   `domotz__list_agents`).
2. More than one network-monitoring tool can be connected at once (e.g. Auvik
   for one site, Meraki for another) — discovery may return multiple vendor
   families. Sweep all of them; do not stop at the first match.
3. Only after discovery, call the concrete tools that came back. Never
   speculatively call a tool name that discovery didn't return — an
   unrecognized tool call is a worse failure mode than reporting "no network
   monitoring connector found."

## Key Concepts

### Each vendor family's data model, and how they normalize

| Concern | Auvik | Meraki | Domotz |
|---|---|---|---|
| Unit of "connected" | Tenant → Network → Device → Interface | Organization → Network → Device | Agent (collector) → Network → Device |
| Device-down signal | Device status field (`online`/`offline`/`warning`) via `auvik__devices_list` / `auvik__devices_get_details` | Device status via Meraki's device/network status tools | Device status per agent, reported by the local Domotz collector |
| Interface/link health | Per-interface stats (errors, discards, utilization) via `auvik__interfaces_list` / `auvik__statistics_interface` | Per-port/uplink stats surfaced at the network/device level | Interface-level detail is thinner — Domotz is stronger on device reachability than deep interface counters |
| Topology-change detection | Auvik's core differentiator — topology/config diffs surfaced via configuration and audit history tools (`auvik__configurations_list`, `auvik__entities_list_audits`) | Not a first-class primitive — infer from device/network membership changes between sweeps | Agent-scoped network scans can surface new/missing devices between runs |
| Collection unit that can itself be "down" | N/A — cloud-polled via SNMP/API | N/A — cloud-managed dashboard | The agent itself — if the collector host is offline, every device behind it reads as unknown, not necessarily down. Always check agent status first. |

Normalize every vendor's native status into one shared health taxonomy before
combining results:

- **Down** — device confirmed offline/unreachable.
- **Degraded** — device online but showing interface errors, high utilization,
  or a warning-level status.
- **Unknown** — the collector/agent responsible for that device can't be
  confirmed healthy itself (this matters most for Domotz — an offline agent
  means "unknown," not "down," for everything behind it).
- **Healthy** — no findings.

### Interface errors and utilization thresholds

In the absence of a documented client-specific threshold, use these as
defaults and state clearly that they're defaults, not tuned policy:

- **Utilization** — sustained (not momentary) utilization above 80% on an
  uplink or trunk interface is a capacity/degradation flag; above 90% is
  urgent.
- **Errors/discards** — any non-zero, climbing error or discard counter on an
  interface across two consecutive sweeps is a degraded-link flag. A single
  static, non-climbing count is likely historical and lower priority.

### Topology-change detection

A topology change (new device joins, a device disappears, an uplink moves) is
not automatically bad — but it's a signal that deserves a callout, because
unplanned topology changes are how MSPs miss rogue devices or a client's
in-house change that wasn't communicated. Where the connected tool exposes
audit/config history (Auvik is strongest here), surface changes since the
last sweep rather than silently absorbing them into the current-state view.

## Common Workflows

### Portfolio-wide sweep

1. Discover connected network-monitoring tools via `conduit__search_tools`
   (see above).
2. For each connected vendor family, pull the device/network list and resolve
   status per the normalized taxonomy above.
3. For Domotz specifically, check agent/collector status first — an offline
   agent invalidates the "down" reading for everything behind it, so it
   should be reported as its own top-line finding, not buried under a wall of
   "unknown" devices.
4. Pull interface-level detail where the vendor exposes it (strongest on
   Auvik) and apply the utilization/error thresholds above.
5. Where available, pull topology/config-change history since the last sweep
   and surface it as its own section.
6. Roll up into one ranked list: Down first, then Degraded, then
   Unknown-due-to-collector-issue, then a topology-changes section, then a
   clean summary count of Healthy devices.

### Single-client or single-site check

Same steps, scoped to the client/site/network identified by the caller.
Resolve the client/network first (name lookup) before pulling device data —
don't assume a network ID.

## Error Handling

### No network-monitoring connector discovered

Say so explicitly: "No network-monitoring connector (Auvik, Meraki, or
Domotz) is available through the gateway, so there's no network health data
to report." Do not fabricate device status.

### One vendor connected, others aren't

Report on what's connected and state plainly which vendor families weren't
available — never silently narrow scope without saying so.

### Domotz agent itself is offline

Call this out as the top-line finding for that site, not a footnote — every
device behind an offline agent should read as "unknown, pending agent
recovery," not "healthy" (no news isn't good news when the collector can't
report) or "down" (unconfirmed).

### Vendor tool call fails mid-sweep

Report the partial results gathered so far, note which vendor/section failed
and why, and don't let one vendor's failure suppress the rest of the report.

## Best Practices

- Keep each vendor's native status visible alongside the normalized status in
  the output, so a technician can cross-check against the vendor's own
  console if needed.

## Related Skills

- [Cloud Capacity Planning](../cloud-capacity-planning/SKILL.md) — the cloud
  side of infrastructure health, for Azure/DigitalOcean resource
  right-sizing rather than network device/link health
- [Cloud Cost Management](../cloud-cost-management/SKILL.md) — spend
  anomalies and reclaimable cost, a different axis from health
