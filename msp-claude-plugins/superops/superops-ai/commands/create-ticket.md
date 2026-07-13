---
description: Create a new service ticket in SuperOps.ai
argument-hint: "<client> <subject> [description] [priority] [requester] [tech-group]"
arguments: [client, subject, description, priority, requester, tech-group]
---

# Create SuperOps.ai Ticket

Create a new service ticket in SuperOps.ai with specified details.

## Prerequisites

- Valid SuperOps.ai API token configured
- Client must exist in SuperOps.ai
- User must have ticket creation permissions

## Steps

1. **Validate client exists**
   - If numeric, use as account ID directly
   - If text, search clients by name
   - Suggest similar names if no exact match

2. **Check for duplicate tickets**
   - Search open tickets for same client
   - Warn if similar subjects found in last 24 hours

3. **Resolve optional fields**
   - Look up requester from client contacts
   - Look up tech group ID from name if provided
   - Apply default priority if not specified

4. **Create the ticket**
   ```graphql
   mutation createTicket($input: CreateTicketInput!) {
     createTicket(input: $input) {
       ticketId
       ticketNumber
       subject
       status
       priority
       createdTime
     }
   }
   ```

   Variables:
   ```json
   {
     "input": {
       "subject": "<subject>",
       "description": "<description>",
       "client": { "accountId": "<client_id>" },
       "priority": "<priority>",
       "requester": { "id": "<requester_id>" },
       "techGroup": { "id": "<tech_group_id>" }
     }
   }
   ```

5. **Return ticket details**
   - Ticket number
   - Ticket ID
   - Direct URL to ticket in SuperOps.ai

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client | string/int | Yes | - | Client name or account ID |
| subject | string | Yes | - | Brief summary of the issue |
| description | string | No | - | Detailed issue description |
| priority | string | No | medium | low, medium, high, critical |
| requester | string | No | - | Requester name or email |
| tech-group | string | No | - | Technician group name |

## Examples

### Basic Usage

```
/create-ticket "Acme Corp" "Email not working"
```

### With Full Details

```
/create-ticket "Acme Corp" "Email not working" --description "Multiple users unable to send/receive since 9am" --priority high --requester "john.smith@acme.com" --tech-group "Service Desk"
```

### Using Account ID

```
/create-ticket 12345 "Server offline" --priority critical
```

## Output

```
Ticket Created Successfully

Ticket Number: TKT-2024-0042
Ticket ID: abc123-def456
Client: Acme Corporation
Priority: High
Status: Open
Tech Group: Service Desk

URL: https://yourcompany.superops.ai/tickets/abc123-def456
```

## Error Handling

### Client Not Found

```
Client not found: "Acme"

Did you mean one of these?
- Acme Corporation (ID: 12345)
- Acme Industries (ID: 12346)
- Acme LLC (ID: 12347)
```

### Duplicate Detection

```
Warning: Potential duplicate ticket detected

Existing ticket TKT-2024-0038 "Email issues" was created 2 hours ago for this client.

Create anyway? [Y/n]
View existing ticket? [v]
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid client ID | Verify client exists |
| Invalid tech group | List available tech groups |
| Rate limited | Wait and retry (800 req/min limit) |
| Invalid priority | Use: low, medium, high, critical |

## Related Commands

- `/list-tickets` - Search existing tickets
- `/update-ticket` - Update ticket details
- `/list-assets` - View client assets
