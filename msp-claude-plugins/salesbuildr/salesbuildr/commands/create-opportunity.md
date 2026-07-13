---
description: Create a new opportunity in Salesbuildr
argument-hint: "<name> <company> [contact] [value] [stage] [close-date]"
arguments: [name, company, contact, value, stage, close-date]
---

# Create Salesbuildr Opportunity

## Arguments

- `name` (required) — Opportunity name/title
- `company` (required) — Company name or ID
- `contact` (optional) — Contact name or ID
- `value` (optional) — Deal value in dollars
- `stage` (optional) — Pipeline stage
- `close-date` (optional) — Expected close date (YYYY-MM-DD)

## Prerequisites
- Salesbuildr API key configured
- Company must exist

## Steps
1. Resolve company and contact names to IDs
2. Validate required fields
3. Call Salesbuildr API: `POST /opportunities`
4. Display created opportunity confirmation

## Examples

### Create opportunity
```
/create-opportunity name="Q1 Refresh" company="Acme Corp" value=25000 stage="proposal"
```

## Error Handling
| Error | Resolution |
|-------|------------|
| Company not found | Verify company exists |
| Invalid stage | Check valid stage values |
