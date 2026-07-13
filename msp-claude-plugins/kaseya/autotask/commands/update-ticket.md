---
description: Update fields on an existing Autotask ticket (status, priority, queue, due date)
argument-hint: "<ticket_id> [status] [priority] [queue] [due_date] [assigned_resource]"
arguments: [ticket_id, status, priority, queue, due_date, assigned_resource]
---

# Update Autotask Ticket

Update fields on an existing Autotask ticket including status, priority, queue, due date, and assignee.

## Prerequisites

- Valid Autotask API credentials configured
- Ticket must exist and be accessible
- User must have ticket update permissions

## Steps

1. **Validate ticket exists**
   - Use `autotask-mcp/autotask_get_ticket_details` to fetch ticket
   - Confirm ticket ID is valid
   - Display current ticket state for reference

2. **Resolve field values**
   - If status provided, lookup status ID via `autotask-mcp/autotask_list_ticket_statuses`
   - If priority provided, validate against `autotask-mcp/autotask_list_ticket_priorities`
   - If queue provided, lookup queue ID via `autotask-mcp/autotask_list_queues`
   - If assigned_resource provided, lookup resource ID via `autotask-mcp/autotask_search_resources`

3. **Build update payload**
   - Only include fields that are being changed
   - Preserve existing values for unchanged fields

4. **Apply the update**
   - Use Autotask API to update ticket fields
   - Note: autotask-mcp may require using search + create pattern for updates

5. **Confirm changes**
   - Fetch updated ticket to verify changes
   - Display before/after comparison

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | Ticket ID to update |
| status | string | No | - | New status name |
| priority | integer | No | - | Priority 1-4 |
| queue | string | No | - | Target queue name |
| due_date | string | No | - | Due date (YYYY-MM-DD) |
| assigned_resource | string | No | - | Resource email or name |

## Examples

### Update Status

```
/update-ticket 12345 --status "In Progress"
```

### Change Priority and Status

```
/update-ticket 12345 --status "In Progress" --priority 3
```

### Move to Different Queue

```
/update-ticket 12345 --queue "Escalations"
```

### Update Due Date

```
/update-ticket 12345 --due_date "2026-02-10"
```

### Reassign and Update Status

```
/update-ticket 12345 --assigned_resource "jane.doe@msp.com" --status "In Progress"
```

## Output

```
Ticket Updated Successfully

Ticket: T20240215.0042 (ID: 12345)
Company: Acme Corporation

Changes Applied:
  Status: New -> In Progress
  Priority: Medium (2) -> High (3)

Current State:
  Status: In Progress
  Priority: High (3)
  Queue: Service Desk
  Assignee: John Technician
  Due Date: 2026-02-10 17:00

URL: https://ww5.autotask.net/Mvc/ServiceDesk/TicketDetail.mvc?ticketId=12345
```

## Error Handling

### Ticket Not Found

```
Error: Ticket not found: 12345

Please verify the ticket ID and try again.
Use /search-tickets to find the correct ticket ID.
```

### Invalid Status

```
Error: Invalid status: "Invalid Status"

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

### Permission Denied

```
Error: Permission denied

You do not have permission to update this ticket.
Contact your Autotask administrator for access.
```

### Resource Not Found

```
Error: Resource not found: "unknown@msp.com"

Did you mean one of these?
- jane.doe@msp.com (Jane Doe)
- john.doe@msp.com (John Doe)
```

## MCP Tool Usage

This command uses the following autotask-mcp tools:
- `autotask_get_ticket_details` - Fetch current ticket state
- `autotask_list_ticket_statuses` - Get available statuses
- `autotask_list_ticket_priorities` - Get available priorities
- `autotask_list_queues` - Get available queues
- `autotask_search_resources` - Lookup resource by name/email

## Related Commands

- `/create-ticket` - Create new ticket
- `/search-tickets` - Search existing tickets
- `/add-note` - Add note to ticket
- `/reassign-ticket` - Reassign ticket to different resource
