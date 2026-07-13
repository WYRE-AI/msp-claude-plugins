---
description: Search the Salesbuildr product catalog
argument-hint: "[search] [category]"
arguments: [search, category]
---

# Search Salesbuildr Products

## Arguments

- `search` (optional) — Search term for product name
- `category` (optional) — Category ID to filter by

## Prerequisites
- Salesbuildr API key configured

## Steps
1. Build search request with filters
2. Call Salesbuildr API: `GET /products?search=$search&category_id=$category`
3. Display results with pricing

## Examples

### Search by name
```
/search-products search="firewall"
```

## Error Handling
| Error | Resolution |
|-------|------------|
| No results | Try broader search terms |
