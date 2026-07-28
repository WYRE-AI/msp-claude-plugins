# Liongard API Error Reference

## HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created successfully |
| 400 | Bad Request | Check request format/values |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |
