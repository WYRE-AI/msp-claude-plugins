---
name: "Autotask Product Catalog"
description: >
  Use this skill when working with Autotask product catalog operations - searching
  products, checking pricing, managing inventory, and understanding the relationship
  between products, services, bundles, and price lists. Covers product types,
  pricing models, inventory tracking, and billing code associations. Essential for
  MSP operations involving quoting, procurement, and cost analysis through Autotask PSA.
when_to_use: >-
  When searching products, checking pricing, managing inventory, and understanding the
  relationship between products, services, bundles, and price lists. Use when: autotask product,
  autotask products, product catalog, product pricing, price list, inventory items, autotask
  services, service bundles, product search, check pricing, cost analysis, billing rates, markup,
  or autotask inventory.
---

# Autotask Product Catalog

## Overview

The Autotask product catalog manages three types of sellable items: **Products** (one-time purchases like hardware and software licenses), **Services** (recurring offerings used in contracts), and **Service Bundles** (grouped services sold together). Each type has associated pricing through **Price Lists** that control unit prices, markup, and billing codes.

This skill covers product catalog operations for MSP technicians, sales engineers, and managers who need to look up products, verify pricing, check inventory levels, or audit cost-vs-billing rates.

## Key Concepts

### Product Types

| Type | Description | Use Case | Recurring |
|------|-------------|----------|-----------|
| Product | Physical or digital item | Hardware, licenses, one-time purchases | No |
| Service | Recurring offering | Managed services, monthly monitoring | Yes |
| Service Bundle | Grouped services | All-in-one MSP packages | Yes |
| Inventory Item | Tracked stock | Warehouse items with serial numbers | No |

### Product Fields

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique product identifier |
| name | string | Product display name |
| sku | string | Stock keeping unit code |
| description | string | Product description |
| isActive | boolean | Whether product is currently available |
| unitCost | number | Internal cost per unit |
| unitPrice | number | Default selling price per unit |
| msrp | number | Manufacturer's suggested retail price |
| productCategory | number | Category ID (picklist) |
| vendorProductNumber | string | Vendor's product number |
| manufacturerName | string | Manufacturer name |
| isSerialTracked | boolean | Whether serial numbers are tracked |
| priceCostMethod | number | How pricing is calculated |
| defaultVendorID | number | Default vendor/supplier |

### Price List Structure

Price lists control what customers actually pay. They can override default product pricing per currency:

| Field | Type | Description |
|-------|------|-------------|
| productID / serviceID | number | The item being priced |
| currencyCode | string | Currency (e.g., USD, GBP) |
| unitPrice | number | Price in this price list |
| usesInternalCurrencyPrice | boolean | Whether to use internal currency |

## API Patterns

### Searching Products

Search products by name, SKU, or category:

```
Tool: autotask_search_products
Args: { searchTerm: "firewall", isActive: true }
```

```
Tool: autotask_search_products
Args: { productCategory: 5, pageSize: 50 }
```

### Getting Product Details

Retrieve full product information by ID:

```
Tool: autotask_get_product
Args: { productId: 12345 }
```

### Searching Services

Find recurring service offerings:

```
Tool: autotask_search_services
Args: { searchTerm: "managed", isActive: true }
```

### Checking Inventory

Look up inventory levels for a product:

```
Tool: autotask_search_inventory_items
Args: { productID: 12345 }
```

Filter by location:

```
Tool: autotask_search_inventory_items
Args: { inventoryLocationID: 1 }
```

### Price List Lookups

Get pricing for a specific product:

```
Tool: autotask_search_price_list_products
Args: { productID: 12345 }
```

Get pricing for a service:

```
Tool: autotask_search_price_list_services
Args: { serviceID: 678 }
```

## Common Workflows

### 1. Quote Pricing Audit

Verify that a product's quote price matches the price list:

1. Search for the product: `autotask_search_products { searchTerm: "product name" }`
2. Get the product details: `autotask_get_product { productId: <id> }`
3. Check price list: `autotask_search_price_list_products { productID: <id> }`
4. Compare unitPrice from product vs price list entry
5. Calculate margin: `(priceListPrice - unitCost) / priceListPrice * 100`

### 2. Cost vs Billing Rate Comparison

Analyze margins across products:

1. Search products: `autotask_search_products { isActive: true, pageSize: 100 }`
2. For each product, compare `unitCost` vs `unitPrice`
3. Flag products where margin is below threshold
4. Check price list overrides if pricing seems off

### 3. Inventory Check Before Quote

Before quoting hardware, verify stock:

1. Find the product: `autotask_search_products { searchTerm: "laptop" }`
2. Check inventory: `autotask_search_inventory_items { productID: <id> }`
3. Review `quantityOnHand` vs `quantityMinimum`
4. If low stock, note in quote or suggest alternatives

### 4. Service Pricing Review

Review recurring service pricing for contract renewals:

1. Search services: `autotask_search_services { isActive: true }`
2. For key services, check price list: `autotask_search_price_list_services { serviceID: <id> }`
3. Compare current pricing to contract rates
4. Identify services where pricing has drifted

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Product not found | Invalid product ID | Verify ID with search first |
| Empty results | No matching products | Broaden search term, check isActive filter |
| Price list empty | No pricing configured | Product may use default unitPrice |
| Permission denied | API user lacks access | Check API integration security level |

## Best Practices

- Always check `isActive` when searching for products to avoid quoting discontinued items
- Use price lists for customer-facing pricing, not the product's `unitPrice` (which is the default)
- When checking inventory, consider all locations if multi-site
- Products with `isSerialTracked: true` require serial number assignment on delivery
- Service pricing in price lists overrides the service's default `unitPrice`

## Related Skills

- [CRM](/skills/crm/) - Company and contact management for quoting
- [Contracts](/skills/contracts/) - Contract pricing and service associations
- [API Patterns](/skills/api-patterns/) - General Autotask API query patterns
