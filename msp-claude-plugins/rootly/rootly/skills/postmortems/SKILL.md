---
name: "Rootly Postmortems"
description: >
  Rootly postmortems as structured post-incident retrospectives: Rootly's retrospective
  process/step model (there is no standalone "postmortem" object), per-step status
  tracking through to completion, action item creation and tracking, and the
  blameless review practices Rootly's model assumes.
when_to_use: >-
  When writing a retrospective for a resolved Rootly incident or tracking its follow-up
  action items. Use when: rootly postmortem, retrospective,
  post-incident review, action item, blameless review, postmortem template, lessons learned, or
  incident review.
---

# Rootly Postmortems

## Overview

Postmortems in Rootly are structured retrospectives created after incidents are resolved. Rootly does not model this as a single "postmortem" document — it models it as a **retrospective process**: an ordered set of steps (e.g., write summary, identify root cause, assign action items) that each incident works through, with each step tracking its own status independently. Action items are tracked separately, both per-incident and across the whole organization.

## Anti-triggers

- **The resolution note a customer reads** — a PSA ticket's resolution
  field is a customer-facing summary written to close the ticket, not a
  blameless internal retrospective. Use `halopsa-tickets`,
  `freshdesk-ticketing`, or `connectwise-psa-tickets`.
- **A security incident write-up** — Huntress ships its own SOC
  investigation detail on the incident record; use `huntress-incidents`.
- **The live incident** — status, severity, and response coordination
  while it is still open are `rootly-incidents`. This skill starts after
  resolution.
- **Automating postmortem creation** — a workflow action that fires on an
  incident event (e.g. `create_incident_postmortem` when the incident is
  resolved) is configured in `rootly-workflows`; this skill covers the
  retrospective steps and action items that result, not the trigger.
- **Publishing the retrospective as customer documentation** — MSP
  knowledge bases are `hudu-articles` or `itglue-documents`.
- **The vendor-agnostic retrospective process** — how to run the
  review, structure findings, and track actions whatever incident tool
  the client uses is `devops-pack-incident-postmortem`; this skill is
  the Rootly retrospective API behind it.

## Key Concepts

### Rootly Has No Single "Postmortem" Object

There is no `postmortem` resource with its own draft/review/published lifecycle. Instead, Rootly defines a **retrospective process** — a reusable template of steps — and applies it to an incident. Each incident then gets its own instance of every step in that process, and each step's completion is tracked independently.

### Retrospective Structure

- **Retrospective Process** -- An org-level template (e.g., "Standard Postmortem," "SEV-1 Deep Dive") defining which steps an incident's retrospective must go through. `retrospective_process_matching_criteria` on the process determines which incidents use it (for example, by severity or incident type).
- **Retrospective Process Group** -- A logical grouping of steps inside a process, tied to an incident sub-status.
- **Retrospective Step** -- A step *definition* within a process: title, description, whether it's `skippable`, and how many days after the triggering event it's due (`due_after_days`).
- **Incident Retrospective Step** -- The actual instance of a step on one specific incident. This is the object you read and update as the retrospective progresses.

### Incident Retrospective Step Status

Each `incident_retrospective_step` carries its own status, independent of the others:

- `todo`
- `in_progress`
- `completed`
- `skipped`

There is no single "postmortem status" — the retrospective's overall state is the aggregate of its steps' statuses.

### Action Items

Action items are the most important output of a retrospective:

- **Kind** -- `task` or `follow_up`
- **Priority** -- `high`, `medium`, `low`
- **Status** -- `open`, `in_progress`, `cancelled`, `done`
- **Assignee** -- `assigned_to` (user) or `assigned_to_group_ids` (team)
- **Due Date** -- `due_date`
- Optional Jira linkage: `jira_issue_id`, `jira_issue_key`, `jira_issue_url`

## API Patterns

### List Retrospective Processes

```
list_retrospective_processes
```

Returns the org's configured retrospective process templates (name, description, whether it's the default, matching criteria).

### Get Retrospective Process Details

