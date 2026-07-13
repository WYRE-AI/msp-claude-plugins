---
description: Create a new service ticket in HaloPSA
argument-hint: "<client> <summary> [details] [priority] [tickettype] [contact] [site] [agent]"
arguments: [client, summary, details, priority, tickettype, contact, site, agent]
---

# Create HaloPSA Ticket

Create a new service ticket in HaloPSA with specified details.

## Prerequisites

- Valid HaloPSA OAuth credentials configured
- Client must exist in HaloPSA
- User must have ticket creation permissions

## Steps

1. **Authenticate with OAuth 2.0**
   - Obtain access token using client credentials flow
   - Token endpoint: `{base_url}/auth/token?tenant={tenant}`

2. **Validate client exists**
   - If numeric, use as client ID directly
   - If text, search clients by name
   - Suggest similar names if no exact match

3. **Check for duplicate tickets**
   - Search open tickets for same client
   - Warn if similar summaries found in last 24 hours

4. **Resolve optional fields**
   - Look up ticket type ID from name if provided
   - Look up contact/user ID if contact provided
   - Look up site ID from name if provided
   - Look up agent ID from name if provided
   - Apply default priority if not specified

5. **Check contract coverage**
   - Query active contracts for client
   - Warn if no active contract (T&M billing)

6. **Create the ticket**
   ```json
   POST /api/Tickets
   Authorization: Bearer {token}

   [
     {
       "client_id": <resolved_client_id>,
       "summary": "<summary>",
       "details": "<details>",
       "tickettype_id": <resolved_tickettype_id>,
       "priority_id": <priority>,
       "status_id": 1,
       "user_id": <resolved_contact_id>,
       "site_id": <resolved_site_id>,
       "agent_id": <resolved_agent_id>
     }
   ]
   ```

7. **Return ticket details**
   - Ticket ID
   - Direct URL to ticket in HaloPSA

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client | string/int | Yes | - | Client name or ID |
| summary | string | Yes | - | Brief summary (max 255 chars) |
| details | string | No | - | Detailed description (HTML OK) |
| priority | int | No | 3 (Medium) | 1=Critical to 4=Low |
| tickettype | string/int | No | Incident | Ticket type name or ID |
| contact | string | No | - | Contact name or email |
| site | string | No | - | Site name or ID |
| agent | string | No | - | Assigned agent name or ID |

## Examples

### Basic Usage

```
/create-ticket "Acme Corp" "Email not working"
```

### With Full Details

```
/create-ticket "Acme Corp" "Email not working" --details "<p>Multiple users unable to send/receive since 9am</p>" --priority 2 --contact "john.smith@acme.com" --site "Main Office" --agent "Jane Tech"
```

### Using Client ID

```
/create-ticket 123 "Server offline" --priority 1 --tickettype "Incident"
```

### Service Request

```
/create-ticket "Acme Corp" "New user setup" --tickettype "Service Request" --priority 4 --details "<p>New employee starting Monday. Needs email, VPN, and laptop.</p>"
```

## Output

```
Ticket Created Successfully

Ticket ID: 54321
Client: Acme Corporation
Summary: Email not working
Priority: High (2)
Status: New
Ticket Type: Incident
Contract: Managed Services Agreement (Active)
Agent: Jane Tech

URL: https://yourcompany.halopsa.com/tickets?id=54321
```

## Error Handling

### Client Not Found

```
Client not found: "Acme"

Did you mean one of these?
- Acme Corporation (ID: 123)
- Acme Industries (ID: 124)
- Acme LLC (ID: 125)
```

### No Active Contract

```
Warning: No active contract found for Acme Corporation

Ticket will be created for ad-hoc (T&M) billing.
Proceed? [Y/n]
```

### Duplicate Detection

```
Potential duplicate ticket detected

Existing ticket #54320 "Email issues" was created 2 hours ago for this company.

Create anyway? [Y/n]
View existing ticket? [v]
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

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid tickettype_id | List available ticket types and retry |
| Contact not found | Create ticket without contact, note in details |
| Site not found | Create ticket without site |
| Rate limited | Wait and retry automatically |

## Related Commands

- `/search-tickets` - Search existing tickets
- `/update-ticket` - Update ticket details
- `/add-action` - Add note/time to ticket
