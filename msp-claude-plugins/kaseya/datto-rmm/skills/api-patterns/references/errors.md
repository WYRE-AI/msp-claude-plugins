# Datto RMM API Error Handling Pattern

```javascript
class DattoAPIError extends Error {
  constructor(response, data) {
    super(data?.message || `API Error: ${response.status}`);
    this.status = response.status;
    this.errorCode = data?.errorCode;
    this.details = data?.details;
  }
}

async function handleApiResponse(response) {
  if (response.ok) {
    return response.json();
  }

  const data = await response.json().catch(() => ({}));

  switch (response.status) {
    case 401:
      throw new DattoAPIError(response, {
        ...data,
        message: 'Authentication failed. Check API credentials or refresh token.'
      });

    case 403:
      throw new DattoAPIError(response, {
        ...data,
        message: 'Permission denied. Verify API key has required permissions.'
      });

    case 404:
      throw new DattoAPIError(response, {
        ...data,
        message: 'Resource not found. Check UID validity.'
      });

    case 429:
      throw new DattoAPIError(response, {
        ...data,
        message: 'Rate limited. Implement backoff strategy.'
      });

    default:
      throw new DattoAPIError(response, data);
  }
}
```
