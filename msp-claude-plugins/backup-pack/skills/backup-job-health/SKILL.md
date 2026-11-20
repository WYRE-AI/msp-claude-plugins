---
name: "Backup Job Health"
description: >
  Portfolio-wide backup job health across whatever BCDR and SaaS-backup tools
  are connected: the two structurally different job models (image-based
  appliance backup vs. SaaS-data snapshot backup) and how to normalize them
  into one health record per protected unit, why a live consecutive-failure
  streak matters more than a trailing success rate, the missed-versus-failed
  distinction and its different root causes, and the two storage-trending
  risk patterns (approaching capacity, anomalous growth). Also scores
  week-over-week trend per protected unit (success rate, cadence slip,
  duration drift, silent skips, verification and offsite lag) so jobs that
  are degrading are caught before they fail, and drafts tickets for them.
when_to_use: >-
  When assessing whether backup jobs are actually running successfully across
  a portfolio, rather than checking one client's one appliance in isolation.
  Use when: backup health, backup job failures, missed backups, backup
  success rate, failed backup jobs, backup storage trending, is this client's
  backups running, backup audit, backup job status, backup trend, backups
  getting slower, backups running late, machine silently skipped, week over
  week backup health.
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

## Anti-triggers

- **Backup Radar's own health records** — ScalePad already aggregates and
  scores backup results across vendors; use `scalepad-backup-radar` when the
  question is what that API returns. This skill normalizes across every
  connected backup tool, including orgs that have no Backup Radar at all.
- **One platform's job, alert, or storage data** — use
  `datto-bcdr-api-patterns`, `datto-saas-protection-api-patterns`,
  `spanning-api-patterns`, or `unitrends-api-patterns` for a single vendor's
  request shapes and field names.

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

### Week-over-week trend scoring

A snapshot says what is broken today. A trend says what is *about to* break:
a nightly job that crept from 40 minutes to 3 hours, a machine that quietly
dropped out of the schedule, a run that now lands at 09:00 instead of 02:00.
Score every protected unit by comparing the last 7 days against the 7 days
before them, which needs at least 14 days of job history. Where a connector
returns less, say the window you could actually cover and score only what it
supports.

| Signal | Compare (this week vs prior week) | Drifting (1 pt) | Degrading (2 pts) |
|---|---|---|---|
| Success rate | Successful runs / expected runs | Down 5-15 points | Down more than 15 points, or any live failure streak |
| Running late | Age of the newest successful run against the expected interval (24h for a nightly job) | Newest success older than 1.5 intervals | Older than 2.5 intervals |
| Duration drift | Median run duration, only where runs carry start and end times | Up 25% or more | Up 100% or more, for 3 or more consecutive runs |
| Silent skip | Assets or seats in the unit's inventory with no run recorded in the last 7 days but with runs in the prior 7 | One asset | Two or more, or any Tier 1 asset |
| Verification slip (image-based only) | Screenshot verification failure share | Any new failure | Failure on 2 or more consecutive screenshots |
| Offsite lag (Datto BCDR) | Gap between newest local recovery point and newest offsite point | Gap grew week over week | Gap over 48 hours |
| Storage growth | Daily growth rate, as in Storage-consumption trending above | Rate doubled | Projected full inside 30 days |

Sum the points per unit. 0 is Stable, 1-2 is Drifting, 3 or more is Degrading.
A unit that is Stable this week but Degrading last week is Improving; say so,
because it tells the reader a fix worked. Never average away a live failure
streak: any unit with a current streak is Degrading regardless of its points.

Duration drift and offsite lag are only as good as the fields the connector
returns. If a run record carries no start and end time, mark duration "unable
to verify" for that unit instead of inferring it from recovery-point spacing.

**Silent skips** are the signal a success rate cannot show: the job succeeds
for the 14 machines it still sees while the 15th stopped being backed up. A
unit's success rate stays at 100%, so compare the asset or seat *inventory*
against the assets or seats that actually appear in job history.

