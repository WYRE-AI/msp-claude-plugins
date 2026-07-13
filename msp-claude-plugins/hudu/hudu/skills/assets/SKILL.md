---
name: "Hudu Assets"
description: >
  Use this skill when working with Hudu assets and asset layouts - servers,
  workstations, network devices, and other documented items. Covers asset
  CRUD, asset layout templates, custom fields, archiving, linking assets
  to companies, and search/filter patterns.
when_to_use: >-
  When working with servers, workstations, network devices, and other documented items in Hudu
  assets and asset layouts. Use when: hudu asset, hudu configuration, hudu server, hudu
  workstation, hudu device, asset layout, asset management, device inventory, hardware tracking,
  or hudu ci.
---

# Hudu Assets Management

## Overview

Assets in Hudu represent documented items such as servers, workstations, network devices, applications, and any other infrastructure or service an MSP needs to track. Unlike some platforms with fixed asset types, Hudu uses **asset layouts** -- customizable templates that define the fields and structure for each type of asset. This means your Hudu instance might have asset layouts for "Server," "Workstation," "Firewall," "Microsoft 365 Tenant," or any custom type your team defines.

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

## Field Reference

### Core Asset Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `company_id` | integer | Yes | Parent company |
| `asset_layout_id` | integer | Yes | The layout (template) this asset uses |
| `name` | string | Yes | Asset display name |
| `primary_serial` | string | No | Primary serial number |
| `primary_model` | string | No | Primary model name |
| `primary_mail` | string | No | Primary email |
| `archived` | boolean | No | Whether the asset is archived |
| `slug` | string | System | URL-friendly identifier |
| `object_type` | string | System | Always "Asset" |

### Custom Fields (Dynamic)

Custom fields are stored in a `fields` array, where each entry is a key-value pair defined by the asset layout:

```json
{
  "asset": {
    "name": "DC-01",
    "asset_layout_id": 5,
    "company_id": 1,
    "custom_fields": [
      { "hostname": "dc-01.acme.local" },
      { "ip_address": "192.168.1.10" },
      { "operating_system": "Windows Server 2022" },
      { "ram_gb": 32 },
      { "warranty_expiry": "2027-01-15" }
    ]
  }
}
```

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
| `url` | string | Full URL to asset in Hudu |
| `asset_layout_name` | string | Name of the asset layout (read-only) |
| `company_name` | string | Name of the parent company (read-only) |

### Asset Layout Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `name` | string | Yes | Layout name (e.g., "Server") |
| `icon` | string | No | Font Awesome icon class |
| `color` | string | No | Hex color code |
| `icon_color` | string | No | Icon color |
| `active` | boolean | No | Whether layout is active |
| `sidebar_folder_id` | integer | No | Sidebar folder |
| `fields` | array | Yes | Array of field definitions |

## API Patterns

### List Assets

```http
GET /api/v1/assets
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**By Company:**
```http
GET /api/v1/assets?company_id=123
```

**By Asset Layout:**
```http
GET /api/v1/assets?asset_layout_id=5
```

**Combined Filters:**
```http
GET /api/v1/assets?company_id=123&asset_layout_id=5
GET /api/v1/assets?company_id=123&name=DC-01
GET /api/v1/assets?company_id=123&archived=false
GET /api/v1/assets?primary_serial=ABC123456789
```

**With Pagination:**
```http
GET /api/v1/assets?company_id=123&page=1
GET /api/v1/assets?company_id=123&page=2
```

### Get Single Asset

```http
GET /api/v1/assets/789
x-api-key: YOUR_API_KEY
```

### Create Asset

```http
POST /api/v1/assets
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

**Server Example:**
```json
{
  "asset": {
    "name": "DC-01",
    "asset_layout_id": 5,
    "company_id": 123,
    "primary_serial": "ABC123456789",
    "primary_model": "Dell PowerEdge R740",
    "custom_fields": [
      { "hostname": "dc-01.acme.local" },
      { "ip_address": "192.168.1.10" },
      { "operating_system": "Windows Server 2022" },
      { "ram_gb": 32 },
      { "cpu": "Intel Xeon Gold 6248" },
      { "warranty_expiry": "2027-01-15" },
      { "notes": "Primary domain controller for Acme Corporation" }
    ]
  }
}
```

**Workstation Example:**
```json
{
  "asset": {
    "name": "WS-JSMITH",
    "asset_layout_id": 7,
    "company_id": 123,
    "primary_serial": "XYZ987654321",
    "primary_model": "Dell OptiPlex 7090",
    "custom_fields": [
      { "hostname": "ws-jsmith.acme.local" },
      { "assigned_user": "John Smith" },
      { "department": "Sales" },
      { "ip_address": "192.168.1.150" },
      { "operating_system": "Windows 11 Pro" },
      { "warranty_expiry": "2026-06-30" }
    ]
  }
}
```

