---
name: "Webroot Usage Reconciliation"
description: >
  Webroot seat and usage reconciliation for MSP billing: the per-site usage
  report and its three report types, console seats allowed vs. deployed,
  per-site devices allowed vs. total endpoints, trial, expiring, suspended
  and deactivated sites, and how to compare the result with PSA agreement
  quantities.
when_to_use: >-
  When reconciling Webroot endpoint counts against customer billing, the
  Webroot invoice, or PSA agreements, or reviewing trials and expiring
  sites. Use when: webroot billing, webroot usage report, webroot seats,
  webroot license count, webroot true-up, expiring webroot sites, webroot
  trial, or webroot invoice reconciliation.
---

# Webroot Usage Reconciliation

## Overview

Monthly billing check: what Webroot will bill the MSP for, per customer, against what the
MSP bills each customer. Every tool here is in Conduit's Read group.

## Which count to use

`webroot_usage_sites_report` takes a `reportType`. Pick the one that matches how the MSP
bills, and say which one you used:

| `reportType` | Counts | Use for |
|---|---|---|
| `EndpointsSeenInLast30Days` (default) | Devices seen in the 30 days before `effectiveDate` | Usage-based billing (devices actually in use that month) |
| `ActiveEndpoints` | All active devices, hidden ones included | Seat-based contracts; the largest number |
| `ActiveEndpointsWithoutHidden` | Active devices as the console shows them | Matching what a technician sees in the console |

Pass `effectiveDate` for a specific day (for example the last day of the billing month).
A day's data is usually ready during the following UTC day; for "today" the tool returns
the most recent complete report.

## Workflow: month-end reconciliation

1. `webroot_console_get`: console license type, seats allowed and end date.
2. `webroot_usage_sites_report` with the chosen `reportType` and `effectiveDate` = the last
   day of the month. This is the per-site count to bill against.
3. `webroot_sites_list`: devices allowed, total endpoints, billing cycle, end date, and
   deactivated or suspended state per site.
4. For each site, flag:
   - **Over allowance**: total endpoints or usage count above devices allowed.
   - **Billed but idle**: a site with seats but zero or near-zero usage.
   - **Deactivated or suspended sites** that still report usage.
   - **End date within 30 days**: renewals to action.
5. If a PSA plugin is connected, compare each site's count with the customer's agreement
   or contract quantity for Webroot. Match sites to PSA companies by name, and list any
   site you could not match instead of guessing.
6. `webroot_statistics_console_get` for console-wide trial, expired, expiring, suspended and
   deactivated site counts, as a cross-check on step 4.

## Output

One table, one row per site: site name, usage count (with report type), devices allowed,
PSA quantity (if available), difference, and a flag column. Then a short list of actions:
true-ups to bill, seats to reduce, trials to convert or close, renewals due.

## Gotchas

- The three report types legitimately disagree. Hidden endpoints and machines that were
  active once in 30 days explain most gaps; do not call a difference an error until you
  know which count each side uses.
- Stale endpoints inflate `ActiveEndpoints`. If usage looks high, run the stale-agent step
  in [endpoint-health](../endpoint-health/SKILL.md) and recommend deactivating retired
  devices in the GSM console.
- Site names in Webroot are free text set by whoever created the site. They often differ
  from PSA company names (abbreviations, "Inc", branch suffixes).
