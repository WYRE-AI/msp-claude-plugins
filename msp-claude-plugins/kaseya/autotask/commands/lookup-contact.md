---
description: Search for Autotask contacts by name, email, phone, or company
argument-hint: "<query> [company_id] [active] [limit]"
arguments: [query, company_id, active, limit]
---

# Lookup Autotask Contact

Search for contacts in Autotask by name, email, phone, or company association for ticket creation and communication.

## Prerequisites

- Valid Autotask API credentials configured
- User must have contact read permissions

## Steps

1. **Determine search type**
   - If query contains "@", search by email
   - If query is numeric or contains dashes, search by phone
   - Otherwise, search by name (first/last name contains match)

2. **Build search filter**
   - Apply company ID filter if provided
   - Apply active status filter (default: active only)

3. **Execute search**
   - Use `autotask-mcp/autotask_search_contacts` with filters
   - Limit results as specified

4. **Display results**
   - Show contact details including name, email, phone
   - Include company association
   - Show contact title/role

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Name, email, or phone |
| company_id | integer | No | - | Filter by company |
| active | boolean | No | true | Active contacts only |
| limit | integer | No | 10 | Max results |

## Examples

### Search by Name

```
/lookup-contact "John Smith"
```

### Search by First Name

```
/lookup-contact "John"
```

### Search by Email

```
/lookup-contact "john.smith@acme.com"
```

### Search by Phone

```
/lookup-contact "555-123-4567"
```

### Filter by Company

```
/lookup-contact "John" --company_id 12345
```

### Include Inactive

```
/lookup-contact "Former Employee" --active false
```

## Output

```
Contact Search Results (3 found)

+--------+------------------+----------------------+------------------+-----------------+
| ID     | Name             | Email                | Phone            | Company         |
+--------+------------------+----------------------+------------------+-----------------+
| 54321  | John Smith       | john.smith@acme.com  | (555) 123-4567   | Acme Corp       |
| 54322  | John Doe         | john.doe@techstart.com | (555) 234-5678 | TechStart Inc   |
| 54323  | Johnny Williams  | jwilliams@dataco.com | (555) 345-6789   | DataCo          |
+--------+------------------+----------------------+------------------+-----------------+

Quick Actions:
  Create ticket: /create-ticket <company_id> "Title" --contact <email>
  View company: /lookup-company <company_id>
```

### Single Result (Detailed View)

```
Contact Found

Name: John Smith
ID: 54321
Title: IT Director
Status: Active

Company: Acme Corporation (ID: 12345)

Contact Information:
  Email: john.smith@acme.com
  Phone: (555) 123-4567
  Mobile: (555) 987-6543
  Fax: (555) 123-4568

Address:
  123 Main Street
  Suite 400
  New York, NY 10001

Alternate Contact: jane.assistant@acme.com

Notes:
  Primary IT contact. Available Mon-Fri 8am-5pm EST.
  Prefers email communication.

Recent Tickets: 3 open as contact

Quick Actions:
  Create ticket: /create-ticket 12345 "Title" --contact "john.smith@acme.com"
  View company: /lookup-company 12345
  Company contacts: /lookup-contact --company_id 12345
```

### Email Search Result

```
Contact Found by Email

Email: john.smith@acme.com

Name: John Smith
ID: 54321
Title: IT Director
Company: Acme Corporation (ID: 12345)

Phone: (555) 123-4567
Mobile: (555) 987-6543

Quick Actions:
  Create ticket: /create-ticket 12345 "Title" --contact "john.smith@acme.com"
```

### Company Filter Results

```
Contacts at Acme Corporation (5 found)

+--------+------------------+----------------------+------------------+-----------+
| ID     | Name             | Email                | Phone            | Title     |
+--------+------------------+----------------------+------------------+-----------+
| 54321  | John Smith       | john.smith@acme.com  | (555) 123-4567   | IT Dir    |
| 54324  | Jane Doe         | jane.doe@acme.com    | (555) 123-4569   | CFO       |
| 54325  | Bob Johnson      | bob.j@acme.com       | (555) 123-4570   | CEO       |
| 54326  | Alice Williams   | alice.w@acme.com     | (555) 123-4571   | HR Mgr    |
| 54327  | Charlie Brown    | charlie.b@acme.com   | (555) 123-4572   | Dev Lead  |
+--------+------------------+----------------------+------------------+-----------+

Company: Acme Corporation (ID: 12345)
Primary Contact: John Smith
```

## Error Handling

### No Results

```
No Contacts Found

No contacts match: "Johnathan"

Suggestions:
  - Check spelling
  - Try partial name: /lookup-contact "John"
  - Search by email if known
  - Include inactive: /lookup-contact "Johnathan" --active false
```

### Invalid Company ID

```
Error: Company not found: ID 99999

Verify the company ID and try again.
Use /lookup-company to find the correct ID.
```

### Ambiguous Email Domain

```
Contact Search Results (12 found)

Many contacts found with @acme.com domain.
Showing first 10 results.

Refine your search:
  - Use full email: /lookup-contact "john.smith@acme.com"
  - Add name filter: /lookup-contact "John" --company_id 12345
```

### Phone Not Found

```
No Contacts Found

No contacts with phone: "555-000-0000"

Tips:
  - Try different phone format: 5550000000
  - Search by name instead
  - Check if number is for a company (main line)
```

## Search Tips

| Query Type | Examples | Search Behavior |
|------------|----------|-----------------|
| Name | "John", "John Smith" | Searches first and last name |
| Email | "john@acme.com" | Exact or partial email match |
| Phone | "555-1234", "5551234" | Searches phone, mobile, fax |
| Partial | "smi", "@acme" | Contains match on relevant fields |

## MCP Tool Usage

This command uses the following autotask-mcp tools:
- `autotask_search_contacts` - Search contacts with filters
- `autotask_search_companies` - Get company details for context

## Related Commands

- `/lookup-company` - Find company information
- `/lookup-asset` - Find assets for a company/contact
- `/create-ticket` - Create ticket with contact
- `/search-tickets` - Search tickets by contact
