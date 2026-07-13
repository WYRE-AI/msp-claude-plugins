---
name: "IT Glue Flexible Assets"
description: >
  Use this skill when working with IT Glue flexible assets - custom asset types
  for structured documentation. Covers flexible asset types, field definitions,
  creating and managing instances, cross-linking with other resources, and
  building custom documentation schemas for MSP needs.
when_to_use: >-
  When working with custom asset types for structured documentation in IT Glue flexible assets.
  Use when: it glue flexible asset, custom asset, flexible asset type, it glue custom
  documentation, flexible asset field, custom documentation, structured asset, or it glue
  template.
---

# IT Glue Flexible Assets Management

## Overview

Flexible Assets in IT Glue provide customizable, structured documentation templates. Unlike free-form documents, flexible assets have defined fields and types, enabling consistent documentation across organizations and powerful filtering/searching capabilities.

## Key Concepts

### Flexible Asset Types

Flexible Asset Types define the schema for a category of documentation:

```
Flexible Asset Type: Network Overview
├── Fields:
│   ├── Primary ISP (Text)
│   ├── Backup ISP (Text)
│   ├── Public IP Addresses (Textarea)
│   ├── Firewall (Tag - Configuration)
│   ├── Network Diagram (Upload)
│   └── DNS Provider (Select)
```

### Field Types

| Type | Description | Use Case |
|------|-------------|----------|
| Text | Single line text | Names, identifiers |
| Textarea | Multi-line text | Descriptions, notes |
| Number | Numeric value | Quantities, counts |
| Date | Date picker | Expiration dates |
| Checkbox | Boolean true/false | Flags, toggles |
| Select | Dropdown selection | Predefined options |
| Tag | Link to IT Glue resource | Configurations, contacts |
| Password | Password field | Embedded credentials |
| Upload | File attachment | Diagrams, documents |
| Percent | Percentage value | Utilization, progress |
| Header | Section header | Visual organization |

### Tag Fields

Tag fields create relationships to other IT Glue resources:

| Tag Type | Links To |
|----------|----------|
| Configuration | Configuration items |
| Contact | Contacts |
| Password | Passwords |
| Document | Documents |
| Flexible Asset | Other flexible assets |
| Location | Locations |

## Field Reference

### Flexible Asset Type Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Type identifier |
| `name` | string | Type name |
| `description` | string | Type description |
| `icon` | string | Display icon |
| `enabled` | boolean | Type enabled status |

### Flexible Asset Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Asset instance identifier |
| `organization-id` | integer | Parent organization |
| `flexible-asset-type-id` | integer | Type definition |
| `name` | string | Auto-generated from name field |
| `traits` | object | Field values |

### Traits (Field Values)

```json
{
  "traits": {
    "primary-isp": "Comcast Business",
    "backup-isp": "Verizon FiOS",
    "public-ip-addresses": "203.0.113.10\n203.0.113.11",
    "firewall": {
      "type": "Tag",
      "values": [{"id": 12345, "type": "Configuration"}]
    },
    "dns-provider": "Cloudflare"
  }
}
```

## Critical: Discover Type IDs First

**Flexible asset type IDs are instance-specific** — every IT Glue account has different IDs. Never guess or hardcode type IDs. Always call `list_flexible_asset_types` first to discover what types exist, then use the returned IDs with `search_flexible_assets`.

```
Step 1: list_flexible_asset_types → get type IDs
Step 2: search_flexible_assets(flexible_asset_type_id=<id from step 1>)
```

## API Patterns

### List Flexible Asset Types

