---
name: "Cove Customer and Storage Inventory"
description: >
  Building a per-customer inventory from Cove: the customer (partner) tree and
  each customer's state, assigned products and retention, protected device
  counts, storage used and its growth, and the storage locations that hold the
  data. Covers reconciling device counts against billing and preparing the
  backup section of a QBR.
when_to_use: >-
  When someone needs to know what Cove protects for a client, how much storage
  a client uses, which customers are in trial or expired, or where a client's
  backup data is stored. Use when: cove customers, backup inventory, storage
  usage, storage growth, backup billing reconciliation, device count, cove
  trial, data residency, retention plan, or backup QBR.
---

# Cove Customer and Storage Inventory

## Overview

MSPs use this view for three recurring jobs: reconciling what Cove protects
against what the client is billed for, showing storage and growth in a QBR,
and answering where a client's backup data is stored. Cove calls customers
**partners**; an MSP's own account is a partner too, with its end customers
below it in a tree.

All tools in this skill are read tier in Conduit. None is admin-gated.

## Anti-triggers

- **Which backups failed or went stale**: use `cove-backup-health`.
- **Who has console access to a customer**: use `cove-access-review`.

## Key Concepts

| Concept | Where it comes from |
|---------|---------------------|
| Customer tree | `cove_partners_list` (`fetch_recursively: true`) or `cove_partner_tree_get` |
| Customer level | `Root`, `SubRoot`, `Distributor`, `SubDistributor`, `Reseller`, `EndCustomer`, `Site` |
| Customer state | `InProduction`, `InTrial`, `Expired`, `NotActive`, `Registered`, `WaitingForProduction`, `Rejected`; per customer with `cove_partner_state_get` |
| External code | A PSA or RMM ID stored on the customer (partner field 18). Use it to match Cove customers to PSA companies. |
| Products | Products and retention plans assigned to a customer, from `cove_products_list` |
| Storage | `cove_storages_list` and `cove_storage_get` for the storage a customer uses; `cove_storage_statistics_list` for usage in MB |
| Location and region | `cove_locations_list` and `cove_regions_list`, for data residency |

Partner `fields` codes: 0 Name, 1 Level, 3 ChildServiceTypes, 4 ServiceType,
5 State, 8 LocationId, 9 Flags, 10 Company info, 18 ExternalCode and
MailFrom, 20 CreationTime.

## Workflows

### Customer list with states

1. `cove_auth_context_get` for the root `PartnerId`.
2. `cove_partners_list` with `parent_partner_id` set to it,
   `fetch_recursively: true` and `fields: [0, 1, 5, 18, 20]`.
3. Group by state. Customers in `InTrial` for a long time, and `Expired`
   customers that still have devices, are the usual follow-ups.

To filter the tree by state, level, name or external code, use
`cove_partner_tree_get` with `states`, `levels`, `name_pattern` or
`external_code_pattern`. Do not use `cove_partner_children_list` to list
customers: it returns a count, and its `Children` can be null even when
children exist.

### Device count per customer (billing reconciliation)

1. Pull the customer list as above.
2. Call `cove_device_statistics_list` on the root customer with
   `columns: ["I1", "I78", "I14"]`, paging with `start_record_number` and
   `records_count` until a page is short.
3. Count devices per `PartnerId`. Split counts by data source when the
   contract bills servers and workstations differently: `I78` lists each
   device's active data sources.
4. Compare against the PSA contract quantity for that client. Match
   customers by external code first, by name second. List every mismatch
   with both numbers; do not guess which side is right.

### Storage used and growth

1. `cove_storage_statistics_list` with the customer's `partner_id`. Sizes are
   in MB (`UsedStorageInMb`, `TotalStorageInMb`).
2. For per-device storage, use column `I14` from
   `cove_device_statistics_list`. It is in bytes, so convert before comparing
   with the MB figures.
3. For growth, compare against a figure from an earlier report the user
   gives you. The tools return current values; Cove's history methods are
   not exposed.

### Data residency

1. `cove_storages_list` for the customer, then `cove_storage_get` for each
   storage.
2. `cove_locations_list` and `cove_regions_list` to name the location and
   region.
3. Where a client asks which devices sit on which node, use
   `cove_storage_nodes_by_device_list` with up to 100 device IDs. The
   storage-node tools are not yet confirmed for a Supporter API user; a 13501
   error means the role does not allow them.

### Products and retention

1. `cove_products_list` with the customer's `partner_id`. Set
   `current_partner_only: true` to see only products defined on that
   customer, not inherited ones.
2. `cove_profiles_list` for the backup profiles available to the customer,
   and `cove_profile_get` for one profile's settings.

### Customer change history

`cove_partner_history_list` returns a customer's change history, for example
when it moved from trial to production. For who made a console change, use
the audit log in `cove-access-review`.

## Output

For a QBR or reconciliation, give one row per customer: name, external code,
state, device count, storage used (GB, one decimal), products. Put mismatches
and expired customers with devices in a separate list above the table.

## Gotchas

- Two units: statistics column `I14` is bytes, storage statistics are MB.
- `cove_devices_list` covers one customer level only. Use
  `cove_device_statistics_list` on a parent to count devices across a tree.
- `cove_partner_get_by_name` needs the exact name. For partial names, list
  the tree and match.
- Cove documents no rate limits. On a large tree, page the statistics query
  and avoid one call per customer when one call on the parent will do.
