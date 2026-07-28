# ConnectWise Automate API - Error Reference

## HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created |
| 204 | No Content | Success, no body |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Refresh token |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Retry with backoff |
| 503 | Unavailable | Server maintenance |

## Error Response Format

```json
{
  "error": {
    "code": "BadRequest",
    "message": "Invalid filter syntax in condition parameter",
    "details": {
      "field": "condition",
      "value": "Status == 'Online'"
    }
  }
}
```

## Error Handling Pattern

```javascript
class AutomateAPIError extends Error {
  constructor(response, data) {
    super(data?.error?.message || `API Error: ${response.status}`);
    this.status = response.status;
    this.code = data?.error?.code;
    this.details = data?.error?.details;
  }
}

async function handleApiResponse(response) {
  if (response.ok) {
    // Handle empty response
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  const data = await response.json().catch(() => ({}));

  switch (response.status) {
    case 401:
      throw new AutomateAPIError(response, {
        error: {
          code: 'Unauthorized',
          message: 'Token expired or invalid. Re-authenticate.'
        }
      });

    case 403:
      throw new AutomateAPIError(response, {
        error: {
          code: 'Forbidden',
          message: 'Permission denied. Check user rights.'
        }
      });

    case 404:
      throw new AutomateAPIError(response, {
        error: {
          code: 'NotFound',
          message: 'Resource not found.'
        }
      });

    case 429:
      throw new AutomateAPIError(response, {
        error: {
          code: 'RateLimited',
          message: 'Too many requests. Implement backoff.'
        }
      });

    default:
      throw new AutomateAPIError(response, data);
  }
}
```
