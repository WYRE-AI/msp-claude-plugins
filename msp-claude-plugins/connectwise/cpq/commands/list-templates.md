---
description: List ConnectWise CPQ quote templates available to copy
argument-hint: "[query]"
arguments: [query]
---

# List ConnectWise CPQ Templates

Templates in CPQ *are* quotes — `cpq_list_templates` returns QuoteView records, and any of
them can be the source for `cpq_create_quote_from_template`.

## Arguments

- `query` (optional) — Filter the returned templates by name, case-insensitively

## Prerequisites
- ConnectWise CPQ credentials configured

## Steps

1. **Fetch** with `cpq_list_templates`. It takes no parameters — no conditions, no paging.
2. **Filter locally** by `query` against `name` if one was given.
3. **Display** each template's `name`, `id`, `quoteTotal` and `modifyDate`, sorted by name.
   The `id` is what `/create-quote` needs.

## Examples

### All templates
```
/list-templates
```

### Find the MSA template
```
/list-templates query="Managed Services"
```

## Notes

- Templates carry their tabs, line items and terms into every copy. A template with no
  tabs produces a quote that cannot take line items.
- If nothing is returned, the tenant has no templates flagged as such — an existing quote
  GUID also works as a copy source.

## Error Handling

| Error | Resolution |
|-------|------------|
| Empty list | No templates configured; copy an existing quote instead, or create a template in the CPQ web app |
| 401 | Verify credentials and that the key owner is an API user |

## Related Commands

- `/create-quote` — Copy a template into a new quote
- `/search-quotes` — Find an existing quote to copy instead
