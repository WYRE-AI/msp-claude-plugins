---
description: Look up a Microsoft 365 user by name or email, showing account status, licenses, MFA, and last sign-in
argument-hint: "<query>"
arguments: [query]
---

# Get M365 User

Look up a Microsoft 365 user and return a comprehensive summary of their account state.

## Conduit tools

The Conduit `m365` connector has no user, licence or MFA tools, so this command runs on the `cipp` and `microsoft-graph` connectors. The Graph requests further down show what each step reads; through Conduit, send a read as `microsoft_graph_get` with that path as `relativeUrl` (call `microsoft_graph_suggest_queries` first if unsure of the query), and perform writes through the CIPP tool named for that step.

| Step | Tool | Tier |
|------|------|------|
| Find the user | `cipp_list_users` (`tenantFilter`), or `microsoft_graph_get` on `/v1.0/users?$filter=...` | read / admin |
| Groups | `cipp_list_user_groups` | read |
| Devices | `cipp_list_user_devices` | read |
| MFA state | `cipp_list_mfa_users` | read |
| Licences | `cipp_list_licenses` | read |
| Recent sign-ins | `cipp_list_user_signin_logs` | read |

## Arguments

- `query` (required) — User's email address (UPN), display name, or partial name

## Prerequisites

- M365 connected via gateway or direct Entra app credentials
- `User.Read.All` and `UserAuthenticationMethod.Read.All` permissions

## Steps

1. **Resolve the user**
   - If `query` contains `@`, treat as UPN: `GET /v1.0/users/{query}`
   - Otherwise search by display name: `GET /v1.0/users?$filter=startsWith(displayName,'{query}')`
   - If multiple matches, list them and ask which one

2. **Fetch user details**
   ```http
   GET /v1.0/users/{id}?$select=id,displayName,userPrincipalName,accountEnabled,jobTitle,department,usageLocation,assignedLicenses,signInActivity,createdDateTime
   ```

3. **Check MFA enrollment**
   ```http
   GET /v1.0/users/{id}/authentication/methods
   ```

4. **Resolve license names**
   - Get `subscribedSkus` to map GUID → friendly name
   - Or use the common SKU table in the licensing skill

5. **Format and return summary**

## Output

```
User: Jane Smith (jsmith@contoso.com)

Status:     ✅ Active
Created:    2022-03-15
Last Login: 2024-01-14 09:23 UTC (1 day ago)

Role:       IT Coordinator
Department: Operations

Licenses:
  ✅ Microsoft 365 Business Premium

MFA:
  ✅ Microsoft Authenticator (iPhone) — registered 2022-03-15
  ✅ FIDO2 Key — registered 2023-11-01

Groups: 3 groups (use /list-teams to see Teams)
```

**Disabled user example:**
```
User: John Old (jold@contoso.com)

Status:     ❌ DISABLED
Last Login: 2023-10-01 14:05 UTC (105 days ago)

Licenses:
  ⚠️  M365 Business Premium — license still assigned (consider reclaiming)
```

**No MFA example:**
```
MFA:
  ❌ No MFA registered — password only (HIGH RISK)
  Recommend: Enroll in Microsoft Authenticator or FIDO2 key
```

## Error Handling

### User Not Found
```
User not found: "Janet Smith"

Did you mean:
- Jane Smith (jsmith@contoso.com) — Active
- James Smith (jsm@contoso.com) — Active
```

### Permission Denied for MFA
```
MFA status: Unable to retrieve (UserAuthenticationMethod.Read.All permission required)
Account and license details shown above are accurate.
```

## Related Commands

- `/check-mfa-status` — Audit MFA across all users
- `/list-licenses` — Full license inventory
- `/offboard-user` — Offboarding workflow for this user
