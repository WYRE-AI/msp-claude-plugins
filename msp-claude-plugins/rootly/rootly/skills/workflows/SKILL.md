---
name: "Rootly Workflows"
description: >
  Rootly's incident-response automation model: workflow tasks (each with a concrete
  `task_type` like `create_slack_channel` or `page_rootly_on_call_responders`), the
  trigger-type/`triggers`-event structure (incident, post_mortem, action_item, alert,
  pulse, simple), the ID-list based condition/matching fields, and the `enabled` flag
  used to turn a workflow on or off (there is no separate enable/disable tool).
when_to_use: >-
  When building, enabling, or auditing automated incident-response
  workflows. Use when: rootly workflow, automated workflow, workflow
  trigger, workflow action, incident automation, response automation, workflow condition, or
  runbook automation.
---

# Rootly Workflows

## Overview

Rootly workflows automate repetitive incident response tasks. Each workflow has a trigger type (what kind of event starts it, e.g. `incident`, `post_mortem`, `action_item`, `alert`), a set of specific trigger events within that type (e.g. `incident_created`, `status_updated`), matching filters (which severities/services/environments/teams it applies to), and one or more **workflow tasks** -- each task carries a specific `task_type` such as `create_slack_channel`, `page_rootly_on_call_responders`, or `send_email`.

## Anti-triggers

"Workflow" means automation *inside Rootly, fired by incident/alert/action-item/postmortem events*.
Several neighbouring things share the word.

- **Claude Code automation** — subagents under `agents/*.md` and slash
  commands under `commands/*.md` are plugin authoring concerns, not
  Rootly resources. Nothing in this skill configures Claude.
- **PSA workflow rules** — ticket routing, board automation, and
  notification rules inside a PSA are `connectwise-psa-tickets`,
  `halopsa-tickets`, or `autotask-tickets`.
- **PagerDuty's automation** — event orchestrations and incident
  workflows are a separate product surface; use `pagerduty-incidents`
  and `pagerduty-alerts`.
- **RMM scripts and scheduled jobs** — running a script on an endpoint is
  `datto-rmm-jobs`, not a Rootly action.
- **What a workflow did on a specific incident** — execution history is
  read from `list_workflow_runs`, not this skill's conceptual reference.

## Key Concepts

### Workflow Structure

A `workflow` record has:

- `name`, `description`, `slug`
- `enabled` -- Whether the workflow is currently active (there is no separate enable/disable tool -- toggle this field with `update_workflow`)
- `trigger_params` -- The trigger type and specific events (see below)
- Matching filters: `environment_ids`, `severity_ids`, `incident_type_ids`, `service_ids`, `functionality_ids`, `group_ids` (teams), `cause_ids`, `sub_status_ids`
- `workflow_group_id` -- Optional grouping for organization
- `repeat_every_duration`, `continuously_repeat`, `repeat_condition_number_of_repeats` -- Repeat/retry behavior

### Trigger Types

`trigger_params` is one of six shapes, selected by `trigger_type`:

| `trigger_type` | Fires on |
|---|---|
| `incident` | Incident lifecycle and field-change events |
| `post_mortem` | Retrospective (postmortem) lifecycle events |
| `action_item` | Action item lifecycle events |
| `alert` | Alert events |
| `pulse` | Pulse (recurring check) events |
| `simple` | A minimal manual/generic trigger |

Each trigger type has its own `triggers` array of specific event names. Confirmed values include:

- **`incident`**: `incident_created`, `incident_started`, `incident_in_triage`, `incident_updated`, `title_updated`, `summary_updated`, `status_updated`, `severity_updated`, `services_added`/`removed`/`updated`, `environments_added`/`removed`/`updated`, `incident_types_added`/`removed`/`updated`, `functionalities_added`/`removed`/`updated`, `teams_added`/`removed`/`updated`, `role_assignments_added`/`updated`/`removed`, `timeline_updated`, `slack_command`
- **`post_mortem`**: `post_mortem_created`, `post_mortem_updated`, `status_updated`, `slack_command`
- **`action_item`**: `action_item_created`, `action_item_updated`, `assigned_user_updated`, `status_updated`, `priority_updated`, `due_date_updated`, `slack_command`

### Condition Matching

Rootly does not use a `severity_is` / `severity_gte` style condition object. Instead:

- Matching is expressed by populating the workflow's `severity_ids`, `service_ids`, `environment_ids`, `group_ids`, etc. with the specific records the workflow should apply to
- Within `trigger_params`, per-field condition operators (e.g. `incident_condition_status`, `incident_condition_kind`) support `IS`, `ANY`, `CONTAINS`, `CONTAINS_ALL`, `CONTAINS_NONE`, `NONE`, `SET`, `UNSET`
- A top-level combinator (`incident_condition`: `ALL` / `ANY` / `NONE`) controls how multiple conditions combine

### Workflow Task Types

A workflow's actions are separate `workflow_task` records (see [Common Query Patterns](#api-patterns)), each with a `task_type`. Confirmed `task_type` values include:

