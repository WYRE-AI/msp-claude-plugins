---
name: "KPN Mobile Fleet"
description: >
  KPN business mobile through the Grexx (IRMA) interface: finding a
  customer's mobile orders, reading number/SIM/subscription/bundle data
  (kpn_grexx_mobile_orders), the active SIM or eSIM (kpn_grexx_get_sim),
  blocks and limits (kpn_grexx_mobile_settings), current usage
  (kpn_grexx_mobile_usage) and available number portings. Read-only: SIM
  blocks, replacements and order approvals happen in the Grexx portal.
when_to_use: >-
  When looking up a customer's KPN business-mobile lines: who has which number
  or SIM, what a line is using, which blocks are set, or which numbers can be
  ported. Use when: kpn zakelijk mobiel, kpn mobile usage, kpn sim, iccid,
  esim, lost phone, kpn bundle, number porting, mobile subscribers.
---

# KPN Mobile Fleet

## Overview

Through Conduit, KPN business mobile is **read-only**. The Grexx tools return order, SIM, setting and usage data for a customer's mobile subscriptions. There is no tool to block, unblock or replace a SIM, read a PUK, authorise or cancel an order, or pull invoices; those are done in the Grexx portal.

## Finding a line

Every mobile tool is keyed on an IRMA **order ID** (one per mobile subscription).

1. `kpn_grexx_customer_data` — find the customer card (by `name`, `chamberOfCommerceNumber`, `zipCode`, ...).
2. `kpn_grexx_order_summary` with `customerId` and `productGroup: "Mobile"` lists the mobile orders. To find one number, pass it as `attribute`.
3. `kpn_grexx_mobile_orders` with up to 50 `orderIds` returns number, SIM, subscription and bundles in one call.

## Per-line reads

| Tool | Returns | Notes |
|---|---|---|
| `kpn_grexx_get_sim` | Active SIM or eSIM: ICCID and SIM type | PUK and eSIM activation/confirmation codes are masked |
| `kpn_grexx_mobile_settings` | Blocks and limits on the number | Available from 5 minutes after activation |
| `kpn_grexx_mobile_usage` | Current data, voice and SMS usage | Available from 5 minutes after activation |
| `kpn_grexx_available_portings` | Portings available for every mobile subscription of a customer (`customerId`) or every number of a HIP group / KPN EEN switchboard (`hipGroupOrderId`) | |

## Workflows

### Fleet overview for a customer

`kpn_grexx_order_summary` (`productGroup: "Mobile"`, `orderState: "Active"`), paging with `skip` and `take` (up to 2500 per page) until every order is collected. Then `kpn_grexx_mobile_orders` with those order IDs in batches of 50. Report number, user label, subscription and bundles.

### Usage review

`kpn_grexx_mobile_usage` per order. It returns current usage only. Flag lines near their bundle limits. Treat a line with no usage as something to investigate, not as proof it is unused: check its history in the Grexx portal and ask the customer before suggesting a cancellation (which the customer requests through the portal).

### Lost or stolen phone

Find the order for the number (`attribute` on `kpn_grexx_order_summary`), confirm it with the user, and read `kpn_grexx_get_sim` and `kpn_grexx_mobile_settings` so they have the ICCID and current blocks. The block itself must be placed in the Grexx portal; say so plainly rather than implying it was done.

## Gotchas

- **Order IDs, not phone numbers.** Search by number through `attribute` on the order summary, then work with the order ID.
- **Freshly activated lines** return nothing from settings and usage for the first few minutes. Retry after the 5-minute window; an empty result after that is a real failure to report, not a new line.
- **Masked codes are masked on purpose.** Do not try to recover a PUK through another route; the user gets it from the portal.
