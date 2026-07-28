# Flexible Assets Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Organization required | Include organization-id |
| 400 | Type required | Include flexible-asset-type-id |
| 401 | Invalid API key | Check IT_GLUE_API_KEY |
| 404 | Asset not found | Verify asset ID |
| 422 | Invalid trait value | Check field type requirements |
| 422 | Required field missing | Provide all required traits |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Organization required | No org ID | Include organization-id |
| Type required | No type ID | Include flexible-asset-type-id |
| Invalid trait | Wrong data type | Match field type |
| Required trait | Missing required field | Add trait value |
| Invalid tag | Bad resource ID | Verify tagged resource exists |

## Error Recovery Pattern

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
