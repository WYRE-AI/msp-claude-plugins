---
description: Show Microsoft 365 license inventory - available SKUs, consumed seats, and optimization opportunities
argument-hint: "[view] [sku]"
arguments: [view, sku]
---

# List M365 Licenses

Show the current Microsoft 365 license inventory for the tenant, including seat utilization and optimization opportunities.

## Arguments

- `view` (optional) — What to show: 'summary' (default), 'users' (per-user breakdown), 'unused' (reclaim candidates)
- `sku` (optional) — Filter to a specific SKU name or partial match (e.g. "Business Premium")

## Prerequisites

- `Directory.Read.All` — list subscribed SKUs
- `User.Read.All` — per-user license assignments
- `AuditLog.Read.All` — sign-in activity for inactive user detection (optional)

## Steps

1. **Get all subscribed SKUs**
   ```http
   GET /v1.0/subscribedSkus?$select=skuPartNumber,skuId,consumedUnits,prepaidUnits,capabilityStatus
   ```

2. **For `--view users` or `--view unused`**: also fetch all users with licenses
   ```http
   GET /v1.0/users?$select=id,displayName,userPrincipalName,accountEnabled,assignedLicenses,signInActivity&$top=999
   ```

3. **Calculate seat availability** per SKU: `prepaidUnits.enabled - consumedUnits`

4. **Identify optimization opportunities**:
   - Disabled users with licenses still assigned
   - Licensed users with no sign-in for 90+ days
   - SKUs with 0 remaining seats (may need expansion)

## Output — Summary View

```
Microsoft 365 License Inventory — contoso.com
As of: 2024-01-15

SKU                                Purchased  Used   Available  Status
─────────────────────────────────────────────────────────────────────
Microsoft 365 Business Premium        50       46        4       ✅ OK
Entra ID P1                           25       22        3       ✅ OK
Microsoft 365 F1 (Frontline)          10        8        2       ✅ OK
Power BI Pro                          15       15        0       ⚠️  FULL

Total monthly spend estimate: ~$1,840/mo

Optimization Opportunities:
  ⚠️  3 disabled users still have M365 Business Premium (3 seats × $22/mo = $66/mo recoverable)
  ⚠️  Power BI Pro is at capacity — consider adding seats or auditing need
  💡  5 users inactive 90+ days — review for downgrade or removal
```

## Output — Unused Licenses (`--view unused`)

```
License Reclaim Candidates — M365 Business Premium

Disabled accounts with licenses (immediate reclaim):
  ❌  jold@contoso.com         Disabled 2023-11-01   M365 Business Premium
  ❌  ftemp@contoso.com        Disabled 2023-12-15   M365 Business Premium
  ❌  test.user@contoso.com    Disabled 2024-01-01   M365 Business Premium

  → 3 licenses recoverable immediately

Inactive active accounts (last sign-in >90 days):
  🕐  msmith@contoso.com       Last login: 2023-09-10  M365 Business Premium
  🕐  jdoe@contoso.com         Last login: 2023-08-22  M365 Business Premium

  → 2 accounts to review — confirm with customer before removal

Estimated monthly saving if all reclaimed: $110/mo (5 seats × $22)
```

## Output — Per-User View (`--view users`)

```
User License Assignments

Active Users:
  ✅  alice@contoso.com         M365 Business Premium
  ✅  bob@contoso.com           M365 Business Premium, Power BI Pro
  ✅  charlie@contoso.com       M365 F1 (Frontline)
  ...

Disabled Users (with licenses):
  ❌  jold@contoso.com          M365 Business Premium ← reclaim candidate
```

## Error Handling

### No Licenses Found
```
No licenses found in this tenant.
This may indicate a trial-only or CSP-managed tenant where licenses
are managed at the partner level.
```

### Insufficient Permissions
```
Error: Directory.Read.All permission required to list SKUs.
User-level permissions insufficient — admin consent needed.
```

## Related Commands

- `/get-user` — Check a specific user's license assignments
- `/check-mfa-status` — Ensure licensed users are properly secured
- `/offboard-user` — Remove licenses during offboarding
