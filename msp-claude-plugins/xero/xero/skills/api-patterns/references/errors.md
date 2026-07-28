# Xero API Errors, Rate Limits, and Retry Handling

## HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check request format and required fields |
| 401 | Unauthorized | Refresh access token |
| 403 | Forbidden | Check tenant ID and scopes |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Wait and retry with backoff |
| 500 | Server Error | Retry with backoff |

## Validation Error Response

Xero returns validation errors as an array within the resource, with an HTTP 200 status:

```json
{
  "Id": "...",
  "Status": "OK",
  "Invoices": [
    {
      "InvoiceID": "00000000-0000-0000-0000-000000000000",
      "HasErrors": true,
      "ValidationErrors": [
        {
          "Message": "Account code '999' is not a valid code for this document."
        },
        {
          "Message": "A Contact is required to create an Invoice."
        }
      ]
    }
  ]
}
```

## Error Handling Pattern

```javascript
function handleXeroResponse(data, resourceName) {
  const resources = data[resourceName] || [];

  for (const resource of resources) {
    if (resource.HasErrors && resource.ValidationErrors) {
      const errors = resource.ValidationErrors.map(e => e.Message);
      throw new Error(`Validation errors: ${errors.join('; ')}`);
    }
  }

  return resources;
}
```

## Rate Limit Headers

| Header | Description |
|--------|-------------|
| `X-Rate-Limit-Problem` | Present when rate limited |
| `Retry-After` | Seconds to wait before retry |

## Rate Limit Response

When rate limited (HTTP 429):

```json
{
  "Type": "RateLimitException",
  "Message": "Rate limit exceeded. Please wait before making more requests.",
  "Detail": "Minute rate limit exceeded"
}
```

## Retry Strategy

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      const jitter = Math.random() * 5000;
      console.log(`Rate limited. Retrying in ${retryAfter}s...`);
      await new Promise(r => setTimeout(r, retryAfter * 1000 + jitter));
      continue;
    }

    if (response.status >= 500) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.log(`Server error ${response.status}. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    return response;
  }

  throw new Error(`Max retries (${maxRetries}) exceeded`);
}
```
