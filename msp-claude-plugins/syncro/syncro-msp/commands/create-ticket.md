---
description: Create a new service ticket in Syncro MSP
argument-hint: "<customer> <subject> [problem_type] [status] [priority] [contact] [description]"
arguments: [customer, subject, problem_type, status, priority, contact, description]
---

# Create Syncro Ticket

Create a new service ticket in Syncro MSP with specified details.

## Prerequisites

- Valid Syncro API key configured
- Customer must exist in Syncro
- User must have ticket creation permissions

## Steps

1. **Validate customer exists**
   - If numeric, use as customer ID directly
   - If text, search customers by name
   - Suggest similar names if no exact match

2. **Check for duplicate tickets**
   - Search open tickets for same customer
   - Warn if similar subjects found in last 24 hours

3. **Resolve optional fields**
   - Look up contact ID if contact provided
   - Validate problem_type against configured types
   - Apply default status/priority if not specified

4. **Create the ticket**
   ```json
   POST /api/v1/tickets
   {
     "customer_id": <resolved_customer_id>,
     "subject": "<subject>",
     "problem_type": "<problem_type>",
     "status": "<status>",
     "priority": "<priority>",
     "contact_id": <resolved_contact_id>,
     "body": "<description>"
   }
   ```

5. **Return ticket details**
   - Ticket number
   - Ticket ID
   - Direct URL to ticket in Syncro

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| customer | string/int | Yes | - | Customer name or ID |
| subject | string | Yes | - | Brief summary of issue |
| problem_type | string | No | - | Category for the issue |
| status | string | No | New | Ticket status |
| priority | string | No | Medium | Low/Medium/High/Urgent |
| contact | string/int | No | - | Contact name or ID |
| description | string | No | - | Detailed issue description |

## Examples

### Basic Usage

```
/create-ticket "Acme Corp" "Email not working"
```

### With Full Details

```
/create-ticket "Acme Corp" "Email not working" --description "Multiple users unable to send/receive since 9am" --priority High --contact "john.smith@acme.com" --problem_type "Email"
```

### Using Customer ID

```
/create-ticket 12345 "Server offline" --priority Urgent
```

## Output

```
Ticket Created Successfully

Ticket Number: 1042
Ticket ID: 54321
Customer: Acme Corporation
Priority: High
Status: New
Problem Type: Email

URL: https://acme.syncromsp.com/tickets/54321
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

### Duplicate Detection

```
Warning: Potential duplicate ticket detected

Existing ticket #1038 "Email issues" was created 2 hours ago for this customer.

Create anyway? [Y/n]
View existing ticket? [v]
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid customer_id | Verify customer exists in Syncro |
| Invalid problem_type | List available problem types and retry |
| Contact not found | Create ticket without contact, note in description |
| Rate limited (429) | Wait and retry automatically |

## Related Commands

- `/search-tickets` - Search existing tickets
- `/update-ticket` - Update ticket details
- `/add-time` - Log time to ticket
