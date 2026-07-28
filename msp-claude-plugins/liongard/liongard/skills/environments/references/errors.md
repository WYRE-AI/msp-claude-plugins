# Liongard Environments Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid environment data | Verify required fields |
| 401 | Unauthorized | Check API key validity |
| 403 | Forbidden | Verify API key permissions |
| 404 | Environment not found | Confirm environment ID exists |
| 409 | Duplicate name | Environment name must be unique |
| 429 | Rate limited | Wait and retry (300 req/min) |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing Name field | Add environment name |
| Name too long | Name exceeds max length | Shorten name |
| Invalid status | Unrecognized status value | Use Active or Inactive |
| Duplicate name | Environment name already exists | Use unique name |
