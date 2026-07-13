---
name: "PandaDoc Templates"
description: >
  Use this skill when working with PandaDoc templates - browsing the
  template library, finding the right template for a document type,
  understanding template fields and tokens, and using templates to
  create new documents. Covers MSP-specific templates for MSAs, SOWs,
  proposals, quotes, and contracts.
when_to_use: >-
  When browsing the template library, finding the right template for a document type,
  understanding template fields and tokens, and using templates to create new documents. Use when:
  pandadoc template, pandadoc blueprint, pandadoc library, document template, template search,
  template list, msa template, sow template, proposal template, or quote template.
---

# PandaDoc Template Management

## Overview

Templates in PandaDoc are reusable document blueprints that define the structure, layout, content, and fields of a document. MSPs use templates to standardize their business documents -- managed service agreements (MSAs), statements of work (SOWs), proposals, hardware quotes, and NDAs. Templates contain placeholders (tokens) for client-specific content, signature fields, and pricing tables that get populated when a document is created. A well-organized template library is the foundation of an efficient MSP sales process.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pandadoc-list-templates` | List and search templates | `q` (search query), `count`, `page`, `tag`, `folder_uuid` |
| `pandadoc-get-template` | Get template details | `id` (required) |

### List Templates

Call `pandadoc-list-templates` with optional parameters:

- **Search by name:** Set `q` to a template name or keyword (e.g., "MSA", "proposal", "quote")
- **Filter by tag:** Set `tag` to a template tag (e.g., "msp", "managed-services")
- **Filter by folder:** Set `folder_uuid` to filter by a specific folder
- **Paginate:** Set `page` (1-based) and `count` (up to 100)

**Example: Find MSA templates:**
- `pandadoc-list-templates` with `q=Managed Services Agreement`, `count=100`

**Example: Find all proposal templates:**
- `pandadoc-list-templates` with `q=proposal`, `count=100`

**Example: List all templates:**
- `pandadoc-list-templates` with `count=100`, `page=1`

### Get Template Details

Call `pandadoc-get-template` with the `id` parameter to get full template details including fields, tokens, roles, and pricing table structure.

**Example:**
- `pandadoc-get-template` with `id=tpl_abc123def456`

## Key Concepts

### Template Structure

| Component | Description | Example |
|-----------|-------------|---------|
| Layout | Page structure and design | Header, body sections, footer |
| Content blocks | Static text and formatting | Terms and conditions, scope descriptions |
| Tokens | Dynamic text placeholders | `{{Client.Company}}`, `{{Contract.StartDate}}` |
| Fields | Interactive form fields | Text inputs, checkboxes, dropdowns |
| Signature fields | E-signature placeholders | Signature, initials, date signed |
| Pricing tables | Line-item pricing | Services, hardware, recurring fees |
| Roles | Recipient roles | Client, MSP, Approver |

### Common MSP Templates

| Template | Purpose | Key Tokens |
|----------|---------|-----------|
| Managed Services Agreement (MSA) | Long-term IT management contract | Client.Company, Contract.Term, Contract.Value, MSP.Company |
| Statement of Work (SOW) | Project-specific scope and deliverables | Project.Name, Project.Timeline, Project.Budget |
| Service Proposal | Proposed managed services with pricing | Client.Company, Services.Description, Pricing |
| Hardware Quote | Equipment and licensing quote | Client.Company, Quote.ValidUntil, Items |
| NDA | Non-disclosure agreement | Client.Company, Client.Name, Effective.Date |
| Change Order | Modifications to existing agreements | ChangeOrder.Number, Original.Agreement, Changes |
| Quarterly Business Review (QBR) | Review document for client meetings | Client.Company, Review.Period, Metrics |

### Template Versioning

Templates in PandaDoc support versioning:

| Field | Description |
|-------|-------------|
| `version` | Current version number |
| `date_created` | When the template was first created |
| `date_modified` | When the template was last updated |

> **Important:** When a template is updated, existing documents created from earlier versions are not affected. New documents will use the latest version.

### Template Tags

Use tags to organize templates by category:

| Tag | Purpose |
|-----|---------|
| `msp` | General MSP templates |
| `managed-services` | Managed service agreements |
| `project` | Project-based templates (SOWs) |
| `security` | Security service templates |
| `compliance` | Compliance-related documents |
| `onboarding` | New client onboarding documents |

## Field Reference

### Template Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Template unique identifier |
| `name` | string | Template display name |
| `date_created` | datetime | When the template was created |
| `date_modified` | datetime | When the template was last modified |
| `version` | string | Template version number |
| `tags` | array | Template tags for organization |
| `folder_uuid` | string | Folder the template belongs to |
| `roles` | array | Recipient roles defined in the template |
| `tokens` | array | Content tokens (dynamic variables) |
| `fields` | array | Interactive form fields |
| `pricing_tables` | array | Pricing table structures |

### Token Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Token name (e.g., "Client.Company") |
| `value` | string | Default value (if any) |

## Common Workflows

### Find the Right Template

1. Call `pandadoc-list-templates` with `q` set to the document type (e.g., "MSA", "proposal", "SOW")
2. Review the returned templates for the best match
3. Call `pandadoc-get-template` with the `id` to review template details, tokens, and fields
4. Use the template ID to create a new document with `pandadoc-create-document`

### List All Available Templates

1. Call `pandadoc-list-templates` with `count=100` and `page=1`
2. If more than 100 templates exist, paginate through additional pages
3. Compile a list of template names, IDs, and tags

### Use a Template to Create a Document

1. Find the template with `pandadoc-list-templates` using `q`
2. Get template details with `pandadoc-get-template` to identify required tokens and fields
3. Call `pandadoc-create-document` with `template_uuid`, `name`, `recipients`, and `tokens`
4. Verify the document was created with `pandadoc-get-document`

### Audit Template Usage

1. Call `pandadoc-list-documents` with `template_id` set to a specific template UUID
2. Count the documents created from each template to identify most/least used templates
3. Review documents by status to see conversion rates (draft -> sent -> completed)

## Response Examples

**Template List:**

```json
{
  "results": [
    {
      "id": "tpl_abc123def456",
      "name": "Managed Services Agreement (MSA)",
      "date_created": "2025-06-15T10:00:00.000000Z",
      "date_modified": "2026-01-20T14:30:00.000000Z",
      "version": "5",
      "tags": ["msp", "managed-services"]
    },
    {
      "id": "tpl_ghi789jkl012",
      "name": "Statement of Work (SOW)",
      "date_created": "2025-08-01T09:00:00.000000Z",
      "date_modified": "2026-02-10T11:15:00.000000Z",
      "version": "3",
      "tags": ["msp", "project"]
    }
  ]
}
```

**Template Details:**

```json
{
  "id": "tpl_abc123def456",
  "name": "Managed Services Agreement (MSA)",
  "date_created": "2025-06-15T10:00:00.000000Z",
  "date_modified": "2026-01-20T14:30:00.000000Z",
  "version": "5",
  "tags": ["msp", "managed-services"],
  "roles": [
    {"name": "Client"},
    {"name": "MSP"}
  ],
  "tokens": [
    {"name": "Client.Company", "value": ""},
    {"name": "Client.Name", "value": ""},
    {"name": "Client.Address", "value": ""},
    {"name": "Contract.StartDate", "value": ""},
    {"name": "Contract.Term", "value": "12 months"},
    {"name": "MSP.Company", "value": "TechForce IT Solutions"}
  ]
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Template not found | Invalid template ID | Verify the ID with `pandadoc-list-templates` |
| No results | Search term too specific | Try a shorter or broader search term |
| Folder not found | Invalid folder UUID | Verify the folder exists in PandaDoc |

## Best Practices

1. **Standardize naming** - Use consistent naming for templates (e.g., "MSA - Managed Services Agreement")
2. **Use tags** - Tag every template for easy filtering and organization
3. **Use folders** - Organize templates into folders by category (Agreements, Proposals, Quotes)
4. **Define all tokens** - Include tokens for every variable field to avoid manual editing
5. **Set default values** - Pre-fill tokens with sensible defaults (e.g., your MSP company name)
6. **Include pricing tables** - Use structured pricing tables rather than static text for pricing
7. **Define roles** - Set up recipient roles (Client, MSP, Approver) in templates for consistent workflows
8. **Version templates** - Update templates when terms change rather than creating new ones
9. **Review regularly** - Audit template usage quarterly and archive unused templates
10. **Test before using** - Create a test document from any new or updated template before using with real clients

## Related Skills

- [PandaDoc API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [PandaDoc Documents](../documents/SKILL.md) - Creating documents from templates
- [PandaDoc Recipients](../recipients/SKILL.md) - Managing recipients in documents
- [PandaDoc Proposals](../proposals/SKILL.md) - MSP proposal workflows
