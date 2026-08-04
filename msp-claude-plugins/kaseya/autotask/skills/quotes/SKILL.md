---
name: "Autotask Quotes"
description: >
  Autotask quote structure and line items - quote item types (product, service, service
  bundle, labor, expense, shipping), the mutually-exclusive catalog reference rules, and
  the three discount mechanisms (unit, line, percentage) used to build customer proposals.
when_to_use: >-
  When creating quotes for customers, adding products/services/bundles as line items, managing
  pricing and discounts, or linking quotes to opportunities. Use when: autotask quote, create
  quote, quote item, quote line item, proposal, pricing quote, customer quote, quote builder, add
  to quote, quote discount, quote opportunity, build quote, or sales quote.
---

# Autotask Quote Management

## Overview

Quotes are formal pricing proposals sent to customers for products, services, and service bundles. Each quote contains line items that reference catalog entries (products, services, or service bundles) with quantities, pricing, and optional discounts. Quotes are typically linked to opportunities in the sales pipeline and can be converted to contracts or projects upon acceptance.

## Anti-triggers

- **Quotes in Kaseya Quote Manager** — a separate Kaseya product with
  its own quote → section → line hierarchy and sales orders, shipped as
  a separate plugin; use `kaseya-quote-manager-quotes`.
- **The catalog entry behind a line item** — product, service, bundle,
  and price-list definitions live in `autotask-product-catalog`.
- **What the client is billed after acceptance** — recurring services
  move onto an agreement; use `autotask-contracts`.

## Key Concepts

### Quote Structure

```
Quote (Header)
├── Quote Item: Product A (qty: 5, $100/ea)
├── Quote Item: Service B (qty: 1, $500/mo)
├── Quote Item: Service Bundle C (qty: 10, $50/ea)
└── Quote Item: Optional - Extended Warranty (optional)
```

### Quote Item Types

| Type ID | Name | Description |
|---------|------|-------------|
| **1** | Product | Physical or virtual products from catalog |
| **2** | Cost | Generic cost items |
| **3** | Labor | Labor/professional services hours |
| **4** | Expense | Expense items |
| **6** | Shipping | Shipping and handling |
| **11** | Service | Recurring services from catalog |
| **12** | ServiceBundle | Service bundles from catalog |

### Item Reference Rules

Each quote item must reference **exactly one** catalog item type:

| Reference Field | Links To | Use When |
|----------------|----------|----------|
| `productID` | Product catalog | Hardware, software, one-time purchases |
| `serviceID` | Service catalog | Recurring managed services |
| `serviceBundleID` | Service bundle catalog | Grouped service packages |

These are **mutually exclusive** - set only one per line item. The `quoteItemType` is auto-determined when you link a catalog item.

## Field Reference

### Quote Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `name` | string | No | Quote name/title |
| `description` | string | No | Quote description |
| `companyId` | int | Yes | Customer company ID |
| `contactId` | int | No | Customer contact ID |
| `opportunityId` | int | No | Linked opportunity ID |
| `effectiveDate` | date | No | Quote effective date (YYYY-MM-DD) |
| `expirationDate` | date | No | Quote expiration date (YYYY-MM-DD) |

### Quote Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `quoteId` | int | Yes | Parent quote ID |
| `name` | string | No | Item name (auto-populated from catalog) |
| `description` | string | No | Item description |
| `quantity` | decimal | Yes | Quantity |
| `unitPrice` | decimal | No | Unit price |
| `unitCost` | decimal | No | Unit cost |
| `unitDiscount` | decimal | No | Per-unit discount amount (default: 0) |
| `lineDiscount` | decimal | No | Total line discount amount (default: 0) |
| `percentageDiscount` | decimal | No | Percentage discount (default: 0) |
| `isOptional` | boolean | No | Whether item is optional (default: false) |
| `serviceID` | int | No | Linked service (mutually exclusive) |
| `productID` | int | No | Linked product (mutually exclusive) |
| `serviceBundleID` | int | No | Linked service bundle (mutually exclusive) |
| `sortOrderID` | int | No | Display sort order |
| `quoteItemType` | int | No | Item type (auto-determined from linked item) |

