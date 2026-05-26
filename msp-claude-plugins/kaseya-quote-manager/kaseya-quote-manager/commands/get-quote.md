---
name: get-quote
description: Get a Kaseya Quote Manager quote with its sections and line items
arguments:
  - name: id
    description: Quote ID
    required: true
---

# Get Kaseya Quote Manager Quote

## Prerequisites
- Kaseya Quote Manager API key configured (read-only)

## Steps
1. Retrieve the quote: `kqm_quote_get` with `id=$id`
2. List its sections: `kqm_quote_section_list` for the quote
3. For each section, list lines: `kqm_quote_line_list`
4. Display the quote with sections, line items, quantities, and pricing

## Examples

### Get quote by ID
```
/get-quote id=12345
```

## Error Handling
| Error | Resolution |
|-------|------------|
| 404 Not Found | Verify the quote ID exists |
| 401 Unauthorized | Verify the API key |
