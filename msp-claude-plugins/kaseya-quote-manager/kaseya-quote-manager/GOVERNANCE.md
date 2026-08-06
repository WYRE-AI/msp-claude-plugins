# Kaseya Quote Manager plugin — governance and safety model

Unofficial. Community-built plugin for the Kaseya Quote Manager (formerly
Datto Commerce) API. Not affiliated with, endorsed by, or sponsored by the
vendor.

## What it connects as

This plugin does not hold credentials. It reaches Kaseya Quote Manager through
the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the operator is
authorised for.

- No Quote Manager API key is stored on the technician's machine, in this repo,
  or in the model's context. The gateway translates operator identity into the
  upstream `apiKey` header.
- The org's Kaseya Quote Manager credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's machine.
  There is no rotate action, though — you re-submit the connect form, which
  overwrites the stored credential in place, and nothing tracks its age or
  prompts you.

- Every call carries operator identity, so the gateway audit log answers "who
  pulled this cost data" — Quote Manager sees a single API key and cannot.
- Removing someone from the organisation clears their per-vendor grants and
  revokes their gateway refresh tokens at once; a user deactivated in your
  identity provider is refused on their very next request. A user only removed
  from the org keeps an already-issued access token for up to an hour, but it
  reaches only a personal Quote Manager connection made with their own key —
  never the org's. See `wyre-gateway/GOVERNANCE.md`.

## Tool permission groups

**This plugin is read-only.** Every tool is a `_list` or a `_get`. Three of
Conduit's four access-editor groups are empty, and that is the whole
state-change safety story: no agent using this plugin can create, edit, send,
cancel, or delete anything in Quote Manager.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Quote Manager state. | `read` for `kqm_customer_list` only; `admin` for every other tool — see below | Sales: `kqm_quote_list`, `kqm_quote_get`, `kqm_quote_section_list`, `kqm_quote_section_get`, `kqm_quote_line_list`, `kqm_quote_line_get`, `kqm_sales_order_list`, `kqm_sales_order_get`, `kqm_sales_order_line_list`, `kqm_sales_order_line_get`, `kqm_sales_order_payment_list`, `kqm_sales_order_payment_get`. Procurement: `kqm_purchase_order_list`, `kqm_purchase_order_get`, `kqm_purchase_order_line_list`, `kqm_purchase_order_line_get`, `kqm_purchase_order_cost_list`, `kqm_purchase_order_cost_get`, `kqm_supplier_list`, `kqm_supplier_get`, `kqm_product_supplier_list`, `kqm_product_supplier_get`. Catalog: `kqm_product_list`, `kqm_product_get`, `kqm_product_image_list`, `kqm_category_list`, `kqm_category_get`, `kqm_brand_list`, `kqm_brand_get`. CRM: `kqm_customer_list`, `kqm_customer_get`, `kqm_customer_address_list`, `kqm_customer_address_get`, `kqm_contact_list`, `kqm_contact_get`. Org: `kqm_employee_list`, `kqm_employee_get`, `kqm_warehouse_list`, `kqm_warehouse_get`. Diagnostics: `kqm_status` |
| **Write** | *Empty.* | — | — |
| **Delete** | *Empty.* | — | — |
| **Admin** | *Empty.* No passthrough, dispatcher, or credential-reading tool. | — | — |

The absence of write tools is a deliberate design choice, not an oversight. An
agent cannot issue a quote, accept an order, place a purchase order with a
distributor, or record a payment through this plugin.

### What Conduit actually classifies

`VENDOR_TOOL_CONFIG` carries **two** entries for `kaseya-quote-manager`:
`kqm_customer_list` and `kqm_navigate`, both `read`. Every other tool in the
table above is unclassified.

Conduit is fail-closed per tool, not per vendor. The enforcement gate coerces
an unclassified tool to the highest tier —
`const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`). **So a read-only connector's read
surface currently requires tier `admin`, one tool excepted.** That is the
opposite of what the group table above implies an owner is buying, and it is
the most likely source of a support ticket about this plugin: an agent
granted `read` can list customers and nothing else.

`kqm_navigate` is classified `read` and is still unreachable. Conduit refuses
every `*_navigate` and `*_back` tool before any tier check, for every caller
including org owners and personal connections
(`src/proxy/tool-call-enforcement.ts:123-129`,
`src/proxy/discovery-tools.ts:41-50`); `conduit__my_access` replaces them.
`kqm_status` is deliberately kept. So of the two classified tools, only one
is actually callable.