### Discount Types

Three discount mechanisms can be applied to quote items:

| Discount Type | Field | Description | Example |
|--------------|-------|-------------|---------|
| **Unit Discount** | `unitDiscount` | Fixed amount off per unit | $10 off each unit |
| **Line Discount** | `lineDiscount` | Fixed amount off the entire line | $50 off the line total |
| **Percentage Discount** | `percentageDiscount` | Percentage off the line total | 15% off |

**Calculation order:** Unit discount is applied first (reduces unitPrice), then line or percentage discount is applied to the subtotal.

## MCP Tool Reference

### Create a Quote

```
Tool: autotask_create_quote
Args: {
  "companyId": 67890,
  "name": "Network Refresh - Contoso Ltd",
  "description": "Hardware and managed services quote for office network upgrade",
  "contactId": 11111,
  "opportunityId": 22222,
  "effectiveDate": "2026-03-01",
  "expirationDate": "2026-03-31"
}
```

**Required:** `companyId` only. All other fields are optional but recommended.

### Add a Product Line Item

```
Tool: autotask_create_quote_item
Args: {
  "quoteId": 55555,
  "productID": 100,
  "quantity": 5,
  "unitPrice": 1299.00,
  "unitCost": 850.00,
  "description": "FortiGate 60F firewall"
}
```

### Add a Service Line Item

```
Tool: autotask_create_quote_item
Args: {
  "quoteId": 55555,
  "serviceID": 200,
  "quantity": 25,
  "unitPrice": 45.00,
  "description": "Managed Endpoint Protection - per device/month"
}
```

### Add a Service Bundle Line Item

```
Tool: autotask_create_quote_item
Args: {
  "quoteId": 55555,
  "serviceBundleID": 300,
  "quantity": 1,
  "unitPrice": 2500.00,
  "description": "Complete Managed IT Package"
}
```

### Add an Optional Line Item

```
Tool: autotask_create_quote_item
Args: {
  "quoteId": 55555,
  "productID": 150,
  "quantity": 1,
  "unitPrice": 499.00,
  "isOptional": true,
  "description": "Extended 3-year warranty"
}
```

### Apply Discounts

```
Tool: autotask_create_quote_item
Args: {
  "quoteId": 55555,
  "productID": 100,
  "quantity": 10,
  "unitPrice": 1299.00,
  "percentageDiscount": 10,
  "description": "FortiGate 60F - volume discount"
}
```

### Update a Quote Item

```
Tool: autotask_update_quote_item
Args: {
  "quoteItemId": 77777,
  "quantity": 8,
  "unitPrice": 1199.00,
  "percentageDiscount": 15
}
```

### Delete a Quote Item

```
Tool: autotask_delete_quote_item
Args: { "quoteItemId": 77777 }
```

### Search Quotes

```
Tool: autotask_search_quotes
Args: {
  "companyId": 67890,
  "searchTerm": "network",
  "pageSize": 25
}
```

**Filters:**
- `companyId` - Filter by customer
- `contactId` - Filter by contact
- `opportunityId` - Filter by linked opportunity
- `searchTerm` - Search quote name/description
- `pageSize` - Results per page (default 25, max 100)

### Get a Quote

```
Tool: autotask_get_quote
Args: { "quoteId": 55555 }
```

### Search Quote Items

```
Tool: autotask_search_quote_items
Args: {
  "quoteId": 55555,
  "pageSize": 50
}
```

### Get a Quote Item

```
Tool: autotask_get_quote_item
Args: { "quoteItemId": 77777 }
```

## Common Workflows

### Build a Complete Quote

1. **Find the company:**
```
autotask_search_companies: { "searchTerm": "Contoso" }
```

