---
description: Get a ConnectWise CPQ quote with its tabs, line items, customers, and terms
argument-hint: "<id_or_number> [version]"
arguments: [id_or_number, version]
---

# Get ConnectWise CPQ Quote

## Arguments

- `id_or_number` (required) — Quote GUID `id`, or the integer `quoteNumber`
- `version` (optional) — With a quote number: `latest`, or a version integer. Omit to list versions.

## Prerequisites
- ConnectWise CPQ credentials configured

## Steps

1. **Resolve to a GUID.**
   - Given a GUID, use it directly.
   - Given a quote number, call `cpq_get_quote_versions` with `quoteNumber` and
     `version` (`latest` unless a version was named), then take `id` from the result.
     With no `version`, list the versions and ask which one.

2. **Fetch the quote** with `cpq_get_quote` using the GUID. This returns the full
   QuoteView and renders the quote card.

3. **Fetch the sections** with `cpq_search_quote_tabs`,
   `conditions=idQuote = "<guid>"`.

4. **Fetch the line items** with `cpq_search_quote_items`,
   `conditions=idQuote = "<guid>"`,
   `includeFields=id,idQuoteTabs,description,mfgPartNumber,quantity,basePrice,extendedPrice,cost,isOptional`,
   `pageSize=100`, paging until short.

5. **Fetch customers and terms** with `cpq_list_quote_customers` and
   `cpq_list_quote_terms` for the quote GUID.

6. **Display** the header (number/version, name, account, status flags, dates), then
   line items grouped by tab, then totals (`subtotal`, `tax`, `quoteTotal`,
   `grossMargin`), then the customer contacts and any payment terms. Mark optional
   lines — they are excluded from `quoteTotal`.

## Examples

### By quote number, latest version
```
/get-quote id_or_number=1042 version=latest
```

### By GUID
```
/get-quote id_or_number=3f1c8d2e-1b44-4a90-9f6a-1d0f2e5b7c11
```

## Error Handling

| Error | Resolution |
|-------|------------|
| 404 on the GUID | The GUID addresses one version — it may have been superseded or deleted; look it up by quote number |
| No line items returned | The quote may genuinely be empty, or the condition was built with an unquoted GUID — `idQuote` needs double quotes |
| 401 | Verify credentials and that the key owner is an API user |

## Related Commands

- `/search-quotes` — Find quotes by account, status, or date
- `/create-quote` — Create a quote by copying a template
