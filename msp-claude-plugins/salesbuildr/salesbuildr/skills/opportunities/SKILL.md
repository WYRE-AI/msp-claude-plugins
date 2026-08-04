---
name: "SalesBuildr Opportunities"
description: >
  Salesbuildr opportunities: pipeline search, opportunity creation, stage
  updates, and deal values, plus how opportunities link companies and
  contacts to potential revenue.
when_to_use: >-
  When managing the Salesbuildr sales pipeline. Use when: salesbuildr
  opportunity, salesbuildr opportunities, salesbuildr pipeline, salesbuildr
  deal, sales pipeline, create opportunity salesbuildr, or opportunity
  stage.
---

# Salesbuildr Opportunities

## Overview

Opportunities represent potential deals in the sales pipeline. Each opportunity is linked to a company and optionally a contact, with a value, stage, and expected close date.

## Anti-triggers

- **The priced breakdown behind the opportunity** — an opportunity carries a
  single value, not line items; use `salesbuildr-quotes`.
- **HubSpot deals** — the same pipeline concept in a different CRM; use
  `hubspot-deals`.

## Search Opportunities

```
GET /opportunities?search=<term>&company_id=<id>&status=<status>&from=0&size=25
```

Parameters:
- `search` - Search by opportunity name
- `company_id` - Filter by company
- `status` - Filter by status
- `from` - Pagination offset
- `size` - Results per page

## Get Opportunity by ID

```
GET /opportunities/{id}
```

## Create Opportunity

```
POST /opportunities

{
  "name": "Q1 Infrastructure Refresh",
  "company_id": 12345,
  "contact_id": 67890,
  "value": 25000,
  "stage": "proposal",
  "expected_close_date": "2026-03-31"
}
```

Required fields: `name`, `company_id`

## Update Opportunity

```
PATCH /opportunities/{id}

{
  "stage": "negotiation",
  "value": 28000
}
```

## Common Workflows

### Create Pipeline Entry

1. Find company: `GET /companies?search=customer name`
2. Find contact: `GET /contacts?company_id=12345`
3. Create opportunity: `POST /opportunities`

### Update Deal Stage

1. Find opportunity: `GET /opportunities?search=deal name`
2. Update stage: `PATCH /opportunities/{id}`
