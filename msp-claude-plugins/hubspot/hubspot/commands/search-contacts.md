---
description: Search HubSpot contacts by name, email, or company
argument-hint: "<query> [field] [lifecycle_stage]"
arguments: [query, field, lifecycle_stage]
---

# Search HubSpot Contacts

Search for contacts in HubSpot CRM by name, email address, or company name. Returns matching contacts with key details and associated records.

## Prerequisites

- HubSpot MCP server connected with valid OAuth credentials
- MCP tools `hubspot_search_contacts`, `hubspot_retrieve_contact`, and `hubspot_list_contact_properties` available

## Steps

1. **Build search filters** based on the user's query

   Determine which field(s) to search:
   - If the query contains `@`, search by `email` using `CONTAINS_TOKEN`
   - If a specific field is requested, search that field
   - Otherwise, search by `firstname`, `lastname`, and `email` across multiple filter groups

2. **Execute the search** using `hubspot_search_contacts`

   Call `hubspot_search_contacts` with the constructed `filterGroups`, `limit=100`, and sort by `lastname` ascending.

3. **Optionally filter by lifecycle stage**

   If a lifecycle stage filter is provided, add it to the filter groups.

4. **Format and return results** with contact details

   For each matching contact, display name, email, phone, company, lifecycle stage, and last activity date.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search term (name, email, or company) |
| field | string | No | all | Specific field to search (name, email, company) |
| lifecycle_stage | string | No | all | Filter by lifecycle stage |

## Examples

### Search by Name

```
/search-contacts "John Smith"
```

### Search by Email

```
/search-contacts "john@acmecorp.com"
```

### Search by Email Domain

```
/search-contacts "@acmecorp.com"
```

### Search by Company Name

```
/search-contacts "Acme" --field company
```

### Search Customers Only

```
/search-contacts "Smith" --lifecycle_stage customer
```

## Output

### Standard Results

```
Found 3 contacts matching "Smith"

+------------------+---------------------------+---------------+-------------------+----------+
| Name             | Email                     | Phone         | Company           | Stage    |
+------------------+---------------------------+---------------+-------------------+----------+
| John Smith       | john.smith@acmecorp.com   | 555-123-4567  | Acme Corporation  | Customer |
| Jane Smith       | jane.smith@betainc.com    | 555-987-6543  | Beta Inc          | Customer |
| Bob Smith        | bob.smith@gammatech.com   | 555-456-7890  | Gamma Technologies| Lead     |
+------------------+---------------------------+---------------+-------------------+----------+

Quick Actions:
  - View details: Ask about contact ID 12345
  - Search deals: /search-deals --company "Acme Corporation"
  - Look up company: /lookup-company "Acme Corporation"
```

### Single Result with Details

```
Found 1 contact matching "john.smith@acmecorp.com"

Contact: John Smith
================================================================
ID:              12345
Email:           john.smith@acmecorp.com
Phone:           555-123-4567
Mobile:          555-111-2222
Company:         Acme Corporation
Job Title:       IT Director
Lifecycle Stage: Customer
Lead Status:     CONNECTED
Owner:           Sarah Johnson
Created:         2025-06-15
Last Modified:   2026-02-10
Last Activity:   2026-02-08

Associated Records:
  - Company: Acme Corporation (ID: 98765)
  - Deals: 2 open deals
  - Tickets: 1 open ticket

Quick Actions:
  - Log activity: /log-activity --contact "John Smith" --type note
  - Search deals: /search-deals --company "Acme Corporation"
  - Create deal: /create-deal --company "Acme Corporation"
================================================================
```

### No Results

```
No contacts found matching "Unknown Person"

Suggestions:
  - Check spelling of the name or email
  - Try a partial match (e.g., "Smith" instead of "John Smith")
  - Search by email domain: /search-contacts "@company.com"
  - Search by company: /search-contacts "Company Name" --field company
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to HubSpot MCP server

Possible causes:
  - OAuth credentials are invalid or expired
  - MCP server is not configured
  - Network connectivity issue

Check your MCP configuration and verify credentials at developers.hubspot.com
```

### Rate Limit

```
Error: Rate limit exceeded (429)

HubSpot allows 100 requests per 10 seconds.
Please wait a moment and try again.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `hubspot_search_contacts` | Search contacts by name, email, or company |
| `hubspot_retrieve_contact` | Get full contact details for single results |
| `hubspot_access_associations` | Get associated companies, deals, and tickets |

## Related Commands

- `/lookup-company` - Find a company and its associated contacts
- `/search-deals` - Search deals related to a contact's company
- `/log-activity` - Log a note or task on a contact
- `/create-deal` - Create a deal associated with a contact
