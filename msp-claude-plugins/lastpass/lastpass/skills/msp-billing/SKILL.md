---
name: "LastPass MSP Billing"
description: >
  Reconciling LastPass MSP license consumption: billing cycles, the
  per-company billing report (`dailyAverageLicenseCount`, `licenseType`,
  `addons`), managed-company license limits and active/suspended status,
  and matching all of it against what the MSP bills each client in the
  PSA. MSP keys only.
when_to_use: >-
  When checking what LastPass will bill the MSP this cycle, finding
  clients that are over their license limit or billed for add-ons they
  do not pay for, or preparing month-end reconciliation of LastPass
  seats against client invoices. Use when: lastpass billing, lastpass
  licenses, lastpass seat count, lastpass reconciliation, lastpass
  invoice, lastpass license limit, or lastpass msp billing.
---

# LastPass MSP Billing

## Overview

The LastPass billing report gives each managed company's **daily
average** license count over a billing cycle, its license type and its
add-ons (`mfa`, `sso`). That is the consumption figure MSP billing is
reconciled against. A company with `status: active` is billed for the
month; `suspended` is not. Reconciliation means checking that what LastPass will charge the
MSP matches what the MSP charges each client.

All three tools need an **MSP** key; a Business key gets 403. Every tool
here is tier **read** in Conduit; none is admin-gated.

## Common Workflows

### Month-end reconciliation

1. **Get the cycle dates.** `lastpass_reports_billing_cycles_list` with
   `number_of_cycles: 1` for the current cycle, or up to 12 for history.
   Each cycle has `startDate` and `endDate`.
2. **Pull consumption.** `lastpass_reports_billing_list` with
   `start_date` and `end_date` set to the cycle's dates (both required,
   `yyyy-MM-dd`). Page with `max_results: 50` and `page_token`. Each row
   gives the company's `dailyAverageLicenseCount`, `licenseType`,
   `addons` and `parentId`.
3. **Pull the companies.** `lastpass_managed_companies_list` with
   `max_results: 500` for `name`, `licenseLimit`, `status`, `type` and
   `addons`, keyed by `id`.
4. **Join and flag** (below). Join the billing rows to the companies on
   the company ID.
5. **Compare with the PSA.** If a PSA plugin is connected, compare each
   client's billed LastPass quantity with the rounded-up
   `dailyAverageLicenseCount`. Otherwise produce the table for a human
   to compare.

### Quick over-limit check

`lastpass_managed_companies_list` alone gives `licenseLimit`. Compare it
with the latest billing report count. A client running at or near its
limit is a renewal or upsell conversation.

## What to Flag

| Finding | Rule |
|---------|------|
| Billed but not invoiced | Company in the billing report with a count above 0 and no matching PSA line |
| Under-invoiced | PSA quantity below the rounded-up daily average |
| Over limit | Daily average at or above `licenseLimit` |
| Add-on drift | `addons` includes `mfa` or `sso` but the client's agreement does not |
| Paying for a dead client | `status: active` for a client the MSP has offboarded; suspend it in LastPass |
| Trial still running | `licenseType: msp-trial` past the trial period |

## Output

A table per cycle: company, type, status, license limit, daily average
count, add-ons, PSA quantity (if available), difference, and flag. Then
totals and a short list of actions (suspend, raise invoice, adjust
limit). Money figures come from the PSA or the MSP's price list; the
LastPass API returns counts, not prices.

## Gotchas

- **Daily average, not a headcount.** A client that added ten users on
  the last day of the cycle barely moves the average. Do not compare it
  with a live users list.
- **Grandchildren.** Rows carry `parentId`. A `managed-msp` company is a
  sub-MSP with its own children; roll its children up under it if the
  MSP bills the sub-MSP rather than its clients.
- **`license_type` filter** values are `msp`, `msp-trial`,
  `msp-managed-company`, `msp-distributor` and `managed-msp`. Leave it
  unset for a full reconciliation.
- **Dates are inclusive**, and both `start_date` and `end_date` are
  required.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - pagination, filters, errors