```
get_retrospective_process
```

Parameters:
- Retrospective process ID

### Get an Incident's Retrospective Step

```
get_incident_retrospective_step
```

Parameters:
- Incident retrospective step ID

**Example response shape:**

```json
{
  "data": {
    "id": "irs-101",
    "type": "incident_retrospective_steps",
    "attributes": {
      "retrospective_step_id": "rs-9",
      "incident_id": "inc-456",
      "title": "Root Cause Analysis",
      "status": "in_progress",
      "kind": "text",
      "due_date": "2026-03-28T00:00:00Z",
      "skippable": false
    }
  }
}
```

### Update an Incident's Retrospective Step

```
update_incident_retrospective_step
```

Parameters:
- Incident retrospective step ID
- `status` -- `todo`, `in_progress`, `completed`, or `skipped`
- `title` / `description` -- Step content
- `due_date` -- Target completion date

### List Action Items on an Incident

```
list_incident_action_items
```

Parameters:
- Incident ID

### List Action Items Across All Incidents

```
list_all_incident_action_items
```

Use this for org-wide action item tracking rather than one incident at a time — this is the tool behind "what's still outstanding across every retrospective."

### Create an Action Item

```
create_incident_action_item
```

Parameters:
- Incident ID
- `summary` -- Action item summary (required)
- `description` -- Detailed description
- `kind` -- `task` or `follow_up`
- `priority` -- `high`, `medium`, or `low`
- `assigned_to` -- Assigned user
- `due_date` -- Target completion date

### Update an Action Item

```
update_incident_action_item
```

Parameters:
- Action item ID
- `status` -- `open`, `in_progress`, `cancelled`, or `done`
- `assigned_to` -- Updated assignee

## Common Workflows

### Run the Retrospective After an Incident

1. Get resolved incident details with `get_incident`
2. Confirm which process applies to the incident (org default, or one matching its severity/type) via `list_retrospective_processes`
3. Work through each `incident_retrospective_step` — update status to `in_progress`, fill in content, then `completed` (or `skipped` if not applicable) via `update_incident_retrospective_step`
4. Create action items for each follow-up task with `create_incident_action_item`

### Generate a Retrospective Summary

1. Get incident details and timeline
2. Call `get_incident_retrospective_step` for each step to pull its content and status
3. Summarize key findings: root cause, impact duration, affected services
4. List action items with status and ownership via `list_incident_action_items`
5. Highlight overdue or unassigned items

### Track Outstanding Action Items

1. Call `list_all_incident_action_items` with `status=open`
2. Group by priority and assignee
3. Flag overdue items (past `due_date`)
4. Identify incidents whose retrospective steps show `completed` but have zero action items (gap in follow-through)
5. Report completion rates and trends

## Error Handling

### Retrospective Step Not Found

**Cause:** Invalid incident retrospective step ID
**Solution:** Re-check the incident's retrospective process to find the correct step ID

### Incident Not Resolved

**Cause:** Attempting to complete retrospective steps for an active incident
**Solution:** Resolve the incident first; some retrospective steps may only be actionable once the incident reaches `resolved`

### Step Marked Skipped Incorrectly

**Cause:** A step was skipped that should have been completed
**Solution:** Call `update_incident_retrospective_step` to set `status` back to `todo` or `in_progress`

## Best Practices

- Start working through retrospective steps within 48 hours of incident resolution
- Keep retrospective content blameless -- focus on systems, not individuals
- Don't leave steps in `todo` indefinitely — either complete or explicitly `skip` them so the retrospective's state is honest
- Assign every action item to a specific person with a due date
- Review open action items weekly in team standups using `list_all_incident_action_items`
- Use a consistent retrospective process for similar incident types so retrospectives are comparable
- Link related incidents to identify recurring patterns
- Track action item completion rates as a reliability metric

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Incident context for retrospectives
- [services](../services/SKILL.md) - Affected service information
- [workflows](../workflows/SKILL.md) - Automated retrospective/postmortem-triggered workflows
