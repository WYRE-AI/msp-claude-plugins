---
description: Resolve an RMM alert in Syncro
argument-hint: "<alert_id> [resolution_note] [create_ticket] [ticket_subject]"
arguments: [alert_id, resolution_note, create_ticket, ticket_subject]
---

# Resolve Syncro RMM Alert

Resolve an RMM alert and optionally create a ticket or add resolution notes.

## Prerequisites

- Valid Syncro API key configured
- Alert must exist and be active
- User must have alert resolve permissions

## Steps

1. **Validate alert exists**
   - Fetch alert details
   - Confirm alert is active
   - Display alert information

2. **Resolve the alert**
   ```bash
   curl -s -X PUT \
     "https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/rmm_alerts/${alert_id}/resolve?api_key=${SYNCRO_API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "resolution_note": "<resolution_note>"
     }'
   ```

3. **Create ticket if requested**
   ```bash
   # Only if create_ticket is true
   curl -s -X POST \
     "https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/tickets?api_key=${SYNCRO_API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "customer_id": <customer_id>,
       "subject": "<ticket_subject>",
       "body": "Resolved RMM Alert: <alert_details>\n\nResolution: <resolution_note>"
     }'
   ```

4. **Confirm and return details**
   - Show alert was resolved
   - Show ticket if created
   - Provide links

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| alert_id | integer | Yes | - | The alert ID to resolve |
| resolution_note | string | No | - | Note explaining the resolution |
| create_ticket | boolean | No | false | Create a ticket from this alert |
| ticket_subject | string | No | auto | Subject if creating ticket |

## API Endpoints Used

```
PUT /api/v1/rmm_alerts/{id}/resolve
GET /api/v1/rmm_alerts/{id} (for validation)
POST /api/v1/tickets (if create_ticket=true)
```

## Examples

### Basic Resolution

```
/resolve-alert 9876
```

### With Resolution Note

```
/resolve-alert 9876 --resolution_note "Disk space cleared by removing temp files"
```

### Create Ticket

```
/resolve-alert 9876 --create_ticket true
```

### Create Ticket with Custom Subject

```
/resolve-alert 9876 --create_ticket true --ticket_subject "Server disk space issue - resolved"
```

### Full Documentation

```
/resolve-alert 9876 --resolution_note "Cleared 50GB of temp files. Scheduled weekly cleanup task." --create_ticket true --ticket_subject "ACME-DC01 disk space remediation"
```

## Output

### Basic Resolution

```
Alert Resolved Successfully

Alert ID: 9876
Type: Disk Space < 5%
Asset: ACME-DC01
Customer: Acme Corporation

Status: Resolved
Resolved At: 2026-02-04 11:30:00
Resolved By: Jane Technician

Resolution Note: (none provided)
```

### With Resolution Note

```
Alert Resolved Successfully

Alert ID: 9876
Type: Disk Space < 5%
Asset: ACME-DC01
Customer: Acme Corporation

Status: Resolved
Resolved At: 2026-02-04 11:30:00
Resolved By: Jane Technician

Resolution Note:
"Disk space cleared by removing temp files"
```

### With Ticket Created

```
Alert Resolved Successfully

Alert ID: 9876
Type: Disk Space < 5%
Asset: ACME-DC01
Customer: Acme Corporation

Status: Resolved
Resolved At: 2026-02-04 11:30:00
Resolved By: Jane Technician

Resolution Note:
"Cleared 50GB of temp files. Scheduled weekly cleanup task."

Ticket Created:
  Ticket #: 1055
  Subject: ACME-DC01 disk space remediation
  URL: https://acme.syncromsp.com/tickets/54321
```

## Error Handling

### Alert Not Found

```
Error: Alert not found

Alert ID 99999 does not exist or you do not have access.

Suggestions:
- Verify the alert ID is correct
- Use /list-alerts to find active alerts
```

### Alert Already Resolved

```
Error: Alert already resolved

Alert ID 9876 was resolved on 2026-02-03 by John Tech.

Resolution note: "Restarted service"

No action needed.
```

### Permission Denied

```
Error: Permission denied (403)

You do not have permission to resolve this alert.

Contact your Syncro administrator if you need access.
```

### Ticket Creation Failed

```
Alert Resolved Successfully

Alert ID: 9876
Status: Resolved

Warning: Ticket creation failed

Error: Unable to create ticket - missing required fields.

The alert was resolved, but the ticket was not created.
Create manually: /create-ticket <customer_id> "<subject>"
```

### Rate Limiting

```
Rate limited by Syncro API (180 req/min)

Retrying in 5 seconds...
```

### RMM Not Enabled

```
Error: RMM not enabled

Your Syncro account does not have RMM features enabled.

Contact Syncro support to enable RMM functionality.
```

## Tips

### Quick Resolution

For simple acknowledgments:

```
/resolve-alert 9876
```

### Documentation Best Practices

Always include a resolution note for audit trail:

```
/resolve-alert 9876 --resolution_note "Verified false positive - no action needed"
```

### Creating Tickets for Billing

If work was performed, create a ticket for time logging:

```
/resolve-alert 9876 --create_ticket true --resolution_note "Cleared temp files"
# Then log time
/log-time <ticket_id> 15 --notes "Disk cleanup"
```

### Batch Resolution Workflow

Review and resolve multiple alerts:

```
/list-alerts --severity Low
# Review each alert
/resolve-alert 9876 --resolution_note "Acknowledged"
/resolve-alert 9877 --resolution_note "Acknowledged"
```

### Auto-Generated Ticket Subject

If --ticket_subject is not provided, it defaults to:

```
"RMM Alert: <alert_type> - <asset_name>"
```

Example: "RMM Alert: Disk Space < 5% - ACME-DC01"

## Related Commands

- `/list-alerts` - List active RMM alerts
- `/get-customer` - Get customer details
- `/search-assets` - Search for assets
- `/create-ticket` - Create a standalone ticket
- `/log-time` - Log time against a ticket
