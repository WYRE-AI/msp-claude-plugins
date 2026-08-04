---
name: "Hudu Assets"
description: >
  Hudu assets and asset layouts: the layout-as-template model, custom
  field types, the `custom_fields` key/value array shape, archiving vs
  deletion, company scoping, and filter patterns across
  /api/v1/assets and /api/v1/asset_layouts.
when_to_use: >-
  When creating, querying, updating, or archiving documented items in Hudu, or when designing
  the asset layouts that define their fields. Use when: hudu asset, hudu configuration, hudu
  server, hudu workstation, hudu device, asset layout, asset management, device inventory,
  hardware tracking, or hudu ci.
---

# Hudu Assets Management

## Overview

Assets in Hudu represent documented items such as servers, workstations, network devices, applications, and any other infrastructure or service an MSP needs to track. Unlike some platforms with fixed asset types, Hudu uses **asset layouts** -- customizable templates that define the fields and structure for each type of asset. This means your Hudu instance might have asset layouts for "Server," "Workstation," "Firewall," "Microsoft 365 Tenant," or any custom type your team defines.

## Anti-triggers

- **The live state of a machine** — a Hudu asset is a documentation
  record. It does not know whether the server is online, patched, or
  alerting, and it goes stale silently. For the running endpoint use
  `ninjaone-devices`, `atera-devices`, `datto-rmm-devices`,
  `ncentral-devices`, or `connectwise-automate-computers`.
- **The same record in IT Glue** — IT Glue calls these Configurations and
  Flexible Assets; use `it-glue-configurations` or
  `it-glue-flexible-assets`. The two platforms model custom fields
  differently, so the field shapes do not transfer.
- **A credential attached to the asset** — passwords are a separate
  endpoint with their own permission model; use `hudu-passwords`.
- **A runbook or procedure about the asset** — prose documentation is
  `hudu-articles`.
- **What changed on the system recently** — configuration drift is
  detected elsewhere; use `liongard-detections`.
- **The asset row in a PSA or RMM rather than the documentation
  platform** — those records carry contract, ticket, and agent state
  that Hudu never sees, and they are keyed independently; use
  `halopsa-assets`, `syncro-assets`, or `superops-assets`.

## Key Concepts

### Asset Layouts

Asset layouts are templates that define what fields an asset of that type contains. Each layout has:

- A name (e.g., "Server," "Workstation," "Network Device")
- A set of custom fields with types (text, rich text, number, date, checkbox, dropdown, etc.)
- An icon and color for visual identification
- Optional: whether it appears in the sidebar, its position, etc.

Common asset layouts in MSP environments:

| Layout | Description | Typical Fields |
|--------|-------------|----------------|
| Server | Physical or virtual servers | Hostname, IP, OS, RAM, CPU, serial |
| Workstation | End-user devices | Hostname, user, OS, serial, warranty |
| Network Device | Routers, switches, firewalls | IP, model, firmware, port count |
| Printer | Print devices | IP, model, serial, location |
| Application | Software/services | Version, license key, vendor |
| Microsoft 365 | M365 tenant details | Tenant ID, domain, license count |
| Backup | Backup configuration | Solution, server, schedule, retention |

### Custom Fields

Each asset layout defines custom fields. Field types include:

| Type | Description | Example |
|------|-------------|---------|
| Text | Single-line text | Hostname, serial number |
| RichText | HTML rich text | Notes, description |
| Number | Numeric value | RAM (GB), port count |
| Date | Date value | Warranty expiry, install date |
| CheckBox | Boolean | Monitored (yes/no) |
| Dropdown | Predefined options | OS type, status |
| Email | Email address | Admin contact |
| Phone | Phone number | Support line |
| Password | Embedded password | Admin credentials |
| AssetTag | Link to another asset | Host server, parent device |
| Website | URL | Management portal |

### Asset vs Asset Layout

- **Asset Layout** = the template/schema (like a database table definition)
- **Asset** = an instance of a layout (like a row in the table)

### Fields

Every asset requires `company_id`, `asset_layout_id`, and `name`. `primary_serial`, `primary_model`, and `primary_mail` are first-class columns; everything else lives in the layout-defined custom fields.

See [references/fields.md](references/fields.md) for the complete field reference, including asset layout fields.

## API Patterns

| Operation | Request |
|-----------|---------|
| List / filter | `GET /api/v1/assets?company_id=123&asset_layout_id=5&name=DC-01&archived=false&page=1` |
| Find by serial | `GET /api/v1/assets?primary_serial=ABC123456789` |
| Get one | `GET /api/v1/assets/789` |
| Create | `POST /api/v1/assets` with `{ "asset": { ... } }` |
| Update | `PUT /api/v1/assets/789` |
| Delete | `DELETE /api/v1/assets/789` |
| Archive / unarchive | `PUT /api/v1/assets/789/archive` \| `/unarchive` |
| Layouts | `GET|POST /api/v1/asset_layouts` (filter with `?name=Server`) |

