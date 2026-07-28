# Hudu Passwords Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide password name |
| 400 | Company is required | Include company_id |
| 401 | Invalid API key | Check HUDU_API_KEY |
| 403 | Password access denied | API key lacks password permission |
| 404 | Password not found | Verify password ID |
| 422 | Validation failed | Check required fields |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Company required | No company_id | Include company_id |
| Access denied | API key lacks permission | Enable password access on API key |
| Invalid folder | Bad folder_id | Query password folders first |

## Secure Error Handling

```javascript
async function safeGetPassword(passwordId) {
  try {
    return await getAssetPassword(passwordId);
  } catch (error) {
    if (error.status === 403) {
      console.log('Password access denied. API key may lack password permission.');
      return null;
    }

    if (error.status === 404) {
      console.log('Password not found.');
      return null;
    }

    throw error;
  }
}
```
