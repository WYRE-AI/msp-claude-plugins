---
description: Reassign a ticket to a different resource or queue
argument-hint: "<ticket_id> [resource] [queue] [note]"
arguments: [ticket_id, resource, queue, note]
---

# Reassign Autotask Ticket

Reassign a ticket to a different resource or queue for workload balancing and escalation workflows.

## Prerequisites

- Valid Autotask API credentials configured
- Ticket must exist and be accessible
- User must have ticket update permissions
- Either resource or queue (or both) is required

## Steps

1. **Validate ticket exists**
   - Use `autotask-mcp/autotask_get_ticket_details` to fetch ticket
   - Display current assignment for confirmation

2. **Resolve target assignment**
   - If resource provided, lookup resource ID via `autotask-mcp/autotask_search_resources`
   - If queue provided, lookup queue ID via `autotask-mcp/autotask_list_queues`
   - Validate resource/queue exists and is active

3. **Apply reassignment**
   - Update ticket with new assignee and/or queue
   - Preserve other ticket fields

4. **Add reassignment note (if provided)**
   - Use `autotask-mcp/autotask_create_ticket_note` to document reason
   - Mark note as internal for audit trail

5. **Confirm changes**
   - Display updated ticket assignment
   - Show reassignment summary

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | Ticket ID to reassign |
| resource | string | No* | - | Resource email or name |
| queue | string | No* | - | Queue name |
| note | string | No | - | Reassignment reason |

*Either resource or queue (or both) is required

## Examples

### Reassign to Resource

```
/reassign-ticket 12345 --resource "jane.doe@msp.com"
```

### Reassign to Queue

```
/reassign-ticket 12345 --queue "Level 2 Support"
```

### Reassign with Note

```
/reassign-ticket 12345 --resource "jane.doe@msp.com" --note "Taking over while John is OOO"
```

### Escalate to Queue with Note

```
/reassign-ticket 12345 --queue "Escalations" --note "Escalating per customer request - needs senior engineer"
```

### Change Both Resource and Queue

```
/reassign-ticket 12345 --resource "senior.tech@msp.com" --queue "Escalations" --note "Escalating complex network issue"
```

### Unassign from Resource (Queue Only)

```
/reassign-ticket 12345 --queue "Service Desk" --note "Returning to queue for reassignment"
```

## Output

### Successful Reassignment

```
Ticket Reassigned Successfully

Ticket: T20240215.0042 (ID: 12345)
Company: Acme Corporation
Title: Email not working

Previous Assignment:
  Resource: John Technician
  Queue: Service Desk

New Assignment:
  Resource: Jane Specialist
  Queue: Service Desk

Reassignment Note Added:
  "Taking over while John is OOO"

URL: https://ww5.autotask.net/Mvc/ServiceDesk/TicketDetail.mvc?ticketId=12345
```

### Queue Change

```
Ticket Moved to New Queue

Ticket: T20240215.0042 (ID: 12345)
Company: Acme Corporation
Title: Email not working

Previous Assignment:
  Resource: John Technician
  Queue: Service Desk

New Assignment:
  Resource: Unassigned
  Queue: Level 2 Support

Reassignment Note Added:
  "Escalating - requires advanced Exchange troubleshooting"

The ticket is now in the Level 2 Support queue awaiting assignment.
```

### Resource and Queue Change

```
Ticket Escalated

Ticket: T20240215.0042 (ID: 12345)
Company: Acme Corporation
Title: Email not working

Previous Assignment:
  Resource: John Technician
  Queue: Service Desk

New Assignment:
  Resource: Senior Engineer
  Queue: Escalations

Reassignment Note Added:
  "Escalating complex issue - customer experiencing significant business impact"

Escalation complete. Senior Engineer has been notified.
```

## Error Handling

### Missing Assignment Target

```
Error: Either resource or queue is required

Usage:
  /reassign-ticket 12345 --resource "jane.doe@msp.com"
  /reassign-ticket 12345 --queue "Escalations"
  /reassign-ticket 12345 --resource "jane@msp.com" --queue "Level 2"
```

### Ticket Not Found

```
Error: Ticket not found: 12345

Please verify the ticket ID and try again.
Use /search-tickets to find the correct ticket ID.
```

### Resource Not Found

```
Error: Resource not found: "unknown@msp.com"

Did you mean one of these?
- jane.doe@msp.com (Jane Doe - Available)
- john.doe@msp.com (John Doe - Available)
- james.smith@msp.com (James Smith - OOO until Feb 10)

Use /search-resources to find available resources.
```

### Queue Not Found

```
Error: Queue not found: "Level 3 Support"

Available queues:
- Service Desk
- Level 2 Support
- Escalations
- Projects
- Monitoring Alerts

Check queue name spelling and try again.
```

### Resource Unavailable

```
Warning: Resource may be unavailable

Jane Doe is marked as Out of Office until 2026-02-10.

Proceed with reassignment anyway?
  - Yes: Assignment will be made but ticket may not be worked immediately
  - No: Choose a different resource

Alternatively, assign to queue only:
  /reassign-ticket 12345 --queue "Level 2 Support"
```

### Same Assignment

```
Note: No changes made

Ticket is already assigned to:
  Resource: Jane Doe
  Queue: Service Desk

No update was necessary.
```

### Permission Denied

```
Error: Permission denied

You do not have permission to reassign this ticket.
This may be due to:
  - Ticket owned by different team
  - Resource not in your department
  - Queue restrictions

Contact your Autotask administrator for access.
```

## Common Reassignment Scenarios

| Scenario | Command |
|----------|---------|
| Escalate to senior | `--resource "senior@msp.com" --note "Complex issue"` |
| Move to escalation queue | `--queue "Escalations"` |
| Hand off for vacation | `--resource "backup@msp.com" --note "Coverage for PTO"` |
| Return to queue | `--queue "Service Desk" --note "Needs reassignment"` |
| Specialist assignment | `--resource "specialist@msp.com" --queue "Specialists"` |

## MCP Tool Usage

This command uses the following autotask-mcp tools:
- `autotask_get_ticket_details` - Verify ticket and get current state
- `autotask_search_resources` - Lookup resource by name/email
- `autotask_list_queues` - Validate queue name
- `autotask_create_ticket_note` - Add reassignment note (if provided)

## Related Commands

- `/update-ticket` - Update other ticket fields
- `/add-note` - Add note without reassigning
- `/my-tickets` - View your assigned tickets
- `/search-tickets` - Search tickets by assignee
