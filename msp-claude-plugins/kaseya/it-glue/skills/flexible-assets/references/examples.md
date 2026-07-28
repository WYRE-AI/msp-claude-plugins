# Flexible Assets Workflow Examples

## Create Flexible Asset from Template

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

## Find Flexible Assets by Type

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

## Update Tagged Resources

```javascript
async function updateFlexibleAssetTags(assetId, fieldName, newTagIds) {
  return await updateFlexibleAsset(assetId, {
    traits: {
      [fieldName]: newTagIds
    }
  });
}
```

## Export Flexible Asset Data

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

## Flexible Asset Health Check

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

## Clone Flexible Asset to Another Org

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
