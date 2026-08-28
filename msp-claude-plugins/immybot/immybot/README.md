# ImmyBot Plugin

Claude Code plugin for [ImmyBot](https://immy.bot) - desired-state Windows software deployment for MSPs.

## What It Does

- **Software deployment** - Configure desired state for tenants or computers, then reconcile via maintenance sessions
- **Maintenance sessions** - Start, pause, resume, cancel, and inspect reconciliation runs
- **Scripts** - List, search, and (with care) execute PowerShell scripts; review execution history
- **Computers** - Enrolled-endpoint inventory, per-computer deployment view, force check-in
- **Tenants** - MSP-level scoping for software inventory and compliance
- **Tasks** - Lower-level work units feeding into maintenance sessions

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install immybot
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/immybot/mcp`.

## Configuration

ImmyBot uses Microsoft Entra ID (Azure AD) OAuth 2.0 client credentials. All four fields are required.

| Variable | Required | Description |
|----------|----------|-------------|
| `IMMYBOT_INSTANCE_SUBDOMAIN` | Yes | Your ImmyBot instance subdomain |
| `IMMYBOT_TENANT_ID` | Yes | Microsoft Entra tenant UUID |
| `IMMYBOT_CLIENT_ID` | Yes | Entra app registration client ID |
| `IMMYBOT_CLIENT_SECRET` | Yes | Entra app registration client secret |

## Skills

- `api-patterns` - Auth, navigation, the desired-state model, polling
- `software-deployment` - Primary skill: deploy software end-to-end

## Commands

- `/search-software` - Search the ImmyBot software catalog

## Destructive Tools

These tools mutate live customer infrastructure. Get human approval before invoking:

- `immybot_scripts_run`
- `immybot_deployments_trigger`
- `immybot_software_install`
- `immybot_maintenance_sessions_start`

## Tools

Provided by the ImmyBot MCP server through the WYRE MCP Gateway:

### Navigation
- `immybot_navigate`, `immybot_back`, `immybot_status`

### Computers
- `immybot_computers_list`, `immybot_computers_get`, `immybot_computers_search`, `immybot_computers_create`
- `immybot_computers_inventory`, `immybot_computers_deployments`, `immybot_computers_trigger_checkin`

### Software
- `immybot_software_list`, `immybot_software_list_global`, `immybot_software_get`, `immybot_software_search`
- `immybot_software_versions`, `immybot_software_latest_version`
- `immybot_software_categories`, `immybot_software_publishers`
- `immybot_software_install` (write), `immybot_software_stats`

### Deployments
- `immybot_deployments_list`, `immybot_deployments_get`, `immybot_deployments_create`
- `immybot_deployments_trigger` (write), `immybot_deployments_compliance`
- `immybot_deployments_for_computer`, `immybot_deployments_for_software`

### Scripts
- `immybot_scripts_list`, `immybot_scripts_get`, `immybot_scripts_search`
- `immybot_scripts_run` (write), `immybot_scripts_categories`
- `immybot_scripts_execution_history`, `immybot_scripts_execution_result`, `immybot_scripts_validate`

### Tenants
- `immybot_tenants_list`, `immybot_tenants_get`, `immybot_tenants_search`
- `immybot_tenants_stats`, `immybot_tenants_computers`, `immybot_tenants_deployments`
- `immybot_tenants_compliance`, `immybot_tenants_software_inventory`

### Maintenance Sessions
- `immybot_maintenance_sessions_list`, `immybot_maintenance_sessions_get`
- `immybot_maintenance_sessions_start` (write), `immybot_maintenance_sessions_cancel`
- `immybot_maintenance_sessions_pause`, `immybot_maintenance_sessions_resume`
- `immybot_maintenance_sessions_logs`, `immybot_maintenance_sessions_results`
- `immybot_maintenance_sessions_active`, `immybot_maintenance_sessions_summary`

### Tasks
- `immybot_tasks_list`, `immybot_tasks_get`, `immybot_tasks_history`, `immybot_tasks_logs`
- `immybot_tasks_queued`, `immybot_tasks_running`, `immybot_tasks_failed`
- `immybot_tasks_for_computer`, `immybot_tasks_for_tenant`, `immybot_tasks_by_type`
- `immybot_tasks_child_tasks`, `immybot_tasks_dependencies`
- `immybot_tasks_estimated_completion`, `immybot_tasks_queue_stats`, `immybot_tasks_metrics`

## License

Apache-2.0
