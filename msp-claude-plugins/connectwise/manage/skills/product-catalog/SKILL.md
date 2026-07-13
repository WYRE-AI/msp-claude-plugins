---
name: "ConnectWise Manage Product Catalog"
description: >
  Use this skill when working with the ConnectWise PSA product catalog — searching,
  creating, or updating catalog items (SKUs), managing categories, subcategories,
  manufacturers, or using catalog items on quotes, opportunities, agreements, and
  tickets. Covers the full catalog item field reference, the common MSP workflows
  (hardware SKU, software license, managed service, agreement add-on), and the
  passthrough pattern for fields not surfaced on the MCP tool directly.
when_to_use: >-
  When searching, creating, or updating ConnectWise PSA product catalog items (SKUs), categories,
  subcategories, or manufacturers. Use when: connectwise product, connectwise catalog, connectwise
  sku, product catalog connectwise, catalog item connectwise, cw manage product, add product
  connectwise, create sku, product category connectwise, manufacturer connectwise, procurement
  catalog, connectwise pricing, bundle product, or managed service sku.
---

# ConnectWise PSA Product Catalog

## Overview

The ConnectWise Manage product catalog is the master list of everything an MSP sells — hardware SKUs, software licenses, managed service subscriptions, bundles, and service offerings. Catalog items are the building blocks that flow into quotes, opportunities, sales orders, agreement additions, and ticket charges. Getting the catalog right drives accurate quoting, consistent billing, and clean COGS/margin reporting.

This skill covers the full catalog item schema, the supporting lookup entities (categories, subcategories, manufacturers, product types, unit of measure), and the workflows for the most common MSP scenarios.

## API Endpoints

```
Base:         /procurement/catalog
Categories:   /procurement/categories
Subcategories: /procurement/subCategories
Manufacturers: /procurement/manufacturers
Product types: /procurement/productTypes
Unit of measure: /procurement/unitOfMeasures
Product class: /procurement/productClasses
```

Available MCP tools (connectwise-manage-mcp):

| Tool | Purpose |
|------|---------|
| `cw_search_catalog_items` | Search catalog items with CW conditions syntax |
| `cw_get_catalog_item` | Fetch one catalog item by ID |
| `cw_create_catalog_item` | Create a new catalog item (common fields + `extraFields` passthrough) |
| `cw_update_catalog_item` | JSON Patch update against an existing item |
| `cw_list_catalog_categories` | List categories |
| `cw_list_catalog_subcategories` | List subcategories (filter by `category/id=N`) |
| `cw_list_manufacturers` | List manufacturers |

## Product Class

`productClass` is the single most important field because it drives downstream billing, inventory, and agreement behavior.

| Class | Use For | Behavior |
|-------|---------|----------|
| `NonInventory` | Software licenses, pass-through charges, most SaaS | No stock tracking, cost = last-purchased or fixed |
| `Inventory` | Physical hardware you stock | Tracks on-hand, reorder points, cost layers |
| `Bundle` | Parent SKU composed of child SKUs | Expands into components at quote time |
| `Service` | Labor-based services, project service items | Maps to work roles, billable on tickets |
| `Agreement` | Recurring managed-services line items | Drives MRR additions on agreements |

**Rule of thumb for MSPs:**
- Per-endpoint managed services (RMM, EDR, backup) → `Agreement`
- M365 / Google Workspace licenses you resell → `NonInventory` (or `Agreement` if billing monthly)
- Switches, firewalls, desktops you physically hold → `Inventory`
- Project engineering hours, onboarding fee → `Service`
- "Small Business Bundle" that rolls up RMM + EDR + backup → `Bundle`

## Complete Catalog Item Field Reference

### Core Identity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated ID |
| `identifier` | string(60) | Yes | Unique SKU / part number (your internal code) |
| `description` | string(50) | Yes | Internal-facing short description |
| `customerDescription` | string | No | Customer-facing description (shows on quotes/invoices) |
| `notes` | string | No | Internal notes (not customer-visible) |

### Classification

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | object | No | `{id: categoryId}` |
| `subcategory` | object | Yes | `{id: subcategoryId}` — CW requires this |
| `type` | object | Yes | `{id: typeId}` — product type |
| `productClass` | enum | No | `NonInventory` / `Inventory` / `Bundle` / `Service` / `Agreement` |
| `serializedFlag` | boolean | No | Track by serial number (hardware) |
| `serializedCostFlag` | boolean | No | Per-unit cost tracking |
| `phaseProductFlag` | boolean | No | Eligible as a project phase product |

