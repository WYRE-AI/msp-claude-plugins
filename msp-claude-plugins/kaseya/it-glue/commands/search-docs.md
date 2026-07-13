---
description: Search IT Glue documentation by keyword or phrase
argument-hint: "<query> [organization] [type] [limit]"
arguments: [query, organization, type, limit]
---

# Search IT Glue Documentation

Search through IT Glue documents and flexible assets to find relevant documentation.

## Prerequisites

- Valid IT Glue API key configured (`IT_GLUE_API_KEY`)
- IT Glue region configured (`IT_GLUE_REGION`)
- User must have document read permissions

## Steps

1. **Parse search parameters**
   - Extract search query terms
   - Resolve organization name to ID if provided
   - Map document type filter

2. **Execute search**
   - Search documents by name and content
   - Search flexible assets by name and traits
   - Apply organization and type filters

3. **Rank and format results**
   - Sort by relevance (name matches first)
   - Display with content snippets
   - Include quick actions

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search keywords or phrase |
| organization | string | No | - | Organization name filter |
| type | string | No | - | Type filter (document/flexible-asset) |
| limit | int | No | 10 | Maximum results (1-50) |

## Examples

### Basic Search

```
/search-docs "backup procedure"
```

### Search in Organization

```
/search-docs "disaster recovery" --organization "Acme Corp"
```

### Search Documents Only

```
/search-docs "network diagram" --type "document"
```

### Search Flexible Assets Only

```
/search-docs "Microsoft 365" --type "flexible-asset"
```

### Limit Results

```
/search-docs "password" --limit 5
```

### Combined Filters

```
/search-docs "VPN setup" --organization "Acme" --type "document" --limit 20
```

## Output

### Results Found

```
Found 5 documents matching "backup procedure"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Backup Procedure - Daily Operations
   Organization: Acme Corporation
   Type: Document
   Folder: Procedures > Backup
   Updated: 2024-02-10

   "...The daily backup procedure runs at 10PM and backs up all
   file server data to the NAS. Verify backup completion each
   morning by checking..."

   [View Document] [Open in IT Glue]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. Backup Overview - Acme Corp
   Organization: Acme Corporation
   Type: Flexible Asset (Backup Overview)
   Updated: 2024-01-25

   Backup Solution: Veeam Backup & Replication
   Backup Server: ACME-BKP-01
   Retention: 30 days local, 90 days cloud

   [View Asset] [Open in IT Glue]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. Disaster Recovery Plan
   Organization: Acme Corporation
   Type: Document
   Folder: Procedures > DR
   Updated: 2024-01-15

   "...In case of complete site failure, restore from backup
   using the disaster recovery procedure outlined below..."

   [View Document] [Open in IT Glue]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Showing 3 of 5 results. Use --limit 50 to see more.
```

### Single Detailed Result

When only one result is found, show full details:

```
Found 1 document matching "VPN setup Acme"

Document: VPN Setup Procedure
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Organization: Acme Corporation
Folder: Procedures > Remote Access
Created: 2023-06-15
Updated: 2024-02-01

Content Preview:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VPN Setup Procedure

Overview
This document covers the setup of VPN access for remote users.

Prerequisites
- Active Directory account
- VPN client installed
- MFA token configured

Steps
1. Download the VPN client from...
2. Enter the server address: vpn.acme.com
3. Use your AD credentials...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Related Resources:
- VPN Credentials: /get-password "VPN" --organization "Acme Corp"
- Firewall: /lookup-asset "firewall" --organization "Acme Corp"

[Open in IT Glue]
```

### No Results

```
No documents found matching "nonexistent topic"

Suggestions:
  - Try different keywords
  - Use partial words (e.g., "back" instead of "backup")
  - Remove organization filter to search all orgs
  - Check flexible assets: --type "flexible-asset"

Example searches:
  /search-docs "backup"
  /search-docs "network" --organization "Acme"
```

## Filter Reference

### Type Values

| Value | Searches |
|-------|----------|
| document | IT Glue documents only |
| flexible-asset | Flexible assets only |
| (none) | Both documents and flexible assets |

### Search Behavior

| Search Term | Matches |
|-------------|---------|
| Single word | Title and content containing word |
| Multiple words | All words must appear (AND) |
| "Quoted phrase" | Exact phrase match |

## Error Handling

### No Results

```
No documents found matching "xyz123"

Try:
  - Broadening your search terms
  - Removing filters
  - Checking for typos
```

### Invalid Organization

```
Organization not found: "Acm"

Did you mean?
  - Acme Corporation
  - Acme East Division

Try: /search-docs "backup" --organization "Acme Corporation"
```

### Too Many Results

```
Found 150+ documents matching "the"

Your search returned too many results. Please refine:
  - Add more specific keywords
  - Filter by organization: --organization "Acme"
  - Filter by type: --type "document"
  - Use quoted phrases: "backup procedure"
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

## Related Commands

- `/lookup-asset` - Find configuration items
- `/get-password` - Get credentials
- `/find-organization` - Find organization details
