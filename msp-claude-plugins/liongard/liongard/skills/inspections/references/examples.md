# Liongard Inspections Examples

## Batch Run Inspections

To trigger multiple inspections for an environment:

```javascript
async function runAllInspections(environmentId) {
  // Get all launchpoints for the environment
  const response = await fetch(
    `https://${instance}.app.liongard.com/api/v1/launchpoints?environmentId=${environmentId}&pageSize=500`,
    {
      headers: { 'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY }
    }
  );

  const data = await response.json();
  const results = [];

  for (const lp of data.Data) {
    if (lp.Status !== 'Active') continue;

    const runResult = await fetch(
      `https://${instance}.app.liongard.com/api/v1/launchpoints/${lp.ID}/run`,
      {
        method: 'POST',
        headers: { 'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY }
      }
    );

    results.push({
      launchpointId: lp.ID,
      name: lp.Name,
      success: runResult.ok
    });

    // Stagger requests
    await sleep(500);
  }

  return results;
}
```