### Pricing & Cost

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cost` | decimal | No | Your cost |
| `price` | decimal | No | Sell price |
| `priceMethodFlag` | string | No | `Markup_Flat`, `Markup_Percent`, `Gross_Margin`, `Price_Flat` |
| `costFlag` | string | No | `Billable`, `DoNotBill`, `NoCharge` |
| `taxableFlag` | boolean | No | Subject to sales tax |

### Vendor & Supply

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `manufacturer` | object | No | `{id: manufacturerId}` |
| `manufacturerPartNumber` | string | No | MPN (not your SKU — the mfr's part number) |
| `vendor` | object | No | `{id: vendorCompanyId}` — a company flagged as a vendor |
| `vendorSku` | string | No | Vendor's SKU for reordering |

### Inventory

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `unitOfMeasure` | object | No | `{id: uomId}` — Each, Box, Hour, Month, License, etc. |
| `minStockLevel` | int | No | Reorder threshold |
| `ianCode` | string | No | Inventory account number (GL) |
| `upc` | string | No | UPC barcode |

### Lifecycle

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `inactiveFlag` | boolean | No | Retired from active sale |
| `specialOrderFlag` | boolean | No | Not normally stocked |
| `buyingEveryFlag` | boolean | No | Continuous purchase |

## Passthrough Pattern: `extraFields`

The `cw_create_catalog_item` tool surfaces ~11 common fields directly as typed Zod params. For any field not in that list (e.g. `manufacturerPartNumber`, `unitOfMeasure`, `upc`, `minStockLevel`, `serializedFlag`), use `extraFields`:

```json
{
  "identifier": "DELL-OPTI-7010",
  "description": "Dell OptiPlex 7010 Desktop",
  "subcategoryId": 12,
  "typeId": 3,
  "cost": 849.00,
  "price": 1199.00,
  "categoryId": 5,
  "manufacturerId": 17,
  "productClass": "Inventory",
  "taxableFlag": true,
  "customerDescription": "Dell OptiPlex 7010 - i5/16GB/512GB SSD",
  "extraFields": {
    "manufacturerPartNumber": "OPT7010-i5-16-512",
    "unitOfMeasure": { "id": 1 },
    "vendor": { "id": 9823 },
    "vendorSku": "DELL-7010-BSTOCK",
    "minStockLevel": 2,
    "serializedFlag": true,
    "ianCode": "1400-INV-HW"
  }
}
```

`extraFields` is merged into the POST body verbatim — anything the CW `/procurement/catalog` POST endpoint accepts will work.

## Common MSP Recipes

### Recipe 1: Hardware SKU (Inventory)

```json
{
  "identifier": "FW-MERAKI-MX67",
  "description": "Meraki MX67 Firewall",
  "subcategoryId": 8,
  "typeId": 2,
  "productClass": "Inventory",
  "categoryId": 3,
  "manufacturerId": 24,
  "cost": 495.00,
  "price": 795.00,
  "taxableFlag": true,
  "extraFields": {
    "manufacturerPartNumber": "MX67-HW",
    "unitOfMeasure": { "id": 1 },
    "serializedFlag": true,
    "minStockLevel": 1
  }
}
```

### Recipe 2: Software License / SaaS (NonInventory)

```json
{
  "identifier": "M365-BP",
  "description": "M365 Business Premium",
  "subcategoryId": 21,
  "typeId": 5,
  "productClass": "NonInventory",
  "cost": 22.00,
  "price": 28.50,
  "taxableFlag": false,
  "customerDescription": "Microsoft 365 Business Premium - per user/month",
  "extraFields": {
    "unitOfMeasure": { "id": 7 }
  }
}
```

### Recipe 3: Managed Service / MRR line item (Agreement)

```json
{
  "identifier": "MSP-WKST-MGD",
  "description": "Managed Workstation",
  "subcategoryId": 30,
  "typeId": 9,
  "productClass": "Agreement",
  "cost": 18.00,
  "price": 75.00,
  "customerDescription": "Fully Managed Workstation - RMM, EDR, patching, backup",
  "extraFields": {
    "unitOfMeasure": { "id": 7 },
    "ianCode": "4100-REC-MSP"
  }
}
```

### Recipe 4: Project Service / Labor (Service)

```json
{
  "identifier": "SVC-PM-HR",
  "description": "Project Management - hourly",
  "subcategoryId": 45,
  "typeId": 11,
  "productClass": "Service",
  "cost": 85.00,
  "price": 195.00,
  "extraFields": {
    "unitOfMeasure": { "id": 3 },
    "phaseProductFlag": true
  }
}
```

## Updating Catalog Items (JSON Patch)

Use `cw_update_catalog_item` with JSON Patch ops. CW Manage is strict about patch syntax — reference fields use `/id` paths.

### Common patch patterns

**Adjust price:**
```json
[{ "op": "replace", "path": "price", "value": 29.95 }]
```

**Retire a SKU:**
```json
[{ "op": "replace", "path": "inactiveFlag", "value": true }]
```

**Change manufacturer:**
```json
[{ "op": "replace", "path": "manufacturer/id", "value": 42 }]
```

**Update customer description + cost atomically:**
```json
[
  { "op": "replace", "path": "customerDescription", "value": "M365 Business Premium (annual commit)" },
  { "op": "replace", "path": "cost", "value": 21.00 }
]
```

## Search Patterns

Catalog search uses standard CW conditions syntax.

**All active hardware from one manufacturer:**
```
conditions=manufacturer/id=17 and inactiveFlag=false and productClass="Inventory"
```

**SKUs with a specific prefix:**
```
conditions=identifier like 'M365-%'
```

**Items missing a manufacturer (data hygiene):**
```
conditions=manufacturer=null and inactiveFlag=false
```

**Price-list export — active NonInventory:**
```
conditions=productClass="NonInventory" and inactiveFlag=false
orderBy=identifier asc
```

**Recently updated:**
```
conditions=_info/lastUpdated>=[2026-01-01T00:00:00Z]
```

## Best Practices

1. **SKU conventions matter** — pick a pattern (`VENDOR-PRODUCT-VARIANT`) and stick to it. Catalog bloat from inconsistent SKUs is the #1 reason CW quote selection gets painful.
2. **Always set `productClass`** — default CW behavior when it's missing is rarely what MSPs want. Bundles and agreement items especially must be classified correctly or they won't expand / won't roll up MRR.
3. **`subcategory` and `type` are required** — look them up first with `cw_list_catalog_subcategories` and cache the IDs. Don't hardcode.
4. **Separate `description` from `customerDescription`** — internal SKU naming (short, searchable) vs customer-facing (descriptive, marketing-friendly).
5. **Retire, don't delete** — set `inactiveFlag=true` instead of deleting. Historical quotes, tickets, and invoices reference the item by ID.
6. **Bundle children must exist first** — create the component SKUs before the bundle parent, or the bundle creation will fail.
7. **GL account (`ianCode`) on agreement items** — this is what flows to accounting. Missing `ianCode` on `Agreement` class items is a common source of bad financial reports.
8. **Keep `cost` current** — margin reporting uses the catalog `cost` at quote time unless the quote has its own override. Stale cost = lying margin.

## Pitfalls & Error Handling

| Symptom | Cause | Fix |
|---------|-------|-----|
| `SubCategory is required` | Missing `subcategory.id` | Include `subcategoryId` on create |
| `Type is required` | Missing `type.id` | Include `typeId` on create |
| `Duplicate identifier` | SKU already exists | Search first; or use `cw_update_catalog_item` |
| Bundle won't expand on quote | Child SKUs missing or `productClass` wrong on parent | Confirm parent is `productClass: "Bundle"` and children exist |
| Agreement addition doesn't bill | `productClass` is `NonInventory` instead of `Agreement` | Patch `productClass` to `Agreement` |
| Price not applying on quote | `priceMethodFlag` overrides fixed price | Set `priceMethodFlag: "Price_Flat"` if you want the catalog price to stick |
| Serial prompt won't appear | `serializedFlag=false` | Patch to `true` |
| Cost shows $0 on reports | `cost` never set, relying on last-PO | Set an explicit `cost` value |

## Related Skills

- [ConnectWise Tickets](../tickets/SKILL.md) — using catalog items as ticket product charges
- [ConnectWise Projects](../projects/SKILL.md) — phase products and project service items
- [ConnectWise API Patterns](../api-patterns/SKILL.md) — query syntax, JSON Patch, pagination
