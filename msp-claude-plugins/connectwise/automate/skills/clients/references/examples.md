# Additional Client Examples

## Safe Client Deletion

```javascript
async function safeDeleteClient(apiClient, clientId, options = {}) {
  const { force = false, moveComputersTo = null } = options;

  // Check for computers
  const computers = await apiClient.request(
    `/Clients/${clientId}/Computers`
  );

  if (computers.length > 0) {
    if (!force && !moveComputersTo) {
      return {
        success: false,
        error: `Client has ${computers.length} computer(s)`,
        computers: computers.map(c => c.Name)
      };
    }

    if (moveComputersTo) {
      // Move computers to another client
      for (const computer of computers) {
        await apiClient.request(`/Computers/${computer.ComputerID}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ClientID: moveComputersTo.clientId,
            LocationID: moveComputersTo.locationId
          })
        });
        await sleep(100);
      }
    }
  }

  // Delete the client
  await apiClient.request(`/Clients/${clientId}`, {
    method: 'DELETE'
  });

  return { success: true };
}
```
