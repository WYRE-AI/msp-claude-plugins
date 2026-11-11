---
description: Update fields on an existing SuperOps.ai ticket
argument-hint: "<ticket_id> [status] [priority] [technician_id] [tech_group_id] [category] [resolution_code]"
arguments: [ticket_id, status, priority, technician_id, tech_group_id, category, resolution_code]
---

# Update SuperOps.ai Ticket

Change a ticket's status, priority, assignment, category or resolution code.

## How this runs through Conduit

Use the typed tool `superops_tickets_update` (write tier). It sends
`updateTicket`. The tool also accepts `subject`, `impact`, `urgency`,
`subcategory` and `requestType`. The schema has no due-date field on a ticket.

## Steps

1. **Read the ticket.** Call `superops_tickets_get` and show its current
   `status`, `priority` and `technician`.
2. **Resolve the assignee.** If the user gave a name, find the `userId` with
   `superops_technicians_list` (`search`) or the `groupId` with
   `superops_technicians_groups`.
3. **Update.**

   ```json
   {
     "ticketId": "<ticket_id>",
     "status": "<status>",
     "priority": "<priority>",
     "technicianId": "<technician user id>"
   }
   ```

   Send only the fields that change. Status and priority must match the tenant's
   lists. Stock statuses are Open, On Hold, Resolved, Closed and Waiting on third
   party. When resolving, also set `resolutionCode`. Put free-text resolution
   notes in `/add-ticket-note`.
4. **Report** the before and after values for each changed field.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ticket_id | string | Yes | Ticket ID |
| status | string | No | The tenant's status value |
| priority | string | No | The tenant's priority value |
| technician_id | string | No | Technician `userId` |
| tech_group_id | string | No | Technician group `groupId` |
| category | string | No | The tenant's category value |
| resolution_code | string | No | Stock values: Permanent Fix, Workaround, Resolved by Requester, Exception |

## Examples

```
/update-ticket 88213 --status "On Hold"
/update-ticket 88213 --priority Critical --tech_group_id 40021
/update-ticket 88213 --status Resolved --resolution_code "Permanent Fix"
```

## Output

```
Ticket #1042 updated
  Status:   Open -> On Hold
  Priority: Medium -> High
  Technician: (none) -> John Smith
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Ticket not found | Look it up with `superops_tickets_list` |
| Unknown status or priority | Read the tenant's lists with `getAllFields(input: "TICKET")` through `superops_custom_query` |
| Technician not found | Search with `superops_technicians_list` |
| Rate limited | Wait and retry (800 req/min limit) |

## Related Commands

- `/create-ticket` - Create a new ticket
- `/add-ticket-note` - Add a note
- `/log-time` - Log a worklog entry
