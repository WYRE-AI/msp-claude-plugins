---
name: "Liongard Inspections"
description: >
  Liongard's inspection pipeline: inspector templates and their credential
  and agent requirements, launchpoint configuration that binds inspector +
  environment + agent + credentials + cron schedule, on-demand inspection
  runs and their status lifecycle, and the failure modes behind failed runs.
when_to_use: >-
  When configuring or scheduling what Liongard inspects, triggering a run by hand,
  migrating inspections between agents, or diagnosing an inspection that failed.
  Use when: liongard inspection, liongard inspector, launchpoint,
  inspection schedule, run inspection, liongard launchpoint, trigger inspection, inspection
  template, or liongard cron.
---

# Liongard Inspections & Launchpoints

## Overview

Inspections are the core mechanism by which Liongard captures IT documentation. The system has three parts: **inspectors** (templates defining what to inspect), **launchpoints** (configured instances tying an inspector to an environment, agent, credentials, and schedule), and **inspections** (individual execution runs that produce system data and potentially trigger detections). The relationship flows: **Inspector** (template) -> **Launchpoint** (configuration) -> **Inspection** (execution) -> **System** (discovered data).

## Anti-triggers

- **"Run" meaning execute a script on an endpoint** —
  `liongard_inspections_run` collects configuration data. It runs no
  operator-supplied code and changes nothing on the target. Script
  execution is `immybot-script-execution`,
  `ncentral-monitoring-tasks`, `superops-runbooks`, `atera-agents`,
  `syncro-assets`, `connectwise-automate-scripts`, or `datto-rmm-jobs`.
- **Scheduled maintenance on endpoints** — a launchpoint cron schedules
  data collection, not patching or reboots; use
  `immybot-maintenance-sessions` or `ncentral-monitoring-tasks`.
- **What an inspection produced** — `liongard-systems` for the data,
  `liongard-detections` for the changes it surfaced.

## Key Concepts

### Inspectors

Inspectors are pre-built templates provided by Liongard that define what technology platform to inspect and what data to collect. There are hundreds, spanning identity, email/collaboration, networking, virtualization, backup/DR, security, cloud, and core infrastructure.

Two inspector fields drive launchpoint design: `RequiresAgent` (whether a locally deployed agent must run it, or Liongard can reach the target directly — Active Directory needs an agent, Microsoft 365 does not) and `CredentialType` (what kind of authentication the target expects, e.g. Domain Admin vs App Registration). `DataPoints` — the list of what the inspector collects — is returned only on the single-inspector GET, not in the list response.

See [references/fields.md](references/fields.md) for the complete inspector and launchpoint field references, the full inspector category table, and the entity relationship map.

### Launchpoints

A launchpoint brings together everything needed to run an inspection:

| Component | Purpose |
|-----------|---------|
| **Inspector** | Which template to use |
| **Environment** | Which customer this is for |
| **Agent** | Which agent runs the inspection |
| **Credentials** | How to authenticate to the target |
| **Schedule** | When to run inspections |
| **Configuration** | Inspector-specific settings |

`InspectorID`, `EnvironmentID`, and `Name` are required; `AgentID` is required only when the inspector's `RequiresAgent` is true. Inspector-specific settings and credentials go in a nested `Configuration` object whose keys vary per inspector. `LastInspection` and `NextInspection` are read-only and are the fastest way to spot a launchpoint that has silently stopped running.

### Inspection Status Values

| Status | Description |
|--------|-------------|
| `Queued` | Inspection is waiting to be picked up by agent |
| `Running` | Inspection is currently executing |
| `Completed` | Inspection finished successfully |
| `Failed` | Inspection encountered an error |
| `Timeout` | Inspection exceeded maximum runtime |

## Scheduling

### Cron Expression Format

Launchpoints use standard cron expressions for scheduling:

```
┌───────── minute (0-59)
│ ┌─────── hour (0-23)
│ │ ┌───── day of month (1-31)
│ │ │ ┌─── month (1-12)
│ │ │ │ ┌─ day of week (0-6, Sun=0)
│ │ │ │ │
* * * * *
```

### Common Schedules

| Cron Expression | Description |
|-----------------|-------------|
| `0 2 * * *` | Daily at 2:00 AM |
| `0 */6 * * *` | Every 6 hours |
| `0 0 * * 0` | Weekly on Sunday at midnight |
| `0 8 1 * *` | Monthly on the 1st at 8:00 AM |
| `*/30 * * * *` | Every 30 minutes |
| `0 2 * * 1-5` | Weekdays at 2:00 AM |

