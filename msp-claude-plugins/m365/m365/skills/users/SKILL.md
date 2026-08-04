---
name: "Microsoft 365 Users"
description: >
  The Entra ID user object as M365's central identity: key properties and their
  MSP relevance, account status values, the license assignment model, Graph
  patterns for listing/searching/creating/disabling users, MFA status checking,
  and the onboarding and offboarding sequences.
when_to_use: >-
  When listing, searching, creating, disabling, or checking user properties. Use when: m365 user,
  microsoft 365 user, entra user, azure ad user, create user m365, disable user m365, user license
  m365, mfa status, m365 account, user provisioning, or user deprovisioning.
---

# Microsoft 365 User Management

## Overview

Users in Microsoft 365 (Entra ID) are the central identity object for your tenant. Every licensed service — Exchange, Teams, OneDrive, SharePoint — flows through the user object. For MSPs, user management spans onboarding new staff, offboarding leavers, license optimization, and security posture checks across customer tenants.

## Anti-triggers

- **Counting, listing, or auditing users without changing them** — a
  read-only question is cheaper and safer through the vetted query
  catalogue; use the `microsoft-graph` plugin's
  `microsoft-graph-querying` skill.
- **Offboarding as one packaged action, or any user work across more
  than one tenant** — the multi-step sequence below is a CIPP primitive
  with its own audit record; use the `cipp` plugin (`cipp-users`).
- **"User" meaning a PSA contact or an MSP technician** — an Entra user
  is neither. The customer's billing/ticket contact lives in the PSA
  (`connectwise`, `halopsa`, `kaseya/autotask`); the technician being
  scored on a CSAT survey is a `crewhu` user.

## User Object Key Properties

| Property | Description | MSP Relevance |
|----------|-------------|---------------|
| `id` | Entra object GUID | Use in API calls |
| `userPrincipalName` | Login email (UPN) | Primary identifier |
| `displayName` | Full name | Display in tickets |
| `accountEnabled` | Active/disabled | Offboarding, lockout |
| `assignedLicenses` | License SKU GUIDs | License audits |
| `strongAuthenticationMethods` | MFA methods | Security posture |
| `signInActivity.lastSignInDateTime` | Last login | Inactive user detection |
| `jobTitle` / `department` | Org structure | Access grouping |
| `manager` | Reporting manager | Approval workflows |
| `usageLocation` | 2-letter country | Required before license assignment |

## Account Status Values

| State | `accountEnabled` | Meaning |
|-------|-----------------|---------|
| Active | `true` | Normal working account |
| Disabled | `false` | Blocked sign-in; retains data |
| Deleted (soft) | N/A | 30-day recoverable window |
| Deleted (hard) | N/A | Permanent — data gone |

## License Assignment Model

M365 licenses are assigned as SKU objects. Users need a `usageLocation` set before any license can be assigned.

### Common MSP License SKUs

| SKU Part Number | Friendly Name |
|-----------------|---------------|
| `O365_BUSINESS_PREMIUM` | Microsoft 365 Business Premium |
| `SPE_E3` | Microsoft 365 E3 |
| `SPE_E5` | Microsoft 365 E5 |
| `ENTERPRISEPACK` | Office 365 E3 |
| `EMS` | Enterprise Mobility + Security E3 |
| `AAD_PREMIUM` | Entra ID P1 |
| `AAD_PREMIUM_P2` | Entra ID P2 |

## Graph API Patterns

### List All Users

```http
GET /v1.0/users?$select=id,displayName,userPrincipalName,accountEnabled,assignedLicenses,signInActivity&$top=100
```

> Note: `signInActivity` requires Entra ID P1 or P2.

### Get a Specific User

```http
GET /v1.0/users/{id or userPrincipalName}?$select=id,displayName,userPrincipalName,accountEnabled,jobTitle,department,assignedLicenses,usageLocation
```

### Search Users by Name

```http
GET /v1.0/users?$filter=startswith(displayName,'John')&$select=id,displayName,userPrincipalName,accountEnabled
```

