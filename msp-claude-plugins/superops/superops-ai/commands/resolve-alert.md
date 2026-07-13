---
description: Resolve an RMM alert and optionally create a ticket
argument-hint: "<alert_id> [resolution_note] [create_ticket] [ticket_subject]"
arguments: [alert_id, resolution_note, create_ticket, ticket_subject]
---

# Resolve SuperOps.ai Alert

Resolve an RMM alert and optionally create a ticket for documentation or follow-up.

## Prerequisites

- Valid SuperOps.ai API token configured
- Alert must exist and not already be resolved
- User must have alert management permissions
- RMM module enabled in SuperOps.ai

## Steps

1. **Validate alert exists**
   - Query alert by ID
   - Return error if alert not found
   - Show current alert details for confirmation

2. **Check alert status**
   - Can resolve from Active or Acknowledged status
   - Warn if already resolved
   - Show resolution history if exists

3. **Resolve the alert**
   ```graphql
   mutation resolveAlerts($input: ResolveAlertInput!) {
     resolveAlerts(input: $input) {
       alert {
         alertId
         status
         resolvedTime
         resolvedBy {
           id
           name
         }
         resolutionNotes
       }
       ticket {
         ticketId
         ticketNumber
         subject
       }
       errors {
         field
         message
       }
     }
   }
   ```

   Variables:
   ```json
   {
     "input": {
       "alertIds": ["<alert_id>"],
       "resolutionNotes": "<resolution_note>",
       "createTicket": false,
       "ticketSubject": "<ticket_subject>"
     }
   }
   ```

4. **Create ticket if requested**
   - If create_ticket is true, create linked ticket
   - Use ticket_subject or generate from alert message
   - Link ticket to alert and asset

5. **Confirm resolution**
   - Display updated alert status
   - Show ticket details if created
   - Confirm documentation is complete

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| alert_id | string | Yes | - | The alert ID to resolve |
| resolution_note | string | No | - | Note explaining the resolution |
| create_ticket | boolean | No | false | Create a ticket from this alert |
| ticket_subject | string | No | - | Subject if creating ticket |

## Examples

### Basic Resolution

```
/resolve-alert alert_9876
```

### With Resolution Note

```
/resolve-alert alert_9876 --resolution_note "Disk space cleared by removing temp files"
```

### Create Ticket on Resolution

```
/resolve-alert alert_9876 --create_ticket true --ticket_subject "Server disk space issue - resolved"
```

### With Custom Ticket Subject

```
/resolve-alert alert_9876 --resolution_note "Cleared 50GB of temp files" --create_ticket true --ticket_subject "ACME-DC01: Disk cleanup performed"
```

## Output

### Basic Resolution

```
Alert Resolved Successfully

Alert ID: alert_9876
Status: Acknowledged -> Resolved

Alert Details:
  Asset: ACME-DC01
  Client: Acme Corporation
  Type: Disk Space
  Severity: Critical
  Message: Disk Space Critical: C: drive at 5% free

Resolution:
  Resolved By: Jane Technician
  Resolved At: 2026-02-04 14:45:00 UTC
  Note: Disk space cleared by removing temp files

Duration:
  Created: 2026-02-04 12:30:00 UTC
  Acknowledged: 2026-02-04 14:32:00 UTC
  Resolved: 2026-02-04 14:45:00 UTC
  Total Time: 2h 15m
```

### Resolution with Ticket Created

```
Alert Resolved Successfully

Alert ID: alert_9876
Status: Active -> Resolved

Alert Details:
  Asset: ACME-DC01
  Client: Acme Corporation
  Type: Disk Space
  Severity: Critical
  Message: Disk Space Critical: C: drive at 5% free

Resolution:
  Resolved By: Jane Technician
  Resolved At: 2026-02-04 14:45:00 UTC
  Note: Cleared 50GB of temp files

Ticket Created:
  Ticket Number: TICK-2026-0123
  Subject: ACME-DC01: Disk cleanup performed
  Status: Resolved
  URL: https://yourcompany.superops.ai/tickets/ticket-uuid

The ticket has been linked to this alert and asset for tracking.
```

### Already Resolved

```
Alert Already Resolved

Alert ID: alert_9876
Status: Resolved

Previous Resolution:
  Resolved By: John Smith
  Resolved At: 2026-02-04 12:00:00 UTC
  Note: Issue auto-cleared after restart

This alert has already been resolved.
If the issue has returned, a new alert should be triggered.
```

## curl Example

```bash
curl -X POST 'https://yourcompany.superops.ai/graphql' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation resolveAlerts($input: ResolveAlertInput!) { resolveAlerts(input: $input) { alert { alertId status resolvedTime resolvedBy { id name } resolutionNotes } ticket { ticketId ticketNumber subject } } }",
    "variables": {
      "input": {
        "alertIds": ["alert-uuid-here"],
        "resolutionNotes": "Disk space cleared by removing temp files",
        "createTicket": true,
        "ticketSubject": "Server disk space issue - resolved"
      }
    }
  }'
```

## Error Handling

### Alert Not Found

```
Alert not found: "alert_99999"

Please verify the alert ID is correct.
Use /list-alerts to find active alerts.
```

### Alert Already Resolved

```
Alert already resolved: "alert_9876"

Resolved By: John Smith
Resolved At: 2026-02-04 12:00:00 UTC

If the issue has reoccurred, check for a new active alert.
Use /list-alerts --asset_id <asset_id> to see current alerts.
```

### Ticket Creation Failed

```
Alert resolved but ticket creation failed.

Alert ID: alert_9876
Status: Resolved

Ticket Error: Invalid client configuration

The alert has been resolved. To create a ticket manually:
/create-ticket "Acme Corporation" "ACME-DC01: Disk space issue"
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid alert ID | Verify alert exists using /list-alerts |
| Already resolved | Alert was already resolved |
| Invalid ticket subject | Provide a valid ticket subject |
| Permission denied | Check user permissions for alert management |
| Rate limited | Wait and retry (800 req/min limit) |

## When to Create Tickets

Create a ticket when:
- Work was performed that should be billed
- Follow-up actions are needed
- Documentation is required for compliance
- The issue may recur and needs tracking
- Client communication is required

Skip ticket creation when:
- Alert auto-resolved (transient issue)
- No significant work was performed
- Issue was a false positive
- Monitoring threshold needs adjustment

## Best Practices

1. **Add resolution notes** - Document what was done
2. **Create tickets for significant work** - Track billable time
3. **Be specific** - Future technicians will thank you
4. **Review patterns** - Recurring alerts may need root cause analysis
5. **Verify resolution** - Confirm the issue is actually fixed

## Related Commands

- `/list-alerts` - List active alerts
- `/acknowledge-alert` - Acknowledge an alert
- `/create-ticket` - Create ticket manually
- `/get-asset` - View asset details
- `/run-script` - Run remediation script
