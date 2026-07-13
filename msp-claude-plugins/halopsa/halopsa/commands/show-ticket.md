---
description: Display comprehensive ticket information including history, actions, and related entities
argument-hint: "<ticket_id> [include_actions] [include_attachments] [include_assets] [format]"
arguments: [ticket_id, include_actions, include_attachments, include_assets, format]
---

# Show HaloPSA Ticket

Display comprehensive ticket information including history, actions, attachments, and related entities.

## Prerequisites

- Valid HaloPSA OAuth credentials configured
- Ticket must exist in HaloPSA
- User must have ticket read permissions

## Steps

1. **Authenticate with OAuth 2.0**
   - Obtain access token using client credentials flow
   - Token endpoint: `{base_url}/auth/token?tenant={tenant}`
   ```bash
   # Get OAuth token
   TOKEN=$(curl -s -X POST "{base_url}/auth/token?tenant={tenant}" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials" \
     -d "client_id={client_id}" \
     -d "client_secret={client_secret}" \
     -d "scope=all" | jq -r '.access_token')
   ```

2. **Fetch ticket details**
   ```bash
   curl -s -X GET "{base_url}/api/Tickets/{ticket_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

3. **Fetch actions (if requested)**
   ```bash
   curl -s -X GET "{base_url}/api/Actions?ticket_id={ticket_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

4. **Fetch attachments (if requested)**
   ```bash
   curl -s -X GET "{base_url}/api/Attachment?ticket_id={ticket_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

5. **Fetch linked assets (if requested)**
   ```bash
   curl -s -X GET "{base_url}/api/Asset?ticket_id={ticket_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

6. **Format and display results**
   - Apply requested format (summary/full/json)
   - Calculate SLA status and remaining time
   - Show action timeline if included

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | The HaloPSA ticket ID |
| include_actions | boolean | No | true | Include action history |
| include_attachments | boolean | No | false | List attachments |
| include_assets | boolean | No | false | Include linked assets |
| format | string | No | summary | Output: summary/full/json |

## Examples

### Basic Ticket View

```
/show-ticket 12345
```

### Full Details with All Includes

```
/show-ticket 12345 --include_actions true --include_attachments true --include_assets true --format full
```

### JSON Output for Scripting

```
/show-ticket 12345 --format json
```

### Quick View Without Actions

```
/show-ticket 12345 --include_actions false
```

### With Assets

```
/show-ticket 12345 --include_assets true
```

## Output

### Summary Format (Default)

```
================================================================================
Ticket #12345 - Email not working
================================================================================

Client:       Acme Corporation
Contact:      John Smith (john.smith@acme.com)
Site:         Main Office

Status:       In Progress
Priority:     High (2)
Type:         Incident
Category:     Email/Exchange

Agent:        Jane Tech
Team:         Service Desk
Created:      2024-02-15 09:23:00
Updated:      2024-02-15 14:45:00

SLA Status:   ⚠️  At Risk
Response:     ✓ Met (responded in 12 min)
Resolution:   Due in 45 minutes (2024-02-15 15:30:00)

--------------------------------------------------------------------------------
Description
--------------------------------------------------------------------------------
Multiple users unable to send or receive email since 9am.
Affects the entire sales team (approximately 15 users).
Error message: "Cannot connect to server"

--------------------------------------------------------------------------------
Recent Actions (3)
--------------------------------------------------------------------------------
[14:45] Jane Tech - Note
        Working on mailbox database repair. ETA 30 minutes.

[11:30] Jane Tech - Phone Call (15 min)
        Called client to gather additional details. Issue started after
        overnight maintenance window.

[09:35] Jane Tech - Note
        Assigned and investigating. Initial checks show Exchange server
        connectivity issues.

--------------------------------------------------------------------------------
Quick Actions
--------------------------------------------------------------------------------
- Add note: /add-action 12345 "note text"
- Update:   /update-ticket 12345 --status "Resolved"
- URL:      https://yourcompany.halopsa.com/tickets?id=12345
================================================================================
```

### Full Format

