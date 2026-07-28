# Xero Contacts Error Reference

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| 400 | Name must be unique | Duplicate contact name | Use a unique name, or find and reuse the existing contact |
| 400 | Name is required | Missing `Name` field | Add `Name` to the request body |
| 400 | Invalid email | Malformed email address | Fix the email format |
| 400 | Invalid phone | Malformed phone number | Fix the phone format |
| 401 | Unauthorized | Access token expired or invalid | Refresh the access token |
| 403 | Forbidden | Wrong tenant or missing scope | Check tenant ID and OAuth scopes |
| 404 | Contact not found | Bad identifier | Verify the `ContactID` |
| 429 | Rate limit exceeded | Too many requests | Wait and retry |
