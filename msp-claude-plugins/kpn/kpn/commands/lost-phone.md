---
description: Find the KPN business-mobile contract for a lost or stolen phone and block its SIM after confirmation
argument-hint: "<mobile number> [ticket reference]"
arguments: [mobile_number, reference]
---

# Lost Phone

Stop a lost or stolen company phone from being used, fast, without
blocking the wrong line.

## Prerequisites

- KPN connected in the Conduit gateway with Mobile Services Management access
- Tools available: `kpn_mobile_contracts_list`, `kpn_mobile_contracts_get_operations`,
  `kpn_mobile_sim_block`, `kpn_mobile_orders_get`

## Steps

1. **Find the contract**

   Call `kpn_mobile_contracts_list` with `mobileNumber`. Expect exactly one
   match. If there are none or several, stop and show what was found rather
   than guessing.

2. **Confirm it is the right line**

   Show the user the contract's number, user name and device, and ask them
   to confirm this is the lost phone.

3. **Check the block is allowed**

   Call `kpn_mobile_contracts_get_operations`. If blocking is not allowed,
   report why (for example an open order on the contract) and stop.

4. **Block the SIM**

   Call `kpn_mobile_sim_block` with the contract id and the ticket number as
   `referenceNumber`. The tool asks for confirmation before it runs.

5. **Report the order**

   Give the order id and status. If it is `UNAUTHORIZED`, say that someone
   with approval rights must authorize it (`kpn_mobile_orders_authorize`)
   before the SIM is blocked.

## Follow-ups to suggest

- Wipe or lock the device in the MDM.
- Order a replacement SIM or eSIM once the user has a new device
  (`kpn_mobile_sim_replace`).
- If the phone turns up, `kpn_mobile_sim_unblock` restores service.

## Error handling

- On any write error, check `kpn_mobile_orders_list` for an order that went
  through before retrying; failed writes are not retried automatically.
