---
description: Update an opportunity's status, value, or other details
argument-hint: "<id> [stage] [value] [close-date]"
arguments: [id, stage, value, close-date]
---

# Update Salesbuildr Opportunity

## Arguments

- `id` (required) — Opportunity ID
- `stage` (optional) — New pipeline stage
- `value` (optional) — Updated deal value
- `close-date` (optional) — Updated expected close date (YYYY-MM-DD)

## Prerequisites
- Salesbuildr API key configured
- Opportunity must exist

## Steps
1. Verify opportunity exists: `GET /opportunities/$id`
2. Build update payload with changed fields
3. Call Salesbuildr API: `PATCH /opportunities/$id`
4. Display updated opportunity

## Examples

### Update stage
```
/update-opportunity id=12345 stage="negotiation"
```

### Update value and close date
```
/update-opportunity id=12345 value=30000 close-date="2026-04-15"
```

## Error Handling
| Error | Resolution |
|-------|------------|
| 404 Not Found | Verify opportunity ID |
| No changes | Provide at least one field to update |
