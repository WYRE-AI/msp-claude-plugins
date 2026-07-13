---
description: List all available PandaDoc templates with details
argument-hint: "[query] [tag]"
arguments: [query, tag]
---

# List PandaDoc Templates

List all available PandaDoc templates with their names, versions, dates, and tags. Useful for finding the right template before creating a document.

## Prerequisites

- PandaDoc MCP server connected with a valid API key
- MCP tool `pandadoc-list-templates` available

## Steps

1. **Fetch templates** from PandaDoc

   Call `pandadoc-list-templates` with optional parameters:
   - Set `q` to the search query (if provided)
   - Set `tag` to the tag filter (if provided)
   - Set `count=100` for maximum results per page
   - Set `page=1` for the first page

2. **Paginate if needed**

   If more than 100 templates exist, call `pandadoc-list-templates` again with `page=2`, etc.

3. **Format and display** the template list

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | - | Search templates by name or keyword |
| tag | string | No | - | Filter by template tag |

## Examples

### List All Templates

```
/list-templates
```

### Search for MSA Templates

```
/list-templates --query "Managed Services Agreement"
```

### Search by Keyword

```
/list-templates --query "proposal"
```

### Filter by Tag

```
/list-templates --tag "msp"
```

### Search with Tag

```
/list-templates --query "SOW" --tag "project"
```

## Output

### Template List

```
PandaDoc Templates
================================================================

Found 8 templates

+--------------------------------------------+------+---------------------+---------------------+
| Template Name                              | Ver  | Created             | Last Modified       |
+--------------------------------------------+------+---------------------+---------------------+
| Managed Services Agreement (MSA)           | v5   | 2025-06-15 10:00    | 2026-01-20 14:30    |
| Statement of Work (SOW)                    | v3   | 2025-08-01 09:00    | 2026-02-10 11:15    |
| Service Proposal                           | v4   | 2025-07-10 13:00    | 2026-02-01 16:45    |
| Hardware Quote                             | v2   | 2025-09-20 11:00    | 2025-12-15 10:30    |
| Non-Disclosure Agreement (NDA)             | v1   | 2025-10-05 14:00    | 2025-10-05 14:00    |
| Change Order                               | v2   | 2025-11-12 09:30    | 2026-01-08 11:00    |
| Quarterly Business Review (QBR)            | v3   | 2025-08-20 10:00    | 2026-02-15 09:45    |
| Cloud Migration Proposal                   | v1   | 2026-01-10 15:00    | 2026-02-20 13:30    |
+--------------------------------------------+------+---------------------+---------------------+

Tags:
  msp (6) | managed-services (2) | project (3) | security (1) | onboarding (1)

Quick Actions:
  - Create document: /create-document --template "Template Name" --recipient_email "email" --recipient_name "Name"
  - View template details: pandadoc-get-template with template ID
================================================================
```

### Search Results

```
PandaDoc Templates matching "proposal"
================================================================

Found 2 templates

+--------------------------------------------+------+---------------------+---------------------+
| Template Name                              | Ver  | Created             | Last Modified       |
+--------------------------------------------+------+---------------------+---------------------+
| Service Proposal                           | v4   | 2025-07-10 13:00    | 2026-02-01 16:45    |
| Cloud Migration Proposal                   | v1   | 2026-01-10 15:00    | 2026-02-20 13:30    |
+--------------------------------------------+------+---------------------+---------------------+

Quick Actions:
  - Create document: /create-document --template "Service Proposal" --recipient_email "email" --recipient_name "Name"
================================================================
```

### No Results

```
No templates found matching "XYZ Template"

Suggestions:
  - Check spelling of the template name
  - Try a shorter or broader search term
  - List all templates: /list-templates
  - Try common keywords: "MSA", "proposal", "quote", "SOW"
  - Create a new template in PandaDoc at app.pandadoc.com
```

### Empty Template Library

```
No templates found in your PandaDoc workspace.

Get started:
  - Create templates in PandaDoc at app.pandadoc.com
  - Use PandaDoc's template gallery for pre-built templates
  - Common MSP templates to create:
    1. Managed Services Agreement (MSA)
    2. Statement of Work (SOW)
    3. Service Proposal
    4. Hardware Quote
    5. Non-Disclosure Agreement (NDA)
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to PandaDoc MCP server

Possible causes:
  - API key is invalid or expired
  - MCP server is not configured
  - Network connectivity issue

Check your MCP configuration and regenerate the API key at app.pandadoc.com > Settings > API
```

### Rate Limit

```
Error: Rate limit exceeded (429)

Please wait a moment and try again.
PandaDoc allows 300 requests per minute (Business) or 600 (Enterprise).
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `pandadoc-list-templates` | List and search templates |
| `pandadoc-get-template` | Get template details (optional, for detailed view) |

## Related Commands

- `/create-document` - Create a document from a template
- `/send-document` - Send a document for signature
- `/document-status` - Check document status
- `/proposal-pipeline` - View proposals in the pipeline
