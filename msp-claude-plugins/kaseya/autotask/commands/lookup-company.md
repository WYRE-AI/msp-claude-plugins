---
description: Search for Autotask companies by name, ID, or other attributes
argument-hint: "<query> [type] [active] [limit]"
arguments: [query, type, active, limit]
---

# Lookup Autotask Company

Search for companies/accounts in Autotask by name, ID, or other attributes to find company information for ticket creation and context.

## Prerequisites

- Valid Autotask API credentials configured
- User must have company read permissions

## Steps

1. **Determine search type**
   - If query is numeric, search by company ID directly
   - If query is text, search by company name (contains match)

2. **Build search filter**
   - Apply company type filter if provided
   - Apply active status filter (default: active only)

3. **Execute search**
   - Use `autotask-mcp/autotask_search_companies` with filters
   - Limit results as specified

4. **Display results**
   - Show company details including ID, name, type
   - Include contact count and primary contact
   - Show contract status summary

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Company name, partial name, or ID |
| type | string | No | - | Company type filter |
| active | boolean | No | true | Active companies only |
| limit | integer | No | 10 | Max results |

## Examples

### Search by Name

```
/lookup-company "Acme"
```

### Search by Exact Name

```
/lookup-company "Acme Corporation"
```

### Search by ID

```
/lookup-company 12345
```

### Filter by Type

```
/lookup-company "Acme" --type Customer
```

### Include Inactive

```
/lookup-company "Old Client" --active false
```

### Limit Results

```
/lookup-company "Tech" --limit 5
```

## Output

```
Company Search Results (3 found)

+--------+----------------------+----------+--------+------------+------------------+
| ID     | Company Name         | Type     | Status | Contacts   | Primary Contact  |
+--------+----------------------+----------+--------+------------+------------------+
| 12345  | Acme Corporation     | Customer | Active | 15         | John Smith       |
| 12346  | Acme Industries      | Customer | Active | 8          | Jane Doe         |
| 12347  | Acme LLC             | Lead     | Active | 2          | Bob Johnson      |
+--------+----------------------+----------+--------+------------+------------------+

Quick Actions:
  View contracts: /check-contract --company_id <id>
  Find contacts: /lookup-contact --company_id <id>
  Create ticket: /create-ticket <id> "Title"
```

### Single Result (Detailed View)

```
Company Found

Company: Acme Corporation
ID: 12345
Type: Customer
Status: Active

Address:
  123 Main Street
  Suite 400
  New York, NY 10001
  United States

Phone: (555) 123-4567
Website: www.acmecorp.com

Primary Contact: John Smith (john.smith@acmecorp.com)
Total Contacts: 15

Active Contracts: 2
  - Managed Services Agreement (Monthly)
  - Microsoft 365 License Bundle (Annual)

Recent Tickets: 5 open, 42 total this year

Quick Actions:
  View contracts: /check-contract --company_id 12345
  Find contacts: /lookup-contact --company_id 12345
  Create ticket: /create-ticket 12345 "Title"
  Search tickets: /search-tickets --company 12345
```

### ID Lookup

```
Company Details

Company: Acme Corporation
ID: 12345
Type: Customer
Status: Active

Phone: (555) 123-4567
Primary Contact: John Smith (john.smith@acmecorp.com)

Contracts: 2 active
Open Tickets: 5

Quick Actions:
  View contracts: /check-contract --company_id 12345
  Find contacts: /lookup-contact --company_id 12345
```

## Error Handling

### No Results

```
No Companies Found

No companies match: "Acmee"

Suggestions:
  - Check spelling
  - Try a partial name: /lookup-company "Acm"
  - Include inactive: /lookup-company "Acmee" --active false
```

### Invalid Company Type

```
Error: Invalid company type: "Client"

Valid company types:
- Customer
- Lead
- Prospect
- Dead
- Vendor
- Partner
```

### ID Not Found

```
Error: Company not found: ID 99999

This company ID does not exist or you do not have access.
Try searching by name: /lookup-company "company name"
```

### Too Many Results

```
Company Search Results (50+ found)

Showing first 10 results. Refine your search for better results.

+--------+----------------------+----------+--------+
| ID     | Company Name         | Type     | Status |
+--------+----------------------+----------+--------+
| ...    | ...                  | ...      | ...    |
+--------+----------------------+----------+--------+

Tips:
  - Use more specific search term
  - Filter by type: --type Customer
  - Increase limit: --limit 25
```

## Company Type Reference

| Type | Description |
|------|-------------|
| Customer | Active paying customer |
| Lead | Potential customer (sales lead) |
| Prospect | Qualified prospect |
| Dead | Inactive/lost customer |
| Vendor | Supplier or vendor |
| Partner | Business partner |

## MCP Tool Usage

This command uses the following autotask-mcp tools:
- `autotask_search_companies` - Search companies with filters
- `autotask_search_contacts` - Get contact count/primary contact
- `autotask_search_contracts` - Get contract summary

## Related Commands

- `/lookup-contact` - Find contacts at a company
- `/lookup-asset` - Find assets for a company
- `/check-contract` - View company contracts
- `/create-ticket` - Create ticket for company
- `/search-tickets` - Search tickets by company
