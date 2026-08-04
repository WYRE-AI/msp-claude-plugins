---
name: "Kaseya Quote Manager Purchasing"
description: >
  Kaseya Quote Manager procurement data: purchase orders with their lines and
  costs, the suppliers they are placed with, and product-supplier records
  mapping catalog products to supplier SKUs and pricing. Read-only tool
  surface.
when_to_use: >-
  When viewing or analyzing purchase orders, suppliers, or product-supplier pricing in Kaseya
  Quote Manager. Use when: kaseya quote manager purchasing, kqm purchase order, kqm supplier,
  quote manager procurement, kqm product supplier, or kqm purchasing.
---

# Kaseya Quote Manager — Purchasing

## Overview

The procurement domain covers what an MSP buys to fulfill quotes and sales
orders: **purchase orders** (with lines and costs), the **suppliers** they
are placed with, and **product-supplier** records that map catalog products
to supplier SKUs and pricing.

All access here is **read-only**.

## Anti-triggers

- **What the customer was quoted or charged** — this is the buy side; the sell
  side is `kaseya-quote-manager-quotes`.
- **Supplier bills as accounting entries** — a Quote Manager purchase order is
  not an ACCPAY bill and never posts to a GL; use `xero-invoices` or
  `quickbooks-online-expenses`.
- **Sell price and catalog descriptions for quoting** — use
  `salesbuildr-products`.

## Tools

| Tool | Purpose |
|------|---------|
| `kqm_purchase_order_list` | List purchase orders |
| `kqm_purchase_order_get` | Retrieve a single purchase order |
| `kqm_purchase_order_line_list` | List PO line items |
| `kqm_purchase_order_line_get` | Retrieve a single PO line |
| `kqm_purchase_order_cost_list` | List costs against purchase orders |
| `kqm_purchase_order_cost_get` | Retrieve a single PO cost |
| `kqm_supplier_list` | List suppliers/distributors |
| `kqm_supplier_get` | Retrieve a single supplier |
| `kqm_product_supplier_list` | List product-supplier mappings (supplier SKU + cost) |
| `kqm_product_supplier_get` | Retrieve a single product-supplier mapping |

## Common Workflows

### Review a purchase order

1. Find the PO: `kqm_purchase_order_list`
2. Get the PO: `kqm_purchase_order_get`
3. List its lines: `kqm_purchase_order_line_list`
4. Review costs: `kqm_purchase_order_cost_list`

### Compare supplier pricing for a product

1. List product-supplier records: `kqm_product_supplier_list`
2. Resolve supplier details: `kqm_supplier_get`
3. Compare cost across suppliers for the same product

## Notes

- Paginate with `pageSize=100`; use `modifiedAfter` for incremental pulls.
- Procurement data pairs naturally with the catalog domain (`kqm_product_*`)
  and the quotes domain for margin analysis.
