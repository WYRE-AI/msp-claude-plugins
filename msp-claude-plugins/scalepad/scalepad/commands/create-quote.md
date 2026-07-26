---
description: Build and publish a Quoter quote step by step
argument-hint: "[description]"
arguments: [description]
---

# Quoter Quote Creation

Build a Quoter quote from a plain-language description: pick the recipient, add sections and line items from the catalog, review totals, and publish only on explicit confirmation.

## Prerequisites

- ScalePad MCP server connected with a valid `X_SCALEPAD_API_KEY` (the ScalePad-hosted Quoter path is the default; Quoter OAuth credentials are NOT required)
- Optional discovery: `scalepad_navigate` with `domain: "quoter"` lists the relevant tools
- Tools used: `scalepad_quoter_quote_templates_list`, `scalepad_quoter_contacts_list`, `scalepad_quoter_contacts_create`, `scalepad_quoter_items_list`, `scalepad_quoter_quotes_create`, `scalepad_quoter_quotes_create_section`, `scalepad_quoter_quotes_create_section_line_item`, `scalepad_quoter_quotes_get`, `scalepad_quoter_quotes_publish`

## Steps

1. **Pick a template (optional)**

   Call `scalepad_quoter_quote_templates_list` and offer a matching template if one fits the description.

2. **Resolve the recipient**

   Call `scalepad_quoter_contacts_list` and match against the client/contact in the description. If no match, confirm details with the user and call `scalepad_quoter_contacts_create`.

3. **Find catalog items**

   Call `scalepad_quoter_items_list` and match items to the requested products. Ask the user before substituting near-matches.

4. **Create the draft**

   Call `scalepad_quoter_quotes_create` with the contact and quote metadata. Add structure with `scalepad_quoter_quotes_create_section` (e.g. "Hardware", "Services") and populate each with `scalepad_quoter_quotes_create_section_line_item` (item, quantity, price).

5. **Review**

   Call `scalepad_quoter_quotes_get` and show the user the full draft: sections, line items, quantities, totals.

6. **Publish (with confirmation)**

   Only after the user explicitly confirms, call `scalepad_quoter_quotes_publish`. Publishing makes the quote customer-visible — never publish without confirmation.

## Examples

```
/create-quote "workstation refresh for Acme Dental — 12 Dell Latitude 5550, 3-year ProSupport"
```

## Related Commands

- `/asset-lifecycle-report` - find the aging assets that justify the quote
