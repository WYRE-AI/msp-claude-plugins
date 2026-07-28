# Passwords Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide password name |
| 400 | Organization required | Include organization-id |
| 401 | Invalid API key | Check IT_GLUE_API_KEY |
| 403 | Access denied | User lacks permission |
| 404 | Password not found | Verify password ID |
| 422 | Invalid category | Query valid category IDs |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Organization required | No org ID | Include organization-id |
| Invalid category | Bad category ID | Query /password-categories |
| Invalid folder | Bad folder ID | Query /password-folders |

## Secure Error Handling

```javascript
async function safeGetPassword(passwordId) {
  try {
    return await getPassword(passwordId, { show_password: true });
  } catch (error) {
    if (error.status === 403) {
      // Don't leak that the password exists
      console.log('Password access denied or not found');
      return null;
    }

    if (error.status === 404) {
      console.log('Password not found');
      return null;
    }

    // Log security event for unexpected errors
    await logSecurityEvent({
      event: 'password_access_error',
      passwordId: passwordId,
      error: error.status,
      timestamp: new Date()
    });

    throw error;
  }
}
```
