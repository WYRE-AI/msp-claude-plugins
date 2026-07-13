---
description: Search for Atera customers by name or criteria
argument-hint: "<query> [include_contacts] [include_agents] [limit]"
arguments: [query, include_contacts, include_agents, limit]
---

# Search Atera Customers

Search for Atera customers by name, domain, or other attributes.

## Prerequisites

- Valid Atera API key configured
- User must have customer read permissions

## Steps

1. **Search for customers**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/customers" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```
   - Filter results by query match on customer name
   - Apply limit parameter

2. **Get contacts if requested**
   For each matching customer:
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/customers/{customer_id}/contacts" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```

3. **Get agent summary if requested**
   For each matching customer:
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/agents?customerId={customer_id}" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```
   - Count total agents
   - Count online vs offline

4. **Return customer list**
   - Customer ID and name
   - Domain (if available)
   - Contact count
   - Agent summary (if requested)

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Customer name or partial match |
| include_contacts | boolean | No | false | Include contact list |
| include_agents | boolean | No | false | Include agent count/summary |
| limit | integer | No | 25 | Maximum results |

## Examples

### Basic Search

```
/search-customers "Acme"
```

### Include Contacts

```
/search-customers "Acme Corp" --include_contacts true
```

### Include Agent Summary

```
/search-customers "Acme" --include_agents true
```

### Full Details with Limit

```
/search-customers "Acme" --include_contacts true --include_agents true --limit 10
```

### Search by Domain

```
/search-customers "acme.com"
```

## Output

### Basic Search Results

```
Customers Found: 3

| ID    | Customer Name          | Domain           | Created            |
|-------|------------------------|------------------|--------------------|
| 12345 | Acme Corporation       | acme.com         | 2023-01-15         |
| 12346 | Acme Industries        | acme-ind.com     | 2023-03-22         |
| 12347 | Acme LLC               | acme-llc.com     | 2024-06-01         |
```

### With Contacts

```
Customers Found: 1

Acme Corporation (ID: 12345)
Domain: acme.com
Created: 2023-01-15

Contacts (5):
| ID    | Name             | Email                    | Phone          | Primary |
|-------|------------------|--------------------------|----------------|---------|
| 1001  | John Smith       | john.smith@acme.com      | 555-123-4567   | Yes     |
| 1002  | Jane Doe         | jane.doe@acme.com        | 555-123-4568   | No      |
| 1003  | Bob Wilson       | bob.wilson@acme.com      | 555-123-4569   | No      |
| 1004  | Sarah Johnson    | sarah.johnson@acme.com   | 555-123-4570   | No      |
| 1005  | Mike Brown       | mike.brown@acme.com      | 555-123-4571   | No      |
```

### With Agent Summary

```
Customers Found: 1

Acme Corporation (ID: 12345)
Domain: acme.com
Created: 2023-01-15

Agents Summary:
- Total Agents: 45
- Online: 42 (93%)
- Offline: 3 (7%)

Agent Types:
- Workstations: 38
- Servers: 5
- Laptops: 2
```

### Full Details

```
Customers Found: 1

Acme Corporation (ID: 12345)
Domain: acme.com
Created: 2023-01-15
Address: 123 Main St, New York, NY 10001

Contacts (5):
| ID    | Name             | Email                    | Primary |
|-------|------------------|--------------------------|---------|
| 1001  | John Smith       | john.smith@acme.com      | Yes     |
| 1002  | Jane Doe         | jane.doe@acme.com        | No      |
...

Agents Summary:
- Total Agents: 45
- Online: 42 (93%)
- Offline: 3 (7%)

Open Tickets: 3
Active Alerts: 2 (1 Critical, 1 Warning)

URL: https://app.atera.com/new/rmm/customer/12345
```

## Error Handling

### No Customers Found

```
No customers found matching: "XYZ Corp"

Suggestions:
- Check the spelling of the customer name
- Try a partial match (e.g., "XYZ" instead of "XYZ Corp")
- Search by domain if known
```

### Empty Query

```
Search query required

Please provide a customer name or partial match:
/search-customers "Customer Name"
```

### Too Many Results

```
Found 150 customers matching "Corp"

Showing first 25 results. Use --limit to adjust:
/search-customers "Corp" --limit 50

Or narrow your search:
/search-customers "Acme Corp"

| ID    | Customer Name          | Domain           |
|-------|------------------------|------------------|
...
```

### Rate Limit Exceeded

```
Rate limit exceeded (700 req/min)

Waiting 30 seconds before retry...
```

## API Patterns

### List All Customers (Paginated)
```http
GET /api/v3/customers?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

### Get Customer Details
```http
GET /api/v3/customers/{customerId}
X-API-KEY: {api_key}
```

### Get Customer Contacts
```http
GET /api/v3/customers/{customerId}/contacts
X-API-KEY: {api_key}
```

### Get Customer Agents
```http
GET /api/v3/agents?customerId={customerId}
X-API-KEY: {api_key}
```

### Response Structure
```json
{
  "Page": 1,
  "ItemsInPage": 50,
  "TotalPages": 3,
  "TotalItemsCount": 125,
  "items": [
    {
      "CustomerID": 12345,
      "CustomerName": "Acme Corporation",
      "Domain": "acme.com",
      "Address": "123 Main St",
      "City": "New York",
      "State": "NY",
      "ZipCode": "10001",
      "Phone": "555-123-4567",
      "CreatedOn": "2023-01-15T10:00:00Z"
    }
  ]
}
```

## Related Commands

- `/create-ticket` - Create a ticket for a customer
- `/search-agents` - Search for customer agents
- `/list-alerts` - View customer alerts
