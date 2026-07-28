# Hudu Assets Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide asset name |
| 400 | Company is required | Include company_id |
| 400 | Asset layout is required | Include asset_layout_id |
| 401 | Invalid API key | Check HUDU_API_KEY |
| 404 | Asset not found | Verify asset ID |
| 422 | Validation failed | Check required custom fields per layout |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Company required | No company_id | Include company_id |
| Layout required | No asset_layout_id | Include asset_layout_id |
| Invalid layout | Bad asset_layout_id | Query /asset_layouts first |
| Required field missing | Layout requires a field | Check layout fields and provide required ones |

## Error Recovery Pattern

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
