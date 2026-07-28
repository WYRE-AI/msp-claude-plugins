# Liongard Inspections Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid launchpoint data | Check required fields |
| 401 | Unauthorized | Verify API key |
| 404 | Launchpoint not found | Confirm launchpoint ID |
| 404 | Inspector not found | Verify inspector ID exists |
| 409 | Duplicate launchpoint | Name must be unique per environment |
| 422 | Invalid schedule | Check cron expression syntax |
| 429 | Rate limited | Wait and retry (300 req/min) |

## Inspection Run Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Agent offline | Agent not reporting | Check agent host connectivity |
| Authentication failed | Bad credentials | Update launchpoint credentials |
| Target unreachable | Network issue | Verify firewall rules and DNS |
| Timeout | Inspection took too long | Check target system performance |
| Inspector error | Bug in inspector | Update inspector or contact support |
