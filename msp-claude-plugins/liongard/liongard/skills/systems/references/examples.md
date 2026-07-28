# Liongard Systems Examples

## Finding Systems by Environment

Page through every system in one environment:

```javascript
async function getEnvironmentSystems(environmentId) {
  const systems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://${instance}.app.liongard.com/api/v1/systems?environmentId=${environmentId}&page=${page}&pageSize=500`,
      {
        headers: { 'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY }
      }
    );

    const data = await response.json();
    systems.push(...data.Data);
    hasMore = data.HasMoreRows;
    page++;
  }

  return systems;
}
```

## Extracting Configuration Data

Pull a single configuration subtree via a dataprint instead of fetching the
whole system detail:

```javascript
async function getPasswordPolicy(systemDetailId) {
  const response = await fetch(
    `https://${instance}.app.liongard.com/api/v2/dataprints-evaluate-systemdetailid`,
    {
      method: 'POST',
      headers: {
        'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        SystemDetailID: systemDetailId,
        Expression: 'Data.PasswordPolicy'
      })
    }
  );

  return response.json();
}
```
