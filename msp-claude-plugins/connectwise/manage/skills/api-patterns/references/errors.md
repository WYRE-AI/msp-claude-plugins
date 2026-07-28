# ConnectWise PSA API Error Reference

## HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created |
| 204 | No Content | Delete successful |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify credentials |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 409 | Conflict | Record locked/modified |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |

## Error Response Format

```json
{
  "code": "InvalidArgument",
  "message": "The value 'invalid' is not valid for field 'status/id'.",
  "errors": [
    {
      "code": "InvalidArgument",
      "message": "status/id must be a valid integer",
      "field": "status/id"
    }
  ]
}
```

## Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `InvalidCredentials` | Bad auth | Verify company ID, keys |
| `MissingClientId` | No clientId header | Add clientId header |
| `InvalidArgument` | Bad field value | Check field type/values |
| `RequiredFieldMissing` | Missing required field | Add required fields |
| `RecordNotFound` | Entity doesn't exist | Verify ID exists |
| `RecordLocked` | Being edited | Retry after delay |
