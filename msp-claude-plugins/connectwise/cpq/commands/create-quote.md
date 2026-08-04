---
description: Create a ConnectWise CPQ quote by copying a template or an existing quote
argument-hint: "<template> [name] [account]"
arguments: [template, name, account]
---

# Create ConnectWise CPQ Quote

CPQ has no create-from-scratch endpoint. A new quote is always a copy of a template or of
an existing quote, then patched into shape.

## Arguments

- `template` (required) — Template GUID, template name, or the GUID of an existing quote to copy
- `name` (optional) — Name for the new quote
- `account` (optional) — Customer account name to set on the copy

## Prerequisites
- ConnectWise CPQ credentials configured
- At least one quote template in the tenant (`/list-templates`)

## Steps

1. **Pick the source.** If `template` is a GUID, use it as `templateId`. Otherwise pass it
   as `templateName` — `cpq_create_quote_from_template` resolves the name, prompting when
   several templates match and erroring with the candidate list when it cannot prompt.
   Run `/list-templates` first if the name is uncertain.

2. **Copy** with `cpq_create_quote_from_template`, passing `templateId` or `templateName`
   plus `newName` when a `name` was given. The copy inherits the source's tabs, line items
   and terms.

3. **Set the header** with `cpq_update_quote` on the new GUID, e.g.
   `fields={ "accountName": "$account", "expectedCloseDate": "..." }`. This tool is
   high-impact — confirm before touching `quoteStatus`, `isArchive`, `isLost` or any
   `orderPorter*` field, which change workflow and customer-facing state.

4. **Adjust the lines** with `cpq_search_quote_items` (`conditions=idQuote = "<new-guid>"`)
   and `cpq_update_quote_item` / `cpq_create_quote_item` / `cpq_delete_quote_item`.

5. **Report** the new quote's `id`, `quoteNumber`, `quoteVersion` and name.

## Examples

### From a named template
```
/create-quote template="Managed Services Agreement" name="Acme — Managed Services FY27" account="Acme Corp"
```

### Revise an existing deal by copying the quote itself
```
/create-quote template=3f1c8d2e-1b44-4a90-9f6a-1d0f2e5b7c11 name="Acme — Renewal FY27"
```

## Notes

- The customer records on the copy come from the source and sync from the CRM/PSA; correct
  them with `cpq_update_quote_customer`. There is no global customer directory to attach from.
- Publishing, e-signature and porting a won quote into the PSA are not API operations —
  finish those in the CPQ web app.

## Error Handling

| Error | Resolution |
|-------|------------|
| "No template matches" | Run `/list-templates`; the error lists available names |
| Multiple templates match | Re-run with the template GUID as `template` |
| Cannot add line items afterwards | The copy has no tabs — tabs cannot be created over the API, so fix the source template in CPQ |
| 401 | Verify credentials and that the key owner is an API user |

## Related Commands

- `/list-templates` — See what can be copied
- `/get-quote` — Inspect the result
- `/search-quotes` — Find quotes to copy
