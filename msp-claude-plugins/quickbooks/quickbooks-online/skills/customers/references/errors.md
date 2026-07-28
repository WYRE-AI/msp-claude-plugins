# QuickBooks Online Customer Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 6240 | Duplicate Name | Use a unique DisplayName |
| 610 | Object Not Found | Verify customer ID |
| 5010 | Stale Object | Re-fetch SyncToken and retry |
| 2050 | Invalid Reference | Check ParentRef or SalesTermRef values |
| 3200 | Auth Failed | Refresh access token |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| DisplayName required | Missing DisplayName | Add DisplayName to request |
| Duplicate DisplayName | Name already exists | Use unique name or append qualifier |
| Invalid ParentRef | Non-existent parent | Verify parent customer ID |
| Invalid SalesTermRef | Bad term ID | Query Terms entity for valid IDs |

## Error Recovery Pattern

```javascript
async function safeCreateCustomer(data) {
  try {
    return await createCustomer(data);
  } catch (error) {
    const fault = error.Fault;
    if (!fault) throw error;

    const errorCode = fault.Error?.[0]?.code;

    if (errorCode === '6240') {
      // Duplicate -- find existing customer
      const existing = await qboQuery(
        `SELECT * FROM Customer WHERE DisplayName = '${data.DisplayName}'`
      );
      return existing.QueryResponse.Customer?.[0];
    }

    if (errorCode === '5010') {
      // Stale SyncToken -- re-fetch and retry
      const fresh = await getCustomer(data.Id);
      data.SyncToken = fresh.SyncToken;
      return await updateCustomer(data);
    }

    throw error;
  }
}
```
