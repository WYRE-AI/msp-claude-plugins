---
name: "ScalePad Quoter"
description: >
  Quoter through ScalePad: building and publishing quotes, managing the catalog (items,
  item groups, tiers, options, manufacturers), quote contacts, suppliers and datafeeds,
  and the OAuth helpers for the standalone api.quoter.com path.
when_to_use: >-
  When creating or publishing quotes, managing the Quoter catalog (items, groups, tiers,
  options), contacts, suppliers, or Quoter OAuth. Use when: quoter, scalepad quote,
  create quote, quoter catalog, quoter items, publish quote.
---

# ScalePad Quoter

## Overview

Quoter is ScalePad's quoting product. There are two access paths to
the same product:

- **Primary (recommended)** — the ScalePad-hosted API at
  `api.scalepad.com/quoter`, authenticated with the same ScalePad API
  key. This is the default for every tool and includes the superset
  surface (fetch quote, publish quote, quote sections, section line
  items).
- **Legacy standalone** — `api.quoter.com` with OAuth2
  client-credentials. Only needed when `X-Quoter-Client-Id` /
  `X-Quoter-Client-Secret` are configured; the MCP server exchanges
  and refreshes the Bearer token for you.

Discover this domain's tools with `scalepad_navigate` (domain `quoter`).

## API Tools (~60; the high-value subset)

### Quotes

| Tool | Purpose |
|------|---------|
| `scalepad_quoter_quotes_list` / `scalepad_quoter_quotes_get` | List/fetch quotes |
| `scalepad_quoter_quotes_create` | Create a draft quote |
| `scalepad_quoter_quotes_create_section` | Add a section to a quote |
| `scalepad_quoter_quotes_create_section_line_item` | Add a line item to a section |
| `scalepad_quoter_quotes_update_line_item` | Update a quote line item |
| `scalepad_quoter_line_items_create` | Add a line item to a quote |
| `scalepad_quoter_quotes_publish` | Publish the quote (customer-visible) |
| `scalepad_quoter_quote_templates_list` | List quote templates |

### Catalog

| Tool | Purpose |
|------|---------|
| `scalepad_quoter_items_list` / `scalepad_quoter_items_create` / `scalepad_quoter_items_get` / `scalepad_quoter_items_update` / `scalepad_quoter_items_delete` | Catalog items |
| `scalepad_quoter_item_groups_*` | Item groups (list/create/get/update/delete) |
| `scalepad_quoter_item_group_assignments_*` | Item-to-group assignments |
| `scalepad_quoter_item_tiers_*` | Pricing tiers |
| `scalepad_quoter_item_options_*` / `scalepad_quoter_item_option_values_*` | Configurable item options and values |
| `scalepad_quoter_categories_*` | Categories |
| `scalepad_quoter_manufacturers_*` | Manufacturers |

### Contacts, Suppliers & Auth

| Tool | Purpose |
|------|---------|
| `scalepad_quoter_contacts_list` / `scalepad_quoter_contacts_create` / `scalepad_quoter_contacts_get` / `scalepad_quoter_contacts_update` | Quote recipients |
| `scalepad_quoter_suppliers_*` | Suppliers (list/create/get/update/delete) |
| `scalepad_quoter_datafeeds_list_suppliers` / `scalepad_quoter_datafeeds_list_supplier_items` | Supplier datafeeds (distributor pricing) |
| `scalepad_quoter_auth_authorize` / `scalepad_quoter_auth_refresh` | Standalone-path OAuth token mint/refresh (1 h TTL) — not needed on the default hosted path |

## Common Workflows

1. **Build and publish a quote** —
   `scalepad_quoter_quote_templates_list` (optional template),
   `scalepad_quoter_contacts_list` (or `_create`) for the recipient,
   `scalepad_quoter_quotes_create`, add structure with
   `scalepad_quoter_quotes_create_section` and
   `scalepad_quoter_quotes_create_section_line_item`, review with
   `scalepad_quoter_quotes_get`, then
   `scalepad_quoter_quotes_publish`.
2. **Catalog maintenance** — `scalepad_quoter_items_list`, update
   pricing with `scalepad_quoter_items_update` and
   `scalepad_quoter_item_tiers_update`.
3. **Supplier price check** — `scalepad_quoter_datafeeds_list_suppliers`
   then `scalepad_quoter_datafeeds_list_supplier_items` for current
   distributor pricing before quoting hardware.

## Error Handling

402 on the hosted path means the ScalePad account has no Quoter
subscription. 401 on the standalone path means the Quoter OAuth
client credentials are missing/invalid — they are optional and only
required for api.quoter.com. Catalog deletes are irreversible.

## Best Practices

- Default to the ScalePad-hosted path; only configure Quoter OAuth
  credentials when the tenant explicitly uses standalone
  api.quoter.com.
- Always `scalepad_quoter_quotes_get` to review totals before
  `scalepad_quoter_quotes_publish` — publishing makes the quote
  customer-visible.
- Reuse existing contacts (`scalepad_quoter_contacts_list`) before
  creating duplicates.

## Related Skills

- [lifecycle-manager](../lifecycle-manager/SKILL.md) - initiatives that feed quotes
- [api-patterns](../api-patterns/SKILL.md) - auth translation details