### Scheduling Best Practices

1. **Stagger inspection times** - Avoid running all launchpoints at the same time
2. **Use off-peak hours** - Schedule during client off-hours (e.g., 2:00 AM)
3. **Match frequency to change rate** - Daily for AD/O365, weekly for static infrastructure
4. **Consider agent load** - Don't overload agents with concurrent inspections
5. **Account for time zones** - Schedule based on the client's local time

## API Patterns

The full endpoint catalog with request/response bodies lives in [references/api.md](references/api.md). The non-obvious parts:

- **Inspectors are read-only** (`GET /api/v1/inspectors`) — they are Liongard-supplied templates, not something you create. Launchpoints are full CRUD at `/api/v1/launchpoints`.
- **On-demand runs are an action sub-resource**: `POST /api/v1/launchpoints/{id}/run` with no body. It returns immediately with an `InspectionID` and `Status: "Queued"` — it does not wait for the inspection to finish, so poll or check the timeline for the outcome.
- **Launchpoint filtering uses the camelCase `environmentId` query param** while response bodies are PascalCase (`Data`, `TotalRows`, `HasMoreRows`, `CurrentPage`, `TotalPages`, `PageSize`).
- **There is no batch-run endpoint** — trigger each launchpoint individually and stagger the calls. See [references/examples.md](references/examples.md) for a worked batch-run implementation.

## Common Workflows

### Setting Up New Inspections for a Client

1. **Identify platforms** - Determine what technologies the client uses
2. **Find inspectors** - Look up the matching inspector templates
3. **Verify agent** - Ensure an agent is deployed and online
4. **Gather credentials** - Collect authentication details for each target
5. **Create launchpoints** - Configure one launchpoint per inspector/target
6. **Set schedules** - Assign appropriate cron schedules
7. **Run initial inspections** - Trigger immediate runs
8. **Verify data** - Check that systems are being discovered correctly

### Troubleshooting Failed Inspections

1. **Check launchpoint status** - Is the launchpoint Active?
2. **Verify agent status** - Is the agent Online?
3. **Review credentials** - Have passwords expired or been rotated?
4. **Check network connectivity** - Can the agent reach the target?
5. **Review timeline** - Look for error messages in the timeline
6. **Check inspector version** - Is a newer version available?
7. **Re-run inspection** - Try triggering a manual run
8. **Check system logs** - Review agent logs on the deployed system

### Migrating Inspections Between Agents

1. **Deploy new agent** - Install at the new location
2. **Verify new agent** - Confirm it's online and healthy
3. **Update launchpoints** - Change AgentID to the new agent
4. **Test inspections** - Trigger manual runs on updated launchpoints
5. **Decommission old agent** - Remove once migration is verified

## Gotchas

- **Deleting a launchpoint removes all associated systems and historical inspection data.** Set `Status` to `Inactive` to stop scheduled runs while keeping the history.
- **Launchpoint names must be unique per environment** — a collision returns 409, not a validation body.
- **A malformed cron expression returns 422 at write time**, so a launchpoint that saved successfully has a valid schedule; a launchpoint that never runs is an agent or credential problem, not a syntax one.
- **Credential rotation on the target silently breaks inspections.** The launchpoint stays `Active` and runs fail with an authentication error, so failures surface in the timeline rather than in the launchpoint's own status.
- **Rate limit is 300 requests/minute.** Batch-triggering an environment's launchpoints needs pacing (roughly 500 ms between runs) to stay clear of it and to avoid swamping a single agent.

See [references/errors.md](references/errors.md) for the complete API and inspection-run error tables.

## Best Practices

1. **Name launchpoints clearly** - Use format: "ClientName - InspectorName"
2. **Monitor inspection health** - Regularly review failed inspections
3. **Keep credentials current** - Update when passwords change
4. **Test before production** - Run manual inspections before scheduling
5. **Document configurations** - Note any inspector-specific settings
6. **Group by environment** - Keep related inspections organized

## Related Skills

- [Liongard Overview](../overview/SKILL.md) - Platform overview and terminology
- [Liongard Environments](../environments/SKILL.md) - Environment management
- [Liongard Systems](../systems/SKILL.md) - Systems and dataprints
- [Liongard Detections](../detections/SKILL.md) - Change detection and alerts
