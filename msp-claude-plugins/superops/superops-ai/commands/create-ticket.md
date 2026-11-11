---
description: Create a new service ticket in SuperOps.ai
argument-hint: "<client> <subject> [description] [priority] [requester] [tech-group]"
arguments: [client, subject, description, priority, requester, tech-group]
---

# Create SuperOps.ai Ticket

Create a new service ticket in SuperOps.ai.

## How this runs through Conduit

Use the typed tool `superops_tickets_create` (write tier). It sends
`createTicket` and fills in the required `source` (`INTEGRATION`).

## Steps

1. **Resolve the client.** Call `superops_clients_search` with the name and take
   its `accountId`. If several clients match, show them and ask which one.
2. **Check for duplicates.** Call `superops_tickets_list` with `clientId` and warn
   about open tickets with a similar subject.
3. **Resolve the optional names to IDs.**
   - requester: find the client user with `superops_custom_query` and
     `getClientUserList` (see the clients skill reference). Use its `userId`.
   - tech group: call `superops_technicians_groups` and use the `groupId`.
4. **Create the ticket.**

   ```json
   {
     "subject": "<subject>",
     "clientId": "<accountId>",
     "description": "<description>",
     "priority": "<priority>",
     "requesterId": "<client user id>",
     "techGroupId": "<group id>"
   }
   ```

5. **Report.** Show the returned `displayId` (the ticket number), `ticketId` and
   `status`.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client | string | Yes | - | Client name or account ID |
| subject | string | Yes | - | Brief summary of the issue |
| description | string | No | - | Detailed description. Write-only, and not returned on reads |
| priority | string | No | tenant default | Must match the tenant's list. Stock values are Critical, High, Medium, Low and Very Low |
| requester | string | No | - | Client user name or email |
| tech-group | string | No | - | Technician group name |

## Examples

```
/create-ticket "Acme Corp" "Email not working"
/create-ticket "Acme Corp" "Email not working" --description "Several users can't send since 09:00" --priority High --tech-group "Service Desk"
```

## Output

```
Ticket created: #1042 (ticketId 88213)
  Client: Acme Corporation
  Subject: Email not working
  Priority: High
  Status: Open
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Client not found | Offer the closest matches from `superops_clients_search` |
| Unknown priority | Use the tenant's value. Read the list with `getAllFields(input: "TICKET")` through `superops_custom_query` |
| Unknown tech group | List the groups with `superops_technicians_groups` |
| Rate limited | Wait and retry (800 req/min limit) |

## Related Commands

- `/update-ticket` - Update ticket details
- `/add-ticket-note` - Add a note
- `/list-assets` - View client assets
