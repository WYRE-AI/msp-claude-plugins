---
description: Find a company in Hudu by name
argument-hint: "<name> [status]"
arguments: [name, status]
---

# Find Hudu Company

Find a company in Hudu by name with optional filters.

## Prerequisites

- Valid Hudu API key configured (`HUDU_API_KEY`)
- Hudu base URL configured (`HUDU_BASE_URL`)
- User must have company read permissions

## Steps

1. **Parse search parameters**
   - Extract company name query
   - Set status filter

2. **Execute search**
   - Search companies by name (partial match)
   - Apply status filter
   - Fetch related summary data

3. **Format and return results**
   - Display company details
   - Include resource counts
   - Provide quick actions

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Company name (partial match) |
| status | string | No | active | Status filter (active/archived/all) |

## Examples

### Basic Search

```
/find-company "Acme"
```

### Search All Statuses

```
/find-company "Acme" --status all
```

### Search Archived

```
/find-company "Corp" --status archived
```

## Output

### Single Match

```
Found 1 company matching "Acme Corporation"

Company: Acme Corporation
================================================================
ID:            123
Nickname:      ACME
Type:          Customer
PSA ID:        12345

Address:
  123 Main Street
  Springfield, IL 62704

Phone:         555-123-4567
Website:       https://www.acme.com

Notes:
Primary contact: John Smith (555-123-4567)
Contract renewal: March 2026

Resources:
================================================================
Assets:            42 items
Passwords:         28 items
Articles:          12 items
Websites:          3 items

Parent Company: Acme Holdings (ID: 100)

Child Companies:
  - Acme East Division (ID: 124)
  - Acme West Division (ID: 125)

Created: 2020-06-15
Updated: 2026-02-10

Quick Actions:
  - View assets: /lookup-asset --company "Acme Corporation"
  - Search articles: /search-articles --company "Acme Corporation"
  - Get password: /get-password --company "Acme Corporation"
  - Open in Hudu: [link]
================================================================
```

### Multiple Matches

```
Found 4 companies matching "Acme"

+------------------------+----------+----------+--------+--------+---------+
| Name                   | Nickname | Status   | Assets | Articles | PSA ID |
+------------------------+----------+----------+--------+--------+---------+
| Acme Corporation       | ACME     | Active   | 42     | 12     | 12345   |
| Acme East Division     | ACME-E   | Active   | 18     | 5      | 12346   |
| Acme West Division     | ACME-W   | Active   | 24     | 7      | 12347   |
| Acme Holdings          | ACME-H   | Active   | 3      | 2      | 12340   |
+------------------------+----------+----------+--------+--------+---------+

Select company:
  /find-company "Acme Corporation"
  /find-company "Acme East"
```

### No Results

```
No companies found matching "XYZ Company"

Suggestions:
  - Check spelling of the company name
  - Try a partial name match
  - Include archived: --status all
  - Try different keywords

Example searches:
  /find-company "XYZ"
  /find-company "Company" --status all
```

### Archived Companies

```
/find-company "Old Client" --status archived

Found 1 archived company matching "Old Client"

Company: Old Client Inc (ARCHIVED)
================================================================
ID:            1000
Nickname:      OCI
Type:          Former Client

Notes:
Client offboarded 2024-06-15. Final contact: Bob Manager.
Data retained for compliance.

Resources (historical):
================================================================
Assets:            15 items (archived)
Passwords:         12 items
Articles:          6 items

WARNING: This company is archived. Data is read-only.
================================================================
```

## Status Values

| Value | Description |
|-------|-------------|
| active | Currently active companies (default) |
| archived | Archived/historical companies |
| all | All companies regardless of status |

## Error Handling

### No Results

```
No companies found matching "xyz"

Suggestions:
  - Check spelling of the company name
  - Try a partial match
  - Include all statuses: --status all

Example:
  /find-company "xyz" --status all
```

### Invalid Status

```
Invalid status: "deleted"

Valid statuses:
  - active
  - archived
  - all

Example:
  /find-company "Acme" --status archived
```

### API Error

```
Error connecting to Hudu API

Possible causes:
  - Invalid API key (check HUDU_API_KEY)
  - Wrong base URL (check HUDU_BASE_URL)
  - Network connectivity issue

Retry or check configuration.
```

## Use Cases

### Pre-Ticket Research

Before working a ticket, look up the company:
```
/find-company "Acme"
```
This shows available documentation and resource counts.

### Verify PSA Sync

Check if company is synced with PSA:
```
/find-company "Acme"
```
The PSA ID field indicates sync status.

### Find Related Companies

Identify parent/child relationships:
```
/find-company "Acme Holdings"
```
Shows all divisions under the parent.

### Audit Archived Clients

Review historical client data:
```
/find-company "Old" --status archived
```

## Related Commands

- `/lookup-asset` - Find assets for a company
- `/search-articles` - Search company articles
- `/get-password` - Get company credentials
