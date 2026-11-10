---
description: Add a note (internal or public) to an existing SuperOps.ai ticket
argument-hint: "<ticket_id> <note> [type]"
arguments: [ticket_id, note, type]
---

# Add SuperOps.ai Ticket Note

Add an internal or public note to an existing SuperOps.ai ticket.

## How this runs through Conduit

Use the typed tool `superops_tickets_add_note` (write tier). It sends
`createNote` with `workItem: { workId: <ticket_id>, module: TICKET }` and
`privacyType` set to `PUBLIC` or `PRIVATE`. The schema has no `addTicketNote`
mutation.

## Steps

1. **Confirm the ticket.** Call `superops_tickets_get` with `ticketId` and show the
   subject. If the user gave the human-facing number (`displayId`), find the
   ticket with `superops_tickets_list` first. The tools take `ticketId`.
2. **Pick the visibility.** The default is internal. A public note is visible
   to the client and cannot be unsent, so confirm with the user before sending
   one.
3. **Add the note.**

   ```json
   { "ticketId": "<ticket_id>", "content": "<note>", "isPublic": false }
   ```

4. **Confirm.** Report the returned `noteId`, `privacyType` and `addedOn`.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | string | Yes | - | Ticket ID |
| note | string | Yes | - | Note content (multi-line supported) |
| type | string | No | internal | `internal` maps to `PRIVATE`, `public` maps to `PUBLIC` |

`createNote` has no notify-customer switch. Whether the client is emailed
depends on the tenant's notification rules for public notes.

## Examples

```
/add-ticket-note 88213 "Contacted customer, awaiting callback"
/add-ticket-note 88213 "We've identified the cause and a technician is working on the fix." --type public
```

## Output

```
Note added to ticket #1042 - Email not working - Outlook disconnected
  Note ID: 551203
  Visibility: PRIVATE (technicians only)
  Added: 2026-02-04T14:45:00Z
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Ticket not found | Look it up with `superops_tickets_list` |
| Empty note | Ask for the content |
| Permission denied | Check the API user's ticket permissions |
| Rate limited | Wait and retry (800 req/min limit) |

## Related Commands

- `/create-ticket` - Create a new ticket
- `/update-ticket` - Update status or assignment
- `/log-time` - Log a worklog entry
