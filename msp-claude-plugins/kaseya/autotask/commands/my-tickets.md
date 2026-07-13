---
description: List tickets currently assigned to you with optional filtering
argument-hint: "[status] [priority] [queue] [limit] [sort]"
arguments: [status, priority, queue, limit, sort]
---

# My Autotask Tickets

List all tickets currently assigned to you with filtering and sorting options for workload management.

## Prerequisites

- Valid Autotask API credentials configured
- User account must be a resource in Autotask
- User must have ticket read permissions

## Steps

1. **Identify current user**
   - Use `autotask-mcp/autotask_search_resources` to find your resource ID
   - Match based on authenticated API user

2. **Build ticket query**
   - Filter by assignedResourceID = current user
   - Apply status filter if provided
   - Apply priority filter if provided
   - Apply queue filter if provided

3. **Execute search**
   - Use `autotask-mcp/autotask_search_tickets` with filters
   - Apply sorting preference
   - Limit results as specified

4. **Format and display results**
   - Show ticket list with key details
   - Include SLA status and due dates
   - Provide quick action references

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | - | Filter by status |
| priority | integer | No | - | Filter by priority (1-4) |
| queue | string | No | - | Filter by queue name |
| limit | integer | No | 25 | Max results (1-100) |
| sort | string | No | priority | Sort field |

## Examples

### View All My Tickets

```
/my-tickets
```

### In Progress Only

```
/my-tickets --status "In Progress"
```

### High Priority Tickets

```
/my-tickets --priority 3
```

### Critical Priority (Urgent)

```
/my-tickets --priority 4
```

### Sorted by Due Date

```
/my-tickets --sort due_date
```

### Filtered by Queue

```
/my-tickets --queue "Service Desk"
```

### Combined Filters

```
/my-tickets --status "In Progress" --priority 2 --sort due_date --limit 10
```

## Output

```
Your Assigned Tickets (15 total)

Sorted by: Priority | Showing: 15 of 15

+------------------+--------------------------------+---------------+----------+-------------+------------------+
| Ticket #         | Title                          | Company       | Priority | Status      | Due              |
+------------------+--------------------------------+---------------+----------+-------------+------------------+
| T20240215.0042   | Server down - production       | Acme Corp     | Critical | In Progress | Today 11:00 (!)  |
| T20240215.0038   | Email not working              | Acme Corp     | High     | In Progress | Today 14:00      |
| T20240215.0035   | VPN connection issues          | TechStart Inc | High     | Waiting     | Today 16:00      |
| T20240214.0156   | Software installation request  | DataCo        | Medium   | New         | Tomorrow 09:00   |
| T20240214.0142   | Printer not printing           | Acme Corp     | Medium   | New         | Tomorrow 12:00   |
| T20240213.0098   | Password reset request         | TechStart Inc | Low      | In Progress | Feb 18           |
+------------------+--------------------------------+---------------+----------+-------------+------------------+

Summary:
  Critical: 1 | High: 2 | Medium: 2 | Low: 1
  Overdue: 0 | Due Today: 3 | Due Tomorrow: 2

Quick Actions:
  View ticket: /search-tickets "T20240215.0042"
  Update ticket: /update-ticket <id>
  Add note: /add-note <id>
```

### Filtered Output

```
Your High Priority Tickets (3 total)

Filter: Priority = High | Sorted by: Due Date

+------------------+--------------------------------+---------------+----------+-------------+------------------+
| Ticket #         | Title                          | Company       | Priority | Status      | Due              |
+------------------+--------------------------------+---------------+----------+-------------+------------------+
| T20240215.0038   | Email not working              | Acme Corp     | High     | In Progress | Today 14:00      |
| T20240215.0035   | VPN connection issues          | TechStart Inc | High     | Waiting     | Today 16:00      |
| T20240214.0129   | Database performance issues    | DataCo        | High     | New         | Tomorrow 10:00   |
+------------------+--------------------------------+---------------+----------+-------------+------------------+

All 3 high priority tickets shown.
```

### Empty Results

```
No Tickets Found

You have no tickets matching the specified criteria.

Current filters:
  Status: In Progress
  Priority: Critical

Try:
  /my-tickets (no filters)
  /my-tickets --status "New" (check new tickets)
```

## Sort Options

| Sort Value | Behavior |
|------------|----------|
| priority | Critical first, then High, Medium, Low |
| due_date | Earliest due date first |
| created | Most recently created first |

## Status Reference

| Status | Description |
|--------|-------------|
| New | Newly created, not started |
| In Progress | Currently being worked |
| Waiting Customer | Awaiting customer response |
| Waiting Materials | Awaiting parts or resources |
| Escalated | Escalated to higher tier |
| Complete | Work finished |

## Error Handling

### Resource Not Found

```
Error: Unable to identify your resource ID

Your API user may not be linked to a resource in Autotask.
Contact your Autotask administrator to verify your resource setup.
```

### Invalid Status

```
Error: Invalid status: "Working"

Available statuses:
- New
- In Progress
- Waiting Customer
- Waiting Materials
- Escalated
- Complete
```

### Invalid Priority

```
Error: Invalid priority: 5

Valid priorities:
- 4 (Critical)
- 3 (High)
- 2 (Medium)
- 1 (Low)
```

### Invalid Sort Field

```
Error: Invalid sort field: "company"

Valid sort options:
- priority (default)
- due_date
- created
```

### Limit Out of Range

```
Warning: Limit 500 exceeds maximum

Adjusting to maximum allowed: 100
```

## MCP Tool Usage

This command uses the following autotask-mcp tools:
- `autotask_search_resources` - Identify current user's resource ID
- `autotask_search_tickets` - Query tickets with filters
- `autotask_list_ticket_statuses` - Validate status values
- `autotask_list_ticket_priorities` - Validate priority values
- `autotask_list_queues` - Validate queue names

## Related Commands

- `/search-tickets` - Search all tickets with various filters
- `/update-ticket` - Update ticket status/priority
- `/add-note` - Add note to ticket
- `/reassign-ticket` - Reassign ticket to another resource
