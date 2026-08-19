---
name: "Axcient Jobs"
description: >
  Axcient x360Recover backup jobs: the BRC vs Replibit job-type split,
  per-job protection thresholds, and job run history with its
  starttime_begin pagination floor.
when_to_use: >-
  When looking up backup job status or run history for an Axcient-protected
  device. Use when: axcient job, backup job, job history, job status, job
  thresholds, or x360recover job.
---

# Axcient Jobs

## Overview

A job is one configured backup task running against a device — the thing
that actually produces recovery points. Jobs always nest under a specific
`client_id` and `device_id`; there is no organization-wide job list. Get a
device's job IDs from `axcient_devices_get` (the `jobs` array) or
`axcient_devices_list_by_client` first.

## Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `axcient_jobs_list_by_device` | All jobs for a device | `client_id`, `device_id` |
| `axcient_jobs_get` | One job's detail | `client_id`, `device_id`, `job_id` |
| `axcient_jobs_get_history` | Run history for a job | `client_id`, `device_id`, `job_id`, `limit?`, `offset?`, `starttime_begin?` |

There is no job-level list at the organization or client level — jobs are
always reached through a specific device.

### Job Types: BRC vs Replibit

The job schema is a tagged union — `org_level_jobs_response` is one of
`org_level_brc_job` or `org_level_replibit_job`, mirroring the device-level
`product` split (`BRC` vs `X360RECOVER`). Handle both shapes: a legacy
appliance's jobs return the BRC shape, current-generation appliances and
D2C devices return the Replibit shape. Don't assume one field set applies
to every job in a fleet with mixed appliance generations.

### Job Thresholds

Jobs carry the same threshold structure as devices —
`vault_rp_threshold`, `cloud_rp_threshold`, `local_rp_threshold`,
`protection_threshold` — each an object with `value`, `enabled`, and
`overridden`. `overridden: true` means this job's threshold deviates from
the client- or organization-level default; check it before assuming a
device-level threshold applies uniformly across all its jobs.

### Job History

```
axcient_jobs_get_history
```

Parameters:
- `client_id`, `device_id`, `job_id` -- required
- `limit`, `offset` -- pagination (groups of up to 1500)
- `starttime_begin` -- unix timestamp floor; only returns runs starting at
  or after this time

**Known upstream caveat:** community testing against Axcient's API found
this endpoint unreliable in some environments — treat an empty or
unexpected result here as worth double-checking against
`axcient_devices_get_restore_points` (which reflects what actually landed,
regardless of what the history endpoint reports) before concluding a job
has never run.

## Common Workflows

### Diagnosing a Stale Recovery Point

1. From `axcient_devices_get`, note which `latest_*_rp` timestamp is stale
   and pull the relevant job ID from the device's `jobs` array
2. `axcient_jobs_get` for the job's current configuration and thresholds
3. `axcient_jobs_get_history` with a `starttime_begin` a few days back to
   see whether the job has been running and failing, or not running at all
4. A job that's running but failing points at a data/connectivity problem
   on the source system; a job that isn't running at all points at
   scheduling or agent-health on the appliance/agent side

### Auditing Threshold Overrides

1. `axcient_jobs_list_by_device` for the device in question
2. For each job, check `thresholds.*.overridden` — flag any job whose
   effective SLA differs from what the client or org default implies
3. Cross-reference with `axcient_vaults_get_threshold` (see the `vaults`
   skill) for the vault-side connectivity threshold, which is separate
   from a job's own `vault_rp_threshold`

## Error Handling

### Job Not Found

**Cause:** Invalid `job_id`, or a `job_id` that belongs to a different
`client_id`/`device_id` pair than supplied
**Solution:** Re-derive the job ID from `axcient_jobs_list_by_device`
rather than guessing — job IDs are not guaranteed unique outside their
parent device.

### Job History Returns Empty Unexpectedly

**Cause:** Either the job genuinely hasn't run in the queried window, or
the known history-endpoint unreliability noted above
**Solution:** Widen or drop `starttime_begin`; corroborate with
`axcient_devices_get_restore_points` before reporting "never ran."

## Best Practices

- Always resolve `client_id`/`device_id` from a device call first — do not
  construct job lookups from IDs seen in other contexts.
- Treat `overridden: true` thresholds as intentional exceptions worth
  surfacing explicitly, not noise to filter out.
- Prefer restore points over job history when the question is "is there a
  usable recovery point," given the history endpoint's known flakiness.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, tool catalog, error codes
- [devices](../devices/SKILL.md) - Device-level recovery-point timestamps and job list
- [vaults](../vaults/SKILL.md) - Vault-side connectivity thresholds
