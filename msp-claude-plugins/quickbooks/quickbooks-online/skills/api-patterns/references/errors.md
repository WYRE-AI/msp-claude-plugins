# QuickBooks Online Error Reference

## HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 401 | Unauthorized | Refresh access token |
| 403 | Forbidden | Check OAuth scopes |
| 404 | Not Found | Check realmId and entity ID |
| 429 | Rate Limited | Back off and retry |
| 400 | Bad Request | Check request format |
| 500 | Server Error | Retry with backoff |
| 503 | Service Unavailable | Retry with backoff |

## Fault Object Format

QBO returns errors in a structured `Fault` object:

```json
{
  "Fault": {
    "Error": [
      {
        "Message": "Object Not Found",
        "Detail": "Object Not Found : Something you're trying to use has been made inactive. Check the fields with accounts, customers, items, vendors or employees.",
        "code": "610",
        "element": ""
      }
    ],
    "type": "ValidationFault"
  },
  "time": "2026-02-23T10:00:00.000-07:00"
}
```

## Rate Limit Response

When rate limited, QBO returns HTTP 429:

```json
{
  "Fault": {
    "Error": [
      {
        "Message": "Request throttled",
        "Detail": "Rate limit reached. Please retry later.",
        "code": "3001"
      }
    ],
    "type": "THROTTLE"
  },
  "time": "2026-02-23T10:00:00.000-07:00"
}
```

## Common Error Codes

| Code | Type | Message | Resolution |
|------|------|---------|------------|
| 610 | ValidationFault | Object Not Found | Check entity ID or referenced objects |
| 6240 | ValidationFault | Duplicate Name | Use a unique DisplayName |
| 5010 | ValidationFault | Stale Object | Re-fetch SyncToken and retry |
| 3001 | THROTTLE | Request throttled | Implement backoff |
| 3200 | AuthenticationFault | Auth failed | Refresh access token |

## Error Handling Pattern

```javascript
function handleQboError(response, body) {
  if (!body.Fault) return;

  const fault = body.Fault;
  const errors = fault.Error || [];
  const firstError = errors[0] || {};

  switch (fault.type) {
    case 'AuthenticationFault':
      console.log('Authentication failed. Refresh your access token.');
      break;
    case 'AuthorizationFault':
      console.log('Insufficient permissions. Check OAuth scopes.');
      break;
    case 'ValidationFault':
      if (firstError.code === '5010') {
        console.log('Stale object. Re-fetch the entity and retry with updated SyncToken.');
      } else if (firstError.code === '6240') {
        console.log('Duplicate name. Use a unique DisplayName.');
      } else {
        console.log(`Validation error: ${firstError.Message} - ${firstError.Detail}`);
      }
      break;
    case 'THROTTLE':
      console.log('Rate limited. Wait before retrying.');
      break;
    default:
      console.log(`Unknown error: ${JSON.stringify(fault)}`);
  }
}
```
