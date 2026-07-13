---
description: >-
  Use this skill when working with Autotask picklist and reference data — listing queues, ticket
  statuses, ticket priorities, and phases. These tools return the configured lookup values for
  your specific Autotask instance, which are required when creating or filtering tickets and other
  entities. Use when: autotask queues, autotask ticket statuses, autotask ticket priorities,
  autotask picklist, list queues autotask, autotask priority values, autotask status values,
  autotask reference data, autotask lookup values, or autotask phases list.
---

# Autotask Picklists and Reference Data

## Overview

Autotask uses instance-specific picklist values for queues, statuses, priorities, and phases. Before creating tickets or filtering results, retrieve these values to use the correct IDs for your organization's configuration.

## API Patterns

### List Queues

Tool: `autotask_list_queues`

Returns all ticket queues configured in your Autotask instance.

Response structure:
```json
[
  { "id": 1, "name": "Service Desk", "isActive": true },
  { "id": 2, "name": "Project Work", "isActive": true },
  { "id": 8, "name": "Monitoring", "isActive": false }
]
```

Use the `id` field when creating or filtering tickets by queue.

### List Ticket Statuses

Tool: `autotask_list_ticket_statuses`

Returns all ticket status values configured in your instance.

Response structure:
```json
[
  { "id": 1, "name": "New", "isActive": true },
  { "id": 5, "name": "Complete", "isActive": true },
  { "id": 9, "name": "Waiting Customer", "isActive": true }
]
```

### List Ticket Priorities

Tool: `autotask_list_ticket_priorities`

Returns all ticket priority values configured in your instance.

Response structure:
```json
[
  { "id": 1, "name": "Critical", "isActive": true },
  { "id": 2, "name": "High", "isActive": true },
  { "id": 3, "name": "Medium", "isActive": true },
  { "id": 4, "name": "Low", "isActive": true }
]
```

### List Phases

Tool: `autotask_list_phases`

Parameters:
- `projectId` (required) — The project ID to retrieve phases for

Returns all phases within a specific project, used when creating tasks or assigning work.

## Common Workflows

### Discover Picklist Values Before Creating a Ticket

1. Call `autotask_list_queues` to find the queue ID
2. Call `autotask_list_ticket_statuses` to find status IDs
3. Call `autotask_list_ticket_priorities` to find priority IDs
4. Use retrieved IDs in `autotask_create_ticket`

### Get Phases for Project Task Assignment

1. Call `autotask_list_phases` with the project ID
2. Note phase IDs and names
3. Use phase ID when creating tasks with `autotask_create_task`

## Notes

- All picklist values are instance-specific — IDs will differ between Autotask environments
- Active vs inactive values: filter by `isActive: true` to avoid using deprecated values
- For other entity field picklists not covered here, use `autotask_get_field_info` to retrieve full picklist data for any entity type
- Cache these values during a session to avoid repeated lookups; they change infrequently
