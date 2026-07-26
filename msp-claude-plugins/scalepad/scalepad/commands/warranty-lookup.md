---
description: Look up warranty and lifecycle status for a client's hardware in ScalePad
argument-hint: "[client] [serial]"
arguments: [client, serial]
---

# ScalePad Warranty Lookup

Look up warranty coverage and lifecycle status for a client's hardware, flagging expired or expiring coverage and available ScalePad warranty pricing.

## Prerequisites

- ScalePad MCP server connected with a valid `X_SCALEPAD_API_KEY`
- Optional discovery: `scalepad_navigate` with `domain: "lifecycle-manager"` lists the relevant tools
- Tools used: `scalepad_lm_clients_lookup`, `scalepad_lm_hardware_list`, `scalepad_lm_hardware_lifecycles_list`, `scalepad_lm_hardware_overview_get`, `scalepad_lm_warranty_pricing_list`

## Steps

1. **Resolve the client**

   Call `scalepad_lm_clients_lookup` with `search` set to the client argument. Confirm with the user if multiple matches.

2. **List the hardware**

   Call `scalepad_lm_hardware_list` with `client_id`. If `serial` was provided, call `scalepad_lm_hardware_lifecycles_list` with `filter[serial_number]` instead to jump straight to the asset.

3. **Pull warranty/lifecycle detail**

   For the asset(s) of interest, call `scalepad_lm_hardware_overview_get` with the `hardware_key` for purchase date, age, warranty expiry, and replacement guidance.

4. **Check ScalePad warranty pricing**

   For assets with expired or expiring OEM coverage, call `scalepad_lm_warranty_pricing_list` with the `client_id` to show available extended-warranty pricing.

5. **Report**

   Output a table: asset name, serial, age, warranty status (active / expiring < 90 days / expired), and — where applicable — the ScalePad warranty option and price.

## Examples

### All hardware for a client
```
/warranty-lookup "Acme Dental"
```

### One asset by serial
```
/warranty-lookup "Acme Dental" "C02XL0GWJGH5"
```

## Related Commands

- `/asset-lifecycle-report` - full aging/refresh report for a client
