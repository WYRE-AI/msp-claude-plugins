---
name: "Unitrends UniView Protection Coverage"
description: >
  Per-customer protection inventory in Unitrends UniView: appliance-protected
  assets with their last backup, Endpoint Backup devices, Spanning and Entra
  tenants mapped to the customer, and the appliances behind them; how to spot
  stale or missing protection and assemble a coverage summary for a QBR or
  onboarding review.
when_to_use: >-
  When an account manager or technician needs to know what a customer has
  protected in Unitrends and when each system was last backed up, for a QBR,
  onboarding sign-off, or audit. Use when: backup coverage, what is backed up,
  unprotected servers, stale backups, endpoint backup devices, uniview assets,
  backup QBR, or backup audit evidence.
---

# Unitrends UniView Protection Coverage

## Overview

Triage asks "what failed last night". Coverage asks "is everything that should
be protected actually protected, and recently". UniView holds four kinds of
protection per customer: appliance-protected assets, Endpoint Backup (EPB)
devices, Spanning SaaS domains and Entra ID tenants. All tools used here are
plain reads in Conduit; none is admin-gated.

## Anti-triggers

- **Last night's failures and BackupIQ alerts**: use the
  `unitrends-uniview-backup-health-triage` skill.
- **Per-user Microsoft 365 or Google Workspace backup status**: use the
  `unitrends-uniview-spanning-saas-backup` skill.

## Key Concepts

| Protection | Tool | Filter by customer |
|------------|------|--------------------|
| Servers, VMs, databases on an appliance | `unitrends_uniview_assets_list` | `customer_id` |
| Appliances | `unitrends_uniview_appliances_list` | `customer_id` |
| Endpoint Backup devices | `unitrends_uniview_epb_assets_list` | `customer_id` |
| Spanning Microsoft 365 / Google Workspace domains | `unitrends_uniview_spanning_domains_list` | No filter; match the mapped customer in the result |
| Entra ID tenants | `unitrends_uniview_entra_domains_list` | No filter; match `mapped_customer_name` in the result |

`unitrends_uniview_agent_latest_get` returns the current Unitrends backup agent
version, download link and checksum: the reference to use when an asset needs
the agent installed or updated.

## Common Workflows

### Coverage summary for one customer

1. `unitrends_uniview_customers_list` with `name` to get the customer `id`.
   Confirm the match if more than one customer comes back.
2. `unitrends_uniview_appliances_list` with `customer_id`: which appliances
   protect this customer, and are they online with free space.
3. `unitrends_uniview_assets_list` with `customer_id` and
   `include: {"backups": "last"}`. Page through every page. For each asset
   record its type and last backup time and status.
4. `unitrends_uniview_epb_assets_list` with `customer_id`: device name, OS,
   status, license type and storage used.
5. `unitrends_uniview_spanning_domains_list` and
   `unitrends_uniview_entra_domains_list`, keeping only the domains mapped to
   this customer.
6. Write the summary: counts per protection type, then the exceptions below.

### Exceptions to report

- **Stale**: an asset whose last backup is older than its expected schedule
  (48 hours is a safe default for daily jobs).
- **Never backed up**: an asset with no last backup.
- **Last backup failed**: the last backup exists but its status is not
  `Successful`.
- **Endpoint not reporting**: an EPB device whose status is not healthy.
- **Unmapped SaaS**: a Spanning or Entra domain with no mapped customer. It may
  belong to this customer and be missing from its report.

### Reconcile against the RMM or PSA

UniView only knows what was added to it. To find systems that were never
protected, compare the asset and EPB device names with the customer's device
list in the RMM or the configuration items in the PSA. A server that exists
there and not here is the most important finding in the review.

### Fleet-wide stale-asset sweep

Run step 3 without `customer_id` to list every asset with its last backup, then
group stale and never-backed-up assets by customer. Read every page.

## Gotchas

- **`include` is an object.** Pass `{"backups": "last"}`, not the string
  `"last"`. Without it, assets come back with no backup information.
- **Asset names are not unique across customers.** Always filter or group by
  `customer_id`.
- **EPB storage is reported in bytes; appliance storage in MB.** Convert before
  comparing.
- **The SaaS lists cannot be filtered by customer.** Pull them once and filter
  the results; do not call them once per customer.
- **Hostnames, IP and MAC addresses** are in the asset records. Keep them out of
  customer-facing summaries unless the customer asked for the detail.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md): headers, paging, truncation, errors
- [backup-health-triage](../backup-health-triage/SKILL.md): last night's failures
- [spanning-saas-backup](../spanning-saas-backup/SKILL.md): SaaS user-level status