**Draft tickets, never created tickets.** For every Degrading unit, and every
Drifting unit that is also Tier 1, draft one ticket per client (not per unit)
as text for a technician to review: client, the units and signals involved with
the numbers behind them, last good run, and a suggested first check chosen to
match the signal (credentials and agent check-in for silent skips, disk and
network throughput for duration drift, appliance storage headroom for storage
growth). Check the PSA for an open ticket on the same unit first and reference
it instead of drafting a duplicate. This skill is read-only: do not call a PSA
create tool, and never call a restore or seat-change tool.

### If no backup/BCDR tool is connected

State plainly that job health cannot be assessed: "No backup or BCDR connector is
connected through the gateway, so there's no backup job data to audit." Do not
fabricate success rates, job counts, or storage figures.

## Tools

Names below are the connected servers' own tools; confirm with
`conduit__search_tools` which are live before calling any of them.

| Need | Datto BCDR | Unitrends | Datto SaaS Protection | Spanning |
|---|---|---|---|---|
| Inventory of protected units | `datto_bcdr_list_devices`, `datto_bcdr_list_assets` | `unitrends_list_appliances`, `unitrends_list_assets` | `datto_saas_list_domains`, `datto_saas_list_seats` | `spanning_list_services`, `spanning_list_users` |
| Run history | `datto_bcdr_list_backups` (recovery points per asset) | `unitrends_list_job_history`, `unitrends_list_recovery_points` | `datto_saas_list_applications` (`daysUntil: 14` to cover two weeks), `datto_saas_get_backup_stats` (last-7-day status per service) | `spanning_list_backups` |
| Verification and offsite | `datto_bcdr_list_screenshots`, `datto_bcdr_get_offsite_status` | n/a | n/a | n/a |
| Alerts | `datto_bcdr_list_alerts` | `unitrends_list_alerts` | n/a | n/a |
| Pre-computed rate | n/a | `unitrends_get_success_rate` (pair with job history; a wide window hides recency) | n/a | n/a |

ScalePad Backup Radar (`scalepad_br_backups_list_health`) can supply a
cross-vendor health record per device when it is connected; it is a convenient
cross-check, not a substitute for per-vendor run history.

Two scope traps change a trend. Spanning connections are bound to one platform
(M365, Google Workspace or Salesforce), and Spanning and Datto SaaS Protection
often protect the same mailboxes, so a "dropped" seat may simply live under the
other product. Unitrends answers per appliance: a clean result from one box says
nothing about the other nineteen.

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

### Weekly trend run

1. Discover connected backup/BCDR tools via `conduit__search_tools`.
2. Pull 14 days of run history, inventory and (for image-based tools) screenshot
   and offsite status per protected unit, per the Tools table.
3. Score each unit against the trend table and label it Stable, Drifting,
   Degrading or Improving.
4. Roll up per client: worst unit label, count of units in each label, and the
   single most important reason in one sentence. This one-line client roll-up is
   what a client health score consumes as its backup-trend input.
5. Report Degrading clients first, then Drifting; list Stable and Improving as
   counts. Draft the per-client tickets described above, for review only.

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
- **Fewer than 14 days of history returned:** report the covered window, score
  only the signals it supports, and label the unit "trend unavailable" rather
  than comparing a full week to a partial one.
- **No prior-week record to compare and the connector keeps no history:** say so.
  Do not reconstruct last week from memory or estimate it; suggest saving this
  run's report so the next weekly run has a baseline.

## Best Practices

- State the rolling window used (default 30 days) explicitly in every report, and
  the 7-versus-7 day windows for any trend result.

## Related Skills

- [Restore-Test Verification](../restore-test-verification/SKILL.md) — whether a
  successfully-run backup is actually recoverable; this skill only confirms the job
  ran, not that its output is usable.
- [Retention/RPO Compliance](../retention-rpo-compliance/SKILL.md) — whether the
  retention window and backup cadence in place satisfy a contracted requirement;
  relevant when storage-forced retention truncation is detected here.
