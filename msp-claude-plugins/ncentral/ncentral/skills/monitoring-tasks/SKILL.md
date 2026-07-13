---
name: "N-central Monitoring & Tasks"
when_to_use: >-
  When triaging N-central active issues, checking job statuses, drilling into scheduled-task
  results, or executing a direct support task on a device. Use when: ncentral active issues,
  ncentral alerts, ncentral job status, ncentral scheduled task, ncentral task status, ncentral
  direct task, ncentral run script, or ncentral automation.
description: >
  Use this skill when working with N-central monitoring and automation —
  active-issue triage per customer or site, job statuses, the scheduled
  task → status → per-device details drill-down, and the safety rules for
  direct-support task execution.
---

# N-central Monitoring & Tasks

Two related surfaces: **monitoring** (what N-central currently thinks is
wrong — active issues and job statuses) and **tasks** (automation that has
run or will run — scheduled tasks and direct support tasks). Triage flows
from the first into the second.

## Active Issues

| Tool | Use For |
|------|---------|
| `ncentral_list_active_issues` | Current issues for one customer or site |
| `ncentral_list_job_statuses` | Backup/AV/patch job outcomes for an org unit |

The critical constraint: **active issues are listed per customer or site
org unit only** — there is no SO-level firehose. A cross-client sweep is a
loop:

1. `ncentral_list_customers` — enumerate clients.
2. `ncentral_list_active_issues` per customer `orgUnitId`.
3. Aggregate, then group by severity and by what actually broke
   (notification trigger / service), not just by device.

Issue records carry the device, the service/monitor that tripped, severity,
and how long it has been active. Long-standing issues (days old) are
usually known noise or accepted risk; a burst of fresh issues across one
customer usually shares one root cause (site down, DNS, a bad patch).
Group before you rank.

`ncentral_list_job_statuses` covers job-shaped work (backups, AV scans,
patch runs) with per-job outcomes — the place to answer "did last night's
backups run?" per customer.

## Scheduled Tasks: The Drill-Down

Task inspection is a three-level descent:

```
ncentral_list_device_tasks / ncentral_get_task     — what tasks exist / one task's definition
        └── ncentral_get_task_status               — aggregate outcome (completed / failed counts)
                └── ncentral_get_task_status_details — per-device results, output, return codes
```

Start at the top. `ncentral_get_task_status` tells you *whether* something
failed; `ncentral_get_task_status_details` tells you *where and why* —
per-target status and captured output. Only pull details when the
aggregate shows failures or the user asks for output; details payloads are
large on wide-target tasks.

## Direct Support Tasks — HIGH IMPACT

`ncentral_create_direct_task` executes a task (script, command, quick fix)
**immediately on a live device**. It is the one tool in this plugin that
changes machine state. Non-negotiable rules:

1. **Always confirm first.** State the device (name + ID), the customer,
   the task/script, and any parameters — and get an explicit yes before
   the call. Never chain it silently at the end of a triage.
2. **One device per task.** Target a single device. For fleet-wide
   remediation, propose a scheduled task through the UI instead of looping
   direct tasks.
3. **It runs immediately.** There is no scheduling, no dry run, and no
   cancel once dispatched. Whatever the script does, it does now, as
   SYSTEM/root on a production endpoint.
4. **Follow up.** After dispatch, poll `ncentral_get_task_status` (and
   details on failure) and report the actual outcome — "task created" is
   not "task succeeded".

## Best Practices

- Sweep active issues before touching tasks — the issue list tells you
  whether automation is the right response at all.
- Correlate issues with maintenance windows
  (`ncentral_list_maintenance_windows`) before escalating: a "down" server
  inside its patch window is expected.
- Note that active issues and scheduled tasks sit on preview-stage
  endpoints in some N-central releases — if a tool 404s, check
  `https://<server>/api-explorer` (see api-patterns).
- Report counts with their scope: "14 active issues (ACME, orgUnitId 123)"
  so results are reproducible.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - preview endpoints, pagination, rate limits
- [devices](../devices/SKILL.md) - per-device service status drill-down
- [organizations](../organizations/SKILL.md) - resolving customer/site org units for sweeps
