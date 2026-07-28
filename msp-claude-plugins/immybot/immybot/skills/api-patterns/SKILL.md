---
name: "ImmyBot API Patterns"
description: >
  ImmyBot MCP fundamentals: Entra ID OAuth 2.0 client-credentials auth (four
  fields), the `immybot_<domain>_<action>` tool naming and domain list, the
  two-step desired-state deployment model, the four destructive operations that
  need explicit confirmation, task/session polling cadence, and HTTP error codes.
when_to_use: >-
  When working with ImmyBot authentication (Entra ID OAuth client credentials), the desired-state
  model, destructive write operations, or task / maintenance-session polling. Use when: immybot
  api, immybot authentication, immybot oauth, immybot entra, immybot mcp, immybot desired state,
  or immybot maintenance session.
---

# ImmyBot MCP Tools & API Patterns

## Overview

ImmyBot is a desired-state software deployment platform for Windows
endpoints. You configure what should be installed at the tenant or
computer level, then a maintenance session reconciles the live state
to the desired state. The MCP surface mirrors that model — listing
and configuring desired state is one set of tools; running and
inspecting maintenance sessions is another.

## Connection & Authentication

ImmyBot uses Microsoft Entra ID (Azure AD) OAuth 2.0 client
credentials. Four fields are required:

| Variable | Description |
|----------|-------------|
| `IMMYBOT_INSTANCE_SUBDOMAIN` | Your ImmyBot instance subdomain (e.g. `acme` for `acme.immy.bot`) |
| `IMMYBOT_TENANT_ID` | Microsoft Entra tenant UUID |
| `IMMYBOT_CLIENT_ID` | App registration client ID |
| `IMMYBOT_CLIENT_SECRET` | App registration client secret |

The gateway exchanges these for a token automatically. Token cache is
managed gateway-side; you should not need to think about token
refresh.

## Navigation Tools

| Tool | Purpose |
|------|---------|
| `immybot_navigate` | Discover available domains |
| `immybot_back` | Pop back to the prior context |
| `immybot_status` | Health/status check |

## Functional Tool Surface

Tools follow `immybot_<domain>_<action>`. Domains:

- `computers` - Enrolled Windows endpoints
- `software` - Software catalog (per-tenant + global)
- `deployments` - Desired-state assignments (the "what should be installed")
- `scripts` - PowerShell scripts and execution history
- `tenants` - MSP-level tenant scoping
- `maintenance_sessions` - The reconciliation runs (active, paused, etc.)
- `tasks` - Lower-level work units inside sessions

## The Two-Step Desired-State Model

This is the most important concept in ImmyBot. Software does not get
installed by a single API call. Instead:

1. **Configure desired state** — Use `immybot_deployments_create`
   (or update an existing deployment) to assert: "Software X should
   be installed at version Y on this scope."
2. **Reconcile** — A maintenance session runs (either on schedule, or
   triggered via `immybot_maintenance_sessions_start`) and brings
   the endpoints in scope into compliance with the desired state.

If you skip step 2, nothing happens on the endpoint. If you skip
step 1 and try to "install software directly," there is no API for
that — the platform is desired-state by design.

## Destructive Operations

The following tools mutate live customer infrastructure. Always
confirm with a human before invoking:

- `immybot_scripts_run` - Executes a PowerShell script on endpoints
- `immybot_deployments_trigger` - Forces deployment evaluation
- `immybot_software_install` - Triggers software install via desired state
- `immybot_maintenance_sessions_start` - Starts a reconciliation run

For all four, log who approved, the scope (computer / tenant), and
the expected outcome before calling.

## Polling Tasks and Sessions

`immybot_maintenance_sessions_start` and similar tools return
quickly with a session/task ID. Actual progress is observed by
polling:

- `immybot_maintenance_sessions_get` - Snapshot of one session
- `immybot_maintenance_sessions_logs` - Log lines so far
- `immybot_maintenance_sessions_results` - Final outcome
- `immybot_tasks_get`, `immybot_tasks_logs` - Lower-level task detail

Reasonable cadence: 10-15s while a session is `running`, stop once it
reaches a terminal state.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Bad client credentials or expired token | Recheck the four creds; gateway refreshes tokens |
| 403 | App registration lacks the right ImmyBot permissions | Check ImmyBot RBAC for the app |
| 404 | Unknown computer / software / deployment | Re-list to confirm |
| 409 | Conflicting maintenance session already running | Wait or cancel the existing one |
| 429 | Rate limit | Back off and retry |

## Best Practices

- For MSP work, scope by tenant first (`immybot_tenants_get`) and
  pivot down — never modify deployments without confirming the
  tenant.
- Always pull `immybot_maintenance_sessions_results` after a session
  to see which endpoints succeeded vs failed.

## Related Skills

- [software-deployment](../software-deployment/SKILL.md) - Primary skill, the desired-state workflow
