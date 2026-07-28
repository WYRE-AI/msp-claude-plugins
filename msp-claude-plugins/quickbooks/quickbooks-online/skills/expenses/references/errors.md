# QuickBooks Online Expense Error Reference

## Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 6000 | Business Validation | Check account refs and line amounts |
| 610 | Object Not Found | Verify AccountRef, VendorRef, or CustomerRef |
| 5010 | Stale Object | Re-fetch SyncToken and retry |
| 6240 | Duplicate Name | Use unique vendor DisplayName |
| 2050 | Invalid Reference | Check referenced entity IDs |

## Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| PaymentType required | Missing payment type | Add "Cash", "Check", or "CreditCard" |
| AccountRef required | Missing bank/CC account | Add AccountRef.value |
| Line required | No line items | Add at least one Line item |
| Invalid AccountRef | Bad account ID | Query Account for valid IDs |

## Error Recovery Pattern

```javascript
async function safeCreatePurchase(data) {
  try {
    return await createPurchase(data);
  } catch (error) {
    const fault = error.Fault;
    if (!fault) throw error;

    const detail = fault.Error?.[0]?.Detail || '';

    if (detail.includes('inactive')) {
      console.log('Referenced account or vendor is inactive. Reactivate or use a different reference.');
    }

    if (detail.includes('AccountRef')) {
      console.log('Invalid account reference. Query Accounts to find valid IDs.');
    }

    throw error;
  }
}
```