```
================================================================================
Ticket #12345 - Email not working
================================================================================

TICKET INFORMATION
--------------------------------------------------------------------------------
Client:           Acme Corporation (ID: 456)
Contact:          John Smith (john.smith@acme.com)
Site:             Main Office
Phone:            +1 555-123-4567

Status:           In Progress (ID: 2)
Priority:         High (ID: 2)
Type:             Incident
Category 1:       Email
Category 2:       Exchange
Category 3:       Connectivity

Agent:            Jane Tech (jane.tech@msp.com)
Team:             Service Desk
Created:          2024-02-15 09:23:00
Updated:          2024-02-15 14:45:00
Logged By:        Auto-generated from email

CONTRACT INFORMATION
--------------------------------------------------------------------------------
Contract:         Managed Services Agreement
Type:             All-Inclusive
Status:           Active
Covered:          Yes - unlimited support included

SLA INFORMATION
--------------------------------------------------------------------------------
SLA Profile:      Premium
Response Target:  30 minutes
Resolution Target: 4 hours

Response SLA:     ✓ Met
  Target:         2024-02-15 09:53:00
  Actual:         2024-02-15 09:35:00 (12 min)

Resolution SLA:   ⚠️ At Risk
  Target:         2024-02-15 13:23:00 (BREACHED)
  Remaining:      -1h 22m (extended by manager)
  New Target:     2024-02-15 15:30:00
  Remaining:      45 minutes

TIME TRACKING
--------------------------------------------------------------------------------
Total Time:       1h 45m
Billable:         0h 0m (covered by contract)
Non-Billable:     1h 45m

DESCRIPTION
--------------------------------------------------------------------------------
Multiple users unable to send or receive email since 9am.
Affects the entire sales team (approximately 15 users).
Error message: "Cannot connect to server"

ACTION HISTORY (5 actions)
--------------------------------------------------------------------------------
[2024-02-15 14:45:00] Jane Tech - Note
        Working on mailbox database repair. ETA 30 minutes.

[2024-02-15 13:00:00] Mike Manager - Status Update
        Extended SLA with client approval. Database repair in progress.

[2024-02-15 11:30:00] Jane Tech - Phone Call (15 min)
        Called client to gather additional details. Issue started after
        overnight maintenance window. Client confirmed no changes on their end.

[2024-02-15 10:00:00] Jane Tech - Note (30 min)
        Identified corrupted mailbox database. Initiating repair process.
        Escalated to Level 2 for database expertise.

[2024-02-15 09:35:00] Jane Tech - Note
        Assigned and investigating. Initial checks show Exchange server
        connectivity issues. Running diagnostics.

ATTACHMENTS (2)
--------------------------------------------------------------------------------
1. error_screenshot.png (245 KB) - Uploaded by John Smith
2. diagnostic_log.txt (12 KB) - Uploaded by Jane Tech

LINKED ASSETS (1)
--------------------------------------------------------------------------------
1. ACME-EXCH-01 (Server)
   Type: Server - Windows Server 2019
   Serial: ABC123456
   Status: Active
   Warranty: Valid until 2025-06-15

RELATED TICKETS
--------------------------------------------------------------------------------
- #12340 - Exchange performance issues (Closed - 2024-02-10)
- #12289 - Email sync delays (Resolved - 2024-02-01)

--------------------------------------------------------------------------------
URL: https://yourcompany.halopsa.com/tickets?id=12345
================================================================================
```

### JSON Format

```json
{
  "id": 12345,
  "summary": "Email not working",
  "details": "Multiple users unable to send or receive email since 9am.",
  "client": {
    "id": 456,
    "name": "Acme Corporation"
  },
  "contact": {
    "id": 789,
    "name": "John Smith",
    "email": "john.smith@acme.com"
  },
  "status": {
    "id": 2,
    "name": "In Progress"
  },
  "priority": {
    "id": 2,
    "name": "High"
  },
  "agent": {
    "id": 42,
    "name": "Jane Tech"
  },
  "team": {
    "id": 5,
    "name": "Service Desk"
  },
  "sla": {
    "profile": "Premium",
    "response": {
      "target": "2024-02-15T09:53:00Z",
      "met": true,
      "actual": "2024-02-15T09:35:00Z"
    },
    "resolution": {
      "target": "2024-02-15T15:30:00Z",
      "met": false,
      "remaining_minutes": 45
    }
  },
  "actions": [...],
  "attachments": [...],
  "assets": [...]
}
```

## Error Handling

### Ticket Not Found

```
Ticket not found: #12345

Please verify the ticket ID and try again.
Use /search-tickets to find the correct ticket.
```

### Authentication Error

```
Authentication failed

Please verify your HaloPSA credentials:
- HALOPSA_CLIENT_ID
- HALOPSA_CLIENT_SECRET
- HALOPSA_BASE_URL
- HALOPSA_TENANT (for cloud-hosted)

Ensure the API application has 'read:tickets' permission.
```

### Rate Limiting

```
Rate limited by HaloPSA API (429)

HaloPSA allows 500 requests per 3 minutes.
Retrying in 5 seconds...
```

### Permission Denied

```
Permission denied (403)

Your API credentials do not have permission to view this ticket.
This may be due to:
- Insufficient API scope
- Team-based ticket restrictions
- Client-level access controls

Contact your HaloPSA administrator.
```

## API Reference

### GET /api/Tickets/{id}

Retrieves full ticket details.

### GET /api/Actions?ticket_id={id}

Retrieves all actions for a ticket.

### GET /api/Attachment?ticket_id={id}

Retrieves attachment metadata for a ticket.

### GET /api/Asset?ticket_id={id}

Retrieves assets linked to a ticket.

## Related Commands

- `/update-ticket` - Update ticket fields
- `/add-action` - Add note to ticket
- `/search-tickets` - Search existing tickets
- `/create-ticket` - Create new ticket
