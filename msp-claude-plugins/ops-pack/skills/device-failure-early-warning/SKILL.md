---
name: "Device Failure Early Warning"
description: >
  Predictive device-failure detection from 30-90 days of RMM telemetry across
  every client: which signals actually predict failure (disk wear and
  reallocated sectors, sustained memory pressure, repeatedly crashing
  services, rising event-log error rates, battery wear), how to score them
  into a failure-risk tier for the next 2-4 weeks, what to do when an RMM
  exposes only a point-in-time reading instead of history, and how to turn
  the result into one draft proactive ticket per client.
when_to_use: >-
  When looking for devices likely to fail before they do, across a portfolio
  rather than one machine. Use when: predictive maintenance, failing disk,
  about to fail, proactive tickets, early warning, disk health, SMART,
  memory leak, crashing service, battery health, which devices will die
  soon, weekly device risk digest.
---

# Device Failure Early Warning

## Overview

Most hardware failures announce themselves weeks ahead in telemetry the RMM is
already collecting, but nobody reads a trend across thousands of devices.
This skill reads that trend. It is read-only against client systems and meant
to run on a schedule (weekly). Its only outputs are a ranked risk list and
draft tickets for a technician to approve; it never runs scripts, restarts
services or changes a device.

## Anti-triggers

- **Warranty, age or end-of-life questions**, device age is not telemetry;
  use `assets-pack-warranty-tracking`, `assets-pack-eol-eos-flagging` or
  `assets-pack-refresh-cycle-planning`.
- **A device that is already down or alerting**, that is an incident; use
  `shared-skills-incident-correlation`.
- **Network gear and cloud resources**, use `cloudops-pack-network-health-sweep`
  or `cloudops-pack-cloud-capacity-planning`.
- **Per-client roll-up across all risk areas**, use `ops-pack-client-health-score`,
  which calls this skill for its device-risk input.

## Key Concepts

### Signals, and how much each one counts

A single bad reading is noise; a worsening trend is a prediction. Require the
condition to hold in at least 3 readings across at least 7 days before it scores.

| Signal | Raw evidence | Weight | Why |
|---|---|---|---|
| Disk wear / SMART | Reallocated or pending sectors rising, SSD wear-level or remaining life under 20%, SMART status "predictive failure", rising read/write latency | High | The strongest and most direct predictor of data-loss failure |
| Memory pressure | Sustained use over 90% with paging, or steady growth in a process's memory over days (leak), plus repeated memory-related crashes | Medium | Usually a software fault, so the fix is a restart or patch, not a replacement. Say which |
| Crashing services | Same service stopping or restarting 3 or more times in 7 days; recurring blue-screen or kernel-power events | Medium to High | Repeated unexpected shutdowns often sit in front of a disk, memory or power fault |
| Event-log errors | Disk, NTFS, storage-controller, or hardware (WHEA) errors per week trending up | High for disk/hardware sources, low for everything else | Filter by source; raw error counts are mostly noise |
| Battery | Design-capacity health under 60% on laptops, or UPS reporting replace-battery | Low to Medium | Failure is predictable but low-impact; batch it with the next visit |

Combine into three tiers: **likely within 2-4 weeks** (any High signal confirmed,
or two Medium signals together), **watch** (one Medium signal, or a High signal
seen only once), and **healthy**. Report the evidence behind every device in
the first tier; a risk with no evidence is a guess.

### Data availability varies by RMM

RMMs differ a lot in what history they keep. Discover what the connected tools
return rather than assuming; do not invent a trend from one reading.

| What the RMM returns | What to do |
|---|---|
| Time-series history for the metric | Score the trend directly |
| Only the current value, but the skill has run before | Compare with the saved prior run (see Run-over-run) and say the trend is built from your own snapshots |
| Only the current value, first run | Score only threshold breaches (SMART predictive-failure flag, battery health) and label everything else "no history yet" |
| Metric not exposed at all | List it under "not assessed" for that client. Never report the device as healthy because the data is missing |

### Run-over-run snapshots

For RMMs without history, write a compact snapshot (device id, metric, value,
date) after each run to wherever the org keeps skill notes, or ask the user to
store the output. The second weekly run then has a baseline; by the fourth it
has a usable trend.

## Common Workflows

### Weekly portfolio sweep

1. Call `conduit__search_tools` with `"list devices"`, `"disk health"`,
   `"device alerts"` and `"event log"` to find every connected RMM and what
   telemetry it exposes. Several RMMs can be connected at once; cover all.
2. For each RMM, list clients (sites/organizations) and devices. Servers and
   anything flagged business-critical in the RMM or documentation get scored
   first; workstations after.
3. Pull the telemetry above for a 30-90 day window. Prefer 90 days where the
   RMM keeps it.
4. Score each device by the tiers above. Drop "healthy" devices from the output.
5. Group by client. For every client with at least one "likely" device, draft one
   proactive ticket (below). "Watch" devices go in the digest only.
6. Present the digest and the drafts. Stop there; creating the tickets is a
   separate step that needs the technician's approval.

### Draft ticket format

One draft ticket per client, never one per device:

```
Title: Proactive: 3 devices showing early failure signs (Acme Co)
Priority: Normal (High only if a server or the only copy of data is involved)
Body:
- SRV-FS01: SSD at 12% life remaining, 41 reallocated sectors (was 9 thirty days ago). Suggest: replace the drive, confirm last good backup first.
- LT-0417: disk and NTFS errors up from 2 to 31 per week. Suggest: schedule a drive check and a backup.
- LT-0233: memory use steady above 92%, one process growing about 80 MB/day. Suggest: restart and patch; replace only if it recurs.
Data not assessed: battery health (not exposed by this RMM).
Evidence window: 2026-08-21 to 2026-11-19.
```

Use the connected PSA's ticket-create tool only when the user approves; otherwise
return the text for them to paste.

## Error Handling

- **No RMM connected:** stop and say "No RMM is connected through the gateway, so
  there is no device telemetry to assess." Do not fall back to warranty age.
- **A client's RMM returns an error or partial data:** report that client as
  "not assessed" with the reason; keep going on the rest.
- **Very large fleets:** page through devices and score as you go; report counts
  assessed versus total so a truncated run is visible.

## Best Practices

- A short list with evidence beats a long list. If more than about 10% of a
  client's devices land in the top tier, check for a shared cause (a bad
  firmware, a failed patch, an alert-threshold change) before drafting 40 replacements.
- Say what the fix is for software-shaped signals; do not suggest hardware
  replacement for a memory leak.

## Related Skills

- [Client Health Score](../client-health-score/SKILL.md), uses this skill's output as its device-risk input
- [Board Hygiene](../board-hygiene/SKILL.md), keeps the proactive tickets from rotting once created
