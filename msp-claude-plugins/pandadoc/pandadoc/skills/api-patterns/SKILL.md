---
name: "PandaDoc API Patterns"
description: >
  Use this skill when working with PandaDoc MCP tools - available tools,
  API key authentication, the hosted MCP server connection, documentation
  search, code generation assistance, rate limiting, error handling,
  and best practices for the PandaDoc API.
when_to_use: >-
  When working with available tools, API key authentication, the hosted MCP server connection,
  documentation search, code generation assistance, rate limiting, error handling. Use when:
  pandadoc api, pandadoc query, pandadoc authentication, pandadoc mcp, pandadoc rate limit,
  pandadoc request, pandadoc api key, pandadoc tools, pandadoc connection, pandadoc endpoint, or
  pandadoc auth.
---

# PandaDoc MCP Tools & API Patterns

## Overview

PandaDoc provides a hosted MCP server at `https://developers.pandadoc.com/mcp` for AI tool integration. The MCP server provides direct API access to PandaDoc's document automation platform, documentation search, and code generation assistance. This skill covers MCP server connection, authentication, the complete tool reference, rate limiting, error handling, and best practices.

## Connection & Authentication

### MCP Server

PandaDoc hosts an official MCP server. Authentication uses an API key passed via the Authorization header:

1. Log into [app.pandadoc.com](https://app.pandadoc.com)
2. Navigate to **Settings > Integrations > API**
3. Generate an API key

**MCP Server URL:** `https://developers.pandadoc.com/mcp`

**Required Header:**

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `API-Key <key>` | API key from PandaDoc Settings |

### Authentication Modes

| Mode | Auth Required | Use Case |
|------|---------------|----------|
| Documentation search | No | Browsing PandaDoc API docs and guides |
| Code generation assistance | No | Generating code snippets for PandaDoc integration |
| Live API calls | Yes | Creating documents, sending for signature, checking status |

> **Note:** Documentation search and code generation work without an API key. All live API operations (creating documents, managing templates, sending for signature) require a valid API key.

### Environment Variables

```bash
export PANDADOC_API_KEY="your-api-key"
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "pandadoc": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://developers.pandadoc.com/mcp",
        "--header", "Authorization:API-Key YOUR_API_KEY"
      ]
    }
  }
}
```

## Complete MCP Tool Reference

### Document Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pandadoc-list-documents` | List and filter documents | `status`, `q` (search query), `tag`, `count`, `page`, `order_by`, `template_id`, `folder_uuid` |
| `pandadoc-get-document` | Get a single document's details | `id` (required) |
| `pandadoc-get-document-status` | Get document status | `id` (required) |
| `pandadoc-create-document` | Create a document from template | `template_uuid`, `name`, `recipients`, `tokens`, `fields`, `pricing_tables`, `folder_uuid` |
| `pandadoc-send-document` | Send a document for signature | `id` (required), `message`, `subject`, `silent` |
| `pandadoc-download-document` | Download a completed document | `id` (required) |

### Template Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pandadoc-list-templates` | List available templates | `q` (search query), `count`, `page`, `tag`, `folder_uuid` |
| `pandadoc-get-template` | Get template details | `id` (required) |

### Recipient Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pandadoc-add-recipient` | Add a recipient to a document | `document_id` (required), `email`, `first_name`, `last_name`, `role`, `signing_order` |

### Documentation Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pandadoc-search-docs` | Search PandaDoc API documentation | `query` (required) |
| `pandadoc-get-code-sample` | Generate code samples | `endpoint`, `language` |

## Pagination

### Page-Based Pagination

List tools use 1-based page pagination with configurable count:

**Pagination Parameters:**

| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `page` | Page number (1-based) | 1 | - |
| `count` | Results per page | 50 | 100 |

### Iterating Through All Pages

To fetch all results, call the list tool repeatedly, incrementing `page` from 1 until the number of results returned is less than `count`:

1. Call the tool with `page=1` and `count=100`
2. If the response contains 100 results, call again with `page=2`
3. Continue until fewer than 100 results are returned
4. Collect results from each response

## Filtering & Sorting

### Document Filters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `status` | `document.draft`, `document.sent`, `document.completed`, `document.viewed`, `document.waiting_approval`, `document.approved`, `document.rejected`, `document.waiting_pay`, `document.paid`, `document.voided`, `document.declined`, `document.expired` | Filter by document status |
| `q` | string | Search documents by name |
| `tag` | string | Filter by document tag |
| `template_id` | UUID | Filter by source template |
| `folder_uuid` | UUID | Filter by folder |
| `order_by` | `date_created`, `date_modified`, `name`, `date_status_changed` | Sort field |

### Template Filters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `q` | string | Search templates by name |
| `tag` | string | Filter by template tag |
| `folder_uuid` | UUID | Filter by folder |

## Response Format

**Single Document:**

```json
{
  "id": "msFYActMfJHqNTKH9tcPFa",
  "name": "Acme Corp - Managed Services Agreement",
  "status": "document.sent",
  "date_created": "2026-01-15T10:30:00.000000Z",
  "date_modified": "2026-01-16T14:22:00.000000Z",
  "expiration_date": "2026-02-15T00:00:00.000000Z",
  "version": "2",
  "recipients": [
    {
      "email": "john@acme.com",
      "first_name": "John",
      "last_name": "Smith",
      "role": "Client",
      "signing_order": 1,
      "has_completed": false
    }
  ],
  "tokens": [
    {
      "name": "Client.Company",
      "value": "Acme Corporation"
    }
  ],
  "grand_total": {
    "amount": "2500.00",
    "currency": "USD"
  }
}
```

**Paginated Document List:**

```json
{
  "results": [
    {
      "id": "msFYActMfJHqNTKH9tcPFa",
      "name": "Acme Corp - Managed Services Agreement",
      "status": "document.sent",
      "date_created": "2026-01-15T10:30:00.000000Z"
    }
  ]
}
```

## Rate Limiting

### Rate Limit Details

| Plan | Limit |
|------|-------|
| Business | 300 requests per minute |
| Enterprise | 600 requests per minute |

When rate limited, the API returns HTTP 429. Wait before retrying. Use exponential backoff for automated retries.

### Rate Limit Best Practices

1. **Batch operations** - Minimize total API calls by using filters and pagination efficiently
2. **Cache template data** - Templates change infrequently; cache for minutes to hours
3. **Avoid polling** - Use webhooks where possible instead of repeatedly checking document status
4. **Stagger requests** - When processing multiple documents, add small delays between calls

## Error Handling

### Common Errors

| Error | HTTP Code | Cause | Resolution |
|-------|-----------|-------|------------|
| Unauthorized | 401 | Invalid or missing API key | Check `PANDADOC_API_KEY` and regenerate if needed |
| Forbidden | 403 | Insufficient permissions | Verify API key has required access scope |
| Not Found | 404 | Document/template ID does not exist | Verify the resource ID |
| Rate Limited | 429 | Too many requests | Wait and retry with exponential backoff |
| Validation Error | 422 | Invalid request parameters | Check required fields and parameter formats |
| Server Error | 500 | PandaDoc internal error | Retry after a brief delay |

### Troubleshooting MCP Connection

1. **Verify API key** - Ensure the API key is valid and not revoked
2. **Check URL** - MCP server URL must be `https://developers.pandadoc.com/mcp`
3. **Test with docs search** - Try `pandadoc-search-docs` (no auth required) to verify connectivity
4. **Test with a simple call** - Try `pandadoc-list-documents` with `count=1` to verify authentication
5. **Regenerate key** - If authentication fails, generate a new key from PandaDoc Settings > API

## Best Practices

1. **Use template-based creation** - Always create documents from templates for consistency
2. **Filter server-side** - Use `status`, `q`, and `tag` parameters to narrow results
3. **Monitor rate limits** - Stay well under your plan's request limit
4. **Use document tags** - Tag documents by client, type, or project for easy filtering
5. **Check status before sending** - Verify a document is in `draft` status before sending
6. **Use content tokens** - Populate template variables (tokens) to personalize documents
7. **Set expiration dates** - Use expiration dates on proposals to create urgency
8. **Track recipient completion** - Check `has_completed` for each recipient to monitor progress
9. **Download completed documents** - Archive signed documents after completion
10. **Use folders** - Organize templates and documents in folders for better management

## Related Skills

- [PandaDoc Documents](../documents/SKILL.md) - Document management
- [PandaDoc Templates](../templates/SKILL.md) - Template library
- [PandaDoc Recipients](../recipients/SKILL.md) - Recipient and signature management
- [PandaDoc Proposals](../proposals/SKILL.md) - MSP proposal workflows
