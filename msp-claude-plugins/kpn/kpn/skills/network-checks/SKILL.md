---
name: "KPN Network Checks"
description: >
  Address- and line-level checks against KPN's Grexx interface: technology,
  speeds and product availability at a Dutch address
  (kpn_grexx_zipcode_check, kpn_grexx_prequalification), infrastructure and
  planned work (kpn_grexx_carrier_info), and live line diagnostics on a
  connectivity order (kpn_grexx_radius_check, kpn_grexx_ras_check,
  kpn_grexx_start_line_diagnose).
when_to_use: >-
  When a Dutch customer site on KPN has connectivity problems, or when scoping
  an internet upgrade or site survey in the Netherlands. Use when: kpn storing,
  kpn outage, kpn down, internet down netherlands, glasvezel, fibre
  availability, kpn speed, line out of sync, flapping line, or postcode check.
---

# KPN Network Checks

## Overview

Two kinds of check: **address checks** (what can this postcode get, and is there planned work) and **line checks** on an existing KPN connectivity order (is the line up, is it flapping). They cover the Netherlands only.

## Addresses

The address tools take a Dutch postcode (`1012JS`), a house number and an optional extension (toevoeging, e.g. `A`, `bis`). Get the extension right: flats at the same number can be on different lines.

- `kpn_grexx_zipcode_check` — technologies and speeds per supplier. Requires `portfolio` (`Business`, `SMB`, `Teleworker` or `All`) and `isRoomNumberKnown`.
- `kpn_grexx_prequalification` — availability of one `productTypeCode` (e.g. `FTTHSMB`, `VDSLZakelijk`, `FIBER`) per supplier. Requires `hasBroadband` and `hasPhone`; when `hasBroadband` is true, pass `serviceId` or `referencePhoneNumber`. Supplier tokens differ from the zipcode check (`Kpn`, not `KPN`).
- `kpn_grexx_carrier_info` — infrastructure at the address for `xDSL`, `FttH`, `WeasFiber` or `All`: connection points, line details and **planned work**.

## Outage triage for a KPN site

1. Resolve the line: `kpn_grexx_customer_data` for the customer card, then `kpn_grexx_order_summary` with `productGroup: "Connectivity"` (or `"Internet"`) for the order ID.
2. `kpn_grexx_ras_check` on the order — is a PPP session up, and with which IP?
3. `kpn_grexx_radius_check` — logins over the last 7 days. Many logins mean a flapping line; an empty result means the line has been up the whole time.
4. `kpn_grexx_carrier_info` for the site address — look for planned work.
5. If the line is down and there is no planned work, and it is an xDSL order that is out of sync, propose `kpn_grexx_start_line_diagnose` with the matching `symptomCode`. It is the one write tool: confirm with the user first, and do not start a second one while one is running.
6. If the line is up, continue with the customer's own network (router/firewall in the RMM).

There is no dedicated "disturbance" (storing) lookup through Conduit. Planned work comes from `kpn_grexx_carrier_info`; unplanned outages show up as a line that is down or flapping.

## Upgrade conversations

Use `kpn_grexx_zipcode_check` (`portfolio: "Business"` or `"SMB"`) for the speed options, then `kpn_grexx_prequalification` for the specific product type you want to quote. Neither tool diagnoses an outage.
