---
description: Find an organization in IT Glue by name
argument-hint: "<name> [type] [status]"
arguments: [name, type, status]
---

# Find IT Glue Organization

Find an organization in IT Glue by name with optional filters.

## Prerequisites

- Valid IT Glue API key configured (`IT_GLUE_API_KEY`)
- IT Glue region configured (`IT_GLUE_REGION`)
- User must have organization read permissions

## Steps

1. **Parse search parameters**
   - Extract organization name query
   - Map type filter to organization type ID
   - Map status filter to organization status ID

2. **Execute search**
   - Search organizations by name (partial match)
   - Apply type and status filters
   - Fetch related summary data

3. **Format and return results**
   - Display organization details
   - Include resource counts
   - Provide quick actions

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Organization name (partial match) |
| type | string | No | - | Type filter (customer/vendor/partner/internal) |
| status | string | No | active | Status filter (active/inactive/archived/all) |

## Examples

### Basic Search

```
/find-organization "Acme"
```

### Search All Statuses

```
/find-organization "Acme" --status all
```

### Filter by Type

```
/find-organization "Tech" --type vendor
```

### Filter by Status

```
/find-organization "Corp" --status archived
```

### Combined Filters

```
/find-organization "Inc" --type customer --status active
```

## Output

### Single Match

```
Found 1 organization matching "Acme Corporation"

Organization: Acme Corporation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID:            123456
Type:          Customer
Status:        Active
Short Name:    ACME
PSA ID:        12345 (Autotask)

Quick Notes:
Primary contact: John Smith (555-123-4567)
Contract renewal: March 2024

Alert: Contract renewal due in 30 days

Resources:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Configurations:     42 assets
Contacts:           15 contacts
Passwords:          28 passwords
Documents:          12 documents
Flexible Assets:    8 assets

Parent Organization: Acme Holdings (ID: 123400)

Child Organizations:
  - Acme East Division (ID: 123457)
  - Acme West Division (ID: 123458)

Created: 2020-06-15
Updated: 2024-02-10

Quick Actions:
  - View assets: /lookup-asset --organization "Acme Corporation"
  - Search docs: /search-docs --organization "Acme Corporation"
  - Get password: /get-password --organization "Acme Corporation"
  - Open in IT Glue: [link]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Multiple Matches

```
Found 4 organizations matching "Acme"

┌────────────────────────┬──────────────┬──────────┬────────┬───────┬─────────┐
│ Name                   │ Type         │ Status   │ Assets │ Docs  │ PSA ID  │
├────────────────────────┼──────────────┼──────────┼────────┼───────┼─────────┤
│ Acme Corporation       │ Customer     │ Active   │ 42     │ 12    │ 12345   │
│ Acme East Division     │ Customer     │ Active   │ 18     │ 5     │ 12346   │
│ Acme West Division     │ Customer     │ Active   │ 24     │ 7     │ 12347   │
│ Acme Holdings          │ Customer     │ Active   │ 3      │ 2     │ 12340   │
└────────────────────────┴──────────────┴──────────┴────────┴───────┴─────────┘

Select organization:
  /find-organization "Acme Corporation"
  /find-organization "Acme East"
```

### No Results

```
No organizations found matching "XYZ Company"

Suggestions:
  - Check spelling of the organization name
  - Try a partial name match
  - Include inactive/archived: --status all
  - Try different keywords

Example searches:
  /find-organization "XYZ"
  /find-organization "Company" --status all
```

### Archived Organizations

```
/find-organization "Old Client" --status archived

Found 1 archived organization matching "Old Client"

Organization: Old Client Inc (ARCHIVED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID:            123000
Type:          Customer
Status:        Archived

Quick Notes:
Client offboarded 2023-06-15. Final contact: Bob Manager.
Data retained for compliance.

Resources (historical):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Configurations:     15 assets (archived)
Contacts:           8 contacts
Passwords:          12 passwords (archived)
Documents:          6 documents

⚠️  This organization is archived. Data is read-only.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Filter Reference

### Type Values

| Value | Description |
|-------|-------------|
| customer | Active service clients |
| vendor | Product/service suppliers |
| partner | Business partners |
| internal | Your own organization |

### Status Values

| Value | Description |
|-------|-------------|
| active | Currently serviced (default) |
| inactive | Not currently active |
| archived | Historical only |
| all | All statuses |

## Error Handling

### No Results

```
No organizations found matching "xyz"

Suggestions:
  - Check spelling of the organization name
  - Try a partial match
  - Include all statuses: --status all

Example:
  /find-organization "xyz" --status all
```

### Invalid Type

```
Invalid organization type: "client"

Valid types:
  - customer
  - vendor
  - partner
  - internal

Example:
  /find-organization "Acme" --type customer
```

### Invalid Status

```
Invalid status: "deleted"

Valid statuses:
  - active
  - inactive
  - archived
  - all

Example:
  /find-organization "Acme" --status archived
```

### API Error

```
Error connecting to IT Glue API

Possible causes:
  - Invalid API key (check IT_GLUE_API_KEY)
  - Wrong region (check IT_GLUE_REGION)
  - Network connectivity issue

Retry or check configuration.
```

## Use Cases

### Pre-Ticket Research

Before creating a ticket, look up the organization:
```
/find-organization "Acme"
```
This shows available documentation and contact information.

### Verify PSA Sync

Check if organization is synced with PSA:
```
/find-organization "Acme"
```
The PSA ID field indicates sync status.

### Find Related Organizations

Identify parent/child relationships:
```
/find-organization "Acme Holdings"
```
Shows all divisions under the parent.

### Audit Archived Clients

Review historical client data:
```
/find-organization "Old" --status archived
```

## Related Commands

- `/lookup-asset` - Find assets for an organization
- `/search-docs` - Search organization documentation
- `/get-password` - Get organization credentials
