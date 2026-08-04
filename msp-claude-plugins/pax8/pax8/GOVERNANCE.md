# Pax8 plugin — governance and safety model

Unofficial. Community-built plugin for the Pax8 marketplace. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Pax8 through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the Pax8 partner account
the operator is authorised for.

Pax8 is unusual in this marketplace: the gateway proxies to **Pax8's own
first-party hosted MCP server** (`https://mcp.pax8.com/v1`) rather than to
a WYRE-built container. The tool surface below is Pax8's, not ours.

- No Pax8 MCP token is stored on the technician's machine, in this repo,
  or in the model's context. The token lives at the gateway.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who pulled that pricing" — the Pax8 portal sees only the partner token.
- Revoking gateway access revokes Pax8 access with it, immediately.

## Tool permission tiers

**This plugin is read-only.** Every tool Pax8's hosted MCP server exposes
is a list or a fetch. There is no create, update, cancel, or delete
anywhere in the surface.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Pax8 state, spend money, or provision anything. | `pax8-list-companies`, `pax8-get-company-by-uuid`, `pax8-list-products`, `pax8-get-product-by-uuid`, `pax8-get-product-pricing-by-uuid`, `pax8-list-subscriptions`, `pax8-get-subscription-by-uuid`, `pax8-get-usage-summary`, `pax8-get-detailed-usage-summary`, `pax8-list-orders`, `pax8-get-order-by-uuid`, `pax8-list-invoices`, `pax8-get-invoice-by-uuid`, `pax8-list-quotes`, `pax8-get-quote-by-uuid` |
| **Write** | *Empty.* | — |
| **Destructive** | *Empty.* | — |

That is the single most useful thing an MSP owner can know about this
connector, so it is worth stating plainly: **an agent using this plugin
cannot buy a licence, change a seat count, or cancel a subscription.**
Every one of those actions costs or refunds real money on the next
invoice, and every one of them still requires a human in the Pax8 portal.

The bundled `/create-order` command reflects this. It resolves the
company, validates the product, quantity bounds, and billing term, prices
the order, and presents a summary — then hands off to the portal for the
actual purchase. The `license-optimizer` and `renewal-calendar` subagents
are analysis-only for the same reason.

## Recommended agent policy

- Read tools: allow. Catalog search, licence inventory, renewal-calendar
  building, usage analysis, and invoice reconciliation are the intended
  autonomous use.
- Write and destructive tools: not applicable — none exist. If a future
  version of Pax8's hosted server adds ordering or quantity-change tools,
  treat them as **destructive on arrival**, not write: a seat-count change
  bills on the next invoice and a decrease deprovisions software out from
  under a working user.

## What it cannot reach

- Only the Pax8 partner account mapped to the operator's gateway identity,
  and only the client companies inside it.
- No filesystem, no shell, no other vendor's data.
- **No provisioning path into the vendor product.** Pax8 sells Microsoft
  365, Azure, and third-party SaaS, but this connector never touches those
  tenants — it reports what was purchased, not what was configured.
- No partner-portal administration: no user management, no payment
  methods, no billing-profile changes.
- No live event stream. Every tool is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `pax8-list-invoices`, `pax8-get-invoice-by-uuid`,
  `pax8-get-product-pricing-by-uuid`, and `pax8-list-quotes` return
  commercial data: partner buy price, margin, and outstanding balances.
  This is the MSP's own cost structure, not the client's — do not let an
  agent surface `partnerBuyPrice` into a client-facing document.
- `pax8-list-companies` and `pax8-get-company-by-uuid` return client
  organisation records and contact details (names, email addresses,
  billing addresses).
- `pax8-get-detailed-usage-summary` returns per-client consumption, which
  for Azure is a fine-grained picture of what a client is running.

## Known sharp edges

- **Tool names are hyphenated here, underscored almost everywhere else.**
  Pax8's hosted server uses `pax8-list-subscriptions`; every WYRE-built
  connector uses `vendor_domain_action`. An agent that pattern-matches
  from a sibling plugin will call a tool that does not exist.
- **Pagination is 0-based.** `page=0` is the first page, `size` maxes at
  200. An agent that assumes 1-based paging silently skips the first page
  of results and will under-report licence counts.
- **Marketplace subscription counts are not tenant assignment counts.** A
  company can hold 50 purchased seats with 32 assigned in Microsoft 365.
  Reconciling those is a real MSP task, but it is a cross-tool comparison,
  not something Pax8 data answers alone.
- **Rate limit is 1000 calls/minute** and a full cross-client licence
  sweep can approach it. Treat a 429-truncated sweep as incomplete rather
  than as a complete inventory.
