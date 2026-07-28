# Liongard API Client Examples

## Efficient Pagination Pattern

```javascript
async function fetchAllItems(endpoint) {
  const allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://${instance}.app.liongard.com/api/v1/${endpoint}?page=${page}&pageSize=500`,
      {
        headers: {
          'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY
        }
      }
    );

    const data = await response.json();
    allItems.push(...data.Data);

    hasMore = data.HasMoreRows;
    page++;

    // Respect rate limits
    if (hasMore) {
      await sleep(200);
    }
  }

  return allItems;
}
```

## Retry Strategy with Exponential Backoff

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After')) || 30;
        const jitter = Math.random() * 1000;
        console.log(`Rate limited. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000 + jitter);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## Error Handling Pattern

```javascript
async function handleLiongardRequest(endpoint, options = {}) {
  const baseUrl = `https://${process.env.LIONGARD_INSTANCE}.app.liongard.com/api/v1`;

  const response = await fetch(`${baseUrl}/${endpoint}`, {
    ...options,
    headers: {
      'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    switch (response.status) {
      case 401:
        throw new Error('Invalid API key. Check LIONGARD_API_KEY.');
      case 403:
        throw new Error('Permission denied. Check API key permissions.');
      case 404:
        throw new Error(`Resource not found: ${endpoint}`);
      case 429:
        throw new Error('Rate limit exceeded. Implement backoff.');
      default:
        throw new Error(error.Message || `API error: ${response.status}`);
    }
  }

  return response.json();
}
```
