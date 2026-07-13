---
name: "PagerDuty API Patterns"
description: >
  Use this skill when working with PagerDuty MCP tools - authentication setup,
  complete 66-tool reference, REST API pagination, token format (Token token=),
  rate limits, error handling, and hosted MCP connection details. Covers all
  13 tool categories: incidents, on-call, schedules, escalation policies,
  services, event orchestrations, status pages, teams, users, and more.
when_to_use: >-
  When working with authentication setup, complete 66-tool reference, REST API pagination, token
  format (Token token=), rate limits, error handling. Use when: pagerduty api, pagerduty mcp,
  pagerduty token, pagerduty authentication, pagerduty pagination, pagerduty tools, pagerduty
  connection, pagerduty request, pagerduty credentials, pagerduty rate limit, or pagerduty
  endpoint.
---

# PagerDuty MCP Tools & API Patterns

## Overview

PagerDuty provides an official hosted MCP server at `mcp.pagerduty.com` (US) and `mcp.eu.pagerduty.com` (EU). The server exposes 66 tools generated from PagerDuty's REST API and is generally available to all PagerDuty accounts. When accessed through the MCP Gateway, credentials are injected automatically — no manual auth handling needed.

> **Critical auth note:** PagerDuty uses `Token token=<key>` header format, NOT `Bearer`. Using `Bearer` returns 401.

## Authentication

### Token Type and Header Format

```
Authorization: Token token=<your-user-api-token>
```

| Token Type | Where to Generate | Scope |
|------------|-------------------|-------|
| **User API Token** (recommended) | My Profile → User Settings → API Access → Create API User Token | Your user's permissions |
| **General Access Token** | Admin → API Access Keys → Create New API Key | Full account access (requires admin) |

User API tokens are preferred — they carry individual audit attribution and work for all 66 MCP tools.

### EU Region

For EU PagerDuty accounts, the gateway operator sets `VENDOR_URL_PAGERDUTY=https://mcp.eu.pagerduty.com`. No change needed in your API token.

### How the Gateway Injects Credentials

The MCP Gateway stores your token as an org credential and automatically forwards:

```
Authorization: Token token=<stored-api-token>
```

## Complete MCP Tool Reference (66 Tools)

### Incidents (14 tools)

| Tool | Description |
|------|-------------|
| `list_incidents` | List incidents with filters (status, urgency, service, team, date range) |
| `get_incident` | Get full incident details by ID |
| `create_incident` | Create a new incident |
| `update_incident` | Update incident fields (status, priority, urgency, title) |
| `merge_incidents` | Merge duplicate incidents into one |
| `list_incident_alerts` | List alerts associated with an incident |
| `list_incident_notes` | List notes/comments on an incident |
| `create_incident_note` | Add a note to an incident |
| `list_incident_log_entries` | List all log entries for an incident |
| `snooze_incident` | Snooze an incident for a duration |
| `manage_incidents` | Bulk update multiple incidents |
| `list_past_incidents` | List resolved incidents matching a pattern |
| `get_incident_field_values` | Get custom field values for an incident |
| `set_incident_field_values` | Set custom field values for an incident |

### On-Call (1 tool)

| Tool | Description |
|------|-------------|
| `list_oncalls` | List current on-call entries (who is on-call for which schedule) |

### Schedules (6 tools)

| Tool | Description |
|------|-------------|
| `list_schedules` | List all on-call schedules |
| `get_schedule` | Get schedule details with rotation layers |
| `create_schedule` | Create a new on-call schedule |
| `update_schedule` | Update schedule details or layers |
| `delete_schedule` | Delete a schedule |
| `list_schedule_overrides` | List temporary overrides for a schedule |

### Escalation Policies (2 tools)

| Tool | Description |
|------|-------------|
| `list_escalation_policies` | List all escalation policies |
| `get_escalation_policy` | Get escalation policy details and rules |

### Services (4 tools)

| Tool | Description |
|------|-------------|
| `list_services` | List all services |
| `get_service` | Get service details |
| `create_service` | Create a new service |
| `update_service` | Update service settings |

### Event Orchestrations (7 tools)

