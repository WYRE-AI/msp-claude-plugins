# Liongard Detection Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid filter conditions | Check condition syntax |
| 401 | Unauthorized | Verify API key |
| 404 | Detection not found | Confirm detection ID |
| 404 | Alert rule not found | Confirm alert ID |
| 422 | Invalid metric expression | Check JMESPath syntax |
| 429 | Rate limited | Wait and retry (300 req/min) |

## Metric Evaluation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Expression error | Invalid JMESPath in metric | Fix the metric expression |
| No data | System has no detail data | Run an inspection first |
| Type mismatch | Threshold type doesn't match value | Align threshold with data type |
