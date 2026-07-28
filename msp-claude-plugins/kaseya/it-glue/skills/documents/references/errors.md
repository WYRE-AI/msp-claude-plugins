# Documents Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide document name |
| 400 | Organization required | Include organization-id |
| 401 | Invalid API key | Check IT_GLUE_API_KEY |
| 404 | Document not found | Verify document ID |
| 404 | POST /publish returns 404 | Use **PATCH** not POST for publish |
| 422 | Invalid folder | Query valid folder IDs |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Organization required | No org ID | Include organization-id |
| Invalid folder | Bad folder ID | Query /document-folders |
| Content too large | Exceeds size limit | Reduce content size |

## Error Recovery Pattern

```javascript
async function safeCreateDocument(data) {
  try {
    return await createDocument(data);
  } catch (error) {
    if (error.status === 422) {
      const errors = error.errors || [];

      // Handle invalid folder
      if (errors.some(e => e.detail?.includes('folder'))) {
        console.log('Invalid folder. Creating at root level.');
        delete data['document-folder-id'];
        return await createDocument(data);
      }
    }

    throw error;
  }
}
```