### Update Asset

```http
PUT /api/v1/assets/789
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "asset": {
    "name": "DC-01",
    "custom_fields": [
      { "ip_address": "192.168.1.20" },
      { "notes": "IP updated after network migration on 2026-02-15" }
    ]
  }
}
```

### Delete Asset

```http
DELETE /api/v1/assets/789
x-api-key: YOUR_API_KEY
```

### Archive / Unarchive Asset

```http
PUT /api/v1/assets/789/archive
x-api-key: YOUR_API_KEY
```

```http
PUT /api/v1/assets/789/unarchive
x-api-key: YOUR_API_KEY
```

### List Asset Layouts

```http
GET /api/v1/asset_layouts
x-api-key: YOUR_API_KEY
```

**By Name:**
```http
GET /api/v1/asset_layouts?name=Server
```

### Get Single Asset Layout

```http
GET /api/v1/asset_layouts/5
x-api-key: YOUR_API_KEY
```

**Response:**
```json
{
  "asset_layout": {
    "id": 5,
    "name": "Server",
    "icon": "fas fa-server",
    "color": "#2196F3",
    "active": true,
    "fields": [
      { "label": "Hostname", "field_type": "Text", "required": true, "position": 1 },
      { "label": "IP Address", "field_type": "Text", "required": false, "position": 2 },
      { "label": "Operating System", "field_type": "Dropdown", "required": false, "position": 3 },
      { "label": "RAM (GB)", "field_type": "Number", "required": false, "position": 4 },
      { "label": "Warranty Expiry", "field_type": "Date", "required": false, "position": 5 },
      { "label": "Notes", "field_type": "RichText", "required": false, "position": 6 }
    ]
  }
}
```

### Create Asset Layout

```http
POST /api/v1/asset_layouts
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "asset_layout": {
    "name": "Network Switch",
    "icon": "fas fa-network-wired",
    "color": "#4CAF50",
    "active": true,
    "fields": [
      { "label": "IP Address", "field_type": "Text", "required": true, "position": 1 },
      { "label": "Model", "field_type": "Text", "required": false, "position": 2 },
      { "label": "Firmware Version", "field_type": "Text", "required": false, "position": 3 },
      { "label": "Port Count", "field_type": "Number", "required": false, "position": 4 },
      { "label": "Location", "field_type": "Text", "required": false, "position": 5 },
      { "label": "Managed", "field_type": "CheckBox", "required": false, "position": 6 }
    ]
  }
}
```

## Common Workflows

### Asset Onboarding

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

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide asset name |
| 400 | Company is required | Include company_id |
| 400 | Asset layout is required | Include asset_layout_id |
| 401 | Invalid API key | Check HUDU_API_KEY |
| 404 | Asset not found | Verify asset ID |
| 422 | Validation failed | Check required custom fields per layout |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Company required | No company_id | Include company_id |
| Layout required | No asset_layout_id | Include asset_layout_id |
| Invalid layout | Bad asset_layout_id | Query /asset_layouts first |
| Required field missing | Layout requires a field | Check layout fields and provide required ones |

### Error Recovery Pattern

```javascript
async function safeCreateAsset(data) {
  try {
    return await createAsset(data);
  } catch (error) {
    if (error.status === 422) {
      // Check if layout requires fields we didn't provide
      const layout = await getAssetLayout(data.asset_layout_id);
      const requiredFields = layout.fields.filter(f => f.required);
      console.log('Required fields for this layout:', requiredFields.map(f => f.label));
    }

    throw error;
  }
}
```

## Best Practices

1. **Standardize naming** - Use consistent format (e.g., SITE-TYPE-NUM: NYC-DC-01)
2. **Always set company** - All assets must belong to a company
3. **Use appropriate layouts** - Choose the right asset layout for the device type
4. **Track serial numbers** - Enable warranty lookups and asset verification
5. **Document custom fields** - Fill in all relevant fields, not just the name
6. **Archive, don't delete** - Preserve historical records for decommissioned assets
7. **Create layouts thoughtfully** - Design layouts with fields MSP technicians actually need
8. **Keep layouts consistent** - Use the same layout across all companies for the same device type
9. **Link related assets** - Use AssetTag fields to connect VMs to hosts, apps to servers
10. **Regular audits** - Verify asset accuracy quarterly

## Related Skills

- [Hudu Companies](../companies/SKILL.md) - Parent company management
- [Hudu Passwords](../passwords/SKILL.md) - Device credentials
- [Hudu Articles](../articles/SKILL.md) - Device documentation
- [Hudu Websites](../websites/SKILL.md) - Website monitoring
- [Hudu API Patterns](../api-patterns/SKILL.md) - API reference
