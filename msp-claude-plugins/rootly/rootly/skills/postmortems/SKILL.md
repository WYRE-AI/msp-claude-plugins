---
name: "Rootly Postmortems"
description: >
  Use this skill when working with Rootly postmortems -- creating retrospectives,
  managing action items, applying templates, and conducting blameless reviews
  after incidents are resolved.
when_to_use: >-
  When creating retrospectives, managing action items, applying templates, and conducting
  blameless reviews after incidents are resolved. Use when: rootly postmortem, retrospective,
  post-incident review, action item, blameless review, postmortem template, lessons learned, or
  incident review.
---

# Rootly Postmortems

## Overview

Postmortems in Rootly are structured retrospectives created after incidents are resolved. They document what happened, why it happened, and what will be done to prevent recurrence. Rootly supports templates, automatic timeline import, action item tracking, and integration with project management tools for follow-through.

## Key Concepts

### Postmortem Lifecycle

1. **Draft** -- Postmortem created, content being assembled
2. **In Review** -- Team reviewing and adding context
3. **Published** -- Finalized and shared with stakeholders
4. **Completed** -- All action items resolved

### Postmortem Sections

A typical Rootly postmortem includes:

- **Summary** -- What happened in plain language
- **Timeline** -- Chronological events (auto-imported from incident)
- **Root Cause** -- Why the incident occurred
- **Impact** -- Users, services, and duration affected
- **Detection** -- How the incident was discovered
- **Response** -- Steps taken to mitigate and resolve
- **Lessons Learned** -- What went well and what didn't
- **Action Items** -- Concrete follow-up tasks with owners and due dates

### Action Items

Action items are the most important output of a postmortem:

- **Priority** -- Critical, high, medium, low
- **Status** -- Open, in progress, completed
- **Assignee** -- Person responsible
- **Due Date** -- Target completion date
- **Type** -- Prevention, detection, process, documentation

## API Patterns

### List Postmortems

```
rootly_list_postmortems
```

Parameters:
- `incident_id` -- Filter by incident
- `status` -- Filter by status (draft, in_review, published, completed)

**Example response:**

```json
{
  "data": [
    {
      "id": "pm-101",
      "type": "postmortems",
      "attributes": {
        "title": "Payment Processing Outage - 2026-03-25",
        "status": "in_review",
        "incident_id": "inc-456",
        "created_at": "2026-03-26T10:00:00Z",
        "summary": "Payment webhooks timed out due to database connection pool exhaustion",
        "action_items_count": 4,
        "action_items_completed": 1
      }
    }
  ]
}
```

### Get Postmortem Details

```
rootly_get_postmortem
```

Parameters:
- `postmortem_id` -- The postmortem ID

### Create Postmortem

```
rootly_create_postmortem
```

Parameters:
- `incident_id` -- The incident to create a postmortem for
- `title` -- Postmortem title
- `template_id` -- Optional template to use

### Update Postmortem

```
rootly_update_postmortem
```

Parameters:
- `postmortem_id` -- The postmortem ID
- `summary` -- Updated summary
- `root_cause` -- Root cause analysis
- `impact` -- Impact description
- `status` -- Updated status

### List Action Items

```
rootly_list_action_items
```

Parameters:
- `incident_id` -- Filter by incident
- `status` -- Filter by status (open, in_progress, completed)
- `assignee` -- Filter by assignee

### Create Action Item

```
rootly_create_action_item
```

Parameters:
- `incident_id` -- The incident ID
- `title` -- Action item title
- `description` -- Detailed description
- `priority` -- Priority level
- `assignee_id` -- Assigned user
- `due_date` -- Target completion date

### Update Action Item

```
rootly_update_action_item
```

Parameters:
- `action_item_id` -- The action item ID
- `status` -- Updated status
- `assignee_id` -- Updated assignee

## Common Workflows

### Create Postmortem After Incident

1. Get resolved incident details with `rootly_get_incident`
2. Create postmortem with `rootly_create_postmortem` (timeline auto-imports)
3. Fill in root cause, impact, and lessons learned sections
4. Create action items for each follow-up task
5. Set postmortem status to "in_review"

### Generate Postmortem Summary

1. Get incident details and timeline
2. Get postmortem content with `rootly_get_postmortem`
3. Summarize key findings: root cause, impact duration, affected services
4. List action items with status and ownership
5. Highlight overdue or unassigned items

### Track Outstanding Action Items

1. Call `rootly_list_action_items` with `status=open`
2. Group by priority and assignee
3. Flag overdue items (past due date)
4. Identify incidents with no action items (gap in follow-through)
5. Report completion rates and trends

## Error Handling

### Postmortem Not Found

**Cause:** Invalid postmortem ID or postmortem deleted
**Solution:** List postmortems for the incident to verify the ID

### Incident Not Resolved

**Cause:** Attempting to create a postmortem for an active incident
**Solution:** Resolve the incident first, then create the postmortem

### Duplicate Postmortem

**Cause:** Postmortem already exists for this incident
**Solution:** Get the existing postmortem instead of creating a new one

## Best Practices

- Create postmortems within 48 hours of incident resolution
- Keep postmortems blameless -- focus on systems, not individuals
- Include both "what went well" and "what could be improved"
- Assign every action item to a specific person with a due date
- Review open action items weekly in team standups
- Use templates for consistency across postmortems
- Link related incidents to identify recurring patterns
- Track action item completion rates as a reliability metric

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Incident context for postmortems
- [services](../services/SKILL.md) - Affected service information
- [workflows](../workflows/SKILL.md) - Automated postmortem creation workflows
