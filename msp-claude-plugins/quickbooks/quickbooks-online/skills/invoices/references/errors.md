# QuickBooks Online Invoice Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 6000 | Business Validation | Check line item amounts and required fields |
| 6140 | Duplicate DocNumber | Use a different invoice number or let QBO auto-assign |
| 610 | Object Not Found | Verify CustomerRef, ItemRef, or Invoice ID |
| 5010 | Stale Object | Re-fetch SyncToken and retry |
| 2050 | Invalid Reference | Check CustomerRef, ItemRef, SalesTermRef values |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| CustomerRef required | Missing customer | Add CustomerRef.value to request |
| Line required | No line items | Add at least one Line item |
| Invalid ItemRef | Bad item ID | Query Items for valid IDs |
| Amount mismatch | Qty x UnitPrice != Amount | Ensure Amount = Qty * UnitPrice |

## Error Recovery Pattern

```javascript
async function safeCreateInvoice(data) {
  try {
    return await createInvoice(data);
  } catch (error) {
    const fault = error.Fault;
    if (!fault) throw error;

    const errorCode = fault.Error?.[0]?.code;

    if (errorCode === '6140') {
      // Duplicate DocNumber -- remove and let QBO auto-assign
      delete data.DocNumber;
      return await createInvoice(data);
    }

    if (errorCode === '610') {
      // Invalid reference -- log details for debugging
      console.log('Invalid reference. Verify CustomerRef and ItemRef values.');
      console.log('Detail:', fault.Error[0].Detail);
    }

    throw error;
  }
}
```
