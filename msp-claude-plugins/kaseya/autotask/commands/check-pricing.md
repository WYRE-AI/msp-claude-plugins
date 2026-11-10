---
description: Check pricing details for an Autotask product or service (price-list overrides are UI-only)
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
3. Note that price-list overrides are not reachable through the connector (Autotask UI only)
4. Display cost, price, MSRP and margin from the product or service record

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

For a product:

```
Tool: autotask_get_product
Args: { productId: <resolved_id> }
```

For a service (`type="service"`, or an ID resolved from `autotask_search_services`):

```
Tool: autotask_get_service
Args: { serviceId: <resolved_id> }
```

Product and service IDs are separate sequences, so never look a service ID up as a product.

### Step 3: Price-list overrides

There is no MCP tool for Autotask Price Lists or Inventory Items (both are real Autotask entities, but the connector does not expose them). Check price-list overrides and stock levels directly in the Autotask UI, and say so in the answer rather than guessing.

### Step 4: Calculate and Display

Show: unit cost, default price, MSRP, and margin percentage from the product or service record. Note that any customer price-list override must be checked in the Autotask UI.

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

Price list overrides: check in the Autotask UI (not available through the connector)

Margins:
  Default margin: 34.6%
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
