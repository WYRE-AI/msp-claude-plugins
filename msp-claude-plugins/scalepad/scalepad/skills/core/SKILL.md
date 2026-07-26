---
name: "ScalePad Core"
description: >
  Use this skill when working with the ScalePad Core API — the
  read-only, US-only unified data layer over clients, contacts,
  members, sites, opportunities, hardware and SaaS assets, the
  product catalog, service contracts, tickets, and integration
  configurations.
when_to_use: >-
  When reading unified ScalePad platform data — clients, contacts, members, sites, opportunities, 
  hardware/SaaS assets, product catalog, contracts, or tickets. Use when: scalepad clients, 
  scalepad core, scalepad assets, scalepad contacts, scalepad tickets, scalepad contracts.
---

# ScalePad Core (Unified Platform Data)

## Overview

Core is ScalePad's read-only unified data surface (US-only). It is the
best starting point for cross-product work: resolve client IDs, asset
IDs, and serial numbers here before touching Lifecycle Manager,
ControlMap, or Quoter. Discover this domain's tools with
`scalepad_navigate` (domain `core`).

## API Tools

### Clients & People

| Tool | Purpose |
|------|---------|
| `scalepad_core_clients_list` / `scalepad_core_clients_get` | List/get clients (filter by name, lifecycle, contact/asset counts, record lineage) |
| `scalepad_core_contacts_list` / `scalepad_core_contacts_get` | List/get contacts (upstream is a POST search — the tool behaves like a normal list) |
| `scalepad_core_members_list` / `scalepad_core_members_get` | List/get MSP team members (also a POST search upstream) |
| `scalepad_core_sites_list` / `scalepad_core_sites_get` | List/get client sites |
| `scalepad_core_opportunities_list` / `scalepad_core_opportunities_get` | List/get sales opportunities |

### Assets & Catalog

| Tool | Purpose |
|------|---------|
| `scalepad_core_hardware_assets_list` / `scalepad_core_hardware_assets_get` | Hardware assets (filter by client, manufacturer, model, serial_number, type, CPU/RAM/disk configuration) |
| `scalepad_core_saas_assets_list` / `scalepad_core_saas_assets_get` | SaaS subscriptions (filter by product, status, tenant_domain, term dates) |
| `scalepad_core_saas_users_list` / `scalepad_core_saas_users_get` | SaaS seat assignments per user |
| `scalepad_core_product_catalog_list` / `scalepad_core_product_catalog_get` | Product catalog records |

### Service & Integrations

| Tool | Purpose |
|------|---------|
| `scalepad_core_contracts_list` / `scalepad_core_contracts_get` | Service contracts (filter by client, type, term, status, recurring) |
| `scalepad_core_tickets_list` / `scalepad_core_tickets_get` | PSA tickets synced into ScalePad |
| `scalepad_core_integration_configurations_list` | Configured integrations |
| `scalepad_core_integration_vendors_list` | Available integration vendors |

## Common Workflows

1. **Resolve a client** — `scalepad_core_clients_list` with a
   `filter` on `name`; note the client `id` for downstream calls.
2. **Asset inventory for a client** —
   `scalepad_core_hardware_assets_list` filtered by `client.id`,
   paginating with `cursor` until exhausted.
3. **Contract expiry review** — `scalepad_core_contracts_list`
   filtered by `client.id` and `term.ends_at`.

## Error Handling

Core returns 402 if the account has no active Core subscription; it is
US-only, so `X-ScalePad-Region` does not affect it. All other error
semantics follow [api-patterns](../api-patterns/SKILL.md).

## Best Practices

- Everything here is read-only — safe to call freely within the
  shared 50-req/5-s rate limit.
- Filters map to the API's `filter[<key>]` params; pass them in the
  tool's `filter` object.
- Use record lineage filters to trace which integration a record came
  from.

## Related Skills

- [lifecycle-manager](../lifecycle-manager/SKILL.md) - act on the assets you find here
- [api-patterns](../api-patterns/SKILL.md) - auth, pagination, errors
