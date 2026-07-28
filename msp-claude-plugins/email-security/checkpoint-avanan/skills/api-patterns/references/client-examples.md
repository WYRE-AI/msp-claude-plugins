# Checkpoint Avanan API Client Code Examples

## Token Refresh Pattern

```javascript
class CheckpointAuth {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.token = null;
    this.expiresAt = 0;
  }

  async getToken() {
    // Refresh 5 minutes before expiry
    if (this.token && Date.now() < this.expiresAt - 300000) {
      return this.token;
    }

    const response = await fetch(
      'https://cloudinfra-gw.portal.checkpoint.com/auth/external',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          accessKey: this.clientSecret
        })
      }
    );

    const data = await response.json();
    this.token = data.data.token;
    this.expiresAt = Date.now() + (data.data.expiresIn * 1000);
    return this.token;
  }
}
```

## Pagination Helper

```javascript
async function fetchAllPages(endpoint, params) {
  const allItems = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${endpoint}?${new URLSearchParams({
      ...params,
      limit: limit.toString(),
      offset: offset.toString()
    })}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    allItems.push(...data.data);

    hasMore = data.pagination.hasMore;
    offset += limit;
  }

  return allItems;
}
```

## Retry Strategy with Backoff

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '30');
        const jitter = Math.random() * 2000;
        await sleep(retryAfter * 1000 + jitter);
        continue;
      }

      if (response.status === 401) {
        // Token expired - refresh and retry
        options.headers['Authorization'] = `Bearer ${await auth.getToken()}`;
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

## Performance Optimization Examples

### Minimize API Calls

```javascript
// Good: Fetch related data in one request with includes
const threat = await client.threats.get('threat-abc123', {
  include: ['iocs', 'timeline', 'relatedEmails']
});

// Avoid: Multiple separate requests
const threat = await client.threats.get('threat-abc123');
const iocs = await client.threats.getIOCs('threat-abc123');
const timeline = await client.threats.getTimeline('threat-abc123');
```

### Parallelize Independent Requests

```javascript
// Good: Independent endpoints in parallel
const [quarantine, threats, incidents] = await Promise.all([
  client.quarantine.list({ startDate, endDate }),
  client.threats.list({ startDate, endDate }),
  client.incidents.list({ startDate, endDate })
]);

// Avoid: Sequential requests for independent data
const quarantine = await client.quarantine.list({ startDate, endDate });
const threats = await client.threats.list({ startDate, endDate });
const incidents = await client.incidents.list({ startDate, endDate });
```
