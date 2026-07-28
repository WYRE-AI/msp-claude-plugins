# Xero Accounts Error Reference

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| 400 | Account code already exists | Duplicate account code | Choose a unique code |
| 400 | Account code is required | Missing `Code` field | Add `Code` to the request |
| 400 | Account name is required | Missing `Name` field | Add `Name` to the request |
| 400 | Invalid account type | Wrong `Type` value | Use a valid account type |
| 400 | Cannot delete account with transactions | Account has transactions | Archive the account instead |
| 400 | System accounts cannot be modified | Modifying a Xero-managed account | System accounts are read-only |
| 401 | Unauthorized | Access token expired or invalid | Refresh the access token |