### Disable a User Account

```http
PATCH /v1.0/users/{id}
Content-Type: application/json

{
  "accountEnabled": false
}
```

### Create a New User

```http
POST /v1.0/users
Content-Type: application/json

{
  "accountEnabled": true,
  "displayName": "Jane Smith",
  "mailNickname": "jsmith",
  "userPrincipalName": "jsmith@contoso.com",
  "usageLocation": "US",
  "passwordProfile": {
    "forceChangePasswordNextSignIn": true,
    "password": "TempP@ss123!"
  }
}
```

### Assign a License

```http
POST /v1.0/users/{id}/assignLicense
Content-Type: application/json

{
  "addLicenses": [
    { "skuId": "<sku-guid>", "disabledPlans": [] }
  ],
  "removeLicenses": []
}
```

### Get User's Group Memberships

```http
GET /v1.0/users/{id}/memberOf?$select=id,displayName,groupTypes
```

### Revoke All Sign-In Sessions

```http
POST /v1.0/users/{id}/revokeSignInSessions
```

## MFA Status Checking

The Softeria MCP server wraps Graph API calls. To check MFA status:

```http
GET /v1.0/users/{id}/authentication/methods
```

**Response includes registered methods:**
- `#microsoft.graph.microsoftAuthenticatorAuthenticationMethod` — Authenticator app
- `#microsoft.graph.phoneAuthenticationMethod` — SMS/phone
- `#microsoft.graph.fido2AuthenticationMethod` — Hardware key
- `#microsoft.graph.windowsHelloForBusinessAuthenticationMethod` — WHfB
- `#microsoft.graph.passwordAuthenticationMethod` — Password only (no MFA!)

**Users with only `passwordAuthenticationMethod` have NO MFA enrolled.**

## Common MSP Workflows

### New User Onboarding

1. Create user with temp password (`forceChangePasswordNextSignIn: true`)
2. Set `usageLocation`
3. Assign license SKU
4. Add to required security groups
5. Create mailbox (auto-provisioned on Exchange license)
6. Communicate credentials to manager

### User Offboarding

1. Revoke all sign-in sessions immediately
2. Disable account (`accountEnabled: false`)
3. Reset password (removes existing sessions)
4. Remove licenses (preserves data, frees seat)
5. Convert mailbox to shared or set auto-forward
6. Remove from Teams/groups
7. Transfer OneDrive ownership to manager
8. Schedule hard delete after data retention period

### Inactive User Detection

Users with no sign-in for 90+ days are candidates for license reclamation:

```http
GET /v1.0/users?$filter=accountEnabled eq true&$select=id,displayName,userPrincipalName,signInActivity&$top=999
```

Filter results where `signInActivity.lastSignInDateTime` is older than 90 days, or null (never logged in).

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `Request_ResourceNotFound` | User GUID/UPN doesn't exist | Verify UPN spelling |
| `Authorization_RequestDenied` | Missing Graph permission | Check app registration scopes |
| `LicenseAssignmentError` | No `usageLocation` set | Set location first |
| `Directory_QuotaExceeded` | Tenant user limit reached | Contact Microsoft |
| `InvalidPasswordComplexity` | Password too weak | Use 12+ char with symbols |

## Permissions Required

| Task | Microsoft Graph Permission |
|------|---------------------------|
| Read users | `User.Read.All` |
| Create/update users | `User.ReadWrite.All` |
| Assign licenses | `Directory.ReadWrite.All` |
| Check auth methods | `UserAuthenticationMethod.Read.All` |
| Revoke sessions | `Directory.ReadWrite.All` |

## Related Skills

- [M365 Mailboxes](../mailboxes/SKILL.md) - Exchange mailbox management
- [M365 Licensing](../licensing/SKILL.md) - License inventory and optimization
- [M365 Security](../security/SKILL.md) - MFA, sign-in risk, conditional access
- [M365 API Patterns](../api-patterns/SKILL.md) - Auth, pagination, throttling
