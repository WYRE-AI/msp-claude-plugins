---
name: "Pax8 Products"
description: >
  The Pax8 product catalog: cloud software SKUs, vendors, pricing tiers and margins, and
  provisioning details across Microsoft 365, Azure, security tools, and backup products.
when_to_use: >-
  When searching the catalog for a SKU, vendor, price, or provisioning detail to match a
  client need. Use when: pax8 product, pax8 catalog, pax8 sku, pax8 pricing, pax8
  vendor, pax8 marketplace, cloud product search, microsoft 365 pax8, azure pax8, pax8
  software, or license pricing.
---

# Pax8 Product Catalog

## Overview

The Pax8 product catalog contains thousands of cloud software products from hundreds of vendors. MSPs use the catalog to find the right products for their clients, check pricing, and understand provisioning requirements. Products range from Microsoft 365 and Azure to security tools, backup solutions, and line-of-business applications. Each product has associated pricing tiers, billing terms, and provisioning details that determine how it is ordered and managed.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pax8-list-products` | Search and browse the product catalog | `productName`, `page`, `size`, `vendorName`, `search` |
| `pax8-get-product-by-uuid` | Get a single product's details | `productId` (required) |
| `pax8-get-product-pricing-by-uuid` | Get product pricing tiers | `productId` (required), `companyId` (optional) |

### Search Products

Call `pax8-list-products` with optional parameters:

- **Search by name:** Set `productName` or `search` to a product name or keyword
- **Filter by vendor:** Set `vendorName` to a vendor name (e.g., `Microsoft`, `SentinelOne`, `Acronis`)
- **Paginate:** Set `page` (0-based) and `size` (up to 200)

**Example: Find Microsoft 365 products:**
- `pax8-list-products` with `vendorName=Microsoft`, `search=365`, `size=200`

**Example: Search for backup products:**
- `pax8-list-products` with `search=backup`, `size=200`

### Get Product Details

Call `pax8-get-product-by-uuid` with the `productId` parameter.

**Example:**
- `pax8-get-product-by-uuid` with `productId=f9e8d7c6-b5a4-3210-fedc-ba0987654321`

### Get Product Pricing

Call `pax8-get-product-pricing-by-uuid` with the `productId` parameter. Optionally pass `companyId` to get company-specific pricing.

**Example:**
- `pax8-get-product-pricing-by-uuid` with `productId=f9e8d7c6-b5a4-3210-fedc-ba0987654321`

**Example with company-specific pricing:**
- `pax8-get-product-pricing-by-uuid` with `productId=f9e8d7c6-...`, `companyId=a1b2c3d4-...`

## Key Concepts

### Product Hierarchy

Products in Pax8 follow a hierarchical structure:

| Level | Description | Example |
|-------|-------------|---------|
| Vendor | The software publisher | Microsoft, SentinelOne, Acronis |
| Product | A specific offering | Microsoft 365 Business Premium |
| SKU/Pricing | Billing terms and tiers | Monthly, Annual, per-user, per-device |

### Product Types

| Type | Description | Examples |
|------|-------------|---------|
| Seat-based | Per-user licensing | Microsoft 365, Google Workspace |
| Usage-based | Pay for what you consume | Azure, AWS |
| Device-based | Per-device licensing | Endpoint security, RMM |
| Flat-rate | Fixed monthly fee | Domain registration, hosted services |
| Tiered | Price varies by quantity | Backup storage tiers |

### Billing Terms

| Term | Description |
|------|-------------|
| Monthly | Month-to-month billing, cancel anytime |
| Annual | 12-month commitment, typically discounted |
| Triennial | 3-year commitment, deepest discount |
| One-Time | Single purchase (e.g., setup fees) |
| Trial | Free trial period before billing begins |

### Provisioning Types

| Type | Description |
|------|-------------|
| Automated | Instantly provisioned through Pax8 |
| Manual | Requires manual setup by vendor or Pax8 |
| Hybrid | Automated creation with manual configuration steps |

## Field Reference

### Product Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Product unique identifier |
| `name` | string | Product display name |
| `vendorName` | string | Vendor/publisher name |
| `vendorId` | UUID | Vendor unique identifier |
| `description` | string | Product description |
| `sku` | string | Product SKU code |
| `unitOfMeasurement` | string | Licensing unit (e.g., "User", "Device", "GB") |
| `billingTermOptions` | array | Available billing terms |
| `provisioningType` | string | How the product is provisioned |
| `minQuantity` | integer | Minimum order quantity |
| `maxQuantity` | integer | Maximum order quantity |
| `active` | boolean | Whether the product is available for ordering |
| `category` | string | Product category |

### Pricing Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Pricing record ID |
| `productId` | UUID | Associated product ID |
| `billingTerm` | string | Billing term (Monthly, Annual) |
| `unitPrice` | decimal | Price per unit |
| `flatPrice` | decimal | Flat fee (if applicable) |
| `partnerBuyPrice` | decimal | MSP cost price |
| `suggestedRetailPrice` | decimal | Suggested end-user price |
| `currency` | string | Currency code (e.g., "USD") |
| `startDate` | date | Pricing effective date |
| `endDate` | date | Pricing expiration date |

## Common Workflows

### Find the Right Product for a Client

1. Call `pax8-list-products` with `search` set to the product keyword and optionally `vendorName`
2. Review the results for matching products
3. For each candidate, call `pax8-get-product-by-uuid` to check details (active status, min/max quantity, provisioning type)
4. Call `pax8-get-product-pricing-by-uuid` to compare pricing tiers

### Compare Product Pricing

1. Identify the product IDs you want to compare
2. For each product, call `pax8-get-product-pricing-by-uuid` with the `productId`
3. Compare `partnerBuyPrice` (your cost) and `suggestedRetailPrice` (recommended client price)
4. Calculate margin: `(suggestedRetailPrice - partnerBuyPrice) / suggestedRetailPrice * 100`

### Microsoft 365 Product Finder

Common M365 plans MSPs order through Pax8:

- Microsoft 365 Business Basic
- Microsoft 365 Business Standard
- Microsoft 365 Business Premium
- Microsoft 365 E3
- Microsoft 365 E5
- Exchange Online Plan 1/2
- Microsoft Teams Essentials
- Microsoft Defender for Business

To find these, call `pax8-list-products` with `vendorName=Microsoft` and `search=365` (or `Defender`, `Exchange`, etc.).

### Build a Product Catalog Export

1. Call `pax8-list-products` with `size=200` and `page=0`
2. Paginate through all pages by incrementing `page`
3. For each product, call `pax8-get-product-pricing-by-uuid` to get pricing
4. Compile into a catalog with product name, vendor, SKU, unit, monthly price, annual price, and margin

## Response Examples

**Product:**

```json
{
  "id": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "name": "Microsoft 365 Business Premium",
  "vendorName": "Microsoft",
  "description": "Best-in-class Office apps with advanced security and device management",
  "sku": "CFQ7TTC0LCHC",
  "unitOfMeasurement": "User",
  "billingTermOptions": ["Monthly", "Annual"],
  "provisioningType": "Automated",
  "minQuantity": 1,
  "maxQuantity": 300,
  "active": true
}
```

**Pricing:**

```json
{
  "content": [
    {
      "id": "p1r2i3c4-e5f6-7890-abcd-ef1234567890",
      "productId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
      "billingTerm": "Monthly",
      "unitPrice": 18.90,
      "partnerBuyPrice": 18.90,
      "suggestedRetailPrice": 22.00,
      "currency": "USD"
    },
    {
      "id": "p2r3i4c5-f6a7-8901-bcde-f12345678901",
      "productId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
      "billingTerm": "Annual",
      "unitPrice": 17.10,
      "partnerBuyPrice": 17.10,
      "suggestedRetailPrice": 22.00,
      "currency": "USD"
    }
  ]
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Product not found | Invalid product UUID | Verify the UUID with `pax8-list-products` |
| Pricing not found | Product may not have pricing configured | Check the Pax8 portal for pricing details |
| No results | Search term too specific | Try a shorter or broader search term |

## Best Practices

1. **Cache product catalog** - Products and pricing change infrequently; cache for 1-4 hours
2. **Use vendor filter** - Always filter by `vendorName` when you know the vendor to reduce result sets
3. **Check pricing separately** - Product listing does not include pricing; use `pax8-get-product-pricing-by-uuid`
4. **Verify active status** - Only order products where `active` is `true`
5. **Check min/max quantities** - Respect `minQuantity` and `maxQuantity` before placing orders
6. **Understand billing terms** - Annual commitments are cheaper but lock in for 12 months
7. **Review provisioning type** - Automated products are instant; manual products may take hours or days
8. **Compare pricing tiers** - Show clients the savings from annual vs. monthly commitment
9. **Calculate margins** - Use `partnerBuyPrice` vs. `suggestedRetailPrice` to understand margins
10. **Paginate large catalogs** - The full Pax8 catalog has thousands of products; always paginate

## Related Skills

- [Pax8 API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [Pax8 Subscriptions](../subscriptions/SKILL.md) - Active product subscriptions
- [Pax8 Orders](../orders/SKILL.md) - Ordering products
- [Pax8 Companies](../companies/SKILL.md) - Client company management
- [Pax8 Invoices](../invoices/SKILL.md) - Billing for products
