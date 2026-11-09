---
name: "HubSpot API Patterns"
description: >
  HubSpot's official remote MCP server (brokered by Conduit) and the CRM
  Search API behind it: the live tool catalog (search_crm_objects,
  get_crm_objects, manage_crm_objects, properties and owners), OAuth via the
  Conduit connect flow, scopes, sensitive-data (PHI) exclusion, filter/sort/
  pagination syntax, plan-tier rate limits, and error handling.
when_to_use: >-
  When connecting to the HubSpot MCP server, constructing CRM search queries, or diagnosing auth,
  scope, and rate-limit failures. Use when:
  hubspot api, hubspot query, hubspot filter, hubspot rate limit, hubspot authentication, hubspot
  mcp, hubspot oauth, hubspot request, hubspot scope, hubspot tools, hubspot connection, or
  hubspot search api.
---

# HubSpot MCP Tools & API Patterns

## Overview

HubSpot provides a first-party remote MCP server, which Conduit brokers as the `hubspot` connector. Its CRM tools are generic over object type and are backed by the HubSpot CRM Search API; they cover contacts, companies, deals, tickets, tasks, notes, associations and custom objects. This skill covers MCP server connection, the complete tool reference, search patterns, error handling, and best practices.

## Anti-triggers

- **What properties an object has and what its enum values mean** — the field,
  lifecycle-stage, and pipeline tables live with the object; use
  `hubspot-contacts`, `hubspot-companies`, `hubspot-deals`, or
  `hubspot-tickets`.
- **A different hosted OAuth MCP server** — the connection shape rhymes but
  the tenant, scopes, session model, and tools do not; use
  `warmly-api-patterns` or `pandadoc-api-patterns`.

## Connection & Authentication

Through Conduit, the `hubspot` connector is HubSpot's own hosted MCP server at `https://mcp.hubspot.com/anthropic/v1/mcp`. Connect it once in the Conduit web UI: HubSpot's OAuth flow runs there, Conduit stores and refreshes the token, and sends it upstream as `Authorization: Bearer`. Nothing is configured on the client; this plugin ships no `.mcp.json`, so install the `wyre-gateway` plugin to reach Conduit at `https://conduit.wyre.ai/v1/mcp`.

The older community server (`WYRE-AI/hubspot-mcp`, whose tools were prefixed hubspot_ and split per object type) is **not** what Conduit serves. Those names do not exist on the live connector.

### Scopes

Scopes are granted on HubSpot's consent screen during the Conduit connect flow. A tool whose object type the connected user cannot read or write returns a permission error rather than an empty result; `discover_hubspot_schema` shows which object types are readable and writable.

### Sensitive Data

HubSpot's hosted server excludes properties marked as sensitive (for example PHI) from results. A property that exists in the portal but never appears in a response may be one of these.

## Complete MCP Tool Reference

### CRM records

| Tool | Purpose | Key arguments |
|------|---------|---------------|
| `search_crm_objects` | Search and list records of one object type | `objectType` (`contacts`, `companies`, `deals`, `tickets`, `notes`, `tasks`, ... or a custom `p<portalId>_<name>`), `query`, `filterGroups` (property `filters` + `associatedWith`), `properties`, `sorts`, `limit` (max 200), `offset` |
| `get_crm_objects` | Fetch up to 100 records of one type by ID | `objectType`, `objectIds`, `properties` |
| `manage_crm_objects` | Create or update records, and create associations | `createRequest` / `updateRequest` with `objects[]` (`objectType`, `properties`, `associations`, `objectId` on update); `confirmationStatus` |
| `query_crm_data` | Read-only SQL over CRM data, for counts and aggregates | `sql`; call `tool_guidance` first |
| `discover_hubspot_schema` | Object types (including custom objects) and access | — |

There is no delete tool and no separate association tool. Associations are read with an `associatedWith` filter on `search_crm_objects` and written through the `associations` array on `manage_crm_objects`. Notes and tasks are created with `manage_crm_objects` (`objectType: "notes"` / `"tasks"`) and associated to the record they belong to.

### Properties and people

| Tool | Purpose |
|------|---------|
| `search_properties` | Find property definitions by keyword (all properties when no keywords) |
| `get_properties` | Full definitions, including enumeration values, for named properties |
| `search_owners` | Resolve owners by name, email or owner ID (`hubspot_owner_id` values) |
| `get_user_details` | The connected user's identity, owner ID, teams and roles |
| `tool_guidance` | Required guidance before `query_crm_data`, and usage notes for other tools |

### Marketing, content and reporting

The same connector also serves marketing and CMS tools that this plugin does not cover in depth: `manage_campaign_objects`, `read_campaign_data`, `get_campaign_attribution_reports`, `manage_segment`, `query_segments`, `manage_social_posts`, `read_social_posts`, `get_social_channels`, `get_social_post_analytics`, `manage_blog_post`, `manage_landing_page`, `manage_website_page`, `get_content_analytics_report`, `manage_saved_reports`, `get_aeo_metrics`, `manage_aeo_prompts`, `manage_aeo_recommendations`, `search_intent_signals`, `get_organization_details`, `manage_onboarding`, `render_asset` and `import-claude-design-from-url`. Treat every `manage_*` tool as a write.

### Writes need confirmation

`manage_crm_objects` takes a `confirmationStatus`. Set `CONFIRMED` only after the user has approved the exact objects and property values; `CONFIRMATION_WAIVED_FOR_SESSION` only if the user explicitly said not to ask again this session. Creating or updating a **contact** can enrol that person in HubSpot workflows that send email (see `GOVERNANCE.md`).


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

1. **Check the Conduit connection** - Reconnect HubSpot in the Conduit web UI if the token was revoked or the user lost access
2. **Test with a simple call** - `get_user_details` confirms the connection and returns the user's owner ID
3. **Check object access** - `discover_hubspot_schema` shows which object types the connected user can read and write
5. **Check plan** - Ensure your HubSpot plan supports the API features you need

## Best Practices

1. **Filter server-side** - Use `search_crm_objects` with `filterGroups` instead of listing all records
2. **Use maximum page size** - Set `limit=100` to minimize total tool calls
3. **Monitor rate limits** - Stay well under 100 requests per 10 seconds
4. **Use associations** - Link related objects (contacts to companies, deals to contacts) for full context
5. **Check properties first** - Use `list_*_properties` tools to discover available fields before searching
6. **Validate before creating** - Search for existing records before creating duplicates
7. **Use lifecycle stages** - Track contacts and companies through their lifecycle for accurate reporting
8. **Cache property lists** - Property definitions change infrequently; reference them across multiple operations

## Related Skills

- [HubSpot Contacts](../contacts/SKILL.md) - Contact management
- [HubSpot Companies](../companies/SKILL.md) - Company management
- [HubSpot Deals](../deals/SKILL.md) - Deal pipeline management
- [HubSpot Tickets](../tickets/SKILL.md) - Support ticket management
- [HubSpot Activities](../activities/SKILL.md) - Tasks, notes, and associations
