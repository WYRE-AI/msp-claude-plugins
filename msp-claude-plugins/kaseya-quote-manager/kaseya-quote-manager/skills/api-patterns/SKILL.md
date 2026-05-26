---
name: "Kaseya Quote Manager API Patterns"
when_to_use: "When working with Kaseya Quote Manager authentication, pagination, rate limits, or error handling for the Kaseya Quote Manager MCP server"
description: >
  Use this skill when working with the Kaseya Quote Manager (Datto Commerce)
  MCP tools — API-key authentication, the read-only tool surface, page/pageSize
  pagination with modifiedAfter, rate limits, and error handling.
triggers:
  - kaseya quote manager api
  - kqm authentication
  - kqm pagination
  - kqm rate limit
  - quote manager api
  - datto commerce api
---

# Kaseya Quote Manager MCP Tools & API Patterns

## Overview

The Kaseya Quote Manager MCP server exposes quoting, sales-order,
procurement, catalog, CRM, and org data from Kaseya Quote Manager
(formerly Datto Commerce). The entire tool surface is **READ-ONLY** —
every tool is a `_list` or `_get`; there are no write tools.

Tool names follow `kqm_<entity>_list` and `kqm_<entity>_get` across
five domains:

- **sales**: `quote`, `quote_section`, `quote_line`, `sales_order`, `sales_order_line`, `sales_order_payment`
- **procurement**: `purchase_order`, `purchase_order_line`, `purchase_order_cost`, `supplier`, `product_supplier`
- **catalog**: `product`, `product_image` (list only), `category`, `brand`
- **crm**: `customer`, `customer_address`, `contact`
- **org**: `employee`, `warehouse`

## Connection & Authentication

Kaseya Quote Manager uses a single API key. Against the upstream API the
key is sent in the `apiKey` HTTP header:

| Header | Value |
|--------|-------|
| `apiKey` | The raw Quote Manager API key |

Generate the key in Quote Manager under **Settings → API**.

When used through the WYRE MCP gateway, the gateway maps the environment
variable `X_KQM_APIKEY` onto an `X-Kqm-Api-Key` header, and the MCP server
translates that into the upstream `apiKey` header automatically. You do not
need to construct headers by hand — set the credential and the server
handles upstream auth translation.

```bash
export X_KQM_APIKEY="your-quote-manager-api-key"
```

## Base URL

```
https://api.kaseyaquotemanager.com/v1/
```

## Pagination

List endpoints use page-based pagination:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| page | number | 1 | - | 1-based page number |
| pageSize | number | - | 100 | Results per page |
| modifiedAfter | datetime | - | - | Only return records changed after this timestamp |

Use `modifiedAfter` for incremental syncs rather than re-walking the full
collection. Always check whether more pages exist (a full page of `pageSize`
results usually means there is another page) before claiming a result set is
complete.

## Rate Limiting

- **60 requests per minute**
- **20,000 requests per day**
- **Strategy:** batch with the largest `pageSize` (100) to minimize calls;
  use `modifiedAfter` for incremental pulls.
- **Backoff:** on `429`, wait and retry with exponential backoff.

## Error Handling

| Status Code | Meaning | Resolution |
|-------------|---------|------------|
| 400 | Bad Request | Check query parameters |
| 401 | Unauthorized | Verify the API key is correct |
| 403 | Forbidden | Check API key permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Wait and retry with backoff |
| 500 | Server Error | Retry after a delay |

## API Documentation

- [Kaseya Quote Manager API](https://help.quotemanager.kaseya.com/help/Content/2-integrate/api.htm)
