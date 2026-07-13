---
description: Get detailed information for a specific Salesbuildr quote
argument-hint: "<id>"
arguments: [id]
---

# Get Salesbuildr Quote Details

## Arguments

- `id` (required) — Quote ID

## Prerequisites
- Salesbuildr API key configured

## Steps
1. Call Salesbuildr API: `GET /quotes/$id`
2. Display full quote details with line items
3. Show total, status, and associated company/contact

## Examples

### Get quote by ID
```
/get-quote id=12345
```

## Error Handling
| Error | Resolution |
|-------|------------|
| 404 Not Found | Verify quote ID exists |
