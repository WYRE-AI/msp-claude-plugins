---
description: List outstanding action items from Rootly postmortems and incidents
argument-hint: "[status] [incident_id] [assignee]"
arguments: [status, incident_id, assignee]
---

# List Outstanding Action Items

List and summarize outstanding action items from Rootly incidents and postmortems. Tracks follow-up tasks that prevent recurrence, improve detection, or address process gaps identified during incident response.

## Prerequisites

- Rootly MCP server connected with valid API credentials
- MCP tools `incidents_get` and `incidents_by_incident_id_action_items_get` available

## Steps

1. **Fetch incidents with action items**

   If `incident_id` is specified, fetch action items for that specific incident using `incidents_by_incident_id_action_items_get`. Otherwise, fetch recent resolved incidents with `incidents_get` and iterate through them to collect action items.

2. **Filter by status**

   Filter action items by the specified status (default: open). Include `in_progress` items as well to show active follow-through.

3. **Filter by assignee**

   If `assignee` is specified, match action items by assignee name or email.

4. **Build action items table**

   For each action item, display:
   - Action item summary
   - Priority (critical, high, medium, low)
   - Status (open, in_progress, completed)
   - Assignee
   - Due date
   - Source incident (sequential ID and title)

5. **Flag overdue items**

   Identify action items past their due date and highlight them for immediate attention.

6. **Identify gaps**

   Flag resolved incidents that have zero action items -- these may need follow-up to ensure lessons are captured.

7. **Provide summary metrics**

   Report total action items, open count, overdue count, completion rate, and breakdown by priority.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | open | Filter by status (open, in_progress, completed) |
| incident_id | string | No | all | Filter to a specific incident |
| assignee | string | No | all | Filter by assignee name or email |

## Examples

### List All Open Action Items

```
/action-items
```

### List Action Items for a Specific Incident

```
/action-items --incident_id "inc-456"
```

### List Action Items Assigned to a Person

```
/action-items --assignee "jane.doe@company.com"
```

### List Completed Action Items

```
/action-items --status completed
```

## Error Handling

- **No Action Items Found:** This may indicate incidents are not being followed up with postmortems -- consider reviewing recent resolved incidents
- **Incident Not Found:** Verify the incident ID; use `/incident-triage` to list recent incidents
- **Authentication Error:** Verify `ROOTLY_API_TOKEN` is set correctly

## Related Commands

- `/incident-triage` - Triage active incidents
- `/postmortem-summary` - Generate postmortem for a resolved incident
- `/service-status` - Check service health
- `/create-incident` - Create a new incident
