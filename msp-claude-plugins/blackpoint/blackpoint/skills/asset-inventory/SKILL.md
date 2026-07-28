---
name: "Blackpoint Asset Inventory"
description: >
  Blackpoint Cyber (CompassOne) asset data: the six asset classes,
  listing and paginating assets per class, cross-class search, asset
  detail, and walking parent/child/sibling relationships to build a
  blast-radius or topology view.
when_to_use: >-
  When enumerating, searching, or mapping assets for a Blackpoint Cyber / CompassOne tenant —
  endpoints, servers, network devices, cloud accounts, mobile, and IoT — and tracing relationships
  between them. Use when: blackpoint asset, blackpoint asset inventory, compassone asset,
  blackpoint endpoints, blackpoint asset search, blackpoint asset relationships, or blackpoint
  asset map.
---

# Blackpoint Asset Inventory

Assets are the leaves of the CompassOne hierarchy — every detection
and vulnerability fires against one. This skill covers enumerating
them, searching across classes, and mapping how they connect.

## Asset Classes

`blackpoint_assets_list` requires an asset **class**. The supported
classes are:

- `endpoint` — workstations, laptops
- `server` — physical and virtual servers
- `network` — switches, routers, firewalls
- `cloud` — cloud accounts and resources
- `mobile` — phones, tablets
- `iot` — IoT and OT devices

## API Tools

| Tool | Purpose |
|------|---------|
| `blackpoint_assets_list` | List assets of a given class for a tenant (paginated) |
| `blackpoint_assets_get` | Full detail for one asset |
| `blackpoint_assets_search` | Search assets across all classes by name / identifier |
| `blackpoint_assets_relationships` | Walk parent / child / sibling links from a source asset |

## Common Workflows

### Full inventory for a tenant

1. Confirm the tenant with `blackpoint_tenants_get`.
2. Call `blackpoint_assets_list` once per class (`endpoint`,
   `server`, `network`, `cloud`, `mobile`, `iot`).
3. Paginate each class fully — endpoint counts can run high.
4. Roll up: total assets, count per class, count per status.

### Find a specific asset fast

1. Use `blackpoint_assets_search` with a hostname, serial, or
   identifier — it spans all classes, so you do not need to know the
   class first.
2. Narrow with the `classes` and `tenant_ids` filters if the search
   returns matches across multiple tenants.
3. Pull `blackpoint_assets_get` on the match for full detail.

### Build a relationship / topology map

1. Identify the entry asset with `blackpoint_assets_search`.
2. Call `blackpoint_assets_relationships` with the source asset ID.
   Use the `direction` filter (`parent` / `child` / `sibling`) and
   the `related_class` filter to control the walk.
3. For each related asset, optionally pull detail and any open
   detections to build a blast-radius view.

## Edge Cases

- **Class is required** — `blackpoint_assets_list` will not return
  "all assets" in one call; you must iterate the six classes. Use
  `blackpoint_assets_search` when you genuinely want a cross-class
  view.
- **Asset identity drift** — a re-imaged endpoint can produce two
  asset records. Dedupe on hostname / serial before reporting counts.
- **Read-only** — there are no tools to create, retire, or modify
  assets; lifecycle changes happen in the CompassOne portal.

## Best Practices

- Always carry the tenant name in inventory output — partner-level
  work spans many customers.
- Pair `blackpoint_assets_relationships` with detection lookups when
  the question is about blast radius, not just topology.

## Related Skills

- [incident-response](../incident-response/SKILL.md) - Pivoting from a detection to its asset
- [api-patterns](../api-patterns/SKILL.md) - Hierarchy, auth, pagination
