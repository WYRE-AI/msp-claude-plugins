---
name: "HubSpot API Patterns"
description: >
  Use this skill when working with the HubSpot MCP tools - available tools,
  OAuth 2.0 + PKCE authentication, scopes, Streamable HTTP transport,
  rate limiting, error handling, and best practices. Covers the official
  remote MCP server connection and all HubSpot CRM MCP tools.
when_to_use: >-
  When working with available tools, OAuth 2.0 + PKCE authentication, scopes, Streamable HTTP
  transport, rate limiting, error handling, and best practices in the HubSpot MCP tools. Use when:
  hubspot api, hubspot query, hubspot filter, hubspot rate limit, hubspot authentication, hubspot
  mcp, hubspot oauth, hubspot request, hubspot scope, hubspot tools, hubspot connection, or
  hubspot search api.
---

# HubSpot MCP Tools & API Patterns

## Overview

HubSpot provides a first-party remote MCP server at `https://mcp.hubspot.com/` for AI tool integration. The MCP server uses OAuth 2.0 with PKCE for authentication and Streamable HTTP as its transport protocol. Tools are backed by the HubSpot CRM Search API and cover contacts, companies, deals, tickets, tasks, notes, and associations. This skill covers MCP server connection, the complete tool reference, search patterns, error handling, and best practices.

## Connection & Authentication

### MCP Server

HubSpot hosts an official remote MCP server. Authentication uses OAuth 2.0 with PKCE, handled by the `mcp-remote` bridge:

