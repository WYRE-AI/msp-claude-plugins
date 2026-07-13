---
name: "Pax8 API Patterns"
description: >
  Use this skill when working with the Pax8 MCP tools - available tools,
  parameters, pagination, sorting, filtering, rate limiting, error
  handling, and best practices. Covers the official hosted MCP server
  connection and all 15 Pax8 MCP tools.
when_to_use: >-
  When working with available tools, parameters, pagination, sorting, filtering, rate limiting,
  error handling, and best practices in the Pax8 MCP tools. Use when: pax8 api, pax8 query, pax8
  filter, pax8 pagination, pax8 rate limit, pax8 authentication, pax8 mcp, pax8 endpoint, pax8
  request, pax8 token, or pax8 tools.
---

# Pax8 MCP Tools & API Patterns

## Overview

Pax8 provides a first-party hosted MCP server at `https://mcp.pax8.com/v1/mcp` for AI tool integration. The MCP server exposes 15 tools covering companies, products, subscriptions, orders, invoices, usage, and quotes. This skill covers MCP server connection, the complete tool reference, pagination patterns, sorting, error handling, and best practices.

## Connection & Authentication

### MCP Server

Pax8 hosts an official MCP server. Authentication uses a single token:

1. Log into [app.pax8.com](https://app.pax8.com)
2. Navigate to **Integrations > MCP** (or visit [app.pax8.com/integrations/mcp](https://app.pax8.com/integrations/mcp))
3. Generate an MCP token

**MCP Server URL:** `https://mcp.pax8.com/v1/mcp`

**Required Header:**

| Header | Value | Description |
|--------|-------|-------------|
| `x-pax8-mcp-token` | `<token>` | MCP token from Pax8 portal |

### Environment Variables

```bash
export PAX8_MCP_TOKEN="your-mcp-token"
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "pax8": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://mcp.pax8.com/v1/mcp",
        "--header", "x-pax8-mcp-token:YOUR_TOKEN"
      ]
    }
  }
}
```

## Complete MCP Tool Reference

### Company Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `pax8-list-companies` | List and filter companies | `page`, `size`, `sort` (name/city/country/stateOrProvince/postalCode), `order` (asc/desc), `company_name`, `status` (active/inactive/deleted) |
| `pax8-get-company-by-uuid` | Get a single company | `uuid` (required) |

### Product Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `pax8-list-products` | Search the product catalog | `productName`, `page`, `size`, `vendorName`, `search` |
| `pax8-get-product-by-uuid` | Get a single product | `productId` (required) |
| `pax8-get-product-pricing-by-uuid` | Get product pricing | `productId` (required), `companyId` (optional) |

### Subscription Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `pax8-list-subscriptions` | List and filter subscriptions | `page`, `size`, `sort`, `status` (Active/Cancelled/PendingManual/PendingAutomated/PendingCancel/WaitingForDetails/Trial/Converted/PendingActivation/Activated), `billingTerm` (monthly/annual/two-year/three-year/one-time/trial/activation), `companyId`, `productId` |
| `pax8-get-subscription-by-uuid` | Get a single subscription | `uuid` (required) |

### Order Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `pax8-list-orders` | List orders | `page`, `size`, `companyId` |
| `pax8-get-order-by-uuid` | Get a single order | `uuid` (required) |

### Invoice Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `pax8-list-invoices` | List and filter invoices | `page`, `size`, `sort`, `status` (unpaid/paid/void/carried/nothing due), `invoiceDate`, `invoiceDateRangeStart`, `invoiceDateRangeEnd`, `dueDate`, `total`, `balance`, `carriedBalance`, `companyId` |
| `pax8-get-invoice-by-uuid` | Get a single invoice | `uuid` (required) |

### Usage Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `pax8-get-usage-summary` | Get usage summary for a subscription | `subscriptionId` (required), `page`, `size`, `sort`, `resourceGroup`, `companyId` |
| `pax8-get-detailed-usage-summary` | Get detailed usage data | `usageSummaryId` (required), `usageDate`, `page`, `size` |

### Quote Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `pax8-list-quotes` | List and filter quotes | `page`, `limit`, `sort`, `search`, `status` (accepted/closed/declined/draft/expired/pending/sent) |
| `pax8-get-quote-by-uuid` | Get a single quote | `quoteId` (required) |

## Pagination

### Page-Based Pagination

All list tools use zero-based page pagination with configurable page size:

**Pagination Parameters:**

| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `page` | Page number (0-based) | 0 | - |
| `size` | Results per page | 50 | 200 |

**Pagination Response Metadata:**

| Field | Description |
|-------|-------------|
| `page.size` | Number of results per page |
| `page.totalElements` | Total number of records |
| `page.totalPages` | Total number of pages |
| `page.number` | Current page number (0-based) |

### Iterating Through All Pages

To fetch all results, call the list tool repeatedly, incrementing `page` from 0 until `page.number >= page.totalPages - 1`:

1. Call the tool with `page=0` and `size=200`
2. Check `page.totalPages` in the response
3. If more pages exist, call again with `page=1`, then `page=2`, etc.
4. Collect `content` arrays from each response

## Sorting

### Sort Parameters

Use the `sort` parameter on list tools. The `order` parameter specifies direction:

| Parameter | Values | Description |
|-----------|--------|-------------|
| `sort` | Varies by tool | Field to sort by |
| `order` | `asc`, `desc` | Sort direction |

**Company sort fields:** `name`, `city`, `country`, `stateOrProvince`, `postalCode`

### Example

To list companies sorted by name ascending:
- Call `pax8-list-companies` with `sort=name`, `order=asc`, `size=200`

## Filtering

### Filter Parameters by Tool

Each list tool supports specific filter parameters:

| Tool | Filter Parameters |
|------|-------------------|
| `pax8-list-companies` | `company_name`, `status` (active/inactive/deleted) |
| `pax8-list-products` | `productName`, `vendorName`, `search` |
| `pax8-list-subscriptions` | `companyId`, `productId`, `status`, `billingTerm` |
| `pax8-list-orders` | `companyId` |
| `pax8-list-invoices` | `companyId`, `status`, `invoiceDate`, `invoiceDateRangeStart`, `invoiceDateRangeEnd`, `dueDate`, `total`, `balance`, `carriedBalance` |
| `pax8-list-quotes` | `search`, `status` |

### Subscription Status Values

| Status | Description |
|--------|-------------|
| `Active` | Subscription is live and billing |
| `Cancelled` | Subscription has been terminated |
| `PendingManual` | Awaiting manual provisioning |
| `PendingAutomated` | Automated provisioning in progress |
| `PendingCancel` | Cancellation in progress |
| `WaitingForDetails` | Additional information needed |
| `Trial` | Free trial active |
| `Converted` | Trial converted to paid |
| `PendingActivation` | Activation pending |
| `Activated` | Recently activated |

### Invoice Status Values

| Status | Description |
|--------|-------------|
| `unpaid` | Invoice issued, payment not received |
| `paid` | Invoice has been paid |
| `void` | Invoice has been voided |
| `carried` | Balance carried forward |
| `nothing due` | No payment required |

## Response Format

**Single Resource:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Acme Corporation",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "stateOrProvince": "IL",
    "postalCode": "62704",
    "country": "US"
  },
  "phone": "555-123-4567",
  "website": "https://www.acme.com",
  "status": "Active",
  "billOnBehalfOfEnabled": false,
  "selfServiceAllowed": false,
  "orderApprovalRequired": false,
  "createdDate": "2024-01-15T10:30:00.000Z"
}
```

**Paginated Collection:**

```json
{
  "page": {
    "size": 50,
    "totalElements": 237,
    "totalPages": 5,
    "number": 0
  },
  "content": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Acme Corporation"
    }
  ]
}
```

## Rate Limiting

### Rate Limit Details

| Metric | Limit |
|--------|-------|
| Successful calls per minute | 1000 |

When rate limited, the MCP tool will return an error. Wait before retrying. The MCP server handles authentication automatically, so rate limit responses are the main error to watch for.

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Tool not found | MCP server not connected | Verify MCP token and server URL |
| Invalid UUID | Malformed resource ID | Check UUID format |
| Resource not found | ID does not exist | Verify the resource UUID |
| Rate limited | Too many requests | Wait 60 seconds and retry |
| Invalid parameter | Wrong filter value | Check allowed values for the parameter |

### Troubleshooting MCP Connection

1. **Verify token** - Ensure the MCP token is valid and not expired
2. **Check URL** - MCP server URL must be `https://mcp.pax8.com/v1/mcp`
3. **Test with a simple call** - Try `pax8-list-companies` with `size=1` to verify connectivity
4. **Regenerate token** - If authentication fails, generate a new token from the Pax8 portal

## Best Practices

1. **Use maximum page size** - Set `size=200` to minimize total tool calls when fetching all records
2. **Filter server-side** - Use tool parameters to narrow results rather than fetching everything
3. **Monitor rate limits** - Stay well under 1000 requests per minute
4. **Sort consistently** - Use `sort=name`, `order=asc` for predictable pagination results
5. **Use UUIDs** - All Pax8 resource IDs are UUIDs; validate format before passing to tools
6. **Use company-scoped queries** - Always pass `companyId` when checking a specific client's data
7. **Paginate large results** - The full Pax8 catalog has thousands of products; always paginate
8. **Cache results when appropriate** - Company and product data changes infrequently
9. **Validate before creating** - Check for existing records before creating duplicates
10. **Use the search parameter** - `pax8-list-products` supports a `search` parameter for flexible text matching

## Related Skills

- [Pax8 Companies](../companies/SKILL.md) - Company management
- [Pax8 Products](../products/SKILL.md) - Product catalog
- [Pax8 Subscriptions](../subscriptions/SKILL.md) - Subscription lifecycle
- [Pax8 Orders](../orders/SKILL.md) - Order management
- [Pax8 Invoices](../invoices/SKILL.md) - Invoice and billing
