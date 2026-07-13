---
description: Create a new service ticket in ConnectWise PSA
argument-hint: "<company> <summary> [description] [board] [priority] [contact] [status]"
arguments: [company, summary, description, board, priority, contact, status]
---

# Create ConnectWise PSA Ticket

Create a new service ticket in ConnectWise PSA with specified details.

## Prerequisites

- Valid ConnectWise PSA API credentials configured
- Company must exist in ConnectWise PSA
- User must have ticket creation permissions

## Steps

1. **Validate company exists**
   - If numeric, use as company ID directly
   - If text, search companies by name or identifier
   - Suggest similar companies if no exact match found

2. **Check for duplicate tickets**
   - Search open tickets for same company
   - Warn if similar summaries found in last 24 hours

3. **Resolve service board**
   - If specified, look up board by name or ID
   - If not specified, use company default or first available board
   - Validate board exists and is active

4. **Resolve optional fields**
   - Look up contact by name or email if provided
   - Validate contact belongs to the company
   - Map priority text to ID (Critical=1, High=2, Medium=3, Low=4)
   - Look up status by name or use default "New"

5. **Check agreement coverage**
   - Query active agreements for company
   - Warn if no active agreement (may be T&M billing)

6. **Create the ticket**
   ```json
   POST /service/tickets
   {
     "summary": "<summary>",
     "board": {"id": <resolved_board_id>},
     "company": {"id": <resolved_company_id>},
     "contact": {"id": <resolved_contact_id>},
     "priority": {"id": <priority>},
     "status": {"name": "New"},
     "initialDescription": "<description>"
   }
   ```

7. **Return ticket details**
   - Ticket ID
   - Ticket summary
   - Direct URL to ticket in ConnectWise PSA

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| company | string/int | Yes | - | Company name, identifier, or ID |
| summary | string | Yes | - | Brief summary (max 100 chars) |
| description | string | No | - | Detailed issue description |
| board | string/int | No | Company default | Service board name or ID |
| priority | int/string | No | 3 (Medium) | 1=Critical, 2=High, 3=Medium, 4=Low |
| contact | string | No | - | Contact name or email |
| status | string/int | No | New | Initial ticket status |

## Examples

### Basic Usage

```
/create-ticket "Acme Corp" "Email not working"
```

### With Full Details

```
/create-ticket "Acme Corp" "Email not working" --description "Multiple users unable to send/receive since 9am" --priority 2 --contact "john.smith@acme.com" --board "Service Desk"
```

### Using Company Identifier

```
/create-ticket "ACME" "Server offline" --priority 1
```

### Using Company ID

```
/create-ticket 12345 "Network slow" --priority 3 --board "Managed Services"
```

## Output

```
Ticket Created Successfully

Ticket ID: 54321
Summary: Email not working
Company: Acme Corporation
Priority: High (2)
Status: New
Board: Service Desk
Contact: John Smith (john.smith@acme.com)
Agreement: Managed Services Agreement (Active)

URL: https://na.myconnectwise.net/v4_6_release/services/system_io/Service/fv_sr100_request.rails?service_recid=54321
```

## Error Handling

### Company Not Found

```
Error: Company not found: "Acm"

Did you mean one of these?
- Acme Corporation (Identifier: ACME, ID: 12345)
- Acme Industries (Identifier: ACMEIND, ID: 12346)
- Acme LLC (Identifier: ACMELLC, ID: 12347)
```

### No Active Agreement

```
Warning: No active agreement found for Acme Corporation

Ticket will be created as Time & Materials.
Proceed? [Y/n]
```

### Duplicate Detection

```
Warning: Potential duplicate ticket detected

Existing ticket #54320 "Email issues" was created 2 hours ago for this company.

Create anyway? [Y/n]
View existing ticket? [v]
```

### Board Not Found

```
Error: Service board not found: "Invalid Board"

Available boards:
- Service Desk (ID: 1)
- Managed Services (ID: 2)
- Projects (ID: 3)
```

### Contact Not at Company

```
Error: Contact "jane@other.com" not found at Acme Corporation

Contacts at this company:
- John Smith (john.smith@acme.com)
- Jane Doe (jane.doe@acme.com)
- Bob Wilson (bob@acme.com)
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid board ID | List available boards and retry |
| Company not found | Search for correct company |
| Contact not found | Create ticket without contact |
| Rate limited | Wait and retry automatically |
| Summary too long | Truncate to 100 characters |

## Related Commands

- `/search-tickets` - Search existing tickets
- `/update-ticket` - Update ticket details
- `/add-note` - Add note to ticket
- `/log-time` - Log time against ticket
