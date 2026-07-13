---
description: Get detailed customer information from Syncro
argument-hint: "[customer_id] [query] [include_assets] [include_tickets]"
arguments: [customer_id, query, include_assets, include_tickets]
---

# Get Syncro Customer

Retrieve detailed customer information including contacts, assets, and recent tickets.

## Prerequisites

- Valid Syncro API key configured
- Customer must exist in Syncro
- User must have customer read permissions

## Steps

1. **Resolve customer**
   - If customer_id provided, fetch directly
   - If query provided, search by name
   - Handle multiple matches with selection

2. **Fetch customer details**
   ```bash
   curl -s -X GET \
     "https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/customers/${customer_id}?api_key=${SYNCRO_API_KEY}"
   ```

3. **Fetch optional related data**
   - If include_assets: fetch customer assets
   - If include_tickets: fetch recent tickets

4. **Format and return details**
   - Display customer information
   - Show contacts
   - List assets and tickets if requested

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| customer_id | integer | No* | - | Customer ID to look up |
| query | string | No* | - | Search by customer name |
| include_assets | boolean | No | false | Include asset list |
| include_tickets | boolean | No | false | Include recent tickets |

*Either customer_id or query is required

## API Endpoints Used

```
GET /api/v1/customers/{id}
GET /api/v1/customers?query={query}
GET /api/v1/customers/{id}/assets
GET /api/v1/tickets?customer_id={id}
```

## Examples

### By Customer ID

```
/get-customer 12345
```

### By Name Search

```
/get-customer --query "Acme Corp"
```

### With Assets

```
/get-customer 12345 --include_assets true
```

### With Recent Tickets

```
/get-customer 12345 --include_tickets true
```

### Full Details

```
/get-customer 12345 --include_assets true --include_tickets true
```

## Output

### Basic Customer Details

```
Customer Details

Name: Acme Corporation
ID: 12345
Business Name: Acme Corporation
Address: 123 Main Street
         Suite 100
         New York, NY 10001

Contact Information:
  Phone: (555) 123-4567
  Email: support@acmecorp.com
  Website: www.acmecorp.com

Primary Contact:
  Name: John Smith
  Email: john.smith@acmecorp.com
  Phone: (555) 123-4568

Account Details:
  Created: 2023-01-15
  Status: Active
  Contract: Managed Services - Gold

URL: https://acme.syncromsp.com/customers/12345
```

### With Assets

```
Customer Details

Name: Acme Corporation
ID: 12345
...

Assets (5 total):

| Type    | Name          | Serial        | Status |
|---------|---------------|---------------|--------|
| Server  | ACME-DC01     | ABC123456     | Active |
| Server  | ACME-DC02     | ABC123457     | Active |
| Desktop | ACME-WS001    | DEF789012     | Active |
| Laptop  | ACME-LT001    | GHI345678     | Active |
| Printer | HP-LaserJet   | JKL901234     | Active |

View all assets: /search-assets --customer_id 12345
```

### With Recent Tickets

```
Customer Details

Name: Acme Corporation
ID: 12345
...

Recent Tickets (last 10):

| # | Subject | Status | Priority | Updated |
|---|---------|--------|----------|---------|
| 1042 | Email not working | In Progress | High | 2h ago |
| 1038 | Outlook crashes | New | Medium | 1d ago |
| 1025 | Cannot send attach. | Resolved | Low | 3d ago |

View all tickets: /search-tickets --customer "Acme Corporation"
```

## Error Handling

### Customer Not Found (by ID)

```
Error: Customer not found

Customer ID 99999 does not exist or you do not have access.

Suggestions:
- Verify the customer ID is correct
- Use /get-customer --query "name" to search
```

### No Matching Customers (by Query)

```
No customers found matching "Acm"

Suggestions:
- Check spelling
- Try a partial name
- Use fewer search terms
```

### Multiple Matches

```
Multiple customers found for "Acme"

| ID | Name | Location |
|----|------|----------|
| 12345 | Acme Corporation | New York, NY |
| 12346 | Acme Industries | Chicago, IL |
| 12347 | Acme LLC | Los Angeles, CA |

Please specify by ID:
/get-customer 12345
```

### Missing Required Parameter

```
Error: customer_id or query required

Please provide either:
- Customer ID: /get-customer 12345
- Search query: /get-customer --query "Acme"
```

### Permission Denied

```
Error: Permission denied (403)

You do not have permission to view this customer.

Contact your Syncro administrator if you need access.
```

### Rate Limiting

```
Rate limited by Syncro API (180 req/min)

Retrying in 5 seconds...
```

## Tips

### Quick Customer Lookup

For known customer IDs:

```
/get-customer 12345
```

### Fuzzy Search

Use partial names for search:

```
/get-customer --query "Acme"
```

### Pre-Call Research

Get full context before a support call:

```
/get-customer 12345 --include_assets true --include_tickets true
```

### Finding Customer ID

Search by name first, then use the ID for subsequent operations:

```
/get-customer --query "Smith"
# Use the returned ID for other commands
/create-ticket 12345 "New issue"
```

## Related Commands

- `/search-tickets` - Search tickets for a customer
- `/search-assets` - Search customer assets
- `/create-ticket` - Create a ticket for this customer
- `/list-alerts` - View alerts for customer assets
