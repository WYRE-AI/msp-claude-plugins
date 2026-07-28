# IT Glue Configurations — Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide configuration name |
| 400 | Organization required | Include organization-id |
| 401 | Invalid API key | Check IT_GLUE_API_KEY |
| 404 | Configuration not found | Verify configuration ID |
| 422 | Invalid type ID | Query valid type IDs first |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Organization required | No org ID | Include organization-id |
| Invalid type | Bad type ID | Query /configuration-types |
| Invalid status | Bad status ID | Query /configuration-statuses |
| Invalid IP format | Malformed IP | Use valid IPv4/IPv6 format |

## Error Recovery Pattern

```javascript
async function safeCreateConfiguration(data) {
  try {
    return await createConfiguration(data);
  } catch (error) {
    if (error.status === 422) {
      const errors = error.errors || [];

      // Handle missing type
      if (errors.some(e => e.detail?.includes('configuration-type'))) {
        const types = await getConfigurationTypes();
        console.log('Valid configuration types:', types);
      }

      // Handle duplicate
      if (errors.some(e => e.detail?.includes('already been taken'))) {
        return await findConfigurationByName(data['organization-id'], data.name);
      }
    }

    throw error;
  }
}
```
