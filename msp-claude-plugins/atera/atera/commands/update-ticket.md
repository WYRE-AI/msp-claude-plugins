---
description: Update fields on an existing Atera ticket
argument-hint: "<ticket_id> [status] [priority] [technician_email] [ticket_type] [impact]"
arguments: [ticket_id, status, priority, technician_email, ticket_type, impact]
---

# Update Atera Ticket

Update fields on an existing Atera ticket including status, priority, technician assignment, and ticket type.

## Prerequisites

- Valid Atera API key configured
- Ticket must exist in Atera
- User must have ticket update permissions

## Steps

1. **Validate ticket exists**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/tickets/{ticket_id}" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```
   - Return error if ticket not found (404)
   - Store current ticket state for comparison

2. **Resolve technician if provided**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/technicians" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```
   - Search for technician by email
   - Return error if technician not found

3. **Build update payload**
   - Only include fields that are being changed
   - Map status to Atera status values
   - Map priority to Atera priority values

4. **Update the ticket**
   ```bash
   curl -s -X PUT "https://app.atera.com/api/v3/tickets/{ticket_id}" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "TicketStatus": "<status>",
       "TicketPriority": "<priority>",
       "TechnicianContactID": <tech_id>,
       "TicketType": "<ticket_type>",
       "TicketImpact": "<impact>"
     }'
   ```

5. **Return updated ticket details**
   - Ticket ID and title
   - Changed fields with before/after values
   - Direct link to ticket

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | The Atera ticket ID to update |
| status | string | No | - | Open, Pending, Resolved, Closed |
| priority | string | No | - | Low, Medium, High, Critical |
| technician_email | string | No | - | Email of technician to assign |
| ticket_type | string | No | - | Problem, Request, Incident, Change |
| impact | string | No | - | Minor, Major, Crisis, No Impact |

## Examples

### Update Status

```
/update-ticket 12345 --status "Pending"
```

### Update Status and Priority

```
/update-ticket 12345 --status "Pending" --priority High
```

### Assign Technician

```
/update-ticket 12345 --technician_email "john.doe@msp.com" --ticket_type "Incident"
```

### Update Impact and Resolve

```
/update-ticket 12345 --impact "Major" --status "Resolved"
```

## Output

```
Ticket Updated Successfully

Ticket ID: 12345
Title: Email not working

Changes Applied:
- Status: Open -> Pending
- Priority: Medium -> High

Customer: Acme Corporation
Assigned To: John Tech

URL: https://app.atera.com/new/rmm/ticket/12345
```

## Error Handling

### Ticket Not Found

```
Ticket not found: 12345

Please verify the ticket ID and try again.
```

### Invalid Status

```
Invalid status: "In Progress"

Valid statuses: Open, Pending, Resolved, Closed
```

### Technician Not Found

```
Technician not found: "john.doe@msp.com"

Available technicians:
- jane.smith@msp.com
- mike.jones@msp.com
- sarah.tech@msp.com
```

### No Changes Specified

```
No changes specified for ticket 12345

Please provide at least one field to update:
--status, --priority, --technician_email, --ticket_type, --impact
```

### Rate Limit Exceeded

```
Rate limit exceeded (700 req/min)

Waiting 30 seconds before retry...
```

### Insufficient Permissions

```
Permission denied: Cannot update ticket 12345

Contact your administrator to verify your permissions.
```

## API Patterns

### Get Ticket Details
```http
GET /api/v3/tickets/{ticketId}
X-API-KEY: {api_key}
```

### Update Ticket
```http
PUT /api/v3/tickets/{ticketId}
X-API-KEY: {api_key}
Content-Type: application/json

{
  "TicketStatus": "Pending",
  "TicketPriority": "High",
  "TicketType": "Incident",
  "TicketImpact": "Major"
}
```

### List Technicians
```http
GET /api/v3/technicians
X-API-KEY: {api_key}
```

## Related Commands

- `/create-ticket` - Create a new ticket
- `/log-time` - Log work hours on a ticket
- `/search-agents` - Search for RMM agents
