---
description: Update fields on an existing HaloPSA ticket including status, priority, and assignment
argument-hint: "<ticket_id> [status] [priority] [category] [team] [agent] [sla]"
arguments: [ticket_id, status, priority, category, team, agent, sla]
---

# Update HaloPSA Ticket

Update fields on an existing HaloPSA ticket including status, priority, category, and assignment.

## Prerequisites

- Valid HaloPSA OAuth credentials configured
- Ticket must exist in HaloPSA
- User must have ticket edit permissions

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

2. **Fetch current ticket state**
   ```bash
   # Get current ticket details
   curl -s -X GET "{base_url}/api/Tickets/{ticket_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```
   - Store current values for comparison
   - Return error if ticket not found

3. **Resolve field values to IDs**

   **Status lookup:**
   ```bash
   curl -s -X GET "{base_url}/api/Status" \
     -H "Authorization: Bearer $TOKEN"
   ```

   **Priority lookup:**
   ```bash
   curl -s -X GET "{base_url}/api/Priority" \
     -H "Authorization: Bearer $TOKEN"
   ```

   **Agent lookup:**
   ```bash
   curl -s -X GET "{base_url}/api/Agent?search={agent}" \
     -H "Authorization: Bearer $TOKEN"
   ```

   **Team lookup:**
   ```bash
   curl -s -X GET "{base_url}/api/Team?search={team}" \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Build update payload**
   - Include ticket ID (required)
   - Include only changed fields
   - Merge with existing ticket data

5. **Update the ticket**
   ```bash
   # HaloPSA uses POST for updates with the id field
   curl -s -X POST "{base_url}/api/Tickets" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '[
       {
         "id": <ticket_id>,
         "status_id": <new_status_id>,
         "priority_id": <new_priority_id>,
         "category_1": "<category>",
         "team_id": <new_team_id>,
         "agent_id": <new_agent_id>,
         "sla_id": <new_sla_id>
       }
     ]'
   ```

6. **Return update confirmation**
   - Show before/after for changed fields
   - Ticket URL

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | The HaloPSA ticket ID |
| status | string | No | - | New status name or ID |
| priority | string/int | No | - | Priority (1=Critical to 4=Low) |
| category | string | No | - | Category for classification |
| team | string | No | - | Team name to assign to |
| agent | string | No | - | Agent name or email |
| sla | string | No | - | SLA profile name |

## Examples

### Change Status and Assign Agent

```
/update-ticket 12345 --status "In Progress" --agent "john.doe@msp.com"
```

### Escalate Priority and Team

```
/update-ticket 12345 --priority "High" --team "Level 2 Support"
```

### Update Category and SLA

```
/update-ticket 12345 --category "Network/Firewall" --sla "Premium"
```

### Change Status Only

```
/update-ticket 12345 --status "Pending Customer"
```

### Reassign to Different Agent

```
/update-ticket 12345 --agent "jane.tech@msp.com"
```

### Full Update

```
/update-ticket 12345 --status "In Progress" --priority 2 --team "Network Team" --agent "jane.tech@msp.com" --category "Network/VPN"
```

## Output

### Success

```
Ticket Updated Successfully

Ticket: #12345 - Email not working
Client: Acme Corporation

Changes Applied:
┌─────────────┬───────────────────┬───────────────────┐
│ Field       │ Previous          │ New               │
├─────────────┼───────────────────┼───────────────────┤
│ Status      │ New               │ In Progress       │
│ Priority    │ Medium (3)        │ High (2)          │
│ Agent       │ Unassigned        │ Jane Tech         │
│ Team        │ Service Desk      │ Level 2 Support   │
└─────────────┴───────────────────┴───────────────────┘

URL: https://yourcompany.halopsa.com/tickets?id=12345
```

### No Changes Made

```
No changes applied

The specified values are the same as current ticket values.

Current Ticket State:
- Status: In Progress
- Priority: High (2)
- Agent: Jane Tech
- Team: Level 2 Support
```

## Error Handling

### Ticket Not Found

```
Ticket not found: #12345

Please verify the ticket ID and try again.
Use /search-tickets to find the correct ticket ID.
```

### Invalid Status

```
Status not found: "Invalid Status"

Available statuses:
- New (ID: 1)
- In Progress (ID: 2)
- Pending Customer (ID: 3)
- Resolved (ID: 4)
- Closed (ID: 5)

Use: /update-ticket 12345 --status "In Progress"
```

### Invalid Agent

```
Agent not found: "unknown.user@msp.com"

Did you mean one of these?
- john.doe@msp.com (John Doe)
- jane.doe@msp.com (Jane Doe)
- james.d@msp.com (James Davis)
```

### Invalid Team

```
Team not found: "Unknown Team"

Available teams:
- Service Desk
- Level 2 Support
- Network Team
- Security Team

Use: /update-ticket 12345 --team "Service Desk"
```

### Authentication Error

```
Authentication failed

Please verify your HaloPSA credentials:
- HALOPSA_CLIENT_ID
- HALOPSA_CLIENT_SECRET
- HALOPSA_BASE_URL
- HALOPSA_TENANT (for cloud-hosted)

Ensure the API application has 'edit:tickets' permission.
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

Your API credentials do not have permission to update tickets.
Contact your HaloPSA administrator to grant 'edit:tickets' scope.
```

### Validation Error

```
Validation error from HaloPSA API (400)

Error: Cannot change status to 'Closed' - ticket has unbilled time entries.

Resolution: Bill or write off time entries before closing ticket.
```

## API Reference

### POST /api/Tickets (Update)

Updates an existing ticket. HaloPSA uses POST for both create and update operations.

**Request Body:**
```json
[
  {
    "id": 12345,
    "status_id": 2,
    "priority_id": 2,
    "category_1": "Network/Firewall",
    "team_id": 5,
    "agent_id": 42,
    "sla_id": 3
  }
]
```

**Response:**
```json
{
  "id": 12345,
  "summary": "Email not working",
  "status_id": 2,
  "status": "In Progress",
  "priority_id": 2,
  "priority": "High",
  "agent_id": 42,
  "agent": "Jane Tech",
  "team_id": 5,
  "team": "Level 2 Support"
}
```

## Related Commands

- `/show-ticket` - View ticket details
- `/add-action` - Add note to ticket
- `/search-tickets` - Search existing tickets
- `/create-ticket` - Create new ticket
