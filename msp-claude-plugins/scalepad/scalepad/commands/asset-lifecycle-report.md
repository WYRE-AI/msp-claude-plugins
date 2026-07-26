---
description: Build an asset lifecycle/aging report for a client from ScalePad Lifecycle Manager
argument-hint: "[client]"
arguments: [client]
---

# ScalePad Asset Lifecycle Report

Build a hardware aging report for a client: dashboard summary, assets past replacement age, warranty gaps, and which refresh initiatives already cover them.

## Prerequisites

- ScalePad MCP server connected with a valid `X_SCALEPAD_API_KEY`
- Optional discovery: `scalepad_navigate` with `domain: "lifecycle-manager"` lists the relevant tools
- Tools used: `scalepad_lm_clients_lookup`, `scalepad_lm_hardware_dashboard_get`, `scalepad_lm_hardware_list`, `scalepad_lm_hardware_attached_initiatives_lookup`, `scalepad_lm_initiatives_list`, `scalepad_lm_budget_summary_get`

## Steps

1. **Resolve the client**

   Call `scalepad_lm_clients_lookup` with `search` set to the client argument.

2. **Dashboard summary**

   Call `scalepad_lm_hardware_dashboard_get` with `filter[client_id]` for the fleet-level picture (counts by age band, warranty coverage).

3. **Find aging assets**

   Call `scalepad_lm_hardware_list` with `client_id` and `filter[age]` for assets past replacement age; paginate to completion. Note warranty status per asset (`filter[hasscalepadwarranty]` helps segment).

4. **Cross-reference initiatives**

   For each aging asset, call `scalepad_lm_hardware_attached_initiatives_lookup` with its `hardware_key`. Separately call `scalepad_lm_initiatives_list` filtered by `filter[client.id]` to see planned refresh work. Assets with no attached initiative are the uncovered risk.

5. **Budget context**

   Call `scalepad_lm_budget_summary_get` for the client to frame the refresh cost against the existing budget/IT-debt picture.

6. **Report**

   Output: fleet summary, table of aging assets (name, serial, age, warranty, covered-by-initiative yes/no), and a recommended next action list (assets to attach to a new refresh initiative).

## Examples

```
/asset-lifecycle-report "Acme Dental"
```

## Related Commands

- `/warranty-lookup` - drill into a single asset's warranty
- `/create-quote` - quote the refresh in Quoter
