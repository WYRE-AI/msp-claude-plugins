---
description: Search for HaloPSA clients by name, domain, or other attributes
argument-hint: "<query> [client_type] [active] [include_sites] [limit]"
arguments: [query, client_type, active, include_sites, limit]
---

# Search HaloPSA Clients

Search for HaloPSA clients by name, domain, or other attributes for quick lookups.

## Prerequisites

- Valid HaloPSA OAuth credentials configured
- User must have client read permissions

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

2. **Build search query**
   - Apply search term
   - Apply type filter if specified
   - Apply active filter

3. **Execute client search**
   ```bash
   curl -s -X GET "{base_url}/api/Client?search={query}&page_size={limit}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

4. **Fetch sites (if requested)**
   ```bash
   # For each client, fetch sites
   curl -s -X GET "{base_url}/api/Site?client_id={client_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

5. **Format and display results**
   - Client list with key details
   - Site information if requested
   - Quick action links

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search term (name, domain, partial) |
| client_type | string | No | - | Customer/Prospect/Vendor |
| active | boolean | No | true | Active clients only |
| include_sites | boolean | No | false | Include site details |
| limit | integer | No | 10 | Maximum results (max 100) |

## Examples

### Basic Search

```
/search-clients "Acme"
```

### Search by Domain

```
/search-clients "acme.com"
```

### Customer Type Only

```
/search-clients "Acme" --client_type Customer
```

### Include Sites

```
/search-clients "Acme Corp" --include_sites true
```

### Include Inactive

```
/search-clients "Old Company" --active false
```

### Limit Results

```
/search-clients "Tech" --limit 25
```

### Vendor Search

```
/search-clients "Microsoft" --client_type Vendor
```

## Output

### Standard Results

```
Found 3 clients matching "Acme"

┌─────────┬────────────────────────┬──────────────┬────────────┬───────────┐
│ ID      │ Name                   │ Type         │ Status     │ Domain    │
├─────────┼────────────────────────┼──────────────┼────────────┼───────────┤
│ 123     │ Acme Corporation       │ Customer     │ Active     │ acme.com  │
│ 124     │ Acme Industries        │ Customer     │ Active     │ acmei.com │
│ 125     │ Acme Labs LLC          │ Prospect     │ Active     │ acmelabs.io│
└─────────┴────────────────────────┴──────────────┴────────────┴───────────┘

Quick Actions:
- View client:    /search-clients --id <id>
- Client tickets: /search-tickets --client <id>
- Create ticket:  /create-ticket <id> "Summary"
```

### With Sites

```
Found 2 clients matching "Acme Corp"

================================================================================
Acme Corporation (ID: 123)
================================================================================
Type:         Customer
Status:       Active
Domain:       acme.com
Phone:        +1 555-123-4567
Address:      123 Main Street, New York, NY 10001

Contract:     Managed Services Agreement (Active)
SLA:          Premium
Account Mgr:  John Manager

Sites (3):
┌─────────┬──────────────────────┬────────────────────────────────┬───────────┐
│ ID      │ Name                 │ Address                        │ Primary   │
├─────────┼──────────────────────┼────────────────────────────────┼───────────┤
│ 456     │ Main Office          │ 123 Main St, New York, NY      │ Yes       │
│ 457     │ West Coast Office    │ 456 Oak Ave, Los Angeles, CA   │ No        │
│ 458     │ Remote Workers       │ Various Locations              │ No        │
└─────────┴──────────────────────┴────────────────────────────────┴───────────┘

Users: 47 active contacts
Assets: 156 managed devices

--------------------------------------------------------------------------------

================================================================================
Acme Industries (ID: 124)
================================================================================
Type:         Customer
Status:       Active
Domain:       acmei.com
Phone:        +1 555-987-6543
Address:      789 Industrial Way, Chicago, IL 60601

Contract:     Pay-As-You-Go
SLA:          Standard
Account Mgr:  Jane Manager

Sites (1):
┌─────────┬──────────────────────┬────────────────────────────────┬───────────┐
│ ID      │ Name                 │ Address                        │ Primary   │
├─────────┼──────────────────────┼────────────────────────────────┼───────────┤
│ 459     │ Headquarters         │ 789 Industrial Way, Chicago    │ Yes       │
└─────────┴──────────────────────┴────────────────────────────────┴───────────┘

Users: 23 active contacts
Assets: 45 managed devices

================================================================================
```

