---
description: Search the Pax8 product catalog by name or vendor
argument-hint: "<query> [vendor] [show_pricing]"
arguments: [query, vendor, show_pricing]
---

# Search Pax8 Products

Search the Pax8 cloud product catalog by name, vendor, or keyword. Returns matching products with pricing and provisioning details.

## Prerequisites

- Pax8 MCP server connected with a valid MCP token
- MCP tools `pax8-list-products`, `pax8-get-product-by-uuid`, and `pax8-get-product-pricing-by-uuid` available

## Steps

1. **Search products** using the Pax8 MCP tools

   Call `pax8-list-products` with the appropriate parameters:
   - Set `search` to the user's query (e.g., "Microsoft 365")
   - If a vendor is specified, set `vendorName` (e.g., "Microsoft")
   - Set `size=200` to get maximum results per page

2. **Filter results** by reviewing the returned product names against the search query

3. **Optionally fetch pricing** for each matching product

   For each product of interest, call `pax8-get-product-pricing-by-uuid` with the `productId` to get pricing tiers (Monthly, Annual, etc.)

4. **Format and return results** with product details and pricing

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Product name search (partial match) |
| vendor | string | No | all | Vendor name filter |
| show_pricing | boolean | No | false | Include pricing in results |

## Examples

### Basic Product Search

```
/search-products "Microsoft 365"
```

### Search by Vendor

```
/search-products "Business" --vendor Microsoft
```

### Search with Pricing

```
/search-products "Defender" --vendor Microsoft --show_pricing
```

### Search Backup Products

```
/search-products "backup"
```

### Search Security Products

```
/search-products "endpoint protection"
```

## Output

### Standard Results

```
Found 5 products matching "Microsoft 365"

+--------------------------------------------+------------+--------+--------+------------+
| Product Name                               | Vendor     | SKU    | Unit   | Provision  |
+--------------------------------------------+------------+--------+--------+------------+
| Microsoft 365 Business Basic               | Microsoft  | CFQ7.. | User   | Automated  |
| Microsoft 365 Business Standard            | Microsoft  | CFQ7.. | User   | Automated  |
| Microsoft 365 Business Premium             | Microsoft  | CFQ7.. | User   | Automated  |
| Microsoft 365 E3                           | Microsoft  | CFQ7.. | User   | Automated  |
| Microsoft 365 E5                           | Microsoft  | CFQ7.. | User   | Automated  |
+--------------------------------------------+------------+--------+--------+------------+

View details:
  /search-products "Microsoft 365 Business Premium" --show_pricing
```

### Results with Pricing

```
Found 1 product matching "Microsoft 365 Business Premium"

Product: Microsoft 365 Business Premium
================================================================
ID:              f9e8d7c6-b5a4-3210-fedc-ba0987654321
Vendor:          Microsoft
SKU:             CFQ7TTC0LCHC
Unit:            User
Min Quantity:    1
Max Quantity:    300
Provisioning:    Automated
Active:          Yes

Pricing:
+----------+--------+---------+---------+--------+
| Term     | Cost   | Retail  | Margin  | Margin%|
+----------+--------+---------+---------+--------+
| Monthly  | $18.90 | $22.00  | $3.10   | 14.1%  |
| Annual   | $17.10 | $22.00  | $4.90   | 22.3%  |
+----------+--------+---------+---------+--------+

Annual savings: $1.80/user/month ($21.60/user/year)

Quick Actions:
  - Order: /create-order --product "Microsoft 365 Business Premium" --company "Company Name" --quantity 25
================================================================
```

### No Results

```
No products found matching "XYZ Product"

Suggestions:
  - Check spelling of the product name
  - Try a shorter search term
  - Browse by vendor: /search-products "" --vendor Microsoft
  - Try common terms: "365", "backup", "security", "endpoint"

Popular searches:
  /search-products "Microsoft 365"
  /search-products "Defender"
  /search-products "backup" --vendor Acronis
  /search-products "SentinelOne"
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to Pax8 MCP server

Possible causes:
  - MCP token is invalid or expired
  - MCP server is not configured
  - Network connectivity issue

Check your MCP configuration and regenerate the token at app.pax8.com/integrations/mcp
```

### Rate Limit

```
Error: Rate limit exceeded (429)

The Pax8 API allows 1000 requests per minute.
Please wait a moment and try again.
```

### No Pricing Available

```
Product: Custom Enterprise Solution
Pricing: Not available via API

Note: Some products require contacting Pax8 directly for pricing.
Check the Pax8 portal at app.pax8.com for details.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `pax8-list-products` | Search products by name and vendor |
| `pax8-get-product-by-uuid` | Get full product details |
| `pax8-get-product-pricing-by-uuid` | Get pricing tiers for a product |

## Related Commands

- `/create-order` - Place an order for a found product
- `/subscription-status` - Check existing subscriptions for a product
- `/license-summary` - See all active licenses across clients
