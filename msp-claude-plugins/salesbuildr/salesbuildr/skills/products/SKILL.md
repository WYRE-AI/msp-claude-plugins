---
name: "SalesBuildr Products"
description: >
  Use this skill when searching for products in the Salesbuildr catalog,
  looking up pricing, or browsing by category. Products are items that
  can be added to quotes as line items.
when_to_use: >-
  When searching for products in the Salesbuildr catalog, looking up pricing, or browsing by
  category. Use when: salesbuildr product, salesbuildr products, salesbuildr catalog, salesbuildr
  pricing, or product search salesbuildr.
---

# Salesbuildr Products

## Overview

The product catalog in Salesbuildr contains items that can be added to quotes. Products include hardware, software licenses, services, and any other billable items.

## Search Products

```
GET /products?search=<term>&category_id=<id>&from=0&size=25
```

Parameters:
- `search` - Search by product name
- `category_id` - Filter by category
- `from` - Pagination offset
- `size` - Results per page (max 100)

## Get Product by ID

```
GET /products/{id}
```

Returns full product details including pricing, description, and category.

## Key Fields

| Field | Description |
|-------|-------------|
| id | Unique product identifier |
| name | Product display name |
| description | Product description |
| price | Default unit price |
| category | Product category |
| sku | Stock keeping unit |

## Common Workflows

### Find Products for a Quote

1. Search for products: `GET /products?search=firewall`
2. Review pricing and descriptions
3. Note product IDs for quote creation

### Browse by Category

1. Search with category filter: `GET /products?category_id=5`
2. Page through results using from/size
