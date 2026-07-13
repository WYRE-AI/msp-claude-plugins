---
description: Audit MFA enrollment across all M365 users, highlighting accounts with no MFA
argument-hint: "[filter] [export]"
arguments: [filter, export]
---

# Check MFA Status (Tenant Audit)

Audit Microsoft 365 MFA enrollment for all users, producing a prioritized list of accounts that need attention.

## Arguments

- `filter` (optional) — Filter results - "all", "enrolled", "not-enrolled", or "admin-only"
- `export` (optional) — Output format - "table" (default) or "csv"

## Prerequisites

- `UserAuthenticationMethod.Read.All` permission (admin consent required)
- Or use the Registration Details report: `AuditLog.Read.All`

## Steps

1. **Pull registration details report** (most efficient — single call)
   ```http
   GET /v1.0/reports/authenticationMethods/userRegistrationDetails?$select=userPrincipalName,isMfaRegistered,isMfaCapable,methodsRegistered,isAdmin
   ```

2. **Categorize users**
   - `isMfaRegistered: false` → No MFA (critical)
   - `methodsRegistered` contains only `password` → No MFA
   - `methodsRegistered` contains `mobilePhone` only → Low-security MFA (SMS)
   - `methodsRegistered` contains `microsoftAuthenticator` or `fido2` → Good

3. **Apply filter if specified**
   - `not-enrolled`: show only users with `isMfaRegistered: false`
   - `admin-only`: cross-reference with admin roles
   - `enrolled`: show only users with MFA

4. **Sort output**: no-MFA users first, then by last sign-in (most active risks first)

## Output

```
M365 MFA Audit — contoso.com
Scanned: 47 users | ❌ No MFA: 8 | ⚠️  SMS only: 5 | ✅ Strong MFA: 34

CRITICAL — No MFA Registered (8 users)
─────────────────────────────────────────────────────
❌  bob.jones@contoso.com         Last login: 2 hours ago    [ACTIVE RISK]
❌  mary.admin@contoso.com        Last login: yesterday       [ADMIN - URGENT]
❌  sales1@contoso.com            Last login: 3 days ago
❌  contractor1@contoso.com       Last login: 14 days ago
❌  legacy.user@contoso.com       Never logged in
...

WARNING — SMS/Phone Only (5 users)
─────────────────────────────────────────────────────
⚠️   sarah.m@contoso.com          SMS — recommend upgrade to Authenticator app
⚠️   tim.c@contoso.com            SMS — recommend upgrade to Authenticator app

✅ Strong MFA — 34 users enrolled with Authenticator, FIDO2, or WHfB

Recommendations:
1. 🔴 Enforce MFA immediately for active users with no enrollment
2. 🟡 Upgrade SMS users to Microsoft Authenticator (phishing-resistant)
3. Enable Conditional Access "Require MFA for all users" policy to enforce going forward
```

## Admin-Only Filter Output

```
/check-mfa-status --filter admin-only

Global Administrators (3):
✅  it.admin@contoso.com          FIDO2 + Authenticator
❌  ceo@contoso.com               ❌ NO MFA — CRITICAL for privileged account
✅  svc.account@contoso.com       Authenticator

⚠️  1 of 3 admins has no MFA — remediate immediately
```

## Error Handling

### Insufficient Permissions
```
Error: AuditLog.Read.All permission required for full MFA audit.

Alternative: Use individual user lookup for specific accounts:
  /get-user user@contoso.com
```

### Large Tenant (>1000 users)
```
Processing 1,247 users... (may take 30-60 seconds due to Graph pagination)
```

## Related Commands

- `/get-user` — Detailed view of a single user including MFA methods
- `/list-licenses` — Check if users have Entra P1/P2 for advanced MFA policies
