---
name: "Blumira API Patterns"
description: >
  Use this skill when working with Blumira API authentication, understanding
  the dual path structure (org vs MSP), constructing filtered queries, handling
  pagination, or troubleshooting API errors.
when_to_use: >-
  When working with Blumira API authentication, understanding the dual path structure (org vs
  MSP), constructing filtered queries, handling pagination, or troubleshooting API errors. Use
  when: blumira api, blumira auth, jwt token, blumira filtering, blumira pagination, or api error.
---

# Blumira API Patterns

## Overview

Blumira exposes a REST API at `https://api.blumira.com/public-api/v1` with two path groups: `/org/*` for direct organization access and `/msp/*` for MSP multi-tenant operations. The MCP server wraps these into tool calls, but understanding the underlying patterns helps construct effective queries.

## Key Concepts

### Authentication

Blumira uses JWT tokens for authentication. The token is passed via the `X-Blumira-JWT-Token` header (MCP Gateway) or as a Bearer token directly against the API.

```
Authorization: Bearer <JWT_TOKEN>
```

Alternatively, for Pax8 integrations:
```
pax8ApiTokenV1: <PAX8_TOKEN>
```

**Important:** JWT tokens have expiration times. If you receive 401 errors, the token may need to be regenerated from the Blumira portal.

### Dual Path Groups

| Path Group | Prefix | Use Case |
|-----------|--------|----------|
| Organization | `/org/*` | Direct access to a single organization's data |
| MSP | `/msp/*` | Multi-tenant access across managed accounts |

Organization tools (`blumira_findings_*`, `blumira_agents_*`, `blumira_users_*`) operate on the authenticated org. MSP tools (`blumira_msp_*`) require MSP-level credentials and can target specific accounts.

### Rich Filtering Syntax

Blumira supports powerful query filters appended to field names:

| Operator | Suffix | Example | Description |
|----------|--------|---------|-------------|
| Equals | `.eq` | `status.eq=10` | Exact match |
| In | `.in` | `severity.in=HIGH,CRITICAL` | Match any in list |
| Greater than | `.gt` | `created.gt=2025-01-01` | Greater than |
| Less than | `.lt` | `created.lt=2025-12-31` | Less than |
| Contains | `.contains` | `name.contains=ransomware` | Substring match |
| Regex | `.regex` | `name.regex=^brute` | Regex match |
| Negation | `!` prefix | `!status.eq=30` | Negate any filter |

**Combining filters:** Multiple filters are ANDed together:

```
GET /org/findings?status.eq=10&severity.in=HIGH,CRITICAL&created.gt=2025-01-01
```

### Pagination

All list endpoints support pagination parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number (1-indexed) | 1 |
| `page_size` | Results per page | 25 |
| `limit` | Max total results | — |
| `order_by` | Sort field (prefix `-` for descending) | varies |

Responses include pagination metadata:

```json
{
  "data": [...],
  "links": {
    "next": "/org/findings?page=2&page_size=25",
    "prev": null
  },
  "meta": {
    "total": 142,
    "page": 1,
    "page_size": 25
  }
}
```

### MCP Navigation Tools

The MCP server includes stateful navigation tools:

- **`blumira_navigate`** — Navigate to a specific resource or view
- **`blumira_status`** — Show current navigation context
- **`blumira_back`** — Return to previous context

These help maintain context when drilling into findings, devices, or accounts.

## Common Workflows

### Filtered Finding Query

1. Use `blumira_findings_list` with filter parameters
2. Narrow results with status, severity, and date filters
3. Page through results if needed
4. Drill into specific findings with `blumira_findings_get`

### MSP Cross-Account Query

1. Use `blumira_msp_accounts_list` to enumerate accounts
2. Use `blumira_msp_findings_all` for cross-account finding overview
3. Filter to specific account with `blumira_msp_findings_list`
4. Drill into per-account details as needed

## Error Handling

### 401 Unauthorized

**Cause:** JWT token is expired, invalid, or missing
**Solution:** Regenerate the token from Blumira Portal > Settings > API Access. Verify `BLUMIRA_JWT_TOKEN` is set.

### 403 Forbidden

**Cause:** Token lacks permissions for the requested resource (e.g., org token used for MSP endpoints)
**Solution:** Ensure the token has appropriate scope. MSP endpoints require MSP-level credentials.

### 404 Not Found

**Cause:** Resource ID doesn't exist or is not accessible from the current scope
**Solution:** Verify the ID and ensure the token has access to the target organization.

### 429 Rate Limited

**Cause:** Too many requests in a short period
**Solution:** Back off and retry after a delay. Use pagination to reduce request volume.

### 422 Validation Error

**Cause:** Invalid filter syntax or parameter values
**Solution:** Check filter operator syntax (`.eq`, `.in`, etc.) and ensure values match expected types.

## Best Practices

- Use pagination (`page_size=50`) for large datasets instead of fetching everything at once
- Combine filters to narrow results before fetching — don't over-fetch and filter client-side
- Use `order_by=-created` to get most recent items first
- Cache account lists when doing MSP operations to avoid repeated lookups
- Always handle pagination — check `meta.total` to know if more pages exist

## Related Skills

- [Findings](../findings/SKILL.md) — Finding lifecycle management
- [MSP](../msp/SKILL.md) — MSP multi-tenant operations
- [Agents](../agents/SKILL.md) — Device and agent management
