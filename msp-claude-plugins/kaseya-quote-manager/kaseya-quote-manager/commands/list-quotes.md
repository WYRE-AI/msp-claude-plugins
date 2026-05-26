---
name: list-quotes
description: List Kaseya Quote Manager quotes, optionally scoped to a recent window
arguments:
  - name: modifiedAfter
    description: ISO timestamp - only return quotes changed after this time
    required: false
  - name: pageSize
    description: Results per page (max 100)
    required: false
---

# List Kaseya Quote Manager Quotes

## Prerequisites
- Kaseya Quote Manager API key configured (read-only)

## Steps
1. Call `kqm_quote_list` with `page=1`, `pageSize=$pageSize` (default 100), and `modifiedAfter=$modifiedAfter` if provided
2. Page through results until a partial page is returned
3. Display quotes with id, customer, status, and total

## Examples

### List quotes changed this month
```
/list-quotes modifiedAfter=2026-05-01T00:00:00Z
```

## Error Handling
| Error | Resolution |
|-------|------------|
| 429 Rate Limited | Wait and retry with backoff (60 req/min, 20k/day) |
| 401 Unauthorized | Verify the API key |
