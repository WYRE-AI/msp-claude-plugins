---
name: "ConnectWise CPQ Quotes"
description: >
  The ConnectWise CPQ quote lifecycle over the real tool surface: searching
  quotes, the GUID-vs-quoteNumber dual addressing, versions, creating quotes by
  copying a template (the API's only create path), patching quote fields, the
  per-quote customer records and payment/financing terms, tabs as the section
  structure, and the deletes that cascade.
when_to_use: >-
  When finding, building, updating, versioning, or deleting a ConnectWise CPQ quote,
  or working with the customers and payment terms attached to one. Use when: cpq quote,
  connectwise cpq quote, create quote from template, cpq quote version, cpq quote status,
  cpq quote customer, cpq quote terms, cpq quote tabs, quosal quote, or connectwise sell quote.
---

# ConnectWise CPQ Quotes

## Overview

A CPQ quote is the proposal an MSP sends a client: a header (account, status, dates,
totals), one or more **tabs** that section the proposal, **line items** on those tabs,
**customer records** synced from the attached CRM/PSA, and optional **payment/financing
terms**. Quotes are versioned — a revision creates a new version under the same quote
number rather than mutating the old one.

Everything an MSP does after the quote is built — publishing to Order Porter, e-signature,
porting a won quote into the PSA as a sales order — happens in the CPQ web app. The API
covers building and reading quotes, not delivering them.

## Key Concepts

### Two ways to address a quote

| Addressing | Used by | Notes |
|---|---|---|
| GUID `id` (string) | `cpq_get_quote`, `cpq_update_quote`, `cpq_delete_quote`, `cpq_create_quote_from_template` | Unique to one *version* of one quote |
| `quoteNumber` (int) + `quoteVersion` (int) | `cpq_get_quote_versions`, `cpq_delete_quote_version` | The human-facing number; identifies the quote across its versions |

Searches return both, so pull the `id` out of a search result before doing anything that
needs a GUID. A quote number alone is not enough to patch or delete a quote.

### Versions

`cpq_get_quote_versions` takes a `quoteNumber` and behaves three ways:

- omit `version` → list every version
- `version: "latest"` → the current version
- `version: 3` → that specific version

Searches return **latest versions only** unless you pass `showAllVersions: true`. If a
search seems to be missing a quote a colleague is looking at, they are probably on a
superseded version.

### Quote status and flags

Status lives across several fields rather than one enum. The ones that decide what a
quote means:

| Field | Meaning |
|---|---|
| `quoteStatus` | Tenant-configurable status text (values vary per install — read them from live data, do not assume) |
| `isSent` | Delivered to the customer |
| `isAccepted` | Customer accepted |
| `isLost` | Marked lost |
| `isArchive` | Archived; excluded from most working views |
| `requiresApproval` / `approvalStatus` / `approvedByUser` | Internal approval workflow |
| `expirationDate` / `expectedCloseDate` | Proposal validity and forecast date |
| `orderPorter*` | Order Porter publishing state (passcode, template, signed date, upload state) |

See [references/fields.md](references/fields.md) for the fuller QuoteView field reference.

### Sub-resources

| Sub-resource | Tools | Notes |
|---|---|---|
| Tabs | `cpq_search_quote_tabs` | Read-only over the API. Sections of the proposal; every line item belongs to one. |
| Line items | see the [quote-items skill](../quote-items/SKILL.md) | Full CRUD |
| Customers | `cpq_list_quote_customers`, `cpq_update_quote_customer`, `cpq_delete_quote_customer` | Exist **only** in the context of a quote — there is no global customer directory to search |
| Terms | `cpq_list_quote_terms`, `cpq_create_quote_term`, `cpq_update_quote_term`, `cpq_delete_quote_term` | Payment/financing options: `periods`, `interestRate`, `downPayment`, `periodPaymentAmount`, `isSelected`, leasing fields |

## Common Workflows

### Find a quote

1. `cpq_search_quotes` with `conditions` and a tight `includeFields`, e.g.
   `conditions: accountName contains "Acme" AND isArchive = False`,
   `includeFields: id,name,quoteNumber,quoteVersion,quoteStatus,quoteTotal,createDate`
2. Page with `page`/`pageSize` until a page returns fewer rows than `pageSize`.
3. `cpq_get_quote` with the GUID for the full record.

Called with no `conditions` the search asks for a created-since date, falling back to the
last 90 days and noting that in the result. Give it a condition when you know one — a
90-day window silently hides older quotes.

### Create a quote

There is no create-from-scratch endpoint. Every new quote is a **copy** of a template or
of an existing quote, then patched into shape.

1. `cpq_list_templates` to see what is available (templates are themselves quotes).
2. `cpq_create_quote_from_template` with `templateId`, or with `templateName` to resolve
   by name — an ambiguous name prompts a selection, and with no way to prompt you get an
   error listing the candidates. Pass `newName` to rename the copy in the same call.
3. The copy inherits the template's tabs, line items and terms. Patch the header with
   `cpq_update_quote` (account, dates, custom fields).
4. Add or adjust lines with the quote-items tools.

To revise an existing deal, copy the existing quote instead of a template —
`cpq_create_quote_from_template` accepts any quote GUID as its source.

### Update a quote

`cpq_update_quote` takes either `fields` (a partial object, turned into `replace` ops) or
`patch` (raw RFC 6902 ops) — never both.

```
cpq_update_quote  id=<guid>  fields={ "name": "Acme — Managed Services FY27",
                                      "expectedCloseDate": "2026-09-30T00:00:00Z" }
```

This tool is flagged high-impact for a reason: patching `quoteStatus`, `isArchive`,
`isLost`, `expirationDate`, `orderPorter*` or the approval fields changes workflow state
and, for the Order Porter fields, what the customer sees. Confirm intent before touching
those; renaming or setting a forecast date is routine.

### Work the customers and terms on a quote

1. `cpq_list_quote_customers` with the quote GUID — the records are already there,
   synced from the CRM/PSA. Correct them with `cpq_update_quote_customer`.
2. `cpq_list_quote_terms` for financing options; `cpq_create_quote_term` to add one.
   `isSelected` marks the term the customer is being offered.

### Delete

`cpq_delete_quote` removes the quote **and every tab, line item and term on it**, and
asks for confirmation first. `cpq_delete_quote_version` removes a single version by
`quoteNumber` + `quoteVersion`. Neither is recoverable — archive (`isArchive: True`) is
almost always the right move for a dead deal instead.

## Gotchas

- **`count` in a tool result is the page length, not a total.** CPQ returns bare arrays
  with no collection count. Keep paging until a short page arrives.
- **Searching by quote number needs a number, not a string:** `quoteNumber = 1042`, not
  `quoteNumber = "1042"`. Dates go in square brackets and are date-only:
  `createDate >= [2026-07-01]`.
- **Every line item needs a tab.** A freshly copied quote has the template's tabs; a
  quote with no tabs cannot take line items, and tabs cannot be created over the API.
- **Deleting a quote version is not the same as deleting a quote.** The version delete
  targets `quoteNumber` + `quoteVersion`; the quote delete targets a GUID and takes
  everything.
- **`crmOpportunityId` is a pointer, not a join.** There are no opportunity endpoints in
  CPQ — resolve it against the PSA/CRM (the `connectwise-psa` plugin) if you need the
  opportunity itself.
- **QuoteView is huge and mostly empty.** 204 properties, 60+ of them unused `zCustom*`
  slots. Always send `includeFields` on searches or the results bury the useful fields.

## Related Skills

- [ConnectWise CPQ API Patterns](../api-patterns/SKILL.md) — auth, conditions syntax, paging, JSON Patch
- [ConnectWise CPQ Quote Items](../quote-items/SKILL.md) — line items, tabs, pricing and margin fields
