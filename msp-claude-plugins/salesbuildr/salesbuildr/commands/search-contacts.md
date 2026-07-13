---
description: Search for contacts in Salesbuildr, optionally filtered by company
argument-hint: "[search] [company]"
arguments: [search, company]
---

# Search Salesbuildr Contacts

## Arguments

- `search` (optional) — Search term for contact name or email
- `company` (optional) — Company name or ID to filter contacts

## Prerequisites
- Salesbuildr API key configured

## Steps
1. If company name provided, search companies first to resolve ID
2. Call Salesbuildr API: `GET /contacts?search=$search&company_id=$company`
3. Display results with company association

## Examples

### Search by name
```
/search-contacts search="John"
```

### Search within a company
```
/search-contacts company="Acme Corp"
```

## Error Handling
| Error | Resolution |
|-------|------------|
| Company not found | Verify company name spelling |
| No contacts found | Try broader search or check company |
