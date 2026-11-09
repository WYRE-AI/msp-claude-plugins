# Moovila plugin - governance and safety model

Unofficial. Community-built plugin for the Moovila Public API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Moovila through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`).

- The MSP registers its own OAuth app in Moovila (App Registration) and
  pastes the Client ID and Client Secret into Conduit once. There is no
  shared WYRE Moovila app.
- Conduit runs the consent flow and keeps the client secret and refresh
  token. Each call forwards only a short-lived access token to the
  Moovila MCP server. Nothing is stored on the technician's machine, in
  this repo, or in the model's context.
- Every call carries the Conduit operator's identity, so the gateway
  audit log shows who ran which report.

The Moovila user who approves the connection is the real boundary.
Moovila does not enforce OAuth scopes on its API, so the token reads
everything that user can see. Approve with a dedicated, least-privileged
Moovila user.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Moovila. Safe for autonomous agents. | `moovila_projects_list`, `moovila_projects_get`, `moovila_project_budgets_list`, `moovila_project_budgets_get`, `moovila_phases_list`, `moovila_phases_get`, `moovila_tasks_list`, `moovila_tasks_list_for_project`, `moovila_tasks_get`, `moovila_time_entries_list`, `moovila_time_entries_get`, `moovila_users_list`, `moovila_users_get`, `moovila_products_list`, `moovila_products_get`, `moovila_labor_types_list`, `moovila_labor_types_get`, `moovila_resource_types_list`, `moovila_resource_types_get` |
| **Write** | None. | - |
| **Destructive** | None. | - |

No tool is admin-gated in Conduit. Confirm the live grant in the Conduit
access editor before relying on this table.

## What it cannot reach

- Anything outside the Moovila tenant whose App Registration was used,
  and anything the approving Moovila user cannot see.
- Any write: no time entry, task, project or budget change.
- Service-desk tickets and PSA time. Moovila holds project time only.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- Time entries carry both `billRate` and `payRate`; users carry
  `hourlyCost`; labor types carry `fullyBurdenedCost`. These are internal
  cost figures. Keep them out of customer-facing output.
- User records include names, email addresses, job titles and
  supervisors.
