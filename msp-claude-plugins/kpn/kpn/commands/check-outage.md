---
description: Check a Dutch address for KPN outages and report what connectivity is available there
argument-hint: "<postcode> <house number> [extension]"
arguments: [postcode, house_number, extension]
---

# Check Outage

Answer "is KPN down at this site?" for one Dutch address, with the
available access technology as context.

## Prerequisites

- KPN connected in the Conduit gateway with a project that includes
  Disturbance Check and Internet Speed Check
- Tools available: `kpn_disturbances_check`, `kpn_availability_check`

## Steps

1. **Check for disturbances**

   Call `kpn_disturbances_check` with the postcode, house number and
   extension. An empty result means KPN knows of no disturbance at the
   address; it is not an error.

2. **Check what the address is on**

   Call `kpn_availability_check` for the same address to show which access
   technology (fibre/copper) and speeds apply there.

3. **Report**

   - If there is a disturbance: its type (broadband, fixed, mobile), start
     and expected end, and that on-site troubleshooting can wait.
   - If there is none: say so, and point to the customer's own equipment
     (router, firewall, cabling) as the next place to look.
   - Include the access technology and maximum speeds as context.

## Error handling

- 401/403 after a successful connection test: the product is not added to
  the KPN project (see the api-patterns skill).
- Invalid postcode: KPN expects a Dutch postcode such as `1234AB`.
