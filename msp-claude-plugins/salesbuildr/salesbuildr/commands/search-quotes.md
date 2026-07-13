---
description: Search for quotes in Salesbuildr
argument-hint: "[search] [company] [opportunity]"
arguments: [search, company, opportunity]
---

# Search Salesbuildr Quotes

## Arguments

- `search` (optional) — Search term for quote name/number
- `company` (optional) — Company name or ID to filter
- `opportunity` (optional) — Opportunity ID to filter

## Prerequisites
- Salesbuildr API key configured

## Steps
1. Resolve company name to ID if needed
2. Call Salesbuildr API: `GET /quotes?search=$search&company_id=$company&opportunity_id=$opportunity`
3. Display quotes with totals and status

## Examples

### Search by company
```
/search-quotes company="Acme Corp"
```

## Error Handling
| Error | Resolution |
|-------|------------|
| No results | Check filters |