2. **Find the contact:**
```
autotask_search_contacts: { "companyId": <company_id>, "searchTerm": "John" }
```

3. **Look up products/services:**
```
autotask_search_products: { "searchTerm": "FortiGate" }
autotask_search_services: { "searchTerm": "Managed" }
```

4. **Create the quote:**
```
autotask_create_quote: {
  "companyId": <company_id>,
  "contactId": <contact_id>,
  "name": "Network Refresh Proposal",
  "effectiveDate": "2026-03-01",
  "expirationDate": "2026-04-01"
}
```

5. **Add line items:**
```
autotask_create_quote_item: { "quoteId": <quote_id>, "productID": <id>, "quantity": 5 }
autotask_create_quote_item: { "quoteId": <quote_id>, "serviceID": <id>, "quantity": 25 }
```

6. **Review the quote:**
```
autotask_search_quote_items: { "quoteId": <quote_id> }
```

### Link Quote to Opportunity

```
autotask_create_quote: {
  "companyId": 67890,
  "opportunityId": 22222,
  "name": "Q1 Hardware Refresh"
}
```

### Adjust Pricing on Existing Quote

```
autotask_update_quote_item: {
  "quoteItemId": 77777,
  "unitPrice": 1099.00,
  "percentageDiscount": 5
}
```

### Remove a Line Item

```
autotask_delete_quote_item: { "quoteItemId": 77777 }
```

## Pricing Strategies

### Volume Discounts

For bulk purchases, use `percentageDiscount`:

| Quantity | Discount |
|----------|----------|
| 1-9 | 0% |
| 10-24 | 5% |
| 25-49 | 10% |
| 50+ | 15% |

### Bundle Pricing

Use `lineDiscount` to apply a flat discount when selling a bundle of products together:

```
autotask_create_quote_item: {
  "quoteId": 55555,
  "productID": 100,
  "quantity": 5,
  "unitPrice": 1299.00,
  "lineDiscount": 500.00,
  "description": "FortiGate 60F - bundle price"
}
```

### Optional Upsells

Mark add-ons as optional so the customer can see the value without commitment:

```
autotask_create_quote_item: {
  "quoteId": 55555,
  "serviceID": 250,
  "quantity": 1,
  "isOptional": true,
  "description": "24/7 Premium Support (optional upgrade)"
}
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| companyId required | Missing customer | Provide companyId when creating quote |
| quoteId required | Missing parent quote | Create a quote first, then add items |
| quantity required | Missing quantity | Always provide quantity for line items |
| Multiple item references | Set more than one of serviceID/productID/serviceBundleID | Set exactly ONE item reference per line item |
| Invalid productID | Product not found | Verify with `autotask_search_products` |
| Invalid serviceID | Service not found | Verify with `autotask_search_services` |
| Invalid serviceBundleID | Bundle not found | Verify with `autotask_search_service_bundles` |

## Best Practices

1. **Always link to an opportunity** - Quotes tied to opportunities flow through the sales pipeline
2. **Set effective and expiration dates** - Creates urgency and prevents stale pricing
3. **Use catalog items** - Link to products/services/bundles rather than generic cost items for accurate reporting
4. **Include optional items** - Show value-add options without inflating the base price
5. **Use sort order** - Set `sortOrderID` to control presentation order
6. **Look up pricing first** - Use `autotask_get_product` or `autotask_get_service` to check current catalog pricing before quoting
7. **Review before sending** - Use `autotask_search_quote_items` to verify all items and totals

## Related Skills

- [Autotask Product Catalog](../product-catalog/SKILL.md) - Products, services, and bundles
- [Autotask CRM](../crm/SKILL.md) - Companies and contacts for quote recipients
- [Autotask Contracts](../contracts/SKILL.md) - Converting quotes to contracts
- [Autotask API Patterns](../api-patterns/SKILL.md) - Query builder and authentication
