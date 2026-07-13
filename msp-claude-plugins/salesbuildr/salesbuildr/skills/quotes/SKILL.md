---
name: "SalesBuildr Quotes"
description: >
  Use this skill when creating, searching, or viewing quotes in Salesbuildr.
  Quotes contain line items (products) and are linked to companies, contacts,
  and optionally opportunities. Covers quote creation with products, searching
  quotes, and retrieving quote details with line items.
when_to_use: >-
  When creating, searching, or viewing quotes in Salesbuildr. Use when: salesbuildr quote,
  salesbuildr quotes, create quote salesbuildr, quote line items, salesbuildr proposal, or search
  quotes salesbuildr.
---

# Salesbuildr Quotes

## Overview

Quotes are proposals sent to customers containing one or more products as line items. Each quote is linked to a company and contact, and can optionally be associated with an opportunity.

## Search Quotes

```
GET /quotes?search=<term>&company_id=<id>&opportunity_id=<id>&from=0&size=25
```

Parameters:
- `search` - Search by quote name/number
- `company_id` - Filter by company
- `opportunity_id` - Filter by opportunity
- `from` - Pagination offset
- `size` - Results per page

## Get Quote by ID

```
GET /quotes/{id}
```

Returns full quote details including all line items with product information.

## Create Quote

```
POST /quotes

{
  "name": "Infrastructure Refresh Q1 2026",
  "company_id": 12345,
  "contact_id": 67890,
  "opportunity_id": 11111,
  "items": [
    {
      "product_id": 100,
      "quantity": 2,
      "unit_price": 1299.00
    },
    {
      "product_id": 200,
      "quantity": 5,
      "unit_price": 49.99
    }
  ]
}
```

Required fields: `company_id`

## Key Fields

| Field | Description |
|-------|-------------|
| id | Unique quote identifier |
| name | Quote title/description |
| company_id | Associated company |
| contact_id | Associated contact |
| opportunity_id | Linked opportunity |
| items | Array of line items |
| total | Calculated total amount |
| status | Quote status |

## Common Workflows

### Create a Quote from Scratch

1. Find company: `GET /companies?search=customer`
2. Find contact: `GET /contacts?company_id=12345`
3. Search products: `GET /products?search=firewall`
4. Create quote with products: `POST /quotes`

### Quote for an Existing Opportunity

1. Find opportunity: `GET /opportunities?search=deal name`
2. Use company_id and contact_id from opportunity
3. Search products for line items
4. Create quote linked to opportunity

### Review Past Quotes

1. Search quotes by company: `GET /quotes?company_id=12345`
2. Get specific quote details: `GET /quotes/{id}`
3. Review line items and pricing