| `task_type` | Description |
|---|---|
| `create_slack_channel` | Create a dedicated incident Slack channel |
| `invite_to_slack_channel` | Add responders to a Slack channel |
| `send_slack_message` | Post a message to a channel |
| `page_rootly_on_call_responders` | Page via Rootly's own on-call/schedules |
| `page_pagerduty_on_call_responders` / `page_opsgenie_on_call_responders` | Page via a connected paging tool |
| `create_jira_issue` | Create a tracking issue in Jira |
| `send_email` | Send email notification |
| `create_zoom_meeting` | Start a video bridge for the incident |
| `http_client` | Call a custom HTTP endpoint (Rootly's generic webhook action) |
| `add_role` | Assign an incident role |
| `update_status` | Change the incident's status |
| `update_incident` | Modify incident fields |
| `create_incident_postmortem` / `update_incident_postmortem` | Create or update the incident's retrospective (see [postmortems](../postmortems/SKILL.md)) |

This is a representative subset -- Rootly's OpenAPI spec defines well over 100 task types (per-vendor paging/ticketing/wiki integrations, etc.). Use `list_workflow_tasks` on an existing workflow to see exactly which task types are in use, rather than assuming a name.

## API Patterns

### List Workflows

```
list_workflows
```

Parameters:
- `filter[search]`, `filter[name]`, `filter[slug]`
- `page[number]` / `page[size]`

**Example response:**

```json
{
  "data": [
    {
      "id": "wf-001",
      "type": "workflows",
      "attributes": {
        "name": "SEV0 Auto-Response",
        "description": "Create war room and page on-call for critical incidents",
        "enabled": true,
        "severity_ids": ["sev-0"],
        "trigger_params": {
          "trigger_type": "incident",
          "triggers": ["incident_created"]
        }
      }
    }
  ]
}
```

### Get Workflow Details

```
get_workflow
```

Parameters:
- Workflow ID

### Create Workflow

```
create_workflow
```

Parameters:
- `name` -- Workflow name (required)
- `description` -- What the workflow does
- `trigger_params` -- Trigger type and event list
- `severity_ids` / `service_ids` / `environment_ids` / etc. -- Matching filters
- `enabled` -- Whether to enable immediately

### Update Workflow (Including Enable/Disable)

```
update_workflow
```

Parameters:
- Workflow ID
- `name` -- Updated name
- `enabled` -- Set `true`/`false` to enable or disable -- there is no separate enable/disable tool
- `trigger_params` -- Updated trigger
- Matching filter fields

### List / Create Workflow Tasks (Actions)

```
list_workflow_tasks
create_workflow_task
```

Parameters:
- Workflow ID
- `task_params` -- An object whose `task_type` selects the action (see table above) plus that action's specific fields

### List Workflow Runs (Execution History)

```
list_workflow_runs
```

Parameters:
- Workflow ID

Returns the history of when this workflow fired and what it did -- this is where you check whether a workflow is actually running.

## Common Workflows

### Review Automation Coverage

1. Call `list_workflows` to get all workflows
2. For each, call `list_workflow_tasks` to see its actions and check `severity_ids`/`service_ids` for scope
3. Identify critical services (`service_ids`) without automated response
4. Check for `enabled: false` workflows that should be active
5. Verify action targets (Slack channels, Jira projects) are current

### Create a SEV0 Auto-Response Workflow

1. Create the workflow with `create_workflow`, `trigger_params.trigger_type = "incident"`, `trigger_params.triggers = ["incident_created"]`
2. Set `severity_ids` to the SEV0 severity ID
3. Add tasks via `create_workflow_task`: `task_type: "create_slack_channel"`, `task_type: "page_rootly_on_call_responders"`, `task_type: "create_zoom_meeting"`
4. Set `enabled: true` via `update_workflow` (or at creation)

### Audit Workflow Effectiveness

1. List all workflows with `list_workflows`
2. For each, call `list_workflow_runs` to see how often it actually fires
3. Identify workflows that never fire (stale or misconfigured matching filters)
4. Identify high-frequency workflows (potential noise)
5. Tighten `severity_ids`/`service_ids`/condition operators to reduce false triggers

## Error Handling

### Workflow Not Found

**Cause:** Invalid workflow ID or workflow deleted
**Solution:** List workflows to verify the correct ID

### Invalid Trigger Type

**Cause:** `trigger_params.trigger_type` doesn't match one of `incident`, `post_mortem`, `action_item`, `alert`, `pulse`, `simple`
**Solution:** Use one of the six documented trigger types, with a `triggers` array of event names valid for that type

### Task Failed

**Cause:** External integration (Slack, Jira, PagerDuty) returned an error for a `workflow_task`
**Solution:** Check integration credentials and permissions; review `list_workflow_runs` for the failure detail

## Best Practices

- Always test with a non-production incident before setting `enabled: true`
- Use specific `severity_ids`/`service_ids`/`environment_ids` to avoid workflows firing on every incident
- Name workflows descriptively (e.g., "SEV0 Production - Page Platform Team")
- Check `list_workflow_runs` regularly to detect misconfiguration (never fires, or fires too often)
- Set `enabled: false` rather than deleting a workflow you might need again
- Document the purpose of each workflow in its `description`
- Chain workflows carefully -- an `incident_updated` trigger can itself update the incident and re-fire

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Incidents that trigger workflows
- [services](../services/SKILL.md) - Service-based workflow conditions
- [alerts](../alerts/SKILL.md) - Alert-triggered workflows
- [postmortems](../postmortems/SKILL.md) - Postmortem/retrospective-triggered workflows
