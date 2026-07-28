# Liongard Detection Examples

## Detection Management Workflow

Fetch and categorize new detections for an environment:

```javascript
async function processNewDetections(environmentId) {
  // Fetch new detections for the environment
  const response = await fetch(
    `https://${instance}.app.liongard.com/api/v1/detections`,
    {
      method: 'POST',
      headers: {
        'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Pagination: { Page: 1, PageSize: 100 },
        conditions: [
          { path: 'EnvironmentID', op: 'eq', value: environmentId },
          { path: 'Status', op: 'eq', value: 'New' }
        ],
        orderBy: [{ path: 'Severity', direction: 'asc' }]
      })
    }
  );

  const data = await response.json();

  // Categorize by severity
  const critical = data.Data.filter(d => d.Severity === 'Critical');
  const high = data.Data.filter(d => d.Severity === 'High');
  const medium = data.Data.filter(d => d.Severity === 'Medium');
  const low = data.Data.filter(d => d.Severity === 'Low');

  return {
    total: data.TotalRows,
    critical: critical.length,
    high: high.length,
    medium: medium.length,
    low: low.length,
    detections: data.Data
  };
}
```