| Tool | Description |
|------|-------------|
| `list_event_orchestrations` | List all event orchestrations |
| `get_event_orchestration` | Get orchestration details |
| `get_global_orchestration_rules` | Get global routing rules |
| `update_global_orchestration_rules` | Update global routing rules |
| `get_service_orchestration_rules` | Get per-service routing rules |
| `update_service_orchestration_rules` | Update per-service routing rules |
| `get_event_orchestration_active_status` | Check if orchestration is active |

### Status Pages (8 tools)

| Tool | Description |
|------|-------------|
| `list_status_pages` | List all status pages |
| `get_status_page` | Get status page details |
| `list_status_page_posts` | List incident posts on a status page |
| `create_status_page_post` | Create a new status page post |
| `update_status_page_post` | Update an existing post |
| `delete_status_page_post` | Delete a status page post |
| `list_status_page_post_updates` | List updates for a post |
| `create_status_page_post_update` | Add update to an existing post |

### Teams (7 tools)

| Tool | Description |
|------|-------------|
| `list_teams` | List all teams |
| `get_team` | Get team details |
| `create_team` | Create a team |
| `update_team` | Update team details |
| `delete_team` | Delete a team |
| `list_team_members` | List members of a team |
| `add_team_member` | Add a user to a team |

### Users (2 tools)

| Tool | Description |
|------|-------------|
| `list_users` | List all users in the account |
| `get_user` | Get user details and contact methods |

### Alert Grouping (5 tools)

| Tool | Description |
|------|-------------|
| `get_alert_grouping_settings` | Get alert grouping configuration for a service |
| `update_alert_grouping_settings` | Update alert grouping settings |
| `list_intelligent_alert_grouping_settings` | List AI-based alert grouping configs |
| `create_intelligent_alert_grouping_settings` | Configure AI-based grouping for a service |
| `update_intelligent_alert_grouping_settings` | Update AI-based grouping settings |

### Incident Workflows (3 tools)

| Tool | Description |
|------|-------------|
| `list_incident_workflows` | List all incident workflow automation rules |
| `get_incident_workflow` | Get workflow details and triggers |
| `list_incident_workflow_instances` | List workflow executions for an incident |

### Change Events (3 tools)

| Tool | Description |
|------|-------------|
| `list_change_events` | List change events (deployments, config changes) |
| `get_change_event` | Get change event details |
| `update_change_event` | Update a change event |

### Log Entries (2 tools)

| Tool | Description |
|------|-------------|
| `list_log_entries` | List log entries across the account |
| `get_log_entry` | Get a specific log entry |

## Pagination

PagerDuty uses offset-based pagination with `limit` and `offset` parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `limit` | Results per page (max 100) | 25 |
| `offset` | Number of results to skip | 0 |
| `total` | Include total count in response | false |

**Pattern:**
1. Call tool with `limit=100`, `offset=0`
2. Check `response.more` — if `true`, fetch next page with `offset=100`
3. Continue until `response.more` is `false`

## Common Filter Parameters

Most list tools support these standard filters:

| Parameter | Description |
|-----------|-------------|
| `team_ids[]` | Filter to specific teams |
| `service_ids[]` | Filter to specific services |
| `user_ids[]` | Filter to specific users |
| `since` | Start time (ISO 8601) |
| `until` | End time (ISO 8601) |
| `statuses[]` | Filter by status values |

## Error Handling

| HTTP Code | Cause | Resolution |
|-----------|-------|------------|
| 401 | Invalid or missing token | Verify token; use `Token token=` format, not `Bearer` |
| 403 | Insufficient permissions | Check user role; some tools require Account Owner |
| 404 | Resource not found | Verify the ID exists with a list call first |
| 429 | Rate limited | Back off 60 seconds; PagerDuty limits 900 req/min |
| 500 | PagerDuty internal error | Retry once; check PagerDuty status page |

## Best Practices

1. **Use `Token token=` format** — `Bearer` will always return 401
2. **Filter server-side** — Use `team_ids[]` and `service_ids[]` to scope results
3. **Paginate with limit=100** — Max allowed; reduces round trips for large accounts
4. **Use `since`/`until` for incident queries** — Avoid unbounded queries on large accounts
5. **List before get** — Always list to find IDs before calling single-resource get tools

## Related Skills

- [Incidents](../incidents/SKILL.md) — Incident lifecycle, triage, PSA correlation
- [On-Call Management](../oncall/SKILL.md) — Schedules, escalation, overrides
