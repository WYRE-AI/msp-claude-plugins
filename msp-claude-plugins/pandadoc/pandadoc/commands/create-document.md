---
description: Create a new PandaDoc document from a template with recipients and content
argument-hint: "<template> <recipient_email> <recipient_name> [document_name] [variables]"
arguments: [template, recipient_email, recipient_name, document_name, variables]
---

# Create PandaDoc Document

Create a new document from a PandaDoc template, populated with recipients and content tokens. This is the primary way MSPs create proposals, MSAs, SOWs, and quotes for clients.

## Prerequisites

- PandaDoc MCP server connected with a valid API key
- MCP tools `pandadoc-list-templates`, `pandadoc-get-template`, and `pandadoc-create-document` available
- Template must exist in PandaDoc
- Recipient must have a valid email address

## Steps

1. **Resolve template** - Find the template by name or use the provided ID

   - If a name was provided, call `pandadoc-list-templates` with `q` set to the template name
   - If an ID was provided, call `pandadoc-get-template` with `id`

2. **Review template details** - Get tokens, fields, and roles

   Call `pandadoc-get-template` with the resolved template `id` to identify:
   - Required content tokens
   - Recipient roles defined in the template
   - Pricing table structure (if any)

3. **Build the document** - Create with recipients and content

   Call `pandadoc-create-document` with:
   - `template_uuid` set to the resolved template ID
   - `name` set to the document name (or auto-generate from template + recipient)
   - `recipients` array with at least the primary recipient
   - `tokens` array with content variables mapped from the user's input

4. **Verify document creation**

   Call `pandadoc-get-document` with the returned `id` to confirm:
   - Document was created successfully
   - All tokens were populated
   - Recipients are correct

5. **Present document summary** to the user

6. **Optionally send** - Ask if the user wants to send immediately or review first

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| template | string | Yes | - | Template name or ID |
| recipient_email | string | Yes | - | Primary recipient email address |
| recipient_name | string | Yes | - | Primary recipient full name (first and last) |
| document_name | string | No | auto | Document name (defaults to "Template Name - Recipient Name") |
| variables | key-value | No | - | Content token values (e.g., Client.Company=Acme Corporation) |

## Examples

### Basic Document from Template

```
/create-document --template "Managed Services Agreement" --recipient_email "john@acme.com" --recipient_name "John Smith"
```

### With Custom Document Name

```
/create-document --template "Managed Services Agreement" --recipient_email "john@acme.com" --recipient_name "John Smith" --document_name "Acme Corp - MSA 2026"
```

### With Content Variables

```
/create-document --template "Managed Services Agreement" --recipient_email "john@acme.com" --recipient_name "John Smith" --variables "Client.Company=Acme Corporation, Contract.StartDate=March 1 2026, Contract.Term=36 months, Client.UserCount=50"
```

### Hardware Quote

```
/create-document --template "Hardware Quote" --recipient_email "lisa@globalservices.com" --recipient_name "Lisa Chen" --document_name "Global Services - Workstation Refresh Q1 2026"
```

### Statement of Work

```
/create-document --template "Statement of Work" --recipient_email "mike@riverside.com" --recipient_name "Mike Torres" --variables "Project.Name=Network Infrastructure Upgrade, Project.Timeline=8 weeks, Project.Budget=$45000"
```

## Output

### Document Created

```
Document Created Successfully
================================================================

Document ID:    msFYActMfJHqNTKH9tcPFa
Name:           Acme Corp - Managed Services Agreement
Status:         Draft
Template:       Managed Services Agreement (v5)
Created:        2026-02-24T10:30:00.000Z

Recipients:
  1. John Smith <john@acme.com> - Client (Signer, Order: 1)

Content Tokens:
  Client.Company:     Acme Corporation
  Contract.StartDate: March 1, 2026
  Contract.Term:      36 months
  Client.UserCount:   50

Next Steps:
  - Review the document in PandaDoc: https://app.pandadoc.com/a/#/documents/msFYActMfJHqNTKH9tcPFa
  - Add MSP countersigner if needed
  - Send for signature: /send-document --document_id "msFYActMfJHqNTKH9tcPFa"
================================================================
```

### Template Not Found

```
Template not found: "Nonexistent Template"

Suggestions:
  - Check spelling of the template name
  - List available templates: /list-templates
  - Search by keyword: /list-templates --query "MSA"
  - Create the template in PandaDoc first at app.pandadoc.com
```

### Missing Required Tokens

```
Warning: Template has tokens that were not provided

Template: Managed Services Agreement
Missing tokens:
  - Client.Address (no default value)
  - SLA.ResponseTime (no default value)
  - SLA.Uptime (no default value)

The document was created with empty values for these tokens.
Edit the document in PandaDoc or recreate with:

/create-document --template "Managed Services Agreement" \
  --recipient_email "john@acme.com" \
  --recipient_name "John Smith" \
  --variables "Client.Company=Acme, Client.Address=123 Main St, SLA.ResponseTime=15 minutes, SLA.Uptime=99.9%"
```

### Invalid Recipient

```
Error: Invalid recipient email address

"john@" is not a valid email address.

Please provide a valid email:
  /create-document --template "MSA" --recipient_email "john@acme.com" --recipient_name "John Smith"
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

### Template Permission Error

```
Error: Access denied for template "Enterprise MSA"

Your API key may not have access to this template.
Check template sharing settings in PandaDoc or use a different API key.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `pandadoc-list-templates` | Find template by name |
| `pandadoc-get-template` | Get template details (tokens, roles, fields) |
| `pandadoc-create-document` | Create the document from template |
| `pandadoc-get-document` | Verify document was created correctly |

## Related Commands

- `/send-document` - Send the created document for signature
- `/document-status` - Check the document status after creation
- `/list-templates` - Browse available templates before creating
- `/proposal-pipeline` - View all proposals in the pipeline
