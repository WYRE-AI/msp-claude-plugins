---
description: Stage and reconcile an ImmyBot desired-state software deployment to a tenant or computer
argument-hint: "<software> <scope>"
arguments: [software, scope]
---

# ImmyBot Deploy Software

Stage a desired-state deployment of "$ARGUMENTS.software" to
"$ARGUMENTS.scope" and reconcile it through a maintenance session.

## Arguments

- `software` (required) — Software name or keyword to deploy
- `scope` (required) — Target tenant name or computer name/hostname

## Prerequisites

- ImmyBot MCP server connected with valid `IMMYBOT_INSTANCE_SUBDOMAIN`,
  `IMMYBOT_TENANT_ID`, `IMMYBOT_CLIENT_ID`, `IMMYBOT_CLIENT_SECRET`
- Maintenance sessions are destructive — this command requires
  explicit human approval before reconciling

## Instructions

1. **Resolve the software** — `immybot_software_search` for the
   keyword, `immybot_software_get` for detail, and
   `immybot_software_latest_version` for the version. Confirm the
   canonical package.
2. **Resolve the scope** — If the scope looks like a tenant, use
   `immybot_tenants_search` then `immybot_tenants_computers` and
   report the computer count. If it looks like a computer, use
   `immybot_computers_search`.
3. **Check for conflicts** — `immybot_deployments_for_software` to
   spot existing deployments that could fight the new one.
4. **Stage desired state** — `immybot_deployments_create` with the
   software, version, and scope. Confirm nothing has executed yet.
5. **Reconcile (destructive)** — Present the software, version, and
   blast radius, and obtain approval. With approval, call
   `immybot_maintenance_sessions_start`.
6. **Monitor** — Poll `immybot_maintenance_sessions_get` and tail
   `immybot_maintenance_sessions_logs` until terminal.
7. **Confirm** — `immybot_deployments_compliance` for the result.

## Example

```
/deploy-software "7-Zip" "Acme Corp"
```

## Related Commands

- `/search-software` — confirm the package before deploying
- `/maintenance-status` — monitor the reconciling session
