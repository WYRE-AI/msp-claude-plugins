# Liongard Environments Examples

## Bulk Status Update

To update multiple environments at once, iterate with rate limiting:

```javascript
async function bulkUpdateStatus(environmentIds, status) {
  const results = [];

  for (const id of environmentIds) {
    const result = await fetch(
      `https://${instance}.app.liongard.com/api/v1/environments/${id}`,
      {
        method: 'PUT',
        headers: {
          'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Status: status })
      }
    );

    results.push({ id, success: result.ok });

    // Respect rate limits
    await sleep(200);
  }

  return results;
}
```

## Export All Environments

```javascript
async function exportAllEnvironments() {
  const environments = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://${instance}.app.liongard.com/api/v1/environments?page=${page}&pageSize=500`,
      {
        headers: { 'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY }
      }
    );

    const data = await response.json();
    environments.push(...data.Data);
    hasMore = data.HasMoreRows;
    page++;
  }

  return environments;
}
```
