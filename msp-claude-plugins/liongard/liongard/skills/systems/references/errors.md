# Liongard Systems Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid system ID | Verify system exists |
| 401 | Unauthorized | Check API key |
| 404 | System not found | Confirm system ID |
| 404 | System detail not found | System may not have been inspected yet |
| 422 | Invalid JMESPath expression | Check expression syntax |
| 429 | Rate limited | Wait and retry (300 req/min) |

## JMESPath Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Invalid expression | Syntax error in JMESPath | Validate expression syntax |
| Null result | Path doesn't exist in data | Check available data fields |
| Type mismatch | Comparing incompatible types | Verify field types |