All requests use the `x-api-key` header. Request and response bodies are wrapped in a singular resource key (`asset`, `asset_layout`).

Custom field values are written as an array of single-key objects keyed by the field's snake_cased label, **not** as a flat object:

```json
"custom_fields": [
  { "hostname": "dc-01.acme.local" },
  { "ip_address": "192.168.1.10" }
]
```

On read they come back on the asset as `fields`, not `custom_fields`.

See [references/api.md](references/api.md) for the complete endpoint catalog with request/response examples.

## Common Workflows

### Asset Onboarding

Layout IDs are instance-specific — resolve the layout by name before creating the asset rather than hardcoding an ID.

```javascript
async function onboardAsset(companyId, assetData) {
  // Step 1: Find the correct asset layout
  const layouts = await fetchAssetLayouts({ name: assetData.layoutName });
  const layout = layouts[0];
  if (!layout) throw new Error(`Asset layout "${assetData.layoutName}" not found`);

  // Step 2: Create the asset
  const asset = await createAsset({
    name: assetData.name,
    asset_layout_id: layout.id,
    company_id: companyId,
    primary_serial: assetData.serialNumber,
    primary_model: assetData.model,
    custom_fields: assetData.customFields
  });

  return asset;
}
```

### Warranty Tracking

Warranty dates live in a layout-defined custom field, so they cannot be filtered server-side — fetch and filter client-side.

```javascript
async function getExpiringWarranties(daysAhead = 90) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  // Fetch all active assets and check warranty fields
  const assets = await fetchAllAssets({ archived: false });

  return assets
    .filter(a => {
      const warrantyField = a.fields?.find(f => f.warranty_expiry);
      if (!warrantyField) return false;
      const warranty = new Date(warrantyField.warranty_expiry);
      return warranty >= today && warranty <= futureDate;
    })
    .sort((a, b) => {
      const aDate = new Date(a.fields.find(f => f.warranty_expiry)?.warranty_expiry);
      const bDate = new Date(b.fields.find(f => f.warranty_expiry)?.warranty_expiry);
      return aDate - bDate;
    });
}
```

### Asset Decommissioning

```javascript
async function decommissionAsset(assetId, reason) {
  // Update with decommission notes
  await updateAsset(assetId, {
    custom_fields: [
      { notes: `DECOMMISSIONED: ${new Date().toLocaleDateString()} - ${reason}` }
    ]
  });

  // Archive the asset
  await archiveAsset(assetId);

  return { status: 'archived', assetId, reason };
}
```

### Asset Inventory by Company

```javascript
async function generateAssetInventory(companyId) {
  const assets = await fetchAssets({ company_id: companyId, archived: false });

  const byLayout = {};
  for (const asset of assets) {
    const layoutName = asset.asset_layout_name || 'Unknown';
    if (!byLayout[layoutName]) byLayout[layoutName] = [];
    byLayout[layoutName].push({
      name: asset.name,
      serial: asset.primary_serial,
      model: asset.primary_model,
      updatedAt: asset.updated_at
    });
  }

  return byLayout;
}
```

## Gotchas

- **`custom_fields` on write, `fields` on read.** Round-tripping an asset requires renaming the key.
- **Custom fields are not queryable.** Only `company_id`, `asset_layout_id`, `name`, `primary_serial`, and `archived` filter server-side; anything layout-defined must be filtered after fetching.
- **A 422 on create usually means a layout-required field is missing.** Fetch the layout and inspect `fields` where `required: true` — the error message does not name the field.
- **Layout IDs differ per Hudu instance.** Look them up by name; never hardcode.
- **Archive is a distinct verb** (`PUT /assets/:id/archive`), not an `archived` field on update. Archived assets are excluded from default listings.

See [references/errors.md](references/errors.md) for the complete error and validation table plus a recovery pattern.

## Best Practices

1. **Standardize naming** - Use consistent format (e.g., SITE-TYPE-NUM: NYC-DC-01)
2. **Use appropriate layouts** - Choose the right asset layout for the device type
3. **Track serial numbers** - Enable warranty lookups and asset verification
4. **Document custom fields** - Fill in all relevant fields, not just the name
5. **Archive, don't delete** - Preserve historical records for decommissioned assets
6. **Create layouts thoughtfully** - Design layouts with fields MSP technicians actually need
7. **Keep layouts consistent** - Use the same layout across all companies for the same device type
8. **Link related assets** - Use AssetTag fields to connect VMs to hosts, apps to servers

## Related Skills

- [Hudu Companies](../companies/SKILL.md) - Parent company management
- [Hudu Passwords](../passwords/SKILL.md) - Device credentials
- [Hudu Articles](../articles/SKILL.md) - Device documentation
- [Hudu Websites](../websites/SKILL.md) - Website monitoring
- [Hudu API Patterns](../api-patterns/SKILL.md) - API reference
