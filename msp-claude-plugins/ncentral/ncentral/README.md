# N-central Plugin

Claude Code plugin for the N-able N-central RMM platform.

## Overview

This plugin gives Claude working knowledge of N-central so MSP technicians can inventory devices, triage active issues, inspect scheduled-task results, and manage custom properties without leaving the chat. It talks to N-central through [Conduit](https://conduit.wyre.ai), so no local SDK, proxy, or credentials on your machine are required.

## What Is N-central

N-able N-central is an RMM platform used by MSPs to monitor and manage customer endpoints — servers, workstations, and network devices — organized under a service organization → customer → site hierarchy. Unlike SaaS-only RMMs, every MSP runs its own N-central server (on-prem or N-able hosted), so all API access targets a per-tenant server FQDN with that server's own credentials.

## What This Plugin Does

- **Device Inventory** — Per-customer device reports with saved device filters, asset/warranty lookups, lifecycle updates, and service-monitor triage
- **Issue Sweep** — Active issues across customers, grouped by severity and probable root cause, with proposed (never auto-executed) remediation
- **Task Status** — Scheduled-task drill-down from aggregate outcome to per-device results and output
- **Org & Custom Properties** — Walk the SO/customer/site tree, read/write org- and device-level custom properties, fetch agent registration tokens
- **Maintenance & Access Groups** — List/add/delete maintenance windows, inspect and create access groups

## Installation

Install via the [MSP Claude Plugins marketplace](https://github.com/WYRE-AI/msp-claude-plugins):

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install ncentral
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/ncentral/mcp`. Your MCP client authenticates to Conduit with OAuth (it will prompt you to sign in on first use) — there are no environment variables or headers to configure on the client.

## Configuration

Connect N-central once in the Conduit web UI (**Connections → N-able N-central**). Conduit stores the credentials and injects them per-request; they never live on your machine:

| Field | Required | Description |
|-------|----------|-------------|
| Server URL | Yes | Base URL of **your** N-central server, e.g. `https://ncentral.yourcompany.com`. Every MSP has its own server FQDN — there is no shared cloud endpoint. |
| User-API Token (JWT) | Yes | Token for a dedicated API user |

### Generating the JWT

1. In the N-central UI, go to **Administration → User Management → Users** and open (or create) the API user.
2. The user must have **MFA disabled** — N-central rejects API token authentication for MFA-enabled users. Use a dedicated least-privilege API user, not a shared admin.
3. Under **API Access**, click **Generate JSON Web Token** and copy the token — paste it into Conduit's **User-API Token** field.

The JWT is the *permanent* User-API Token. The MCP server exchanges it for short-lived access (~1 h) and refresh (~25 h) tokens automatically; you never handle those.

### On-prem notes

- **Per-server FQDN** — credentials are only valid on the server that issued them; point the **Server URL** field at your exact server.
- **Conduit reachability** — Conduit must be able to reach the server over HTTPS/443. LAN-only servers need an inbound path.
- **Private CA certificates** — servers with internal-CA certificates need the CA bundle supplied to the MCP sidecar via `NODE_EXTRA_CA_CERTS`. Never disable TLS verification as a workaround.
- **Version drift** — several endpoints are N-able "preview" stage and vary by release. Check `https://<your-server>/api-explorer` (Swagger UI) for what your server actually ships.

## Available Commands

| Command | Description |
|---------|-------------|
| `/ncentral:device-inventory` | Inventory a customer/site with class, warranty, and monitor-health breakdown |
| `/ncentral:issue-sweep` | Sweep active issues across customers, grouped by root cause |
| `/ncentral:task-status` | Drill into a scheduled task's outcome down to per-device output |

## Available Agents

| Agent | Use For |
|-------|---------|
| `device-auditor` | Read-only fleet audits — missing assets, expired warranties, untracked hardware, failed service monitors across customers |
| `issue-triager` | Cross-customer active-issue sweeps — severity ranking, root-cause grouping, proposed (never executed) remediation |

## Skills Bundled

- `api-patterns` — JWT auth model, Conduit connection, pagination envelope, rate limits, preview endpoints, on-prem specifics
- `devices` — Device filters, asset/warranty lookups, lifecycle updates, service-monitor triage
- `organizations` — SO/customer/site hierarchy, registration tokens, org- and device-level custom properties
- `monitoring-tasks` — Active-issue triage, job statuses, task drill-down, direct-task safety

## Available Tools

Provided by the N-central MCP server through Conduit. Tools sit behind decision-tree navigation: use `ncentral_navigate` to enter a domain, `ncentral_back` to go up, and `ncentral_status` to see where you are.

| Domain | Tools |
|--------|-------|
| System | `ncentral_health`, `ncentral_server_info`, `ncentral_validate_token` |
| Organizations | `ncentral_list_service_orgs`, `ncentral_list_customers`, `ncentral_get_customer`, `ncentral_list_sites`, `ncentral_get_site`, `ncentral_list_org_units`, `ncentral_get_org_unit`, `ncentral_list_org_unit_children`, `ncentral_get_registration_token` |
| Devices | `ncentral_list_devices` (filterId-aware), `ncentral_get_device`, `ncentral_get_device_assets`, `ncentral_get_device_lifecycle`, `ncentral_update_device_lifecycle`, `ncentral_get_device_service_status`, `ncentral_list_devices_by_org_unit`, `ncentral_list_device_filters` |
| Monitoring | `ncentral_list_active_issues` (customer/site org units only), `ncentral_list_job_statuses` |
| Tasks | `ncentral_list_device_tasks`, `ncentral_get_task`, `ncentral_get_task_status`, `ncentral_get_task_status_details`, `ncentral_create_direct_task` (HIGH-IMPACT — executes immediately on a device; always confirm) |
| Custom Properties | `ncentral_list_org_custom_properties`, `ncentral_get_org_custom_property`, `ncentral_update_org_custom_property`, `ncentral_list_device_custom_properties`, `ncentral_get_device_custom_property`, `ncentral_update_device_custom_property` |
| Maintenance | `ncentral_list_maintenance_windows`, `ncentral_add_maintenance_windows`, `ncentral_delete_maintenance_windows` (IRREVERSIBLE) |
| Access Groups | `ncentral_list_access_groups`, `ncentral_get_access_group`, `ncentral_create_device_access_group`, `ncentral_create_org_unit_access_group` |

## Common Workflows

### Morning issue sweep

```
/ncentral:issue-sweep
```

Loops every customer (active issues are per customer/site — there is no SO-level query), groups issues by probable cause, checks maintenance windows and agent staleness before escalating, and proposes remediation without executing it.

### Warranty audit before a QBR

```
/ncentral:device-inventory org_unit_id=<customer>
```

Lists the customer's devices, joins lifecycle data for servers and network devices, and flags expired warranties, 90-day expirations, and untracked hardware.

### Did last night's remediation task work?

```
/ncentral:task-status task_id=<id>
```

Aggregate outcome first, then per-device return codes and output for the failures only.

## Troubleshooting

- **401 on every call** — the JWT is invalid/expired or the API user has MFA enabled. Regenerate the token and verify MFA is off. `ncentral_validate_token` confirms which user the token authenticates as.
- **404 on specific tools** — the endpoint is preview-stage and your N-central release doesn't ship it. Check `https://<server>/api-explorer` and `ncentral_server_info`.
- **TLS errors from Conduit** — on-prem server with a private-CA certificate; supply the CA bundle via `NODE_EXTRA_CA_CERTS` on the sidecar. Do not disable verification.
- **429 throttling** — the sidecar retries automatically; if sweeps stay slow, use saved device filters (`filterId`) and org-unit scoping instead of full-fleet pulls.
- **Direct tasks** — `ncentral_create_direct_task` executes immediately on a live device with no dry run and no cancel. Confirm the device, script, and parameters explicitly every time.

## License

Apache-2.0

## Links

- [N-able N-central product](https://www.n-able.com/products/n-central-rmm)
- [N-central API documentation](https://developer.n-able.com/n-central/docs)
- [N-able support](https://www.n-able.com/support)
