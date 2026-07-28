# Checkpoint Avanan API Error Reference

## Error Response Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The field 'startDate' is required for list operations.",
    "details": [
      {
        "field": "startDate",
        "message": "This field is required"
      }
    ]
  }
}
```

## Common Error Scenarios

| Error Code | Scenario | Resolution |
|------------|----------|------------|
| `INVALID_TOKEN` | Token expired or malformed | Re-authenticate and obtain new token |
| `INVALID_REQUEST` | Missing or invalid parameters | Check request against API docs |
| `ENTITY_NOT_FOUND` | Quarantine/threat/incident not found | Verify entity ID |
| `ALREADY_PROCESSED` | Email already released/deleted | No action needed |
| `PERMISSION_DENIED` | API key lacks required scope | Update API key permissions |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement backoff strategy |
| `DATE_RANGE_EXCEEDED` | Date range exceeds 90 days | Narrow the date range |
