---
name: "ImmyBot Software Deployment"
description: >
  ImmyBot's desired-state software deployment model end-to-end: the software
  catalog, deployment, maintenance-session and computer tool surfaces; the
  canonical select → scope → assert → reconcile → verify workflow; and the
  pinned-vs-latest, conflicting-deployment, and reboot edge cases.
when_to_use: >-
  When deploying software to Windows endpoints via ImmyBot, configuring desired state, running
  maintenance sessions, or auditing per-computer compliance. Use when: immybot deploy, immybot
  install, immybot software, immybot maintenance, deploy software immybot, immybot compliance, or
  desired state windows software.
---

# ImmyBot Software Deployment

This is ImmyBot's headline capability. The model is desired-state:
you assert what should be installed, then a maintenance session
brings the endpoint into compliance. This skill walks the canonical
deployment workflow end-to-end.

## Anti-triggers

- **Making the install actually happen** — creating a deployment changes
  nothing on any endpoint; the reconciliation run that acts on it is
  `immybot-maintenance-sessions`.
- **OS and security patching** — ImmyBot deploys applications, not
  Windows Update. Patch compliance lives in the RMM: `superops-assets`,
  `syncro-assets`, or `ncentral-devices`.
- **A one-off command on one machine** — use
  `immybot-script-execution`.
- **Whether a tenant is compliant overall** — rollups and scorecards are
  `immybot-tenant-compliance`.

## API Tools

### Discover the catalog

| Tool | Purpose |
|------|---------|
| `immybot_software_list` | Per-tenant software catalog |
| `immybot_software_list_global` | Global ImmyBot software catalog |
| `immybot_software_search` | Search by name |
| `immybot_software_get` | Full detail for one software |
| `immybot_software_versions` | Available versions for a software |
| `immybot_software_latest_version` | The current "latest" version |
| `immybot_software_categories` | Browse by category |
| `immybot_software_publishers` | Browse by publisher |
| `immybot_software_stats` | Usage stats across the fleet |

### Configure desired state

| Tool | Purpose |
|------|---------|
| `immybot_deployments_list` | Current deployments |
| `immybot_deployments_get` | Detail for a deployment |
| `immybot_deployments_create` | Assert new desired state |
| `immybot_deployments_for_computer` | Deployments scoped to a computer |
| `immybot_deployments_for_software` | Deployments scoped to a software |
| `immybot_deployments_compliance` | Compliance report for a deployment |
| `immybot_deployments_trigger` | Force immediate reconciliation (destructive) |
| `immybot_software_install` | Install a software via desired state (destructive) |

### Reconcile

| Tool | Purpose |
|------|---------|
| `immybot_maintenance_sessions_list` | Recent sessions |
| `immybot_maintenance_sessions_get` | One session snapshot |
| `immybot_maintenance_sessions_start` | Start a session (destructive) |
| `immybot_maintenance_sessions_pause` | Pause a running session |
| `immybot_maintenance_sessions_resume` | Resume a paused session |
| `immybot_maintenance_sessions_cancel` | Cancel a session |
| `immybot_maintenance_sessions_logs` | Log stream |
| `immybot_maintenance_sessions_results` | Final outcome |
| `immybot_maintenance_sessions_active` | Currently active sessions |
| `immybot_maintenance_sessions_summary` | Summary metrics |

### Computers in scope

| Tool | Purpose |
|------|---------|
| `immybot_computers_list` | Enrolled computers |
| `immybot_computers_get` | One computer detail |
| `immybot_computers_search` | Search by name |
| `immybot_computers_inventory` | Installed software on a computer |
| `immybot_computers_deployments` | Deployments hitting a computer |
| `immybot_computers_trigger_checkin` | Force a check-in |

## The Canonical Deployment Workflow

### 1. Identify the software

```
immybot_software_search → immybot_software_get → immybot_software_latest_version
```

Confirm the software exists in the catalog and what version you intend
to deploy.

### 2. Identify the scope

For tenant-wide rollouts:
```
immybot_tenants_get → immybot_tenants_computers
```

For a single computer:
```
immybot_computers_search → immybot_computers_get
```

### 3. Configure desired state

Call `immybot_deployments_create` with the chosen software, version,
and scope. The deployment now exists, but nothing has happened on
the endpoint yet.

### 4. Reconcile

Either wait for the next scheduled maintenance window, or trigger
immediately:

```
immybot_maintenance_sessions_start
```

This is destructive — get human approval first.

### 5. Watch the session

Poll `immybot_maintenance_sessions_get` and tail
`immybot_maintenance_sessions_logs`. Stop polling once the session is
in a terminal state.

### 6. Confirm compliance

Call `immybot_deployments_compliance` to see which computers in
scope reached the desired state and which failed.

## Other Common Workflows

### Per-computer audit

1. `immybot_computers_get` for the computer
2. `immybot_computers_inventory` for installed software
3. `immybot_computers_deployments` for what desired-state expects
4. Reconcile differences

### Per-tenant compliance scorecard

1. `immybot_tenants_get`
2. `immybot_tenants_compliance` for the rollup
3. Drill into failing deployments via `immybot_deployments_compliance`

### Investigate a failed install

1. Identify the maintenance session: `immybot_maintenance_sessions_list`
2. `immybot_maintenance_sessions_results` for outcome
3. `immybot_maintenance_sessions_logs` for the failing log lines
4. Cross-reference with `immybot_tasks_logs` for lower-level detail

## Edge Cases

- **Pinned versions vs latest** - A deployment can pin a specific
  version or track latest. Always confirm which mode you are in
  before changing the desired version.
- **Conflicting deployments** - Two deployments hitting the same
  software on the same scope can fight. Use
  `immybot_deployments_for_computer` to spot conflicts before adding
  a new one.
- **Reboot requirements** - Some installs require a reboot. Maintenance
  sessions handle this, but expect the session to span longer than the
  install itself.

## Best Practices

- Prefer tenant-scoped deployments over per-computer deployments for
  fleet-wide software; reserve per-computer for exceptions.
- Always run a small pilot (one or two computers) before triggering a
  fleet-wide maintenance session.
- For destructive operations, log the approver, the scope, and the
  expected outcome.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Auth and the desired-state model
