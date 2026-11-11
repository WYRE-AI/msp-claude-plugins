---
name: "Unitrends UniView Backup Health Triage"
description: >
  The cross-customer backup health sweep in Unitrends UniView: failed and warning
  backup jobs, failed replication, open BackupIQ alerts, offline appliances and
  low appliance storage, how to tell a one-off failure from a protection gap, and
  how to rank the findings into a technician work queue.
when_to_use: >-
  When a technician or NOC lead needs to know which customers' Unitrends backups
  failed or are at risk, typically as the morning backup check. Use when: failed
  backups, backup triage, morning backup check, uniview failures, replication
  failed, BackupIQ alerts, offline appliance, or appliance storage full.
---

# Unitrends UniView Backup Health Triage

## Overview

The morning backup check answers one question per customer: is every protected
system recoverable from last night? UniView sees every customer at once, so the
sweep is a handful of tenant-wide queries rather than a login per appliance.
All tools used here are plain reads in Conduit; none is admin-gated.

## Anti-triggers

- **"What does this customer protect at all?"** (missing assets, Endpoint
  Backup, SaaS coverage): use the `unitrends-uniview-protection-coverage` skill.
- **Microsoft 365 or Google Workspace backup failures**: Spanning user status
  lives in the `unitrends-uniview-spanning-saas-backup` skill.
- **Fixing a failure** (rerunning a job, freeing storage, dismissing an alert):
  the API is read-only. That work happens in UniView or on the appliance.

## Key Concepts

| Signal | Tool | Filter |
|--------|------|--------|
| Failed backup | `unitrends_uniview_backups_list` | `status: "Failed"` plus a `start_time_from` window |
| Backup with warnings | `unitrends_uniview_backups_list` | `status: "Warning"` |
| Failed replication (offsite copy) | `unitrends_uniview_backups_list` | `replication_status: "Failed"` |
| Unresolved backup issue | `unitrends_uniview_backupiq_alerts_list` | `type` is required: `alert`, `job`, `conditional` or `helix` |
| Appliance down | `unitrends_uniview_appliances_list` | `is_online: false` |
| Appliance storage low | `unitrends_uniview_appliances_list` | `total_mb_free_to: <MB>`, or sort by `total_mb_free` |

Customer IDs in every result are UUIDs. Resolve them to names once with
`unitrends_uniview_customers_list` and reuse the map.

## Common Workflows

### Morning sweep (last 24 hours)

1. `unitrends_uniview_customers_list` (page through it) to build the
   ID-to-name map.
2. `unitrends_uniview_appliances_list` with `is_online: false`. Do this
   **before** reading failures: an offline appliance stops reporting jobs, so
   its customers show no failures at all.
3. `unitrends_uniview_backups_list` with `status: "Failed"` and
   `start_time_from` set to 24 hours ago, `order_by: "start_time"`,
   `order_direction: "desc"`. Page through every page in `paging.total_pages`.
4. Repeat step 3 with `status: "Warning"`, then with
   `replication_status: "Failed"`.
5. `unitrends_uniview_backupiq_alerts_list` with `type: "alert"` and
   `is_dismissed: false`, then `type: "job"`. Add `severity: "critical"` or
   `"alarm"` to narrow when the queue is long.
6. `unitrends_uniview_appliances_list` sorted by `total_mb_free` ascending to
   find appliances close to full. Compare free space with the appliance's
   total size; a fixed MB threshold means different things on a 2 TB and a
   60 TB appliance.

### One-off failure or a real gap?

A single failed job that succeeded on its next run is noise. Repeated failures
are a protection gap. For each failed backup:

1. Take its `asset_key` and call `unitrends_uniview_backups_list` with that
   `asset_key`, `order_by: "start_time"`, `order_direction: "desc"`,
   `page_size: 10`.
2. If the most recent run is `Successful`, record it as self-healed.
3. If the last two or more runs failed, or there is no successful run in the
   last 48 hours, record it as a gap.

### Ranking the queue

| Priority | Finding |
|----------|---------|
| P1 | Appliance offline; asset with no successful backup in 48 hours; repeated failures on the same asset; critical BackupIQ alert |
| P2 | Single failure not yet retried; failed replication (the offsite copy is stale); appliance under ~10% free |
| P3 | Warnings; self-healed failures; appliance version drift |

Report per customer, P1 first. Include the appliance (`asset_tag`), asset,
last successful run time and the job type for each line, so the technician can
go straight to the job.

## Gotchas

- **Silence is not success.** An offline appliance or an asset removed from its
  schedule produces no failed jobs. Check appliances first, and use the
  `unitrends-uniview-protection-coverage` skill to catch assets with a stale last backup.
- **Read every page.** The server returns one page per call (default 50). A
  sweep that reads only page 1 under-reports.
- **Muted BackupIQ alerts are hidden by default.** Pass `is_muted: "all"` when
  auditing why an alert never reached the queue.
- **`InProgress` jobs** started in the window may still finish. Do not count
  them as failures.
- **Times are UTC ISO 8601.** Convert the customer's backup window to UTC before
  building `start_time_from`.
- **Rate limits are undocumented.** Prefer tenant-wide filtered calls over one
  call per customer. On a 429, wait the `Retry-After` value.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md): headers, paging, truncation, errors
- [protection-coverage](../protection-coverage/SKILL.md): stale and missing protection
