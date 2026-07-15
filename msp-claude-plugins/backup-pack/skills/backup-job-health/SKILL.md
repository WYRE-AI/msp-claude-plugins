---
name: "Backup Job Health"
when_to_use: >-
  When assessing whether backup jobs are actually running successfully across
  a portfolio, rather than checking one client's one appliance in isolation.
  Use when: backup health, backup job failures, missed backups, backup
  success rate, failed backup jobs, backup storage trending, is this client's
  backups running, backup audit, backup job status.
description: >
  Use this skill to assess portfolio-wide backup job health across whatever
  BCDR and SaaS-backup tools are connected: job success/failure rate, missed-
  backup detection, storage-consumption trending, and how to normalize very
  different vendor job models (image-based appliance backup vs. SaaS-data
  snapshot backup) into one comparable health view.
---

# Backup Job Health

## Overview

"Backups are running" is the single most-assumed, least-verified fact in an MSP's
environment. A backup job that failed silently three nights ago looks identical, from
a distance, to one that's been succeeding for months — nobody notices until a restore
is needed and there's nothing current to restore from. This skill is the recurring,
portfolio-wide sweep that catches that gap before it becomes an incident: job success/
failure rate, missed-backup detection, and storage-consumption trending, rolled into
one normalized view across every backup and BCDR tool an org has connected.

This skill is about whether backups are *happening*. It is deliberately narrower than
disaster-recovery readiness as a whole — it does not assess whether a backup, once
taken, is actually recoverable (see `restore-test-verification`), and it does not
assess whether the retention window or cadence in place actually satisfies a
contracted requirement (see `retention-rpo-compliance`). Treat this as the first,
most frequent layer of the DR assurance stack: if jobs aren't running, nothing
downstream matters yet.

## Key Concepts

### Two fundamentally different job models

Backup and BCDR vendors protect data in two structurally different ways, and treating
them as the same "job" concept produces misleading comparisons:

- **Image-based appliance backup** (e.g. Datto BCDR / SIRIS / Alto, Unitrends) —
  protects physical or virtual servers/workstations by taking periodic block-level
  or image-level snapshots to a local appliance, then syncing offsite/to the cloud.
  A "job" here is a scheduled backup of one protected agent/asset on one appliance.
  Health signals include: last successful local backup, last successful offsite
  sync, and (for Datto BCDR specifically) screenshot/boot verification status —
  see `restore-test-verification`.
- **SaaS-data snapshot backup** (e.g. Datto SaaS Protection, Spanning) — protects
  cloud application data (Microsoft 365 mailboxes/OneDrive/SharePoint/Teams, Google
  Workspace, Salesforce) by taking periodic API-level snapshots of tenant data. A
  "job" here is a scheduled backup pass across a set of protected seats/users for a
  tenant. There is no "appliance" and no local/offsite sync distinction — health
  signals are seat coverage (are all licensed users actually being backed up) and
  per-run success/failure across the tenant.

Normalize both into a single health record per protected unit (appliance-agent pair,
or tenant-seat set) with the same fields — last successful run, run status, and
failure streak — even though the underlying job mechanics differ. Don't force a
one-size-fits-all metric like "backup window duration" that only makes sense for one
model.

### Job success/failure rate

For each protected unit, compute the success rate over a rolling window (default:
last 30 days unless the org has a documented preference) and, more importantly, the
**current consecutive-failure streak**. A unit with a 96% success rate over 30 days
but a live 4-night failure streak right now is a more urgent problem than a unit with
90% success and no current streak — trailing averages hide exactly the thing that
matters most: is it broken *right now*.

### Missed-backup detection

A missed backup is distinct from a failed backup: a failed backup ran and errored; a
missed backup never ran at all (no job execution recorded for the expected window).
Both matter, but they point to different root causes — a failed job usually means an
in-scope problem (disk full, credential expired, source unreachable), while a missed
job often means a scheduling, licensing, or connectivity problem that's more
structural (the agent/connector isn't checking in at all). Report them as separate
categories rather than merging them into one "unhealthy" bucket, since the
remediation path differs.

### Storage-consumption trending

Track local and offsite/cloud storage consumption per appliance (or per SaaS tenant,
where the vendor exposes storage/quota data) over time. Flag two distinct risk
patterns:

- **Approaching capacity** — an appliance trending toward its local storage limit,
  which risks retention truncation (older recovery points get purged early to make
  room) even while nightly jobs continue to report success. This is a silent
  retention risk — see `retention-rpo-compliance` for how a storage-forced retention
  cut interacts with a contracted retention requirement.
- **Anomalous growth** — a sudden, unexplained jump in daily change-rate/storage
  consumption, which can indicate anything from a legitimate data-growth event to
  ransomware encryption activity happening on the protected source. Anomalous growth
  is worth flagging even when it isn't yet a capacity problem, because of what it
  might indicate about the protected system.

### If no backup/BCDR tool is connected

State plainly that job health cannot be assessed: "No backup or BCDR connector is
connected through the gateway, so there's no backup job data to audit." Do not
fabricate success rates, job counts, or storage figures.

## Common Workflows

### Full portfolio sweep

1. Discover connected backup/BCDR tools via `conduit__search_tools` — don't assume
   which of Datto BCDR, Datto SaaS Protection, Spanning, or Unitrends (or others) are
   live for this org.
2. For each connected tool, pull the protected-unit list (appliances/agents for
   image-based tools; tenants/seats for SaaS-snapshot tools) and each unit's recent
   job history.
3. Normalize into one health record per protected unit: last successful run, current
   run status, consecutive-failure streak, and (where available) storage/quota state.
4. Bucket into: actively failing (current failure streak), missed (no run recorded
   for expected window), storage-at-risk, and healthy.
5. Report worst-first: longest active failure streak, then missed backups, then
   storage risk.

### Targeted client check

1. Resolve the client to its protected units across whatever connected tool(s) cover
   them (a client may have both an on-prem appliance and a SaaS-backup tenant).
2. Pull and normalize job history for just that client's units.
3. Report success/failure rate, active streaks, and storage state for that client
   only.

## Error Handling

- **No backup/BCDR connector connected:** stop and say so; do not fabricate job
  status.
- **A connected tool doesn't expose storage/quota data:** report job success/failure
  normally and mark the storage-trending section "unable to verify — connector does
  not expose storage data" rather than omitting it silently.
- **A protected unit exists in inventory but has no job history at all:** treat this
  as a missed backup, not a gap in the report — a never-run job is exactly the kind
  of silent failure this skill exists to catch.

## Best Practices

- Always distinguish trailing success rate from current failure streak — lead with
  the streak, since it's the more actionable signal.
- Always separate "missed" from "failed" — they have different root causes and
  different remediation owners.
- State the rolling window used (default 30 days) explicitly in every report.
- Never let a healthy trailing average suppress a live failure streak in the report
  ordering — worst-current-state leads, not best-historical-average.

## Related Skills

- [Restore-Test Verification](../restore-test-verification/SKILL.md) — whether a
  successfully-run backup is actually recoverable; this skill only confirms the job
  ran, not that its output is usable.
- [Retention/RPO Compliance](../retention-rpo-compliance/SKILL.md) — whether the
  retention window and backup cadence in place satisfy a contracted requirement;
  relevant when storage-forced retention truncation is detected here.
