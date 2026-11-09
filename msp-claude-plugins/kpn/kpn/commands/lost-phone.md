---
description: Find the KPN business-mobile line and SIM for a lost or stolen phone so it can be blocked in the Grexx portal
argument-hint: "<mobile number> [customer name] [ticket reference]"
arguments: [mobile_number, customer, reference]
---

# Lost Phone

Identify exactly which KPN line and SIM belong to a lost or stolen company phone, so the block is placed on the right line. Through Conduit the KPN tools are read-only: the block itself is done in the Grexx portal.

## Prerequisites

- KPN connected in Conduit with Grexx credentials
- Tools: `kpn_grexx_customer_data`, `kpn_grexx_order_summary`, `kpn_grexx_mobile_orders`, `kpn_grexx_get_sim`, `kpn_grexx_mobile_settings`

## Steps

1. **Find the customer** (if given): `kpn_grexx_customer_data` by name.

2. **Find the order for the number**

   `kpn_grexx_order_summary` with `attribute` set to the mobile number (and `customerId` if known), `productGroup: "Mobile"`. Expect exactly one active order. If there are none or several, stop and show what was found rather than guessing.

3. **Confirm it is the right line**

   `kpn_grexx_mobile_orders` for that order: show the number, user label, subscription and bundles, and ask the user to confirm this is the lost phone.

4. **Collect what the portal needs**

   - `kpn_grexx_get_sim` — ICCID and SIM type (PUK is masked)
   - `kpn_grexx_mobile_settings` — blocks already in place

5. **Hand off**

   Give the user the order ID, number and ICCID, and tell them to place the block in the Grexx portal (quoting the ticket reference). Do not say the SIM has been blocked: no tool here can block it.

## Follow-ups to suggest

- Wipe or lock the device in the MDM.
- Order a replacement SIM or eSIM in the portal once the user has a new device.
- Afterwards, `kpn_grexx_mobile_settings` confirms the block is visible on the line.
