# Autotask Configuration Items — Code Examples

## Common DNS Tracking Patterns

```javascript
// Track all DNS records for a domain CI
const dnsRecords = await queryDnsRecords({
  filter: [
    {field: 'configurationItemID', op: 'eq', value: domainCiId}
  ]
});

// Find CIs with expiring SSL certs
const expiringSSL = await queryCIs({
  filter: [
    {field: 'configurationItemType', op: 'eq', value: SSL_CERT_TYPE},
    {field: 'warrantyExpirationDate', op: 'lte', value: thirtyDaysFromNow}
  ]
});
```

## Warranty Tracking Report

```javascript
async function getExpiringWarranties(daysAhead = 90) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const cis = await queryCIs({
    filter: [
      {field: 'warrantyExpirationDate', op: 'isNotNull'},
      {field: 'warrantyExpirationDate', op: 'lte', value: futureDate.toISOString().split('T')[0]},
      {field: 'isActive', op: 'eq', value: true}
    ],
    includeFields: ['Company.companyName']
  });

  return cis.map(ci => ({
    name: ci.referenceTitle,
    company: ci.companyName,
    expires: ci.warrantyExpirationDate,
    daysRemaining: Math.ceil(
      (new Date(ci.warrantyExpirationDate) - new Date()) / (1000 * 60 * 60 * 24)
    )
  })).sort((a, b) => a.daysRemaining - b.daysRemaining);
}
```

## Lifecycle Planning

```javascript
function calculateAssetAge(ci) {
  if (!ci.purchaseDate) return null;

  const purchase = new Date(ci.purchaseDate);
  const now = new Date();
  const ageYears = (now - purchase) / (1000 * 60 * 60 * 24 * 365);

  // Standard lifecycle recommendations
  const lifecycles = {
    server: 5,
    workstation: 4,
    networkDevice: 7,
    printer: 5
  };

  const expectedLife = lifecycles[ci.typeCategory] || 5;
  const remainingLife = expectedLife - ageYears;

  return {
    ageYears: Math.round(ageYears * 10) / 10,
    expectedLife,
    remainingLife: Math.round(remainingLife * 10) / 10,
    status: remainingLife <= 0 ? 'REPLACE' :
            remainingLife <= 1 ? 'PLAN_REPLACEMENT' :
            'HEALTHY'
  };
}
```

## RMM Sync Verification

```javascript
async function findUnmatchedAssets(companyId) {
  const cis = await queryCIs({
    filter: [
      {field: 'companyID', op: 'eq', value: companyId},
      {field: 'isActive', op: 'eq', value: true},
      {field: 'configurationItemType', op: 'in', value: [1, 2]} // Servers, workstations
    ]
  });

  return {
    withRMM: cis.filter(ci => ci.rmmDeviceID),
    withoutRMM: cis.filter(ci => !ci.rmmDeviceID),
    coverage: `${Math.round((cis.filter(ci => ci.rmmDeviceID).length / cis.length) * 100)}%`
  };
}
```
