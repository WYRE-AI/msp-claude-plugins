---
name: "ImmyBot Maintenance Sessions"
description: >
  ImmyBot maintenance sessions — the reconciliation engine that brings endpoints
  into their desired state: the session tool surface, start parameters (computer
  vs tenant scope, type, priority, reboot flag), pause/resume/cancel semantics,
  polling to a terminal state, failure investigation, and reboot-spanning and
  queued-vs-running edge cases.
when_to_use: >-
  When starting, monitoring, pausing, resuming, or cancelling ImmyBot maintenance sessions, or
  investigating session logs and results to diagnose a failed reconciliation. Use when: immybot
  maintenance session, immybot reconcile, immybot session logs, immybot session status, immybot
  run maintenance, cancel maintenance immybot, or immybot session failed.
---

# ImmyBot Maintenance Sessions

A maintenance session is the unit of work that reconciles an
endpoint (or a whole tenant) against its desired state — installing,
updating, or removing software and running remediation. Starting a
session is **destructive**: it can install software and reboot
machines.

## Anti-triggers

- **An N-central maintenance window** — a *window* is a scheduled alert
  suppression period that executes nothing; an ImmyBot *session* is an
  execution run that installs software and reboots machines. For
  windows use `ncentral-monitoring-tasks`. SuperOps script schedules
  (`superops-runbooks`) are likewise a calendar, not a session.
- **What should be installed** — the desired state a session reconciles
  is configured in `immybot-software-deployment`.
- **Running one script now** — a session reconciles everything in scope;
  for a single script use `immybot-script-execution`.

## API Tools

| Tool | Purpose |
|------|---------|
| `immybot_maintenance_sessions_list` | Recent sessions with computer/tenant/status/type/date filters |
| `immybot_maintenance_sessions_get` | Snapshot of one session by ID |
| `immybot_maintenance_sessions_active` | All currently running sessions |
| `immybot_maintenance_sessions_start` | Start a session (DESTRUCTIVE) |
| `immybot_maintenance_sessions_pause` | Pause a running session |
| `immybot_maintenance_sessions_resume` | Resume a paused session |
| `immybot_maintenance_sessions_cancel` | Cancel a queued/running session (DESTRUCTIVE) |
| `immybot_maintenance_sessions_logs` | Log stream for a session |
| `immybot_maintenance_sessions_results` | Final results / per-task outcomes |

## Starting a Session

`immybot_maintenance_sessions_start` targets either a single
computer ID **or** a tenant ID (all computers in that tenant). It
takes a session type, priority, a `reboot` flag (allow reboot if
required), and a description / reason.

This operation is destructive — obtain human approval, name the
scope explicitly, and decide deliberately whether reboots are
permitted before starting.

## Monitoring a Running Session

1. `immybot_maintenance_sessions_get` — poll for status.
2. `immybot_maintenance_sessions_logs` — tail progress detail.
3. Stop polling once the session reaches a terminal state
   (completed / failed / cancelled).

Use `immybot_maintenance_sessions_active` to see everything running
across the fleet at once.

## Controlling a Session

- **Pause** — `immybot_maintenance_sessions_pause` halts a running
  session (e.g. user reports the machine is busy). Supply a reason.
- **Resume** — `immybot_maintenance_sessions_resume` continues a
  paused session.
- **Cancel** — `immybot_maintenance_sessions_cancel` stops a queued
  or running session. Destructive: an in-progress install may be
  left half-applied. Supply a cancellation reason.

## Investigating a Failed Session

1. `immybot_maintenance_sessions_list` filtered by computer/tenant
   and `status = failed` to locate the session.
2. `immybot_maintenance_sessions_results` for which tasks failed.
3. `immybot_maintenance_sessions_logs` for the failing log lines.
4. Cross-reference the underlying tasks via the tasks tools
   (`immybot_tasks_for_computer`, `immybot_tasks_failed`).
5. Re-run a targeted session once the root cause is fixed.

## Edge Cases

- **Reboot-spanning sessions** — when `reboot` is allowed and an
  install requires it, the session continues after the reboot;
  expect a longer wall-clock duration.
- **Tenant-scoped sessions** — touch every computer in the tenant.
  Confirm the blast radius before starting.
- **Queued vs running** — a session may sit queued behind others;
  `immybot_maintenance_sessions_get` distinguishes the states.

## Best Practices

- Pilot with a single-computer session before a tenant-wide one.
- Schedule fleet-wide sessions during maintenance windows.
- Log the approver, scope, reboot decision, and outcome for every
  started or cancelled session.

## Related Skills

- [software-deployment](../software-deployment/SKILL.md) — stage the desired state a session reconciles
- [tenant-compliance](../tenant-compliance/SKILL.md) — confirm the post-session compliance result
- [api-patterns](../api-patterns/SKILL.md) — destructive-operation and polling patterns
