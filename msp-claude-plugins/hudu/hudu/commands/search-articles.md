---
description: Search Hudu knowledge base articles by keyword or phrase
argument-hint: "<query> [company] [limit]"
arguments: [query, company, limit]
---

# Search Hudu Articles

Search through Hudu knowledge base articles to find relevant documentation.

## Prerequisites

- Valid Hudu API key configured (`HUDU_API_KEY`)
- Hudu base URL configured (`HUDU_BASE_URL`)
- User must have article read permissions

## Steps

1. **Parse search parameters**
   - Extract search query terms
   - Resolve company name to ID if provided
   - Set result limit

2. **Execute search**
   - Search articles by name and content
   - Apply company filter
   - Paginate through results as needed

3. **Rank and format results**
   - Sort by relevance (name matches first)
   - Display with content snippets
   - Include quick actions

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search keywords or phrase |
| company | string | No | - | Company name filter |
| limit | int | No | 10 | Maximum results (1-50) |

## Examples

### Basic Search

```
/search-articles "backup procedure"
```

### Search in Company

```
/search-articles "disaster recovery" --company "Acme Corp"
```

### Limit Results

```
/search-articles "password" --limit 5
```

### Combined Filters

```
/search-articles "VPN setup" --company "Acme" --limit 20
```

## Output

### Results Found

```
Found 5 articles matching "backup procedure"

================================================================

1. Backup Procedure - Daily Operations
   Company: Acme Corporation
   Folder: Procedures > Backup
   Updated: 2025-12-10

   "...The daily backup procedure runs at 10PM and backs up all
   file server data to the NAS. Verify backup completion each
   morning by checking..."

   [View Article] [Open in Hudu]

================================================================

2. Backup Overview - Acme Corp
   Company: Acme Corporation
   Folder: Infrastructure
   Updated: 2025-11-25

   Backup Solution: Veeam Backup & Replication
   Backup Server: ACME-BKP-01
   Retention: 30 days local, 90 days cloud

   [View Article] [Open in Hudu]

================================================================

3. Disaster Recovery Plan
   Company: Acme Corporation
   Folder: Procedures > DR
   Updated: 2025-10-15

   "...In case of complete site failure, restore from backup
   using the disaster recovery procedure outlined below..."

   [View Article] [Open in Hudu]

================================================================

Showing 3 of 5 results. Use --limit 50 to see more.
```

### Single Detailed Result

When only one result is found, show full details:

```
Found 1 article matching "VPN setup Acme"

Article: VPN Setup Procedure
================================================================
Company: Acme Corporation
Folder: Procedures > Remote Access
Created: 2024-06-15
Updated: 2025-12-01

Content Preview:
================================================================

VPN Setup Procedure

Overview
This procedure covers setting up VPN access for remote users.

Prerequisites
- Active Directory account
- VPN client installed
- MFA token configured

Steps
1. Download the VPN client from...
2. Enter the server address: vpn.acme.com
3. Use your AD credentials...

================================================================

Related Resources:
- VPN Credentials: /get-password "VPN" --company "Acme Corp"
- Firewall: /lookup-asset "firewall" --company "Acme Corp"

[Open in Hudu]
```

### No Results

```
No articles found matching "nonexistent topic"

Suggestions:
  - Try different keywords
  - Use partial words (e.g., "back" instead of "backup")
  - Remove company filter to search all companies
  - Check global articles (shared across companies)

Example searches:
  /search-articles "backup"
  /search-articles "network" --company "Acme"
```

## Search Behavior

| Search Term | Matches |
|-------------|---------|
| Single word | Title and content containing word |
| Multiple words | All words must appear (AND) |
| "Quoted phrase" | Exact phrase match |

## Error Handling

### No Results

```
No articles found matching "xyz123"

Try:
  - Broadening your search terms
  - Removing filters
  - Checking for typos
```

### Invalid Company

```
Company not found: "Acm"

Did you mean?
  - Acme Corporation
  - Acme East Division

Try: /search-articles "backup" --company "Acme Corporation"
```

### Too Many Results

```
Found 150+ articles matching "the"

Your search returned too many results. Please refine:
  - Add more specific keywords
  - Filter by company: --company "Acme"
  - Use quoted phrases: "backup procedure"
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

## Related Commands

- `/lookup-asset` - Find assets
- `/get-password` - Get credentials
- `/find-company` - Find company details
