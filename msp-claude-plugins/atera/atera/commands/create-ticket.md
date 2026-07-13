---
description: Create a new service ticket in Atera
argument-hint: "<customer> <title> [description] [priority] [contact] [technicianEmail]"
arguments: [customer, title, description, priority, contact, technicianEmail]
---

# Create Atera Ticket

Create a new service ticket in Atera with specified details.

## Prerequisites

- Valid Atera API key configured
- Customer must exist in Atera
- User must have ticket creation permissions

## Steps

1. **Validate customer exists**
   - If numeric, use as customer ID directly
   - If text, search customers by name
   - Suggest similar names if no exact match

2. **Check for duplicate tickets**
   - Search open tickets for same customer
   - Warn if similar titles found in last 24 hours

3. **Resolve optional fields**
   - Look up contact ID if contact provided
   - Validate technician email if provided
   - Apply default priority if not specified

4. **Create the ticket**
   ```json
   POST /api/v3/tickets
   X-API-KEY: {api_key}
   Content-Type: application/json

   {
     "TicketTitle": "<title>",
     "Description": "<description>",
     "EndUserID": <resolved_contact_id>,
     "TicketPriority": "<priority>",
     "TicketType": "Problem",
     "TechnicianContactID": <resolved_tech_id>
   }
   ```

5. **Return ticket details**
   - Ticket ID
   - Ticket title
   - Customer name
   - Assigned technician

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| customer | string/int | Yes | - | Customer name or ID |
| title | string | Yes | - | Brief summary of the issue |
| description | string | No | - | Detailed issue description |
| priority | string | No | Medium | Low, Medium, High, Critical |
| contact | string | No | - | Contact name or email |
| technicianEmail | string | No | - | Technician to assign |

## Examples

### Basic Usage

```
/create-ticket "Acme Corp" "Email not working"
```

### With Full Details

```
/create-ticket "Acme Corp" "Email not working" --description "Multiple users unable to send/receive since 9am" --priority High --contact "john.smith@acme.com" --technicianEmail "tech@msp.com"
```

### Using Customer ID

```
/create-ticket 12345 "Server offline" --priority Critical
```

## Output

```
Ticket Created Successfully

Ticket ID: 54321
Title: Email not working
Customer: Acme Corporation
Priority: High
Status: Open
Assigned To: John Tech

URL: https://app.atera.com/new/rmm/ticket/54321
```

## Error Handling

### Customer Not Found

```
Customer not found: "Acme"

Did you mean one of these?
- Acme Corporation (ID: 12345)
- Acme Industries (ID: 12346)
- Acme LLC (ID: 12347)
```

### Invalid Contact

```
Warning: Contact "john.smith@acme.com" not found for customer

Ticket will be created without a contact assignment.
Proceed? [Y/n]
```

### Rate Limit Exceeded

```
Rate limit exceeded (700 req/min)

Waiting 30 seconds before retry...
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid customer ID | Verify customer exists |
| Contact not found | Create ticket without contact, note in description |
| Rate limited | Wait and retry automatically |
| Unauthorized | Verify API key is valid |

## Related Commands

- `/search-agents` - Search for RMM agents
- `/list-tickets` - List existing tickets
