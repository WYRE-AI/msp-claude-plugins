---
description: Check pricing details for an Autotask product or service from price lists
argument-hint: "<product> [type]"
arguments: [product, type]
---

# Check Autotask Pricing

## Prerequisites

- Autotask MCP server connected and authenticated
- API user has read access to products and price lists

## Steps

1. Resolve the product/service (search by name/SKU if not an ID)
2. Get the item's base pricing (unitCost, unitPrice, MSRP)
3. Look up price list entries for this item
4. Display comparison of base vs price list pricing with margins

### Step 1: Find the Product/Service

If the input is not a numeric ID, search for it:

```
Tool: autotask_search_products
Args: { searchTerm: "$product" }
```

Or for services:

```
Tool: autotask_search_services
Args: { searchTerm: "$product" }
```

### Step 2: Get Full Details

```
Tool: autotask_get_product
Args: { productId: <resolved_id> }
```

### Step 3: Check Price List

```
Tool: autotask_search_price_list_products
Args: { productID: <resolved_id> }
```

Or for services:

```
Tool: autotask_search_price_list_services
Args: { serviceID: <resolved_id> }
```

### Step 4: Calculate and Display

Show: unit cost, default price, MSRP, price list price, and margin percentage.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| product | string | Yes | - | Product name, SKU, or numeric ID |
| type | string | No | product | product or service |

## Examples

### Check pricing by name
```
/check-pricing product="FortiGate 60F"
```

### Check pricing by ID
```
/check-pricing product=12345
```

### Check service pricing
```
/check-pricing product="Managed Endpoint" type="service"
```

## Output

```
Pricing for: FortiGate 60F (SKU: FG-60F)

Base Pricing:
  Unit Cost:  $850.00
  Unit Price: $1,299.00 (default)
  MSRP:       $1,499.00

Price List Pricing:
  USD: $1,199.00

Margins:
  Default margin: 34.6%
  Price list margin: 29.2%
  vs MSRP discount: 20.0%
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Product not found | Verify name/SKU spelling, try partial search |
| No price list entry | Product uses default unitPrice for billing |
| Multiple matches | Results shown for selection, re-run with specific ID |

## Related Commands

- [search-products](/commands/search-products) - Browse the product catalog
- [lookup-company](/commands/lookup-company) - Find company for context
