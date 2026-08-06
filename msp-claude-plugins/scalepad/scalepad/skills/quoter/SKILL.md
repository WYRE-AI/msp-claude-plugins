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

## Anti-triggers

Most MSPs run more than one quoting system, and "build a quote" does
not name which. This skill only speaks to Quoter:

- **A ConnectWise quote** — use the `connectwise/cpq` plugin
  (`connectwise-cpq-quotes`).
- **An Autotask quote or opportunity** — use the `autotask` plugin
  (`autotask-quotes`); Kaseya's standalone quoting product is
  `kaseya-quote-manager`.
- **Sending a document for signature** — publishing a quote here is not
  an e-signature flow; use `pandadoc`.
- **Invoicing and payment collection** — a published quote is not an
  invoice; use `quickbooks`, `xero`, `stripe`, or the `finance-pack`.
- **Distributor purchasing** — buying what you quoted happens at the
  distributor; use `pax8` or `sherweb`.

## API Tools (61 total — the high-value subset below; full list in [references/tool-inventory.md](../../references/tool-inventory.md))

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

### Contacts & Suppliers

| Tool | Purpose |
|------|---------|
| `scalepad_quoter_contacts_list` / `scalepad_quoter_contacts_create` / `scalepad_quoter_contacts_get` / `scalepad_quoter_contacts_update` | Quote recipients |
| `scalepad_quoter_suppliers_*` | Suppliers (list/create/get/update/delete) |
| `scalepad_quoter_datafeeds_list_suppliers` / `scalepad_quoter_datafeeds_list_supplier_items` | Supplier datafeeds (distributor pricing) |

### The two auth tools mint credentials — do not call them casually

`scalepad_quoter_auth_authorize` and `scalepad_quoter_auth_refresh` are
the only tools in this plugin that talk to a host other than ScalePad.
They target **`api.quoter.com`** directly:

| Tool | What it actually does |
|------|----------------------|
| `scalepad_quoter_auth_authorize` | `POST /v1/auth/oauth/authorize` — exchanges OAuth client credentials for an `access_token` (1 h TTL) **and a `refresh_token`**. Its `client_id` / `secret` arguments are optional and, when supplied, **override the configured credentials** — so it will mint tokens for a Quoter tenant unrelated to this connection. |
| `scalepad_quoter_auth_refresh` | `POST /v1/auth/refresh` — exchanges a `refresh_token` for a fresh pair, extending possession without re-presenting the client secret. |

Two things follow:

- **The server does not flag these as mutating.** They carry no
  `destructiveHint`, because from the server's point of view they read
  a token rather than write a record. The gateway pins them to `admin`
  by hand for exactly this reason — do not infer "safe" from the
  missing annotation.
- **Their responses are bearer credentials in your context.** Do not
  echo them, log them, or paste them into a summary. The refresh token
  has no useful expiry.

You almost certainly do not need them: the ScalePad-hosted path is the
default and covers the full surface. Reach for these only when the
tenant explicitly runs standalone Quoter and `X-Quoter-Client-Id` /
`X-Quoter-Client-Secret` are configured — and even then the server
exchanges and refreshes the token for you automatically on the calls
that need it.

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
