---
description: Check a Dutch KPN site for line problems and planned work, and report what connectivity is available there
argument-hint: "<postcode> <house number> [extension] [order id]"
arguments: [postcode, house_number, extension, order_id]
---

# Check Outage

Answer "is KPN down at this site?" for one Dutch address, using the line's own state where the KPN order is known and planned work at the address as context.

## Prerequisites

- KPN connected in Conduit with Grexx credentials (Grexx portal → API Gegevens)
- Tools: `kpn_grexx_carrier_info`, `kpn_grexx_zipcode_check`, and for a known line `kpn_grexx_order_summary`, `kpn_grexx_ras_check`, `kpn_grexx_radius_check`

## Steps

1. **Find the line (if possible)**

   If `order_id` was not given, look it up: `kpn_grexx_customer_data` (by `zipCode` or customer name; it returns 20 cards by default, so page with `skip`/`take` up to 100 until `TotalNumberOfRecords` is covered and check every matching card), then `kpn_grexx_order_summary` with the `customerId` and `productGroup: "Connectivity"`, and again with `productGroup: "Internet"`. Pick the order whose installation address matches the requested address, including the house number and extension. If you cannot establish that match, ask the user to confirm the order ID instead of checking a line at another site. Only if neither product group returns an order, skip to step 3. A failed lookup or check is not evidence of an outage: say which call failed (see the api-patterns skill for connection and order errors).

2. **Check the line**

   - `kpn_grexx_ras_check` — is a PPP session up, and which IP does it have?
   - `kpn_grexx_radius_check` — logins in the last 7 days. Many logins mean a flapping line. An empty result means the line has been up for over 7 days **or not at all**, so read it together with the RAS check before concluding anything.

3. **Check for planned work**

   `kpn_grexx_carrier_info` with `productType: "All"` and the address. Report any planned work at the connection point.

4. **Show what the address is on**

   `kpn_grexx_zipcode_check` (`portfolio: "Business"`, `isRoomNumberKnown: false` unless known) for the technologies and speeds as context.

5. **Report**

   - Line down or flapping with planned work that is **in progress now** and covers this line: report the work window; on-site troubleshooting can wait. Planned work that is in the future, already over, or on another connection point does not explain a current outage: report it, and keep investigating.
   - Line down, no planned work, xDSL out of sync: suggest `kpn_grexx_start_line_diagnose` (write; confirm the order and symptom code first).
   - Line up: point to the customer's own equipment (router, firewall, cabling) next.

## Error handling

- Test data or unknown customers: the connection may be on the Grexx test environment (URL fields blank). See the api-patterns skill.
- Invalid postcode: Grexx expects a Dutch postcode such as `1234AB`.
