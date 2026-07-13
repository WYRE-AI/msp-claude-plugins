---
description: Resolve an RMM alert in Atera
argument-hint: "<alert_id> [resolution_note] [create_ticket] [ticket_title]"
arguments: [alert_id, resolution_note, create_ticket, ticket_title]
---

# Resolve Atera Alert

Resolve an RMM alert and optionally create an associated ticket for documentation.

## Prerequisites

- Valid Atera API key configured
- Alert must exist and be in an open state
- User must have alert management permissions

## Steps

1. **Get alert details**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/alerts/{alert_id}" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```
   - Validate alert exists
   - Capture alert details for ticket creation if needed
   - Check if already resolved

2. **Create ticket if requested**
   If `--create_ticket true`:
   ```bash
   curl -s -X POST "https://app.atera.com/api/v3/tickets" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "TicketTitle": "<ticket_title or alert title>",
       "Description": "Alert resolved: <alert details>\n\nResolution: <resolution_note>",
       "EndUserID": <customer_contact_id>,
       "TicketPriority": "<based on alert severity>",
       "TicketType": "Incident"
     }'
   ```

3. **Resolve the alert**
   ```bash
   curl -s -X POST "https://app.atera.com/api/v3/alerts/{alert_id}/resolve" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "ResolutionNote": "<resolution_note>"
     }'
   ```

4. **Return resolution confirmation**
   - Alert ID and original title
   - Resolution timestamp
   - Resolution note
   - Ticket ID if created

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| alert_id | integer | Yes | - | The alert ID to resolve |
| resolution_note | string | No | - | Description of the resolution |
| create_ticket | boolean | No | false | Create a ticket from this alert |
| ticket_title | string | No | - | Custom title for the ticket |

## Examples

### Simple Resolution

```
/resolve-alert 9876
```

### Resolution with Note

```
/resolve-alert 9876 --resolution_note "Disk space issue resolved by cleanup script"
```

### Create Ticket from Alert

```
/resolve-alert 9876 --create_ticket true --ticket_title "Critical disk alert - resolved"
```

### Resolution with Full Details

```
/resolve-alert 9876 --resolution_note "Ran disk cleanup, removed 50GB of temp files" --create_ticket true
```

## Output

### Basic Resolution

```
Alert Resolved Successfully

Alert ID: 9876
Title: Disk Space Critical (<5%)
Device: SERVER-DC01
Customer: Acme Corporation

Resolution Note: Disk space issue resolved by cleanup script
Resolved At: 2026-02-04 10:30:00
Resolved By: John Tech
```

### Resolution with Ticket Creation

```
Alert Resolved Successfully

Alert ID: 9876
Title: Disk Space Critical (<5%)
Device: SERVER-DC01
Customer: Acme Corporation

Resolution Note: Ran disk cleanup, removed 50GB of temp files
Resolved At: 2026-02-04 10:30:00

Ticket Created:
Ticket ID: 54321
Title: Critical disk alert - resolved
URL: https://app.atera.com/new/rmm/ticket/54321
```

## Error Handling

### Alert Not Found

```
Alert not found: 9876

Please verify the alert ID and try again.
Use /list-alerts to find valid alert IDs.
```

### Alert Already Resolved

```
Alert 9876 is already resolved

Original Alert: Disk Space Critical (<5%)
Resolved At: 2026-02-04 09:00:00
Resolved By: Jane Smith

No action taken.
```

### Ticket Creation Failed

```
Alert resolved, but ticket creation failed

Alert ID: 9876
Status: Resolved

Ticket Error: Customer contact not found
Please create the ticket manually if needed.
```

### Rate Limit Exceeded

```
Rate limit exceeded (700 req/min)

Waiting 30 seconds before retry...
```

### Insufficient Permissions

```
Permission denied: Cannot resolve alert 9876

Contact your administrator to verify your permissions.
```

## API Patterns

### Get Alert Details
```http
GET /api/v3/alerts/{alertId}
X-API-KEY: {api_key}
```

### Resolve Alert
```http
POST /api/v3/alerts/{alertId}/resolve
X-API-KEY: {api_key}
Content-Type: application/json

{
  "ResolutionNote": "Issue resolved by running cleanup script"
}
```

### Create Ticket (if needed)
```http
POST /api/v3/tickets
X-API-KEY: {api_key}
Content-Type: application/json

{
  "TicketTitle": "Critical disk alert - resolved",
  "Description": "Alert: Disk Space Critical\nDevice: SERVER-DC01\n\nResolution: Disk space issue resolved by cleanup script",
  "EndUserID": 12345,
  "TicketPriority": "High",
  "TicketType": "Incident"
}
```

### Alert Severity to Ticket Priority Mapping

| Alert Severity | Ticket Priority |
|----------------|-----------------|
| Critical | High |
| Warning | Medium |
| Information | Low |

## Related Commands

- `/list-alerts` - List active alerts
- `/create-ticket` - Create a new ticket
- `/search-agents` - Search for RMM agents
