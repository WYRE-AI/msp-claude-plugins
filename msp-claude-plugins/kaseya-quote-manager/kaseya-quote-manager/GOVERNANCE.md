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
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers "who
  pulled this cost data" — Quote Manager sees a single API key and cannot.
- Revoking gateway access revokes Quote Manager access with it, immediately.

## Tool permission tiers

**This plugin is read-only.** Every tool is a `_list` or a `_get`. The write
and destructive tiers are empty, and that is the whole safety story: no agent
using this plugin can create, edit, send, cancel, or delete anything in Quote
Manager.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Quote Manager state. Safe for autonomous agents. | Sales: `kqm_quote_list`, `kqm_quote_get`, `kqm_quote_section_list`, `kqm_quote_section_get`, `kqm_quote_line_list`, `kqm_quote_line_get`, `kqm_sales_order_list`, `kqm_sales_order_get`, `kqm_sales_order_line_list`, `kqm_sales_order_line_get`, `kqm_sales_order_payment_list`, `kqm_sales_order_payment_get`. Procurement: `kqm_purchase_order_list`, `kqm_purchase_order_get`, `kqm_purchase_order_line_list`, `kqm_purchase_order_line_get`, `kqm_purchase_order_cost_list`, `kqm_purchase_order_cost_get`, `kqm_supplier_list`, `kqm_supplier_get`, `kqm_product_supplier_list`, `kqm_product_supplier_get`. Catalog: `kqm_product_list`, `kqm_product_get`, `kqm_product_image_list`, `kqm_category_list`, `kqm_category_get`, `kqm_brand_list`, `kqm_brand_get`. CRM: `kqm_customer_list`, `kqm_customer_get`, `kqm_customer_address_list`, `kqm_customer_address_get`, `kqm_contact_list`, `kqm_contact_get`. Org: `kqm_employee_list`, `kqm_employee_get`, `kqm_warehouse_list`, `kqm_warehouse_get`. Diagnostics: `kqm_status`, `kqm_navigate` |
| **Write** | — | None. |
| **Destructive** | — | None. |

The absence of write tools is a deliberate design choice, not an oversight. An
agent cannot issue a quote, accept an order, place a purchase order with a
distributor, or record a payment through this plugin.

## Recommended agent policy

Because there is no write surface, **read tools can be granted to autonomous
and scheduled agents** — margin analysis, procurement reporting, and quote
pipeline review are the intended unattended uses.

The remaining control is not about state change, it is about disclosure. The
data this plugin returns is among the most commercially sensitive an MSP holds
(see below), so scope agent access by *what an operator may see*, not by what
it may break.

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