### Detailed Client View

```
================================================================================
Client Details: Acme Corporation
================================================================================

BASIC INFORMATION
--------------------------------------------------------------------------------
ID:               123
Name:             Acme Corporation
Type:             Customer
Status:           Active
Created:          2022-01-15

CONTACT INFORMATION
--------------------------------------------------------------------------------
Primary Domain:   acme.com
Phone:            +1 555-123-4567
Email:            support@acme.com
Website:          https://www.acme.com

Address:          123 Main Street
                  Suite 400
                  New York, NY 10001
                  United States

ACCOUNT DETAILS
--------------------------------------------------------------------------------
Account Manager:  John Manager (john.manager@msp.com)
Industry:         Technology
Employee Count:   50-100
Client Since:     2022-01-15

CONTRACT INFORMATION
--------------------------------------------------------------------------------
Active Contract:  Managed Services Agreement
Contract Type:    All-Inclusive
Billing Cycle:    Monthly
Next Invoice:     2024-03-01
SLA Profile:      Premium

STATISTICS
--------------------------------------------------------------------------------
Open Tickets:     4
Total Tickets:    156
Avg Resolution:   2.3 hours
Sites:            3
Active Users:     47
Managed Assets:   156

RECENT ACTIVITY
--------------------------------------------------------------------------------
- 2024-02-15: Ticket #12345 - Email not working (In Progress)
- 2024-02-14: Ticket #12340 - VPN issue (Resolved)
- 2024-02-12: Ticket #12335 - New user setup (Closed)

================================================================================

Quick Actions:
- Open tickets:   /search-tickets --client 123 --status open
- Create ticket:  /create-ticket 123 "Summary"
- View contract:  /contract-status --client_id 123
- Client URL:     https://yourcompany.halopsa.com/clients?id=123
```

## Error Handling

### No Results

```
No clients found matching "Unknown Company"

Suggestions:
- Check spelling
- Try a partial name (first few letters)
- Search by domain instead
- Include inactive clients: --active false
```

### Too Many Results

```
Found 150 clients matching "Tech"

Showing first 10 results. Use --limit to see more.

┌─────────┬────────────────────────┬──────────────┬───────────┐
│ ID      │ Name                   │ Type         │ Domain    │
├─────────┼────────────────────────┼──────────────┼───────────┤
│ ...     │ ...                    │ ...          │ ...       │
└─────────┴────────────────────────┴──────────────┴───────────┘

Narrow your search:
- /search-clients "Tech Solutions"
- /search-clients "tech" --client_type Customer
- /search-clients "techcorp.com"
```

### Authentication Error

```
Authentication failed

Please verify your HaloPSA credentials:
- HALOPSA_CLIENT_ID
- HALOPSA_CLIENT_SECRET
- HALOPSA_BASE_URL
- HALOPSA_TENANT (for cloud-hosted)

Ensure the API application has 'read:clients' permission.
```

### Rate Limiting

```
Rate limited by HaloPSA API (429)

HaloPSA allows 500 requests per 3 minutes.
Retrying in 5 seconds...
```

## API Reference

### GET /api/Client

Query parameters:
- `search={query}` - Search term
- `page_size={limit}` - Results per page
- `inactive=true` - Include inactive clients
- `client_type={type}` - Filter by type

**Response:**
```json
{
  "clients": [
    {
      "id": 123,
      "name": "Acme Corporation",
      "client_type": "Customer",
      "inactive": false,
      "main_domain": "acme.com",
      "phone": "+1 555-123-4567",
      "address": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "postcode": "10001"
    }
  ],
  "record_count": 1
}
```

### GET /api/Site

Query parameters:
- `client_id={id}` - Client ID to get sites for

## Related Commands

- `/create-ticket` - Create ticket for client
- `/search-tickets` - Search client's tickets
- `/contract-status` - View client contracts
- `/search-assets` - Search client's assets
