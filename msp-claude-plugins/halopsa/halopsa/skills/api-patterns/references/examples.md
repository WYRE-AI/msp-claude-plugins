# HaloPSA API Code Patterns

## Pagination Loop

```javascript
async function fetchAllTickets(filters = {}) {
  const allTickets = [];
  let pageNo = 1;
  const pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      ...filters,
      page_no: pageNo,
      page_size: pageSize
    });

    const response = await fetch(`${baseUrl}/api/Tickets?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    allTickets.push(...data.tickets);

    hasMore = data.tickets.length === pageSize;
    pageNo++;
  }

  return allTickets;
}
```

## Retry Strategy

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
        const jitter = Math.random() * 5000;
        console.log(`Rate limited. Waiting ${retryAfter}s + jitter`);
        await sleep(retryAfter * 1000 + jitter);
        continue;
      }

      if (response.status === 401) {
        // Token expired, refresh and retry
        await refreshToken();
        options.headers['Authorization'] = `Bearer ${accessToken}`;
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff with jitter
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await sleep(delay);
    }
  }
}
```

## Batch Processing

```javascript
async function batchProcess(items, batchSize = 25, delayMs = 2000) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);

    // Delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }

  return results;
}
```

## Error Handling

```javascript
function handleApiError(response, data) {
  switch (response.status) {
    case 400:
      console.log('Validation Error:', data.message);
      if (data.details) {
        data.details.forEach(d => {
          console.log(`  Field: ${d.field} - ${d.message}`);
        });
      }
      break;

    case 401:
      console.log('Authentication failed - refreshing token');
      return refreshToken().then(() => retryRequest());

    case 403:
      console.log('Permission denied. Check API application permissions.');
      break;

    case 404:
      console.log('Resource not found');
      break;

    case 429:
      const retryAfter = response.headers.get('Retry-After') || 60;
      console.log(`Rate limited. Retry after ${retryAfter} seconds`);
      break;

    default:
      console.log('API Error:', data);
  }
}
```
