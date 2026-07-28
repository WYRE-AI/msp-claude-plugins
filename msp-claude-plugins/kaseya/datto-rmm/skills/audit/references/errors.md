# Datto RMM Audit Errors and Validation

## Common Audit API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Device not found | 404 | Invalid deviceUid | Verify device exists |
| Audit not available | 404 | No audit data yet | Wait for agent collection |
| Device offline | - | Agent not reporting | Check device connectivity |

## Audit Data Validation

```javascript
function validateAuditFreshness(audit, maxAgeHours = 48) {
  const lastAudit = audit.lastAuditDate;
  if (!lastAudit) {
    return { fresh: false, reason: 'No audit date' };
  }

  const ageMs = Date.now() - lastAudit;
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours > maxAgeHours) {
    return {
      fresh: false,
      reason: `Audit data is ${Math.round(ageHours)} hours old`,
      lastAudit: new Date(lastAudit).toISOString()
    };
  }

  return {
    fresh: true,
    ageHours: Math.round(ageHours),
    lastAudit: new Date(lastAudit).toISOString()
  };
}
```