```http
GET /flexible-asset-types
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

### Get Flexible Asset Type Details

```http
GET /flexible-asset-types/123
x-api-key: YOUR_API_KEY
```

**With Field Definitions:**
```http
GET /flexible-asset-types/123?include=flexible-asset-fields
```

### List Flexible Assets

```http
GET /flexible-assets
x-api-key: YOUR_API_KEY
```

**By Organization:**
```http
GET /organizations/456/relationships/flexible-assets
```

**By Type:**
```http
GET /flexible-assets?filter[flexible-asset-type-id]=123
```

**By Organization and Type:**
```http
GET /flexible-assets?filter[organization-id]=456&filter[flexible-asset-type-id]=123
```

### Get Single Flexible Asset

```http
GET /flexible-assets/789
x-api-key: YOUR_API_KEY
```

**With Includes:**
```http
GET /flexible-assets/789?include=organization,flexible-asset-type
```

### Create Flexible Asset

```http
POST /flexible-assets
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "flexible-assets",
    "attributes": {
      "organization-id": 456,
      "flexible-asset-type-id": 123,
      "traits": {
        "name": "Acme Corp Network Overview",
        "primary-isp": "Comcast Business",
        "backup-isp": "Verizon FiOS",
        "public-ip-addresses": "203.0.113.10\n203.0.113.11",
        "dns-provider": "Cloudflare"
      }
    }
  }
}
```

### Create with Tag Fields

```json
{
  "data": {
    "type": "flexible-assets",
    "attributes": {
      "organization-id": 456,
      "flexible-asset-type-id": 123,
      "traits": {
        "name": "Main Office Network",
        "firewall": [12345],
        "core-switch": [67890],
        "network-admin": [11111]
      }
    }
  }
}
```

### Update Flexible Asset

```http
PATCH /flexible-assets/789
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "flexible-assets",
    "attributes": {
      "traits": {
        "backup-isp": "AT&T Business",
        "last-reviewed": "2024-02-15"
      }
    }
  }
}
```

### Delete Flexible Asset

```http
DELETE /flexible-assets/789
x-api-key: YOUR_API_KEY
```

## Common Flexible Asset Types

### Network Overview

```
Fields:
├── Name (Text) - Required, Name field
├── Primary ISP (Text)
├── Backup ISP (Text)
├── Public IP Addresses (Textarea)
├── Internal IP Scheme (Textarea)
├── Firewall (Tag - Configuration)
├── Core Switch (Tag - Configuration)
├── Network Diagram (Upload)
├── DNS Provider (Select)
└── Last Reviewed (Date)
```

### Application Documentation

```
Fields:
├── Name (Text) - Required, Name field
├── Description (Textarea)
├── Version (Text)
├── Vendor (Text)
├── Support Contact (Tag - Contact)
├── Primary Server (Tag - Configuration)
├── Database Server (Tag - Configuration)
├── Admin URL (Text)
├── Admin Credentials (Password)
├── License Key (Password)
├── License Expiration (Date)
├── Documentation URL (Text)
└── Notes (Textarea)
```

### Backup Overview

```
Fields:
├── Name (Text) - Required, Name field
├── Backup Solution (Select)
├── Backup Server (Tag - Configuration)
├── Retention Policy (Textarea)
├── Backup Schedule (Textarea)
├── Data Protected (Textarea)
├── Recovery Time Objective (Text)
├── Recovery Point Objective (Text)
├── Last Test Date (Date)
├── Backup Admin Credentials (Password)
└── Notes (Textarea)
```

### Microsoft 365 Tenant

```
Fields:
├── Name (Text) - Required, Name field
├── Tenant ID (Text)
├── Primary Domain (Text)
├── Additional Domains (Textarea)
├── License Summary (Textarea)
├── Admin Portal URL (Text)
├── Global Admin (Tag - Contact)
├── Admin Credentials (Password)
├── MFA Status (Select)
├── Conditional Access (Checkbox)
└── Notes (Textarea)
```

## Common Workflows

### Create Flexible Asset from Template

```javascript
async function createFlexibleAssetFromType(orgId, typeId, fieldValues) {
  // Get the type definition to understand fields
  const assetType = await getFlexibleAssetType(typeId, {
    include: 'flexible-asset-fields'
  });

  // Validate required fields
  const requiredFields = assetType.included?.filter(
    f => f.attributes.required
  ) || [];

  for (const field of requiredFields) {
    const fieldKey = field.attributes['name-key'];
    if (!fieldValues[fieldKey]) {
      throw new Error(`Required field missing: ${field.attributes.name}`);
    }
  }

  // Create the flexible asset
  return await createFlexibleAsset({
    'organization-id': orgId,
    'flexible-asset-type-id': typeId,
    traits: fieldValues
  });
}
```

### Find Flexible Assets by Type

```javascript
async function findFlexibleAssetsByType(orgId, typeName) {
  // First, find the type by name
  const types = await fetchFlexibleAssetTypes();
  const type = types.find(t =>
    t.attributes.name.toLowerCase() === typeName.toLowerCase()
  );

  if (!type) {
    throw new Error(`Flexible asset type not found: ${typeName}`);
  }

  // Then fetch assets of that type for the org
  return await fetchFlexibleAssets({
    filter: {
      'organization-id': orgId,
      'flexible-asset-type-id': type.id
    }
  });
}
```

### Update Tagged Resources

```javascript
async function updateFlexibleAssetTags(assetId, fieldName, newTagIds) {
  return await updateFlexibleAsset(assetId, {
    traits: {
      [fieldName]: newTagIds
    }
  });
}
```

### Export Flexible Asset Data

```javascript
async function exportFlexibleAssets(orgId, typeId) {
  const assets = await fetchFlexibleAssets({
    filter: {
      'organization-id': orgId,
      'flexible-asset-type-id': typeId
    }
  });

  const type = await getFlexibleAssetType(typeId, {
    include: 'flexible-asset-fields'
  });

  const fieldNames = type.included?.reduce((acc, f) => {
    acc[f.attributes['name-key']] = f.attributes.name;
    return acc;
  }, {}) || {};

  return assets.map(asset => {
    const exportData = { id: asset.id };
    Object.entries(asset.attributes.traits || {}).forEach(([key, value]) => {
      const fieldName = fieldNames[key] || key;
      exportData[fieldName] = value;
    });
    return exportData;
  });
}
```

### Flexible Asset Health Check

```javascript
async function flexibleAssetHealthCheck(orgId) {
  // Get all flexible asset types
  const types = await fetchFlexibleAssetTypes();

  const results = [];

  for (const type of types) {
    const assets = await fetchFlexibleAssets({
      filter: {
        'organization-id': orgId,
        'flexible-asset-type-id': type.id
      }
    });

    results.push({
      type: type.attributes.name,
      count: assets.length,
      hasAssets: assets.length > 0
    });
  }

  return {
    totalTypes: types.length,
    typesWithData: results.filter(r => r.hasAssets).length,
    details: results
  };
}
```

### Clone Flexible Asset to Another Org

```javascript
async function cloneFlexibleAsset(sourceAssetId, targetOrgId) {
  // Get source asset
  const source = await getFlexibleAsset(sourceAssetId);

  // Clone traits (remove tag fields that won't be valid in new org)
  const traits = { ...source.attributes.traits };

  // Note: Tag fields reference resources in the source org
  // You may need to map or remove these

  return await createFlexibleAsset({
    'organization-id': targetOrgId,
    'flexible-asset-type-id': source.attributes['flexible-asset-type-id'],
    traits: traits
  });
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Organization required | Include organization-id |
| 400 | Type required | Include flexible-asset-type-id |
| 401 | Invalid API key | Check IT_GLUE_API_KEY |
| 404 | Asset not found | Verify asset ID |
| 422 | Invalid trait value | Check field type requirements |
| 422 | Required field missing | Provide all required traits |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Organization required | No org ID | Include organization-id |
| Type required | No type ID | Include flexible-asset-type-id |
| Invalid trait | Wrong data type | Match field type |
| Required trait | Missing required field | Add trait value |
| Invalid tag | Bad resource ID | Verify tagged resource exists |

### Error Recovery Pattern

```javascript
async function safeCreateFlexibleAsset(data) {
  try {
    return await createFlexibleAsset(data);
  } catch (error) {
    if (error.status === 422) {
      const errors = error.errors || [];

      // Handle missing required fields
      const missingFields = errors.filter(e =>
        e.detail?.includes('required') || e.detail?.includes("can't be blank")
      );

      if (missingFields.length > 0) {
        console.log('Missing required fields:',
          missingFields.map(e => e.source?.pointer)
        );

        // Get type definition to see required fields
        const type = await getFlexibleAssetType(data['flexible-asset-type-id'], {
          include: 'flexible-asset-fields'
        });
        const required = type.included?.filter(f => f.attributes.required);
        console.log('Required fields:', required?.map(f => f.attributes.name));
      }

      // Handle invalid tag references
      const invalidTags = errors.filter(e =>
        e.detail?.includes('invalid') && e.source?.pointer?.includes('traits')
      );

      if (invalidTags.length > 0) {
        console.log('Invalid tag references found. Removing...');
        // Remove invalid tags and retry
        // (implementation depends on which fields are tags)
      }
    }

    throw error;
  }
}
```

## Best Practices

1. **Plan type structure** - Design flexible asset types before creating
2. **Use consistent naming** - Follow conventions for field names
3. **Leverage tags** - Link to configurations, contacts for relationships
4. **Required fields** - Mark essential fields as required
5. **Use appropriate types** - Match field type to data (date for dates, etc.)
6. **Document types** - Add descriptions to types and fields
7. **Standardize across orgs** - Use same types for all clients
8. **Regular reviews** - Update flexible asset content periodically
9. **Avoid duplicates** - One flexible asset per topic per org
10. **Export capability** - Build export for reporting needs

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Flexible asset scope
- [IT Glue Configurations](../configurations/SKILL.md) - Tag field targets
- [IT Glue Contacts](../contacts/SKILL.md) - Tag field targets
- [IT Glue Passwords](../passwords/SKILL.md) - Password fields
- [IT Glue Documents](../documents/SKILL.md) - Alternative documentation
- [IT Glue API Patterns](../api-patterns/SKILL.md) - API reference
