# IT Glue API Patterns — Code Examples

## Efficient Pagination Pattern

```javascript
async function fetchAllOrganizations() {
  const allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${baseUrl}/organizations?page[size]=1000&page[number]=${page}`,
      { headers: { 'x-api-key': apiKey } }
    );

    const data = await response.json();
    allItems.push(...data.data);

    hasMore = data.meta['next-page'] !== null;
    page++;
  }

  return allItems;
}
```

## Retry Strategy

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        const jitter = Math.random() * 5000;
        await sleep(retryAfter * 1000 + jitter);
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