Classifying the rest is a privilege *reduction* — it moves them down from
`admin` to `read`. Until that lands, a granular per-tool `customTools`
allowlist is the only way to give an analysis agent this surface without also
granting it `admin` on the vendor, and `admin` is a materially different
thing to hold: it is the tier that would admit any write or passthrough tool
this connector ever gains.

### There is no write surface to grant, and no delete row to misread

Nothing here for a `write` grant to admit. State the general rule anyway,
because this connector is the exception and not the pattern: Conduit's
enforcement tiers are only `read`, `write` and `admin` (plus `none`, meaning
deny) — `src/access/permission-tier.ts:27`. The access editor's "Delete"
group is presentation only and compiles to and enforces at tier `write`
(`src/access/tier-group-mapping.ts`, `GROUP_ENFORCEMENT_TIER`), so on any
vendor that does have delete tools, granting `write` grants every one of
them. Only a granular per-tool `customTools` allowlist separates them.

Conduit compares tiers. It has **no approval step, no per-call confirmation,
and no elicitation.** There is nothing to approve here today, but do not
carry the assumption to a connector where there is.

## Recommended agent policy

Because there is no write surface, **read tools are safe to grant to
autonomous and scheduled agents** — margin analysis, procurement reporting,
and quote pipeline review are the intended unattended uses. Grant them
through a granular `customTools` allowlist naming the tools the agent
actually needs; a bare `read` grant reaches one tool, and `admin` reaches
everything including anything added later.

The remaining control is not about state change, it is about disclosure. The
data this plugin returns is among the most commercially sensitive an MSP holds
(see below), so scope agent access by *what an operator may see*, not by what
it may break. Conduit's tier model is a poor instrument for that: it ranks
tools by whether they mutate state, and every tool here is a read. **The
mechanical tier and the real risk are orthogonal on this connector** — which
is exactly why the `customTools` allowlist, not the tier, is the control to
reach for.

## What it cannot reach

- Only the Quote Manager tenant the operator's gateway identity maps to.
- No filesystem, no shell, no other vendor's data.
- No other Kaseya product. BMS, VSA, and Datto RMM share the vendor name but
  are separate APIs with separate credentials; nothing here reaches a ticket,
  an agent, or a managed device.
- No write path of any kind — no create, update, delete, send, or approve.
- No live event stream. Every tool is point-in-time; `modifiedAfter` is the
  only incremental mechanism.

## Data handling

Responses pass through the gateway into model context for the session and are
not persisted by this plugin. This plugin returns an unusually high
concentration of sensitive data for a read-only surface:

- **Margin.** `kqm_purchase_order_cost_list` / `_get` and
  `kqm_product_supplier_list` / `_get` return distributor buy price and supplier
  SKUs. Set against `kqm_quote_line_*` sell price, they expose your gross margin
  per line, per customer. This is the data an MSP would least like to leak to a
  customer or a competitor.
- **Payment records.** `kqm_sales_order_payment_list` / `_get` return payment
  amounts, methods, and dates against customer orders.
- **Customer PII.** `kqm_customer_*`, `kqm_customer_address_*`, and
  `kqm_contact_*` return client names, addresses, and contact details.
- **Staff records.** `kqm_employee_list` / `_get` returns internal staff
  identity.
- **Supplier terms.** `kqm_supplier_*` returns distributor relationships and
  the commercial terms behind them.

Restrict the cost, product-supplier, and payment tools specifically if an agent
ever renders output where a customer might see it.

## Known sharp edges

- **Read-only is not risk-free.** The classification above means the operational
  risk here is disclosure, not damage. An agent that summarises a quote for a
  customer and helpfully includes the cost line has caused a commercial
  incident without changing a single record.
- **Quote acceptance is invisible here.** A quote becoming a sales order
  happens outside this API. An agent polling `kqm_quote_list` will not see the
  transition until it queries `kqm_sales_order_list` as well.
- **Payments recorded here are not accounting entries.**
  `kqm_sales_order_payment_*` is what Quote Manager captured against an order.
  Reconcile against `xero-payments` or `quickbooks-online-payments`; do not
  treat either as authoritative for the other.
- **`modifiedAfter` covers the parent, not the children.** A quote whose line
  items changed may not surface if the quote header's own timestamp did not
  move. Incremental syncs that only walk quotes will drift.
