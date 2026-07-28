---
name: "HaloPSA Assets"
description: >
  HaloPSA asset/CMDB data model: asset (configuration item) fields, device types
  and statuses, links to clients, sites, users, tickets, and contracts, plus
  parent-child asset relationships. Covers the Asset API surface, hardware
  lifecycle workflows, RMM auto-sync and device matching, and validation errors.
when_to_use: >-
  When tracking devices, managing configuration items, hardware lifecycle, and asset
  relationships in HaloPSA. Use when: halopsa asset, halo asset, configuration item halopsa,
  ci halopsa, device management halo, hardware tracking halopsa, halopsa cmdb, asset
  lifecycle, halo inventory, or halopsa device.
---

# HaloPSA Asset Management

## Overview

Assets (also called Configuration Items or CIs) in HaloPSA represent managed devices, software, and other trackable items. Effective asset management is crucial for MSPs to track what's deployed at client sites, manage hardware lifecycle, and link service tickets to affected equipment.

## Key Concepts

An asset is always owned by a client and optionally placed at a site, assigned to a
user, and covered by a contract:

| Link field | Points to | Notes |
|------------|-----------|-------|
| `client_id` | Client | Required |
| `site_id` | Site | Physical location |
| `user_id` | User (contact) | Assigned end user |
| `contract_id` | Contract | Billing/coverage |
| `parent_id` | Asset | Parent-child (e.g. host and its VMs) |

Most-used asset fields: `devicename` (required), `serialnumber`, `assettag`,
`macaddress`, `ipaddress`, `manufacturer`, `model`, `operatingsystem`,
`devicetype_id`, `status_id`, `purchasedate`, `purchaseprice`, `warrantyexpires`,
`lastauditdate`, `inactive`.

`devicetype_id` and `status_id` are **configurable per instance** — the shipped
IDs (1 Workstation, 2 Server, ... / 1 Active, 2 Spare, 3 In Repair, 4 Retired,
5 On Order, 6 Lost/Stolen) are defaults only. Query `/api/AssetType` and
`/api/AssetStatus` for the actual values before hard-coding any ID.

See [references/fields.md](references/fields.md) for the complete field reference plus the default asset type and status tables.

## API Patterns

- **Create and update use the same call.** `POST /api/Asset` creates when no `id`
  is present and updates when `id` is supplied. There is no `PUT`/`PATCH`.
- **The body is always a JSON array**, even for one record — this is also how you
  bulk-update many assets in a single request.
- **Updates are partial** — send only `id` plus the fields being changed.
- **Date range filters** use `<field>_before` / `<field>_after` suffixes, e.g.
  `warrantyexpires_before=2024-06-30&warrantyexpires_after=2024-01-01`.
- **Related data is opt-in**: `GET /api/Asset/5001?includedetails=true`.
- **Aggregates** use `groupby` plus `count=true`.

See [references/api.md](references/api.md) for full request/response examples covering create, search, update, bulk update, ticket/asset linking, and reports.

## RMM Integration

HaloPSA integrates with RMM tools to auto-sync assets.

### Auto-Sync Fields

When integrated with an RMM, these fields typically auto-populate and will be
overwritten on the next sync — do not hand-edit them:

- `devicename`
- `operatingsystem`
- `operatingsystemversion`
- `ipaddress`
- `macaddress`
- `lastauditdate`

### Matching Assets

RMM sync must resolve to an existing asset or it will create duplicates. Match in
this order of confidence: RMM device ID (`ncentral_device_id`, `datto_device_id`,
`connectwise_device_id`) → serial number → hostname scoped to the client.
Hostname alone is not unique across clients.

See [references/examples.md](references/examples.md) for a `matchOrCreateAsset` implementation.

## Common Workflows

### Hardware Procurement

1. **Create asset as "On Order"** (`status_id` for On Order, plus `client_id`)
2. **Receive and configure**
   - Update with serial, asset tag
   - Install software
   - Update status to "Spare"
3. **Deploy to user**
   - Assign `user_id` and `site_id`
   - Update status to "Active"
   - Create deployment ticket

### Hardware Refresh

1. **Identify aging assets**
   ```http
   GET /api/Asset?purchasedate_before=2020-01-01&inactive=false
   ```

2. **Generate refresh report**
   - List assets over X years old
   - Calculate replacement cost

3. **Plan replacement**
   - Order new equipment
   - Schedule deployment tickets
   - Update old assets to "Retired"

### Warranty Management

1. **Find expiring warranties**
   ```http
   GET /api/Asset?warrantyexpires_before=2024-06-30&warrantyexpires_after=2024-01-01
   ```

2. **Generate renewal quotes**
3. **Update warranty dates after renewal**

### Asset Audit

Compare RMM inventory against PSA records and flag assets missing warranty dates,
missing serials, or running an out-of-support OS. See
[references/examples.md](references/examples.md) for an `auditClientAssets`
implementation and an asset-value-by-client roll-up.

## Error Handling

| Code | Message | Resolution |
|------|---------|------------|
| 400 | devicename required | Asset must have a name |
| 400 | client_id required | Asset must be linked to client |
| 400 | Invalid devicetype_id | Query `/api/AssetType` for valid IDs |
| 404 | Asset not found | Verify asset ID exists |
| 409 | Duplicate serial number | Serial already in use |

Serial numbers are enforced unique instance-wide, so a 409 on create usually means
the device already exists under another client — search before creating rather than
generating a new record. See [references/examples.md](references/examples.md) for a
pre-flight `validateAsset` helper.

## Best Practices

1. **Use consistent naming** - Establish hostname conventions (CLIENT-TYPE-###)
2. **Track serials** - Essential for warranty and vendor support
3. **Link to clients** - Every asset should have a client_id
4. **Update status promptly** - Keeps inventory accurate
5. **Document lifecycle** - Purchase date, warranty, refresh date
6. **Sync with RMM** - Automated updates reduce manual effort
7. **Regular audits** - Compare RMM data vs PSA records
8. **Track costs** - Purchase price and depreciation

## Related Skills

- [HaloPSA Tickets](../tickets/SKILL.md) - Link assets to tickets
- [HaloPSA Clients](../clients/SKILL.md) - Client and site management
- [HaloPSA Contracts](../contracts/SKILL.md) - Asset billing and coverage
- [HaloPSA API Patterns](../api-patterns/SKILL.md) - Authentication and queries