1. Go to [developers.hubspot.com](https://developers.hubspot.com)
2. Navigate to **Development > MCP Auth Apps**
3. Create a new MCP Auth App
4. Copy the **Client ID** and **Client Secret**

**MCP Server URL:** `https://mcp.hubspot.com/`

**Transport:** Streamable HTTP

**Authentication:** OAuth 2.0 + PKCE (handled automatically by `mcp-remote`)

### Environment Variables

```bash
export HUBSPOT_CLIENT_ID="your-client-id"
export HUBSPOT_CLIENT_SECRET="your-client-secret"
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "hubspot": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://mcp.hubspot.com/"
      ],
      "env": {
        "HUBSPOT_CLIENT_ID": "YOUR_CLIENT_ID",
        "HUBSPOT_CLIENT_SECRET": "YOUR_CLIENT_SECRET"
      }
    }
  }
}
```

### Scopes

HubSpot MCP automatically derives required OAuth scopes from the tools you use. You do not need to manually configure scopes. For example:

- Using contact tools automatically requests `crm.objects.contacts.read` and `crm.objects.contacts.write`
- Using deal tools automatically requests `crm.objects.deals.read` and `crm.objects.deals.write`
- Using association tools automatically requests the appropriate association scopes

### Sensitive Data

HubSpot MCP excludes sensitive data properties (PHI -- Protected Health Information) from tool responses by default. Properties marked as sensitive in HubSpot settings will not appear in MCP tool results.

## Complete MCP Tool Reference

### Contact Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `hubspot_retrieve_contact` | Get a single contact by ID | `contactId` (required) |
| `hubspot_create_contact` | Create a new contact | `email` (required), `firstname`, `lastname`, `phone`, `company` |
| `hubspot_update_contact` | Update an existing contact | `contactId` (required), property fields to update |
| `hubspot_list_contacts` | List contacts with pagination | `limit`, `after` (cursor) |
| `hubspot_list_contact_properties` | List all contact properties | None |
| `hubspot_search_contacts` | Search contacts by criteria | `filterGroups`, `sorts`, `limit`, `after` |

### Company Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `hubspot_retrieve_company` | Get a single company by ID | `companyId` (required) |
| `hubspot_create_company` | Create a new company | `name` (required), `domain`, `industry`, `phone` |
| `hubspot_update_company` | Update an existing company | `companyId` (required), property fields to update |
| `hubspot_list_company_properties` | List all company properties | None |
| `hubspot_search_companies` | Search companies by criteria | `filterGroups`, `sorts`, `limit`, `after` |

### Deal Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `hubspot_retrieve_deal` | Get a single deal by ID | `dealId` (required) |
| `hubspot_create_deal` | Create a new deal | `dealname` (required), `amount`, `dealstage`, `pipeline` |
| `hubspot_update_deal` | Update an existing deal | `dealId` (required), property fields to update |
| `hubspot_list_deal_properties` | List all deal properties | None |
| `hubspot_search_deals` | Search deals by criteria | `filterGroups`, `sorts`, `limit`, `after` |

### Ticket Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `hubspot_retrieve_ticket` | Get a single ticket by ID | `ticketId` (required) |
| `hubspot_create_ticket` | Create a new ticket | `subject` (required), `content`, `hs_pipeline`, `hs_pipeline_stage` |
| `hubspot_update_ticket` | Update an existing ticket | `ticketId` (required), property fields to update |

### Activity Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `hubspot_create_task` | Create a task | `hs_task_subject` (required), `hs_task_body`, `hs_task_priority`, `hs_timestamp` |
| `hubspot_create_note` | Create a note | `hs_note_body` (required), `hs_timestamp` |

### Utility Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `hubspot_open_hubspot_ui` | Open HubSpot UI for an object | `objectType`, `objectId` |
| `hubspot_get_user_details` | Get details of the current user | None |

### Association Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `hubspot_create_association` | Create an association between objects | `fromObjectType`, `fromObjectId`, `toObjectType`, `toObjectId`, `associationType` |
| `hubspot_access_associations` | List associations for an object | `objectType`, `objectId`, `toObjectType` |

## CRM Search API

### Search Patterns

HubSpot MCP tools that search records use the CRM Search API under the hood. Search tools accept `filterGroups` for structured queries:

**Filter Group Structure:**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "email",
          "operator": "CONTAINS_TOKEN",
          "value": "acme.com"
        }
      ]
    }
  ]
}
```

### Available Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `EQ` | Equals | `{"propertyName": "lifecyclestage", "operator": "EQ", "value": "customer"}` |
| `NEQ` | Not equals | `{"propertyName": "lifecyclestage", "operator": "NEQ", "value": "subscriber"}` |
| `LT` | Less than | `{"propertyName": "amount", "operator": "LT", "value": "1000"}` |
| `LTE` | Less than or equal | `{"propertyName": "amount", "operator": "LTE", "value": "5000"}` |
| `GT` | Greater than | `{"propertyName": "amount", "operator": "GT", "value": "10000"}` |
| `GTE` | Greater than or equal | `{"propertyName": "createdate", "operator": "GTE", "value": "2026-01-01"}` |
| `CONTAINS_TOKEN` | Contains token (word match) | `{"propertyName": "email", "operator": "CONTAINS_TOKEN", "value": "acme"}` |
| `NOT_CONTAINS_TOKEN` | Does not contain token | `{"propertyName": "email", "operator": "NOT_CONTAINS_TOKEN", "value": "test"}` |
| `HAS_PROPERTY` | Property has a value | `{"propertyName": "phone", "operator": "HAS_PROPERTY"}` |
| `NOT_HAS_PROPERTY` | Property has no value | `{"propertyName": "phone", "operator": "NOT_HAS_PROPERTY"}` |
| `IN` | Value in list | `{"propertyName": "dealstage", "operator": "IN", "values": ["stage1", "stage2"]}` |
| `NOT_IN` | Value not in list | `{"propertyName": "dealstage", "operator": "NOT_IN", "values": ["closedlost"]}` |
| `BETWEEN` | Between two values | `{"propertyName": "amount", "operator": "BETWEEN", "value": "1000", "highValue": "5000"}` |

### Sorting

```json
{
  "sorts": [
    {
      "propertyName": "createdate",
      "direction": "DESCENDING"
    }
  ]
}
```

**Sort Directions:** `ASCENDING`, `DESCENDING`

### Pagination

Search results use cursor-based pagination:

| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `limit` | Results per page | 10 | 100 |
| `after` | Cursor for next page | None | - |

**Iterating through all results:**

1. Call the search tool with `limit=100`
2. Check the response for a `paging.next.after` value
3. If present, call again with `after` set to that value
4. Repeat until no `paging.next.after` is returned

## Response Format

**Single Resource:**

```json
{
  "id": "12345",
  "properties": {
    "firstname": "John",
    "lastname": "Smith",
    "email": "john.smith@acmecorp.com",
    "company": "Acme Corporation",
    "phone": "555-123-4567",
    "lifecyclestage": "customer",
    "createdate": "2025-06-15T10:30:00.000Z",
    "lastmodifieddate": "2026-01-20T14:15:00.000Z"
  },
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2026-01-20T14:15:00.000Z"
}
```

**Search Results:**

```json
{
  "total": 47,
  "results": [
    {
      "id": "12345",
      "properties": {
        "firstname": "John",
        "lastname": "Smith",
        "email": "john.smith@acmecorp.com"
      }
    }
  ],
  "paging": {
    "next": {
      "after": "12345"
    }
  }
}
```

## Rate Limiting

### Rate Limit Details

| Metric | Limit |
|--------|-------|
| Requests per 10 seconds | 100 (per OAuth app) |
| Requests per day | 500,000 (varies by plan) |
| Search requests per day | 1,000 (Free), 10,000+ (paid plans) |

When rate limited, the MCP tool will return a 429 error. Wait before retrying. The MCP server handles OAuth token refresh automatically.

### Plan-Based Limits

| HubSpot Plan | Daily API Limit | Search Limit |
|-------------|----------------|--------------|
| Free | 100,000 | 1,000 |
| Starter | 250,000 | 5,000 |
| Professional | 500,000 | 10,000 |
| Enterprise | 1,000,000 | 25,000 |

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Tool not found | MCP server not connected | Verify OAuth credentials and server URL |
| 401 Unauthorized | OAuth token expired or invalid | Restart MCP connection to re-authenticate |
| 403 Forbidden | Insufficient scopes or plan limitation | Check HubSpot plan tier and MCP Auth App permissions |
| 404 Not Found | Invalid object ID | Verify the record ID exists |
| 409 Conflict | Duplicate record | Check for existing records before creating |
| 429 Too Many Requests | Rate limit exceeded | Wait 10 seconds and retry |
| Invalid property | Property name not valid | Use `list_*_properties` tools to check available properties |

### Troubleshooting MCP Connection

1. **Verify credentials** - Ensure `HUBSPOT_CLIENT_ID` and `HUBSPOT_CLIENT_SECRET` are correct
2. **Check URL** - MCP server URL must be `https://mcp.hubspot.com/`
3. **Test with a simple call** - Try `hubspot_get_user_details` to verify connectivity
4. **Re-authenticate** - Restart the MCP connection to force a fresh OAuth flow
5. **Check plan** - Ensure your HubSpot plan supports the API features you need

## Best Practices

1. **Use search tools** - Use `hubspot_search_*` tools with filters instead of listing all records
2. **Use maximum page size** - Set `limit=100` to minimize total tool calls
3. **Filter server-side** - Use `filterGroups` to narrow results rather than fetching everything
4. **Monitor rate limits** - Stay well under 100 requests per 10 seconds
5. **Use associations** - Link related objects (contacts to companies, deals to contacts) for full context
6. **Check properties first** - Use `list_*_properties` tools to discover available fields before searching
7. **Validate before creating** - Search for existing records before creating duplicates
8. **Use lifecycle stages** - Track contacts and companies through their lifecycle for accurate reporting
9. **Cache property lists** - Property definitions change infrequently; reference them across multiple operations
10. **Handle sensitive data** - Remember that PHI properties are excluded from MCP responses by design

## Related Skills

- [HubSpot Contacts](../contacts/SKILL.md) - Contact management
- [HubSpot Companies](../companies/SKILL.md) - Company management
- [HubSpot Deals](../deals/SKILL.md) - Deal pipeline management
- [HubSpot Tickets](../tickets/SKILL.md) - Support ticket management
- [HubSpot Activities](../activities/SKILL.md) - Tasks, notes, and associations
