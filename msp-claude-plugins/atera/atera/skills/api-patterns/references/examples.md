# Atera API Code Examples

Reference implementations for pagination, retry, throttling, error handling,
and performance patterns against the Atera v3 REST API.

## Efficient Pagination

```javascript
async function fetchAllItems(endpoint) {
  const allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://app.atera.com/api/v3/${endpoint}?page=${page}&itemsInPage=50`,
      {
        headers: {
          'X-API-KEY': process.env.ATERA_API_KEY
        }
      }
    );

    const data = await response.json();
    allItems.push(...data.items);

    hasMore = page < data.totalPages;
    page++;

    // Respect rate limits
    if (hasMore) {
      await sleep(100); // 100ms between requests
    }
  }

  return allItems;
}
```

## Retry with Exponential Backoff

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        // Rate limited - wait and retry
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

      // Exponential backoff with jitter
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

## Request Throttling

```javascript
class RateLimiter {
  constructor(maxRequests = 700, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();

    // Remove requests outside window
    this.requests = this.requests.filter(t => t > now - this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      // Wait until oldest request expires
      const waitTime = this.requests[0] - (now - this.windowMs) + 100;
      await sleep(waitTime);
    }

    this.requests.push(Date.now());
  }
}

const limiter = new RateLimiter();

async function makeRequest(endpoint) {
  await limiter.throttle();
  return fetch(`https://app.atera.com/api/v3/${endpoint}`, {
    headers: { 'X-API-KEY': process.env.ATERA_API_KEY }
  });
}
```

## Error Handling Wrapper

```javascript
async function handleAteraRequest(endpoint, options = {}) {
  const response = await fetch(
    `https://app.atera.com/api/v3/${endpoint}`,
    {
      ...options,
      headers: {
        'X-API-KEY': process.env.ATERA_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    switch (response.status) {
      case 401:
        throw new Error('Invalid API key. Check ATERA_API_KEY.');
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

## Batch Operations

When processing multiple items, batch requests:

```javascript
async function batchProcess(items, batchSize = 10, delayMs = 1000) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );

    results.push(...batchResults);

    // Delay between batches to respect rate limits
    if (i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }

  return results;
}
```

## Caching Strategy

Cache slowly-changing data to reduce API calls:

```javascript
const cache = new Map();

async function getCachedData(key, fetchFn, ttlMs = 300000) {
  const cached = cache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs
  });

  return data;
}

// Usage
const customers = await getCachedData(
  'customers',
  () => fetchAllItems('customers'),
  5 * 60 * 1000 // 5 minute cache
);
```

## Parallel Requests

For independent requests, use parallel execution:

```javascript
const [tickets, agents, alerts] = await Promise.all([
  fetchAllItems('tickets'),
  fetchAllItems('agents'),
  fetchAllItems('alerts')
]);
```
