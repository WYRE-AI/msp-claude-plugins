---
description: Search for companies in Salesbuildr
argument-hint: "[search]"
arguments: [search]
---

# Search Salesbuildr Companies

## Arguments

- `search` (optional) — Search term for company name

## Prerequisites
- Salesbuildr API key configured

## Steps
1. Build search request with provided filters
2. Call Salesbuildr API: `GET /companies?search=$search`
3. Display results in table format

## Examples

### Search by name
```
/search-companies search="Acme Corp"
```

### List all companies
```
/search-companies
```

## Error Handling
| Error | Resolution |
|-------|------------|
| 401 Unauthorized | Check SALESBUILDR_API_KEY configuration |
| No results | Try broader search terms |
