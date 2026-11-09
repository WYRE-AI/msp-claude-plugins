---
name: "ConnectWise PSA Procurement and Inventory"
description: >
  ConnectWise PSA procurement and stock through Conduit: purchase orders and
  their line items, sales orders and their products, procurement product
  items placed on tickets/projects/opportunities, warehouses and bins,
  inventory on hand, and the three-step inventory adjustment
  (cw_create_adjustment, cw_add_adjustment_detail, cw_close_adjustment).
when_to_use: >-
  When reviewing open purchase or sales orders, checking what has been received, reconciling
  stock, or writing off inventory in ConnectWise PSA (Manage). Use when: purchase order, po
  status, sales order, procurement, items not received, inventory on hand, warehouse bin, stock
  adjustment, write off stock, or connectwise procurement.
---

# ConnectWise PSA Procurement and Inventory

## Overview

Procurement in ConnectWise PSA has a sell side (sales orders and the procurement product items placed on tickets, projects, opportunities and sales orders) and a buy side (purchase orders to distributors such as Ingram or TD SYNNEX). Received stock lands in warehouse bins. Through Conduit the reads are all `read` tier; creating an adjustment is `write`; **posting** it, which actually moves stock, is `admin`.

## Anti-triggers

- **Catalog SKU definitions** (what a product is, its default price and cost) — use `connectwise-psa-product-catalog`.
- **Quoting** — quotes live in ConnectWise CPQ or a quoting tool, not in PSA procurement.
- **Agreement billing** — agreement additions and recaps are read with `cw_get_agreement_additions`, `cw_search_agreement_recaps` and `cw_get_agreement_recap`; see the `/check-agreement` command.

## MCP Tools

| Tool | Tier | Purpose |
|------|------|---------|
| `cw_search_purchase_orders` / `cw_get_purchase_order` | read | Buy-side POs (`conditions` such as `closedFlag = false`, `vendorCompany/name = 'Ingram'`) |
| `cw_get_purchase_order_items` | read | PO lines: unit and extended cost, quantity received, receipt status (`purchaseOrderId`) |
| `cw_search_sales_orders` / `cw_get_sales_order` | read | Sell-side sales orders |
| `cw_get_sales_order_products` | read | Products on a sales order |
| `cw_search_procurement_products` / `cw_get_procurement_product` | read | Catalog items placed on a ticket, project, sales order or opportunity, with their own price, cost and margin |
| `cw_list_warehouses` / `cw_list_warehouse_bins` | read | Where stock lives |
| `cw_get_inventory_on_hand` | read | Every catalog item with non-zero stock, one row per bin (negative balances included). Pass `warehouseId` — scanning every bin is slow |
| `cw_list_adjustment_types` / `cw_get_adjustment` | read | Adjustment types and existing adjustments |
| `cw_create_adjustment` | write | Adjustment header (`identifier`, `typeId`, `reason`); moves no stock |
| `cw_add_adjustment_detail` | write | One signed line (`quantityAdjusted` negative removes stock) per item and bin |
| `cw_close_adjustment` | admin | **Posts** the adjustment: applies every line to on-hand. Irreversible except by a counter-adjustment |

All search tools take ConnectWise `conditions` syntax, `orderBy`, `page` and `pageSize` (max 1000). Date literals go in square brackets in UTC: `poDate > [2026-01-01T00:00:00Z]`.

## Workflows

### Open purchase orders and what is still outstanding

1. `cw_search_purchase_orders` with `conditions: "closedFlag = false"`, ordered by `poDate desc`.
2. For each PO, `cw_get_purchase_order_items` and compare quantity ordered with quantity received.
3. Report per vendor: open POs, lines not yet received, and their extended cost. Old open lines are usually either back-ordered or received without being marked.

### What has been sold but not ordered

1. `cw_search_procurement_products` for items on open tickets or projects (`conditions` on the parent and a not-yet-purchased state).
2. Cross-check against open POs. Items with no PO line are the procurement backlog.

### Stock reconciliation and write-off

1. `cw_list_warehouses`, then `cw_get_inventory_on_hand` with `warehouseId` (and `catalogItemId` to narrow).
2. Compare with the physical count the user supplies. Negative balances are the usual sign of a missed receipt.
3. Draft the adjustment and show it: header (`identifier`, `typeId` from `cw_list_adjustment_types`, `reason`) and every line (item, warehouse, bin, signed quantity).
4. After approval: `cw_create_adjustment`, then `cw_add_adjustment_detail` per line. Leave `unitCost` unset for a write-off so ConnectWise applies average cost.
5. `cw_close_adjustment` only after a second, explicit approval. It is the step that moves stock, and it is `admin` tier.

## Gotchas

- **Creating is not posting.** An adjustment with lines but no close changes nothing; a closed one cannot be edited.
- **Signed quantities.** To zero a bin holding 7, send `-7`, not `0`.
- **Serialised items** need their serial numbers on the adjustment line (`serialNumbers`).
- **Procurement products are not catalog items.** A procurement product is a placed instance with its own price and cost; edit the catalog definition in `connectwise-psa-product-catalog`.
