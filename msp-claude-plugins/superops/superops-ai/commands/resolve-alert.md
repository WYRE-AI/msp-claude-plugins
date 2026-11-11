---
description: Resolve an RMM alert and optionally create a ticket
argument-hint: "<alert_id> [resolution_note] [create_ticket] [ticket_subject]"
arguments: [alert_id, resolution_note, create_ticket, ticket_subject]
---

# Resolve SuperOps.ai Alert

Resolve an RMM alert. Optionally record the work on a new ticket.

## How this runs through Conduit

The Conduit `superops` connector has **no alert tool**. Resolving goes through
the generic GraphQL passthrough `superops_custom_mutation`, which is admin tier.
It runs an arbitrary mutation against the tenant, so every call needs a named
human approver who has seen the exact mutation text and variables. Never run it
from a scheduled or unattended agent.

The ticket is created with the typed `superops_tickets_create` tool (write tier).
The schema has no alert-to-ticket mutation. If the operator has no `admin` grant
on SuperOps, stop and say so rather than looking for another route.

## Steps

1. **Confirm the alert.** Read it with `getAlertList` or `getAlertsForAsset`
   through `superops_custom_query`, exactly as in `/acknowledge-alert`. Show
   the operator its `message`, `severity`, `status` and asset. If `resolvedTime`
   is already set, report that and stop.

2. **Resolve the alert.** `resolveAlerts` takes a list of `{ id }` and returns a
   bare `Boolean`:

   ```graphql
   mutation resolveAlerts($input: [ResolveAlertInput]) {
     resolveAlerts(input: $input)
   }
   ```

   ```json
   { "input": [{ "id": "<alert_id>" }] }
   ```

   The mutation takes no resolution note. A `false` result means SuperOps did not
   resolve the alert, so report it and do not retry blindly.

3. **Create a ticket, if requested.** Call `superops_tickets_create`:

   ```json
   {
     "subject": "<ticket_subject, or the alert message>",
     "clientId": "<accountId from the asset's client JSON>",
     "description": "Alert <alert_id> on <asset name>: <message>\n\nResolution: <resolution_note>",
     "status": "Resolved"
   }
   ```

   Take the client's `accountId` from `superops_assets_get` on the alerting asset.

4. **Record the resolution note.** If there is a ticket, call
   `superops_tickets_add_note` with the `resolution_note`. Otherwise give the note
   back to the operator. The alert itself cannot store it.

5. **Confirm.** Re-read the alert and report its `status` and `resolvedTime`, plus
   the ticket's `displayId` if one was created.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| alert_id | string | Yes | - | The alert `id` |
| resolution_note | string | No | - | What was done. Goes on the ticket, not the alert |
| create_ticket | boolean | No | false | Record the work as a ticket |
| ticket_subject | string | No | alert message | Ticket subject |

## Examples

```
/resolve-alert 4417
/resolve-alert 4417 --resolution_note "Cleared 50 GB of temp files" --create_ticket true --ticket_subject "ACME-DC01: Disk cleanup performed"
```

## Output

```
Alert 4417 resolved (resolveAlerts returned true)
  Asset: ACME-DC01
  Message: Disk Space Critical: C: drive at 5% free
  Resolved at: 2026-02-04T14:45:00Z

Ticket created: #1042 "ACME-DC01: Disk cleanup performed" (Resolved)
  Note added: Cleared 50 GB of temp files
```

## Error Handling

| Situation | Response |
|-----------|----------|
| Alert not found | Re-check the ID with `/list-alerts` |
| `resolveAlerts` returns `false` | Report it. Do not assume the alert was resolved |
| Alert resolved but ticket creation failed | Report the resolved alert and offer `/create-ticket` |
| No `admin` grant | Stop and say so |

## When to Create Tickets

Create a ticket when the work is billable, needs follow-up or documentation, may
recur, or needs client communication. Skip it for transient alerts that cleared
by themselves and for false positives.

## Related Commands

- `/list-alerts` - List alerts
- `/acknowledge-alert` - Acknowledge an alert
- `/create-ticket` - Create a ticket manually
- `/get-asset` - View asset details
- `/run-script` - Run a remediation script
