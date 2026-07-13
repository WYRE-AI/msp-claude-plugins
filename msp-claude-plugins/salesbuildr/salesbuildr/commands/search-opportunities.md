---
description: Search for opportunities in the Salesbuildr sales pipeline
argument-hint: "[search] [company] [status]"
arguments: [search, company, status]
---

# Search Salesbuildr Opportunities

## Arguments

- `search` (optional) — Search term for opportunity name
- `company` (optional) — Company name or ID to filter
- `status` (optional) — Filter by opportunity status

## Prerequisites
- Salesbuildr API key configured

## Steps
1. If company name provided, resolve to ID
2. Call Salesbuildr API: `GET /opportunities?search=$search&company_id=$company&status=$status`
3. Display pipeline with values and stages

## Examples

### Search by name
```
/search-opportunities search="infrastructure"
```

### Filter by company
```
/search-opportunities company="Acme Corp"
```

## Error Handling
| Error | Resolution |
|-------|------------|
| No results | Check filters or broaden search |
