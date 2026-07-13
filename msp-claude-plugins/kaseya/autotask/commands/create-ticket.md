---
description: Create a new service ticket in Autotask PSA
argument-hint: "<company> <title> [description] [queue] [priority] [contact]"
arguments: [company, title, description, queue, priority, contact]
---

# Create Autotask Ticket

Create a new service ticket in Autotask PSA with specified details.

## Prerequisites

- Valid Autotask API credentials configured
- Company must exist in Autotask
- User must have ticket creation permissions

## Steps

1. **Validate company exists**
   - If numeric, use as company ID directly
   - If text, search companies by name
   - Suggest similar names if no exact match

2. **Check for duplicate tickets**
   - Search open tickets for same company
   - Warn if similar titles found in last 24 hours

3. **Resolve optional fields**
   - Look up queue ID from name if provided
   - Look up contact ID if contact provided
   - Apply default priority if not specified

4. **Check contract coverage**
   - Query active contracts for company
   - Warn if no active contract (T&M billing)

5. **Create the ticket**
   ```json
   POST /v1.0/Tickets
   {
     "companyID": <resolved_company_id>,
     "title": "<title>",
     "description": "<description>",
     "queueID": <resolved_queue_id>,
     "priority": <priority>,
     "status": 1,
     "contactID": <resolved_contact_id>
   }
   ```

6. **Return ticket details**
   - Ticket number
   - Ticket ID
   - Direct URL to ticket in Autotask

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| company | string/int | Yes | - | Company name or ID |
| title | string | Yes | - | Brief summary (max 255 chars) |
| description | string | No | - | Detailed issue description |
| queue | string/int | No | Service Desk | Target queue |
| priority | int | No | 2 (Medium) | 4=Critical, 3=High, 2=Medium, 1=Low |
| contact | string | No | - | Contact name or email |

## Examples

### Basic Usage

```
/create-ticket "Acme Corp" "Email not working"
```

### With Full Details

```
/create-ticket "Acme Corp" "Email not working" --description "Multiple users unable to send/receive since 9am" --priority 3 --contact "john.smith@acme.com" --queue "Service Desk"
```

### Using Company ID

```
/create-ticket 12345 "Server offline" --priority 4
```

## Output

```
✅ Ticket Created Successfully

Ticket Number: T20240215.0042
Ticket ID: 54321
Company: Acme Corporation
Priority: High (3)
Queue: Service Desk
Contract: Managed Services Agreement (Active)

URL: https://ww5.autotask.net/Mvc/ServiceDesk/TicketDetail.mvc?ticketId=54321
```

## Error Handling

### Company Not Found

```
❌ Company not found: "Acme"

Did you mean one of these?
- Acme Corporation (ID: 12345)
- Acme Industries (ID: 12346)
- Acme LLC (ID: 12347)
```

### No Active Contract

```
⚠️ Warning: No active contract found for Acme Corporation

Ticket will be created as Time & Materials.
Proceed? [Y/n]
```

### Duplicate Detection

```
⚠️ Potential duplicate ticket detected

Existing ticket T20240215.0038 "Email issues" was created 2 hours ago for this company.

Create anyway? [Y/n]
View existing ticket? [v]
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid queue ID | List available queues and retry |
| Contact not found | Create ticket without contact, note in description |
| Rate limited | Wait and retry automatically |

## Related Commands

- `/search-tickets` - Search existing tickets
- `/update-ticket` - Update ticket details
- `/time-entry` - Log time to ticket
