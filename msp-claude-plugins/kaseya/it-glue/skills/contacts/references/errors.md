# IT Glue Contacts — Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Organization required | Include organization-id |
| 401 | Invalid API key | Check IT_GLUE_API_KEY |
| 404 | Contact not found | Verify contact ID |
| 422 | Invalid contact type | Query valid type IDs first |
| 422 | Invalid email format | Check email syntax |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Organization required | No org ID | Include organization-id |
| Invalid type | Bad type ID | Query /contact-types |
| Invalid email | Malformed email | Use valid email format |
| Name required | No first or last name | Provide at least one name |

## Error Recovery Pattern

```javascript
async function safeCreateContact(data) {
  try {
    return await createContact(data);
  } catch (error) {
    if (error.status === 422) {
      const errors = error.errors || [];

      // Handle invalid email
      if (errors.some(e => e.detail?.includes('email'))) {
        console.log('Invalid email format. Removing invalid emails.');
        data['contact-emails'] = data['contact-emails']?.filter(
          e => isValidEmail(e.value)
        );
        return await createContact(data);
      }

      // Handle missing contact type
      if (errors.some(e => e.detail?.includes('contact-type'))) {
        const types = await getContactTypes();
        console.log('Valid contact types:', types);
      }
    }

    throw error;
  }
}
```
