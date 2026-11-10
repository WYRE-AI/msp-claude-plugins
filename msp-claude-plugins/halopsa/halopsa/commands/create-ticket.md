---
description: Create a new service ticket in HaloPSA
argument-hint: "<client> <summary> [details] [priority] [tickettype] [contact] [site] [agent] [category]"
arguments: [client, summary, details, priority, tickettype, contact, site, agent, category]
---

# Create HaloPSA Ticket

Create a new service ticket in HaloPSA with specified details.

## Prerequisites

- HaloPSA connected in Conduit (Client ID, Client Secret, Tenant); Conduit handles the OAuth token
- Client must exist in HaloPSA
- User must have ticket creation permissions

## Steps

1. **Check the connection**
   - Call `halopsa_status`; if it fails, ask the user to fix the HaloPSA connection in Conduit. Do not ask for credentials or request a token yourself

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
   - If `category` was given, resolve it with `halopsa_categories_list` (`search` by name; admin grant on the `halopsa` connector) and pass the name as `category_1`–`category_4` by its level. Skip the lookup when no category was given
   - Apply default priority if not specified

5. **Check contract coverage**
   - Query active contracts for client
   - Warn if no active contract (T&M billing)

6. **Create the ticket** with `halopsa_tickets_create` (`summary`, `client_id`, `tickettype_id` required; `details`, `priority_id`, `site_id`, `agent_id`, `category_1`–`category_4` optional). The underlying request:
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
       "agent_id": <resolved_agent_id>,
       "category_1": "<level-1 category name>"
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
| category | string | No | - | Ticket category name; resolved with `halopsa_categories_list` |

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
