---
description: Find a HubSpot company by name or domain and show associated contacts and deals
argument-hint: "<query> [show_contacts] [show_deals] [show_tickets]"
arguments: [query, show_contacts, show_deals, show_tickets]
---

# Look Up HubSpot Company

Find a company in HubSpot CRM by name or domain and display a complete profile including associated contacts, deals, and optionally tickets. Provides a single-view summary of the client relationship.

## Prerequisites

- HubSpot MCP server connected with valid OAuth credentials
- MCP tools `search_crm_objects` (`objectType: "companies"`), `get_crm_objects` (`objectType: "companies"`), `search_crm_objects` (`associatedWith` filter), `get_crm_objects` (`objectType: "contacts"`), and `get_crm_objects` (`objectType: "deals"`) available

## Steps

1. **Search for the company** by name or domain

   - If the query contains a dot (e.g., `acmecorp.com`), search by `domain` using `EQ`
   - Otherwise, search by `name` using `CONTAINS_TOKEN`
   - Call `search_crm_objects` (`objectType: "companies"`) with the constructed filter

2. **Retrieve full company details**

   Call `get_crm_objects` (`objectType: "companies"`) with the matched `companyId` to get all properties.

3. **Fetch associated contacts** (if show_contacts is true)

   - Call `search_crm_objects` with `objectType: "contacts"` and an `associatedWith` filter `{ objectType: "companies", operator: "EQUAL", objectIdValues: [<companyId>] }`
   - For each contact ID, call `get_crm_objects` (`objectType: "contacts"`) to get name, email, job title, and phone

4. **Fetch associated deals** (if show_deals is true)

   - Call `search_crm_objects` with `objectType: "deals"` and an `associatedWith` filter on the same record
   - For each deal ID, call `get_crm_objects` (`objectType: "deals"`) to get deal name, amount, stage, and close date

5. **Fetch associated tickets** (if show_tickets is true)

   - Call `search_crm_objects` with `objectType: "tickets"` and an `associatedWith` filter on the same record
   - For each ticket ID, call `get_crm_objects` (`objectType: "tickets"`) to get subject, status, and priority

   Each association search returns one page. Pass the returned `offset` and repeat until there are no more results, so the profile and deal total cover every record.

6. **Format and present the complete company profile**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Company name or domain |
| show_contacts | boolean | No | true | Include associated contacts |
| show_deals | boolean | No | true | Include associated deals |
| show_tickets | boolean | No | false | Include associated open tickets |

## Examples

### Look Up by Name

```
/lookup-company "Acme Corp"
```

### Look Up by Domain

```
/lookup-company "acmecorp.com"
```

### Full Profile with Tickets

```
/lookup-company "Acme Corp" --show_tickets true
```

### Company Only (No Associations)

```
/lookup-company "Acme Corp" --show_contacts false --show_deals false
```

## Output

### Full Company Profile

```
Company: Acme Corporation
================================================================

ID:              98765
Domain:          acmecorp.com
Industry:        Information Technology and Services
Phone:           555-123-4567
Address:         123 Main St, Springfield, IL 62704, US
Employees:       150
Annual Revenue:  $25,000,000
Lifecycle Stage: Customer
Company Type:    Client
Owner:           Sarah Johnson
Created:         2025-03-10
Last Modified:   2026-02-15

Contacts (4):
+------------------+---------------------------+---------------+--------------+
| Name             | Email                     | Phone         | Title        |
+------------------+---------------------------+---------------+--------------+
| John Smith       | john.smith@acmecorp.com   | 555-123-4567  | IT Director  |
| Jane Doe         | jane.doe@acmecorp.com     | 555-987-6543  | CFO          |
| Bob Johnson      | bob.j@acmecorp.com        | 555-456-7890  | CEO          |
| Alice Brown      | alice.b@acmecorp.com      | 555-222-3333  | Office Mgr   |
+------------------+---------------------------+---------------+--------------+

Deals (3):
+--------------------------------------------+--------+-----------+------------+
| Deal Name                                  | Amount | Stage     | Close Date |
+--------------------------------------------+--------+-----------+------------+
| Acme Corp - Managed IT Services            | $5,000 | Proposal  | 2026-04-15 |
| Acme Corp - Network Upgrade                | $12,000| Contract  | 2026-03-01 |
| Acme Corp - Annual Renewal 2026            | $48,000| Qualified | 2026-06-01 |
+--------------------------------------------+--------+-----------+------------+

Total Deal Value: $65,000

Quick Actions:
  - Search contacts: /search-contacts "@acmecorp.com"
  - Create deal: /create-deal --company "Acme Corporation"
  - Log activity: /log-activity --company "Acme Corporation" --type note
  - View pipeline: /pipeline-summary
================================================================
```

### Full Profile with Tickets

```
Company: Acme Corporation
================================================================

[...company details and contacts as above...]

Open Tickets (2):
+--------------------------------------------+----------+--------+----------+
| Subject                                    | Status   | Priority| Created  |
+--------------------------------------------+----------+--------+----------+
| Email delivery issues                      | In Prog  | HIGH   | 2026-02-20|
| VPN connectivity for remote users          | New      | MEDIUM | 2026-02-23|
+--------------------------------------------+----------+--------+----------+

================================================================
```

### Company Not Found

```
No company found matching "Unknown Corp"

Suggestions:
  - Check spelling of the company name
  - Try a partial name (e.g., "Unknown" instead of "Unknown Corp")
  - Search by domain: /lookup-company "unknown.com"
  - Search contacts instead: /search-contacts "Unknown Corp" --field company
```

### Multiple Matches

```
Multiple companies found matching "Acme"

+------------------+-------------------+-------------------+----------+
| Name             | Domain            | Industry          | Stage    |
+------------------+-------------------+-------------------+----------+
| Acme Corporation | acmecorp.com      | IT Services       | Customer |
| Acme Industries  | acmeindustries.com| Manufacturing     | Lead     |
| Acme Medical     | acmemedical.com   | Healthcare        | Customer |
+------------------+-------------------+-------------------+----------+

Please refine your search:
  /lookup-company "Acme Corporation"
  /lookup-company "acmecorp.com"
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to HubSpot MCP server

Check your MCP configuration and verify credentials at developers.hubspot.com
```

### Rate Limit

```
Error: Rate limit exceeded (429)

HubSpot allows 100 requests per 10 seconds.
Please wait a moment and try again.

Note: Looking up a company with many contacts and deals requires multiple API calls.
For companies with 50+ contacts, this may approach the rate limit.
```

### Too Many Associations

```
Note: Acme Corporation has 85 associated contacts.
Showing the first 20. Use /search-contacts "@acmecorp.com" for the full list.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `search_crm_objects` (`objectType: "companies"`) | Find company by name or domain |
| `get_crm_objects` (`objectType: "companies"`) | Get full company details |
| `search_crm_objects` (`associatedWith` filter) | Get associated contacts, deals, and tickets |
| `get_crm_objects` (`objectType: "contacts"`) | Get contact details for each association |
| `get_crm_objects` (`objectType: "deals"`) | Get deal details for each association |
| `get_crm_objects` (`objectType: "tickets"`) | Get ticket details (if show_tickets is true) |

## Related Commands

- `/search-contacts` - Search for contacts at a company
- `/search-deals` - Search deals for a company
- `/create-deal` - Create a new deal for the company
- `/log-activity` - Log a note or task on the company
- `/pipeline-summary` - View the full deal pipeline
