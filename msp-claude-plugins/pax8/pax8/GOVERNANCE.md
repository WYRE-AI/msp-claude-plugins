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
- The org's Pax8 credential is stored once at the gateway, so replacing
  it is one edit rather than a change on every technician's machine.
  There is no rotate action, though — you re-submit the connect form,
  which overwrites the stored credential in place, and nothing tracks
  its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who pulled that pricing" — the Pax8 portal sees only the partner token.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated in
  your identity provider is refused on their very next request. A user
  only removed from the org keeps an already-issued access token for up to
  an hour, but it reaches only a personal Pax8 connection made with their
  own key — never the org's. See `wyre-gateway/GOVERNANCE.md`.

## Tool permission groups

**This plugin is read-only.** Every tool Pax8's hosted MCP server exposes
is a list or a fetch. There is no create, update, cancel, or delete
anywhere in the surface — so three of Conduit's four access-editor groups
are empty, and that is the whole safety story.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Pax8 state, spend money, or provision anything. | `read` for seven tools, `admin` for the other nine — see below | `pax8-list-companies`, `pax8-list-products`, `pax8-get-product-by-uuid`, `pax8-lookup-product`, `pax8-list-subscriptions`, `pax8-list-orders`, `pax8-list-invoices`, `pax8-get-company-by-uuid`, `pax8-get-product-pricing-by-uuid`, `pax8-get-subscription-by-uuid`, `pax8-get-usage-summary`, `pax8-get-detailed-usage-summary`, `pax8-get-order-by-uuid`, `pax8-get-invoice-by-uuid`, `pax8-list-quotes`, `pax8-get-quote-by-uuid` |
| **Write** | *Empty.* | — | — |
| **Delete** | *Empty.* | — | — |
| **Admin** | *Empty.* No passthrough, dispatcher, or credential-reading tool. | — | — |

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

### What Conduit actually classifies

`VENDOR_TOOL_CONFIG` carries **seven** entries for `pax8`, all `read`:
`pax8-list-companies`, `pax8-list-products`, `pax8-get-product-by-uuid`,
`pax8-lookup-product`, `pax8-list-subscriptions`, `pax8-list-orders`, and
`pax8-list-invoices`. (`pax8-lookup-product` is classified but was missing
from the table above until now.)

The other nine — six `-by-uuid` fetches, both usage summaries, and
`pax8-list-quotes` — are unclassified. Conduit is fail-closed per tool,
not per vendor: the enforcement gate coerces an unclassified tool to the
highest tier, `const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`). **So on a read-only connector,
over half the read surface today requires tier `admin`.** The list tools
work at `read`; the moment an agent drills from a list into a single
record, it needs `admin`.

That is worth fixing rather than working around, because classifying them
is a privilege *reduction* — it moves them down from `admin` to `read`.
Until then, a granular per-tool `customTools` allowlist is the only way to
give an analysis agent the detail fetches without also handing it `admin`
on the vendor.

### There is no write surface to grant, and no delete row to misread

Because the Write and Delete groups are empty, the trap that catches
readers of other governance documents does not apply here: there is nothing
for a `write` grant to admit. State it anyway, because it is the general
rule and this connector is the exception, not the pattern. Conduit's
enforcement tiers are only `read`, `write` and `admin` (plus `none`,
meaning deny) — `src/access/permission-tier.ts:27`. "Delete" is a
presentation group in the access editor and compiles to and enforces at
tier `write` (`src/access/tier-group-mapping.ts`,
`GROUP_ENFORCEMENT_TIER`), so on any vendor that *does* have delete tools,
granting `write` grants them too.

Conduit compares tiers. It has **no approval step, no per-call
confirmation, and no elicitation.** If a future version of Pax8's hosted
server adds ordering tools, nothing at the gateway will pause them for a
human — only the agent configuration you write will.

### Two write tools exist upstream and are not served

The WYRE-built `pax8-mcp` repository defines `pax8_orders_create` and
`pax8_subscriptions_update`. **Neither is reachable through this plugin.**
Conduit routes `pax8` to Pax8's hosted server at `https://mcp.pax8.com/v1`
(`src/credentials/vendor-config.ts`), and that server's surface is the
hyphenated read-only set above; the underscored tools live in a sidecar
that is not in the request path. They are deliberately dead code, recorded
here so nobody documents them as callable or plans a workflow around them.

## Recommended agent policy

- Read tools: allow. Catalog search, licence inventory, renewal-calendar
  building, usage analysis, and invoice reconciliation are the intended
  autonomous use. Note that a `read` grant currently reaches only the seven
  classified tools; use a granular `customTools` allowlist for the detail
  fetches rather than granting `admin`.
- Write and delete tools: not applicable — none exist. If a future
  version of Pax8's hosted server adds ordering or quantity-change tools,
  they will enforce at `write` like any other mutation, and a single
  `write` grant will admit all of them at once. Treat that as a
  policy question for your agent configuration on the day it happens: a
  seat-count change bills on the next invoice, and a decrease deprovisions
  software out from under a working user.
- Admin tools: none exist, but the fail-closed coercion means an `admin`
  grant is currently the only tier that reaches the whole read surface.
  Prefer the allowlist.

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
