---
name: "Rootly Workflows"
description: >
  Rootly's incident-response automation model: the trigger / condition / action
  structure, the full catalog of trigger, action, and condition types, workflow
  CRUD and enable/disable, and the failure modes behind stale, over-firing, or
  circularly chained workflows.
when_to_use: >-
  When building, enabling, or auditing automated incident-response
  workflows. Use when: rootly workflow, automated workflow, workflow
  trigger, workflow action, incident automation, response automation, workflow condition, or
  runbook automation.
---

# Rootly Workflows

## Overview

Rootly workflows automate repetitive incident response tasks. Each workflow consists of a trigger (what starts it), conditions (when it should run), and actions (what it does). Workflows can create Slack channels, page on-call, update status pages, create Jira tickets, send notifications, and more -- all automatically when incidents match specific criteria.

## Anti-triggers

"Workflow" means automation *inside Rootly, fired by incident events*.
Several neighbouring things share the word.

- **Claude Code automation** — subagents under `agents/*.md` and slash
  commands under `commands/*.md` are plugin authoring concerns, not
  Rootly resources. Nothing in this skill configures Claude.
- **PSA workflow rules** — ticket routing, board automation, and
  notification rules inside a PSA are `connectwise-manage-tickets`,
  `halopsa-tickets`, or `autotask-tickets`.
- **PagerDuty's automation** — event orchestrations and incident
  workflows are a separate product surface; use `pagerduty-incidents`
  and `pagerduty-alerts`.
- **RMM scripts and scheduled jobs** — running a script on an endpoint is
  `datto-rmm-jobs`, not a Rootly action.
- **What a workflow did on a specific incident** — execution history is
  read from the incident; use `rootly-incidents`.

## Key Concepts

### Workflow Components

- **Trigger** -- The event that starts the workflow (incident created, severity changed, status updated)
- **Conditions** -- Filters that determine if the workflow runs (severity >= SEV1, specific service, production environment)
- **Actions** -- What the workflow does when triggered (create channel, page team, post update)

### Trigger Types

| Trigger | Description |
|---------|-------------|
| `incident_created` | Fires when a new incident is declared |
| `incident_updated` | Fires when incident fields change |
| `severity_changed` | Fires when severity is escalated or de-escalated |
| `status_changed` | Fires when status transitions (started -> mitigated -> resolved) |
| `role_assigned` | Fires when a role is assigned |
| `postmortem_created` | Fires when a postmortem is created |
| `action_item_created` | Fires when an action item is added |
| `alert_received` | Fires when an alert is received from monitoring |

### Action Types

| Action | Description |
|--------|-------------|
| `create_slack_channel` | Create a dedicated incident Slack channel |
| `invite_to_slack_channel` | Add responders to the incident channel |
| `send_slack_message` | Post a message to a channel |
| `page_on_call` | Page the on-call responder via PagerDuty/Opsgenie |
| `create_jira_ticket` | Create a tracking ticket in Jira |
| `update_status_page` | Post to Statuspage or similar |
| `send_email` | Send email notification |
| `create_zoom_meeting` | Start a video bridge for the incident |
| `run_webhook` | Call a custom webhook |
| `assign_role` | Auto-assign an incident role |
| `update_incident` | Modify incident fields |

### Condition Types

| Condition | Description |
|-----------|-------------|
| `severity_is` | Match specific severity level |
| `severity_gte` | Severity is at or above threshold |
| `service_is` | Match specific service |
| `environment_is` | Match specific environment |
| `team_is` | Match specific team |
| `label_contains` | Match incident labels |

## API Patterns

### List Workflows

```
rootly_list_workflows
```

Parameters:
- `enabled` -- Filter by enabled/disabled status

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
        "trigger": "incident_created",
        "conditions": [
          { "field": "severity", "operator": "eq", "value": "sev0" }
        ],
        "actions": [
          { "type": "create_slack_channel" },
          { "type": "page_on_call", "target": "platform-team" },
          { "type": "create_zoom_meeting" }
        ],
        "last_triggered_at": "2026-03-25T08:00:00Z",
        "trigger_count": 12
      }
    }
  ]
}
```

### Get Workflow Details

```
rootly_get_workflow
```

Parameters:
- `workflow_id` -- The workflow ID

### Create Workflow

```
rootly_create_workflow
```

Parameters:
- `name` -- Workflow name (required)
- `description` -- What the workflow does
- `trigger` -- Trigger event type
- `conditions` -- Array of condition objects
- `actions` -- Array of action objects
- `enabled` -- Whether to enable immediately

### Update Workflow

```
rootly_update_workflow
```

Parameters:
- `workflow_id` -- The workflow ID
- `name` -- Updated name
- `conditions` -- Updated conditions
- `actions` -- Updated actions

### Enable/Disable Workflow

```
rootly_enable_workflow
rootly_disable_workflow
```

Parameters:
- `workflow_id` -- The workflow ID

## Common Workflows

### Review Automation Coverage

1. Call `rootly_list_workflows` to get all workflows
2. Map workflows to trigger types and services
3. Identify critical services without automated response
4. Check for disabled workflows that should be active
5. Verify action targets (Slack channels, on-call schedules) are current

### Create SEV0 Auto-Response Workflow

1. Create workflow with trigger `incident_created`
2. Add condition: severity equals SEV0
3. Add actions: create Slack channel, page on-call, create Zoom meeting
4. Add action: update status page with "investigating" status
5. Enable the workflow

### Audit Workflow Effectiveness

1. List all workflows with trigger counts
2. Identify workflows that never fire (stale or misconfigured)
3. Identify high-frequency workflows (potential noise)
4. Review action success rates
5. Optimize conditions to reduce false triggers

## Error Handling

### Workflow Not Found

**Cause:** Invalid workflow ID or workflow deleted
**Solution:** List workflows to verify the correct ID

### Invalid Trigger Type

**Cause:** Trigger type doesn't match valid options
**Solution:** Use one of the documented trigger types

### Action Failed

**Cause:** External integration (Slack, Jira, PagerDuty) returned an error
**Solution:** Check integration credentials and permissions; review workflow logs

## Best Practices

- Always test workflows with a non-production incident before enabling
- Use specific conditions to avoid workflows firing on every incident
- Name workflows descriptively (e.g., "SEV0 Production - Page Platform Team")
- Monitor workflow trigger counts to detect misconfiguration
- Disable rather than delete workflows you might need again
- Document the purpose of each workflow in the description field
- Chain workflows carefully to avoid circular triggers

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Incidents that trigger workflows
- [services](../services/SKILL.md) - Service-based workflow conditions
- [alerts](../alerts/SKILL.md) - Alert-triggered workflows
- [postmortems](../postmortems/SKILL.md) - Postmortem-triggered workflows
