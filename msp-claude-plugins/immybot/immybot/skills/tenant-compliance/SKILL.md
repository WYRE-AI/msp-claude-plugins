---
name: "ImmyBot Tenant & Compliance Reporting"
when_to_use: >-
  When working with ImmyBot tenants (client organizations), reviewing per-tenant compliance
  dashboards, software inventory rollups, or auditing background task queues across the fleet. Use
  when: immybot tenant, immybot client organization, immybot compliance report, immybot tenant
  stats, immybot task queue, immybot failed tasks, or immybot fleet report.
description: >
  Use this skill when working with ImmyBot tenants and fleet-wide
  reporting — listing and searching client organizations, pulling
  per-tenant compliance dashboards and software-inventory rollups,
  and auditing background task queues (running, queued, failed) to
  produce client-facing or operational status reports.
---

# ImmyBot Tenant & Compliance Reporting

Tenants are ImmyBot's client organizations. This skill covers
tenant-level queries, compliance rollups, and the background-task
queue that powers fleet-wide operational and QBR reporting.

## Tenant API Tools

| Tool | Purpose |
|------|---------|
| `immybot_tenants_list` | List tenants with name/status filters |
| `immybot_tenants_get` | Full detail for one tenant by ID |
| `immybot_tenants_search` | Search tenants by name |
| `immybot_tenants_stats` | Statistics for a tenant |
| `immybot_tenants_computers` | Computers belonging to a tenant |
| `immybot_tenants_deployments` | Deployments scoped to a tenant |
| `immybot_tenants_compliance` | Compliance dashboard data for a tenant |
| `immybot_tenants_software_inventory` | Software inventory rollup for a tenant |

## Task Queue API Tools

| Tool | Purpose |
|------|---------|
| `immybot_tasks_list` | Background tasks with computer/tenant/status/type filters |
| `immybot_tasks_get` | Detail for one task |
| `immybot_tasks_running` | All currently running tasks |
| `immybot_tasks_queued` | Tasks waiting for execution |
| `immybot_tasks_failed` | All failed tasks |
| `immybot_tasks_for_computer` | Tasks for a specific computer |
| `immybot_tasks_for_tenant` | Tasks for a specific tenant |
| `immybot_tasks_by_type` | Tasks of a given type (SoftwareInstall, ScriptExecution, …) |
| `immybot_tasks_queue_stats` | Task queue statistics |
| `immybot_tasks_history` | Task execution history over a date range |

## Per-Tenant Compliance Scorecard

1. `immybot_tenants_search` → resolve the tenant.
2. `immybot_tenants_get` and `immybot_tenants_stats` for the
   overview (computer count, status).
3. `immybot_tenants_compliance` for the compliance rollup — which
   deployments are met vs failing.
4. Drill into failing deployments with
   `immybot_deployments_compliance`.
5. `immybot_tenants_software_inventory` to confirm what is actually
   installed across the tenant.

## Fleet Task-Queue Audit

1. `immybot_tasks_queue_stats` for the high-level picture.
2. `immybot_tasks_failed` — every failure across the fleet.
3. `immybot_tasks_running` and `immybot_tasks_queued` for current
   load and backlog.
4. For a problem client, `immybot_tasks_for_tenant` to scope the
   failures.
5. `immybot_tasks_history` over a date range for trend reporting.

## Building a Client QBR Report

For each tenant, assemble:

- Computer count and online ratio (`immybot_tenants_stats`,
  `immybot_tenants_computers`).
- Compliance percentage and failing deployments
  (`immybot_tenants_compliance`).
- Software inventory highlights — required software present,
  outdated packages (`immybot_tenants_software_inventory`).
- Recent failed tasks and how they were resolved
  (`immybot_tasks_failed`, `immybot_tasks_history`).

Present per-tenant so the technician knows which client each finding
belongs to.

## Best Practices

- Always scope task and compliance queries by tenant when reporting
  to a specific client — unscoped results span the whole MSP.
- Treat a low compliance percentage as a remediation backlog: route
  failing deployments into a maintenance session.
- Track failed-task trends over time, not just the current snapshot,
  to catch recurring issues.

## Related Skills

- [software-deployment](../software-deployment/SKILL.md) — fix failing deployments
- [maintenance-sessions](../maintenance-sessions/SKILL.md) — reconcile non-compliant tenants
- [endpoint-management](../endpoint-management/SKILL.md) — drill into individual computers
