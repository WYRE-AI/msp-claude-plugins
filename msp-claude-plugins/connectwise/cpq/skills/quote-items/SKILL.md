---
name: "ConnectWise CPQ Quote Items"
description: >
  ConnectWise CPQ line items and the tabs that hold them: searching items by quote
  or tab, the tab requirement on every create, the pricing and margin fields,
  bundle and optional-line flags, recurring-revenue and PSA mapping fields, JSON
  Patch updates, and why there is no product catalog to search.
when_to_use: >-
  When adding, pricing, repricing, inspecting, or removing line items on a ConnectWise
  CPQ quote, or when working with quote tabs. Use when: cpq line item, cpq quote item,
  cpq quote tab, cpq add product to quote, cpq pricing, cpq margin, cpq recurring revenue,
  quosal line item, or cpq bundle.
---

# ConnectWise CPQ Quote Items

## Overview

Line items are the priced rows of a CPQ quote — hardware, licences, labour, recurring
services. Each item belongs to exactly one **tab** (a section of the quote), and each tab
belongs to one quote. Items carry both sell and cost figures, so margin is computed per
line, per tab and per quote.

## Anti-triggers

- **Looking up a product, SKU, list price or manufacturer** — CPQ has no catalog to
  search (see below). The priced SKU master list is ConnectWise PSA's; use
  `connectwise-manage-product-catalog` and carry the values onto the line yourself.
- **Quote-level fields — status, totals, expiry, versions, quote customers, payment
  terms** — those hang off the quote header, not its lines; use `connectwise-cpq-quotes`.
- **Line items on another vendor's quote** — Kaseya Quote Manager quote lines and
  SalesBuildr quote products share this vocabulary exactly; use
  `kaseya-quote-manager-quotes` or `salesbuildr-quotes`.

## Key Concepts

### Items live on tabs, and tabs are read-only

`idQuote` says which quote; `idQuoteTabs` says which section of it. The API has no
tab create/update/delete — tabs come from the template a quote was copied from, or are
added in the CPQ web app.

`cpq_create_quote_item` resolves the tab for you: with `idQuoteTabs` omitted it reads the
quote's tabs, uses the only one if there is exactly one, and otherwise asks which to use
(erroring with the tab list if it cannot ask). A quote with no tabs cannot take items at
all — that has to be fixed in CPQ.

### There is no product catalog

CPQ's real-time price sourcing (Etilize, distributor feeds) is not exposed over the REST
API. You cannot search products, look up a distributor price, or add "a product" by SKU
lookup. Items are created by writing their fields directly, or by copying a quote or
template that already contains them. `etilizeProductId` on an existing line records where
a line originally came from; it is not a searchable handle.

Practical consequence: the reliable way to build a priced quote is to copy a template
that already carries the right lines and adjust quantities and prices, rather than
composing lines from scratch.

### Pricing and margin fields

| Field | Notes |
|---|---|
| `basePrice` | Unit sell price |
| `cost` | Unit cost |
| `quantity` | Line quantity |
| `extendedPrice` | `basePrice x quantity`, as computed by CPQ |
| `extendedCost` | `cost x quantity` |
| `discount` | Line discount |
| `grossMargin` | Line margin |
| `costModifier` | Markup/margin rule applied to derive price from cost |
| `isProtectedPrice` | Price locked against repricing |

### Line flags and structure

| Field | Notes |
|---|---|
| `isOptional` | Customer-selectable line; excluded from the base total |
| `isBundleHeader` / `isBundleComponent` | Bundle parent and its children |
| `isPhaseItem` | Belongs to a project phase |
| `isPrinted` | Appears on the printed proposal |
| `idRecurringRevenue` | Links the line to a recurring-revenue period (list them with `cpq_list_recurring_revenues`) |

### PSA mapping

`cwClass`, `cwAgreement` and `crmReference` control how a line lands in ConnectWise PSA
when a won quote is ported. Porting itself happens in the integration engine, not here,
but wrong values on these fields surface as billing problems later.

Identity fields worth setting on a new line: `mfgPartNumber` (manufacturer part number)
and `description`.

## Common Workflows

### List the lines on a quote

`cpq_search_quote_items` with `conditions: idQuote = "<quote-guid>"`, plus an
`includeFields` such as `id,description,mfgPartNumber,quantity,basePrice,extendedPrice,cost`.
Filter to one section with `idQuoteTabs = "<tab-guid>"` instead. Page until a page returns
fewer rows than `pageSize`; searches cover latest quote versions only unless you pass
`showAllVersions: true`.

### Add a line

1. If the quote may have several sections, `cpq_search_quote_tabs` with
   `conditions: idQuote = "<quote-guid>"` to pick the tab.
2. `cpq_create_quote_item` with `idQuote`, optionally `idQuoteTabs`, and an `item` object:

```
item = { "mfgPartNumber": "ABC-123",
         "description": "Managed endpoint - per device",
         "quantity": 50, "basePrice": 12.00, "cost": 7.20 }
```

### Reprice or adjust a line

`cpq_update_quote_item` with the item GUID and either `fields` (partial object) or
`patch` (raw RFC 6902 ops) — one or the other, not both.

```
cpq_update_quote_item  id=<item-guid>  fields={ "quantity": 60, "basePrice": 11.50 }
```

Patch the unit fields (`quantity`, `basePrice`, `cost`) and let CPQ recompute the
extended figures; writing `extendedPrice` directly fights the calculation engine.

### Remove a line

`cpq_delete_quote_item` with the item GUID. It confirms first, echoing the line's
description or part number, and the delete is permanent. Setting `isPrinted: false` or
`isOptional: true` is the non-destructive way to take a line off a proposal.

## Gotchas

- **A missing `idQuoteTabs` is the most common create failure.** Single-tab quotes work
  without it; multi-tab quotes need one, and it must belong to the same quote.
- **Deletes are per line, so bundles need care.** `cpq_delete_quote_item` removes exactly
  the item you name. Before deleting an `isBundleHeader` line, list the quote's items and
  deal with its `isBundleComponent` children deliberately rather than assuming they follow.
- **`isOptional` lines are excluded from the quote total** but still returned by searches,
  so a line-item sum will not match `quoteTotal` unless you account for them.
- **Item searches span quotes.** `cpq_search_quote_items` with no `conditions` walks every
  quote in the tenant; always scope by `idQuote` or `idQuoteTabs`.
- **QuoteItemView has ~224 properties.** Send `includeFields` or the response is mostly
  empty custom-field slots.

## Related Skills

- [ConnectWise CPQ Quotes](../quotes/SKILL.md) — quote lifecycle, versions, customers, terms
- [ConnectWise CPQ API Patterns](../api-patterns/SKILL.md) — auth, conditions syntax, paging, JSON Patch
