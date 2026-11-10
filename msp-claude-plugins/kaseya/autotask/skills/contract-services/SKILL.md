---
name: "Autotask Contract Services and Recurring Billing"
description: >
  The recurring-billing side of Autotask contracts: service and bundle lines
  (autotask_search_contract_services, autotask_search_contract_service_bundles),
  the billed unit rows behind them (autotask_search_contract_service_units,
  autotask_search_contract_service_bundle_units), the per-contract monthly
  recurring-revenue roll-up (autotask_get_contract_recurring_lines), and
  writing service lines and onboarding contract shells.
when_to_use: >-
  When answering what a customer is billed every month in Autotask, reconciling seat counts
  against contract units, or setting up recurring services on a new contract. Use when: contract
  services, recurring revenue autotask, mrr per client, contract units, seat count billing,
  service bundle, recurring lines, add service to contract, or onboarding contracts.
---

# Autotask Contract Services and Recurring Billing

## Overview

An Autotask recurring-service contract bills through **service lines** (a catalog service at a contract-specific unit price) and **service bundles**, each with **unit rows** that record how many units are active over a date range. MRR per client, seat reconciliation against the RMM, and "why did this invoice change?" are all answered from these tables, not from the contract header.

## Anti-triggers

- **Contract headers, types, SLAs, renewals** — use `autotask-contracts`.
- **The service catalog itself** (what a service is and its default price) — use `autotask-product-catalog`.
- **Invoices and billing items already posted** — use `autotask-billing`.

## MCP Tools

| Tool | Tier | Purpose |
|------|------|---------|
| `autotask_search_contract_services` | read | Service lines on a contract (`contractID`) |
| `autotask_search_contract_service_bundles` | read | Bundle lines on a contract |
| `autotask_search_contract_service_units` | read | Billed unit rows per service line, active on `activeOn` (default today) |
| `autotask_search_contract_service_bundle_units` | read | Billed unit rows per bundle line |
| `autotask_get_contract_recurring_lines` | read | Every service and bundle line with units active on a day, joined to the catalog (name, vendor, billing period) and normalised to a monthly figure |
| `autotask_create_contract_service` | write | Add a service line (`contractID`, `serviceID`, `unitPrice`) |
| `autotask_update_contract_service` | write | Change a service line (`id`, `contractID`) |
| `autotask_create_contracts_bulk` | write | Up to 50 contract shells (headers only) in one call, e.g. one per client location |

## Workflows

### MRR for a client

1. `autotask_search_contracts` with `companyID`, `status: 1` and `pageSize: 500` (the default is 25). If 500 contracts come back, say the list may be incomplete.
2. For each recurring-service contract, `autotask_get_contract_recurring_lines` (`activeOn` today).
3. Sum the monthly figures; report per service and per contract.

### Seat reconciliation

1. `autotask_search_contract_service_units` for the managed-workstation and managed-user lines.
2. Compare units with the device or user counts from the RMM or M365 (for example `datto_list_devices`, `cipp_list_users`).
3. Report under-billing (more devices than units) and over-billing separately. Changing units is a proposal for the account manager, not something to apply automatically.

### Explain a changed invoice

Run `autotask_get_contract_recurring_lines` with `activeOn` set to a day in each billing period and compare the two results line by line.

### Onboard a multi-site customer

1. Draft one contract shell per site and show it.
2. After approval, `autotask_create_contracts_bulk`. Shells are created one at a time, so read the per-item result: a failure part-way does not roll back the earlier ones. Retry only the failed items, never the whole batch, or the shells that succeeded are duplicated.
3. Add the service lines with `autotask_create_contract_service`, only to shells that were created successfully.

## Gotchas

- **Lines are not units.** A service line with no active unit row bills nothing; always read units (or the recurring roll-up) before quoting a figure.
- **Contract-specific prices.** The unit price on the line overrides the catalog price; do not quote the catalog price as what the customer pays.
- **Date-scoped rows.** Unit rows have start and end dates. A count for "now" and a count for last month can both be correct.
