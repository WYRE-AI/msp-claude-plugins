---
description: Search the Autotask product catalog for products, services, or inventory items
argument-hint: "[search] [type] [active-only] [category]"
arguments: [search, type, active-only, category]
---

# Search Autotask Product Catalog

## Prerequisites

- Autotask MCP server connected and authenticated
- API user has read access to product catalog entities

## Steps

1. Determine the search type (products, services, or inventory)
2. Build the appropriate search query with filters
3. Execute the search using the corresponding MCP tool
4. Format and display results with key fields

### For Products

```
Tool: autotask_search_products
Args: {
  searchTerm: "$search",
  isActive: $active-only,
  productCategory: $category
}
```

### For Services

```
Tool: autotask_search_services
Args: {
  searchTerm: "$search",
  isActive: $active-only
}
```

### For Inventory

```
Tool: autotask_search_inventory_items
Args: {
  productID: <resolved from search>
}
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | - | Search term for name or SKU |
| type | string | No | products | products, services, or inventory |
| active-only | boolean | No | true | Filter to active items only |
| category | number | No | - | Product category ID filter |

## Examples

### Search for firewall products
```
/search-products search="firewall"
```

### Search for managed services
```
/search-products search="managed" type="services"
```

### Browse all active products in a category
```
/search-products category=5 active-only=true
```

### Check inventory for a product
```
/search-products search="laptop" type="inventory"
```

## Output

Results displayed as a table:

```
Found 3 products matching "firewall":

| ID    | Name                    | SKU        | Unit Price | Active |
|-------|-------------------------|------------|------------|--------|
| 12345 | FortiGate 60F           | FG-60F     | $1,299.00  | Yes    |
| 12346 | FortiGate 80F           | FG-80F     | $2,199.00  | Yes    |
| 12347 | SonicWall TZ270         | SW-TZ270   | $599.00    | Yes    |
```

## Error Handling

| Error | Resolution |
|-------|------------|
| No results found | Try broader search terms or remove filters |
| MCP server not connected | Check Autotask MCP server configuration |
| Permission denied | Verify API user has product catalog access |

## Related Commands

- [check-pricing](/commands/check-pricing) - Get detailed pricing from price lists
- [lookup-company](/commands/lookup-company) - Find company for quoting context
- [check-contract](/commands/check-contract) - Check contract service associations
