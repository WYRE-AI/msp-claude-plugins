---
name: "Huntress API Patterns"
description: >
  Huntress MCP fundamentals: HTTP Basic Auth via API key/secret headers, the
  full MCP tool catalog, token-based pagination, the 60 req/min rate limit,
  and the common HTTP error codes with their causes.
when_to_use: >-
  When authenticating to or calling Huntress through the MCP tools, or diagnosing a failed
  Huntress request. Use when: huntress api, huntress
  authentication, huntress pagination, huntress rate limit, huntress mcp, huntress tools, huntress
  request, huntress error, or huntress connection.
---

# Huntress MCP Tools & API Patterns

## Overview

The Huntress MCP server provides AI tool integration with the Huntress managed threat detection and response platform. It exposes tools covering account management, endpoint agents, organizations, incidents, escalations, billing, signals, and user management. The API uses HTTP Basic Auth with an API key and secret.

## Connection & Authentication

### HTTP Basic Auth

Huntress authenticates using an API key and secret passed as HTTP headers:

| Header | Description |
|--------|-------------|
| `X-Huntress-API-Key` | Your Huntress API key |
| `X-Huntress-API-Secret` | Your Huntress API secret |

Generate credentials at: **Huntress Dashboard > Settings > API Credentials**

**Environment Variables:**

```bash
export HUNTRESS_API_KEY="your-api-key"
export HUNTRESS_API_SECRET="your-api-secret"
```

## Available MCP Tools

### Navigation

| Tool | Description |
|------|-------------|
| `huntress_navigate` | Navigate to a specific resource |
| `huntress_status` | Get current navigation status |
| `huntress_back` | Navigate back to previous resource |

### Account

| Tool | Description |
|------|-------------|
| `huntress_accounts_get` | Get account details |
| `huntress_accounts_actor` | Get current authenticated actor info |

### Agents

| Tool | Description |
|------|-------------|
| `huntress_agents_list` | List endpoint agents with filters |
| `huntress_agents_get` | Get details for a specific agent |

### Organizations

| Tool | Description |
|------|-------------|
| `huntress_organizations_list` | List all organizations |
| `huntress_organizations_get` | Get organization details |
| `huntress_organizations_create` | Create a new organization |
| `huntress_organizations_update` | Update an organization |
| `huntress_organizations_delete` | Delete an organization |

### Incidents

| Tool | Description |
|------|-------------|
| `huntress_incidents_list` | List incidents with filters |
| `huntress_incidents_get` | Get incident details |
| `huntress_incidents_resolve` | Resolve an incident |
| `huntress_incidents_remediations` | List remediations for an incident |
| `huntress_incidents_remediation_get` | Get specific remediation details |
| `huntress_incidents_bulk_approve` | Bulk approve remediations |
| `huntress_incidents_bulk_reject` | Bulk reject remediations |

### Escalations

| Tool | Description |
|------|-------------|
| `huntress_escalations_list` | List escalations |
| `huntress_escalations_get` | Get escalation details |
| `huntress_escalations_resolve` | Resolve an escalation |

### Reports

| Tool | Description |
|------|-------------|
| `huntress_billing_reports_list` | List billing reports |
| `huntress_billing_reports_get` | Get a specific billing report |
| `huntress_summary_reports_list` | List summary reports |
| `huntress_summary_reports_get` | Get a specific summary report |

### Signals

| Tool | Description |
|------|-------------|
| `huntress_signals_list` | List security signals |
| `huntress_signals_get` | Get signal details |

### Users

| Tool | Description |
|------|-------------|
| `huntress_users_list` | List users |
| `huntress_users_get` | Get user details |
| `huntress_users_create` | Create a user |
| `huntress_users_update` | Update a user |
| `huntress_users_delete` | Delete a user |

## Pagination

The Huntress API uses token-based pagination:

- Pass `page_token` to retrieve the next page of results
- The response includes `next_page_token` if more results are available
- Continue fetching pages until `next_page_token` is absent or null

**Example workflow:**

1. Call `huntress_agents_list` with no `page_token`
2. If response includes `next_page_token`, call again with that token
3. Repeat until no `next_page_token` is returned

## Rate Limiting

Huntress enforces **60 requests per minute**.

- HTTP 429 responses indicate rate limit exceeded
- Wait before retrying — use exponential backoff
- Batch operations where possible
- Use filters to reduce result set sizes

## Error Handling

### Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 401 | Unauthorized | Check API key and secret |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist or wrong ID |
| 429 | Rate Limited | Wait and retry after delay |
| 500 | Server Error | Retry; contact support if persistent |

### Error Response Format

```json
{
  "error": {
    "code": 401,
    "message": "Invalid API credentials"
  }
}
```

## Best Practices

- Use organization filters to scope queries to specific clients
- Cache account/org info to reduce API calls
- Use the navigation tools (`huntress_navigate`, `huntress_status`, `huntress_back`) to manage stateful workflows

## Related Skills

- [agents](../agents/SKILL.md) - Endpoint agent management
- [organizations](../organizations/SKILL.md) - Organization CRUD operations
- [incidents](../incidents/SKILL.md) - Incident lifecycle management
- [escalations](../escalations/SKILL.md) - Escalation handling
- [billing](../billing/SKILL.md) - Billing and summary reports
- [signals](../signals/SKILL.md) - Security signals monitoring
