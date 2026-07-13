---
description: Create a new quote with line items in Salesbuildr
argument-hint: "<name> <company> [contact] [opportunity] [products]"
arguments: [name, company, contact, opportunity, products]
---

# Create Salesbuildr Quote

## Arguments

- `name` (required) — Quote title
- `company` (required) — Company name or ID
- `contact` (optional) — Contact name or ID
- `opportunity` (optional) — Opportunity name or ID to link
- `products` (optional) — Comma-separated product names or IDs with quantities (e.g., "FortiGate 60F:2, SonicWall TZ270:1")

## Prerequisites
- Salesbuildr API key configured
- Company and products must exist

## Steps
1. Resolve company, contact, and opportunity to IDs
2. Resolve product names to IDs and build line items
3. Call Salesbuildr API: `POST /quotes`
4. Display created quote with line items and total

## Examples

### Create quote with products
```
/create-quote name="Infrastructure Refresh" company="Acme Corp" products="FortiGate 60F:2, Endpoint License:50"
```

### Create quote linked to opportunity
```
/create-quote name="Proposal" company="Acme Corp" opportunity="Q1 Refresh"
```

## Error Handling
| Error | Resolution |
|-------|------------|
| Product not found | Verify product names with /search-products |
| Company not found | Verify company exists |
