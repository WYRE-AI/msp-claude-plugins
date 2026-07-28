# Hudu Articles Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide article name |
| 401 | Invalid API key | Check HUDU_API_KEY |
| 404 | Article not found | Verify article ID |
| 422 | Validation failed | Check required fields |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Invalid folder | Bad folder_id | Query /folders first |
| Invalid company | Bad company_id | Query /companies first |

## Error Recovery Pattern

```javascript
async function safeCreateArticle(data) {
  try {
    return await createArticle(data);
  } catch (error) {
    if (error.status === 422) {
      // Handle invalid folder
      if (error.message?.includes('folder')) {
        console.log('Invalid folder. Creating at root level.');
        delete data.folder_id;
        return await createArticle(data);
      }
    }

    throw error;
  }
}
```
