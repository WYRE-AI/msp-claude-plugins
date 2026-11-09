# Moovila Plugin

Claude Code plugin for [Moovila](https://moovila.com) project management.

## Overview

This plugin gives Claude working knowledge of Moovila so MSP project and
service managers can review project health, budget burn, billable time and
technician utilization across their customers without leaving the chat. It
talks to Moovila through [Conduit](https://conduit.wyre.ai), so no local
SDK, proxy or credentials on your machine are required.

The connection is **read-only**. Moovila's Public API publishes 19
endpoints and every one is a `GET`, so this plugin cannot create, update or
delete anything in Moovila. Logging time, updating tasks and closing
projects stay in the Moovila UI.

## What This Plugin Does

- **Project health** - Active portfolio per customer, overdue and blocked
  tasks, late milestones, projects past due or forecast to slip, stalled
  projects
- **Project profitability** - Budget versus actual per project and
  customer, burn against completion, largest overruns
- **Time reconciliation** - Billing-period time review: billable entries
  with no rate or billing code, entries with no task, adjustments, and
  Moovila-versus-PSA hour differences
- **Resource utilization** - Billable utilization per technician against
  labor type targets, and forward task load

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install moovila
```

This plugin ships no `.mcp.json`. Install the `wyre-gateway` plugin (or
any workflow pack), which connects Claude Code to
[Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/mcp`,
then connect Moovila in the Conduit web UI (`/connect/moovila`) as
described below. Your MCP client authenticates to Conduit with OAuth (it
prompts you to sign in on first use). There are no environment variables
or headers to configure on the client.

The Moovila connector is in staged rollout in Conduit. If Moovila does not
appear under **Connections** yet, it has not been enabled for your
workspace.

## Configuration

Moovila uses OAuth with an app your MSP registers in its own Moovila
tenant (bring your own client). Connect it once in Conduit:

1. In Moovila, open **App Registration**. This needs a Moovila user with
   the **Integrations Manager** permission and a plan that includes the
   API.
2. Register an app for Conduit. Use Conduit's callback URL as the redirect
   URL and tick the project, task, user, time entry and lookup table read
   permissions.
3. In Conduit, open **Connections → Moovila** and paste the **Client ID**
   and **Client Secret** Moovila shows.
4. Sign in to Moovila to approve.

| Field | Required | Description |
|-------|----------|-------------|
| Client ID | Yes | From your Moovila App Registration |
| Client Secret | Yes | From your Moovila App Registration |

Conduit keeps the client secret and refresh token and sends only a
short-lived access token to the Moovila MCP server on each call.

Moovila does not enforce scopes on its API, so the connection can read
everything the Moovila user who approved it can see. Approve with a
dedicated, least-privileged Moovila user rather than an owner account.

## Access tiers

All 19 tools are read tier. None is admin-gated in Conduit, so anyone
granted the Moovila connection can use every tool. Cost data
(`payRate`, `hourlyCost`, labor type `fullyBurdenedCost`) is part of that
read surface; grant the connection accordingly.

## Available Commands

| Command | Description |
|---------|-------------|
| `/moovila:project-review` | Review one project or one customer's projects for schedule, budget and time issues |

## Available Agents

| Agent | Use For |
|-------|---------|
| `project-portfolio-reviewer` | Weekly cross-customer review combining schedule, budget, time and activity into one ranked action list |

## Skills Bundled

- `api-patterns` - Tool surface, OAuth connection, paging and truncation, `lastChangedDate`, record fields, errors
- `project-health` - Overdue and blocked tasks, late milestones, stalled and at-risk projects
- `project-profitability` - Budget lines, task rollups, labor cost and revenue, overrun ranking
- `time-reconciliation` - Billing-period pull, time entry checks, PSA reconciliation
- `resource-utilization` - Roster and labor types, billable utilization against targets, forward load

## Available Tools

Provided by the Moovila MCP server through Conduit. All are read tier.

| Domain | Tools |
|--------|-------|
| Projects | `moovila_projects_list`, `moovila_projects_get` |
| Budgets | `moovila_project_budgets_list`, `moovila_project_budgets_get` |
| Phases | `moovila_phases_list`, `moovila_phases_get` |
| Tasks | `moovila_tasks_list`, `moovila_tasks_list_for_project`, `moovila_tasks_get` |
| Time entries | `moovila_time_entries_list`, `moovila_time_entries_get` |
| Users | `moovila_users_list`, `moovila_users_get` |
| Products | `moovila_products_list`, `moovila_products_get` |
| Labor types | `moovila_labor_types_list`, `moovila_labor_types_get` |
| Resource types (deprecated by Moovila) | `moovila_resource_types_list`, `moovila_resource_types_get` |

List tools page with `offset` and `limit` (default 20, maximum 100). The
project, budget, phase, task and time entry lists also accept
`lastChangedDate` for incremental pulls. There are no customer, status or
date-range filters; the skills show how to filter after the fact.

## Troubleshooting

- **401 on every call** - the access token was rejected. Reconnect Moovila
  in Conduit. Token refresh has not yet been verified against a live
  tenant.
- **403** - the Moovila user who approved the connection cannot see that
  data. Widen that user's access in Moovila or reconnect as another user.
- **Validation error on `lastChangedDate`** - it needs a time zone, for
  example `2026-10-01T00:00:00Z`.
- **Validation error on `limit`** - the maximum is 100.
- **A page ends with a truncation note** - resume from the offset the note
  gives, not from `offset + limit`.
- **Empty Smart Construction fields** (`prevailingWageID`,
  `supervisorNotes`, travel distances) - expected on MSP tenants.

## License

Apache-2.0

## Links

- [Moovila](https://moovila.com)
- [Moovila Public API spec](https://api.moovila.com/PublicAPI/swagger/v1/swagger.json)
