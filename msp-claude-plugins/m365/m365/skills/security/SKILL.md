---
name: "Microsoft 365 Security"
description: >
  The M365 tenant security checks that distinguish a secure tenant from a
  vulnerable one: per-user authentication-method inspection for real MFA
  enrollment, sign-in risk and risky users, suspicious inbox rules, legacy
  authentication exposure, conditional access coverage, Secure Score, and the
  indicator set for a compromised account.
when_to_use: >-
  When reviewing an M365 tenant's security posture or investigating a suspected account
  compromise. Use when: m365 security, m365 mfa, mfa
  enrollment, conditional access, risky sign-in, account compromise m365, m365 security audit,
  suspicious activity m365, m365 security score, entra security, or m365 sign-in logs.
---

# Microsoft 365 Security Posture

## Overview

Security checks are among the most high-value tasks an MSP can perform in a customer's M365 tenant. Account compromises, inadequate MFA coverage, and misconfigured mail rules are the leading causes of M365 security incidents. This skill covers the key checks and indicators that separate a secure tenant from a vulnerable one.

## Anti-triggers

"Security" is the most overloaded word in the MSP stack. This skill is
identity posture inside **one** M365 tenant, read via Graph:

- **A detection or alert on an endpoint** — malware, ransomware,
  suspicious process, isolate-the-host. That is EDR/MDR, not Entra; use
  `huntress`, `sentinelone`, `blackpoint`, or `blumira`.
- **Enforcing a baseline rather than reporting on it** — this skill
  tells you conditional access is missing; deploying and holding the
  standard across tenants is `cipp` (`cipp-standards`) or `inforcer`
  (`inforcer-baseline-alignment`).
- **The same posture check across every tenant** — use `cipp`
  (`cipp-security`). One tenant at a time is what this skill does.
- **Phishing, quarantine, and mail-flow threat verdicts** — those
  belong to the mail-security gateway: `mimecast`, `abnormal`,
  `ironscales`, or the `email-security` pack.
- **Evidence for an audit or insurance questionnaire** — a control
  attestation is not a Graph query; use the `compliance-pack`.

## MFA Status Audit

### Check All Users' Authentication Methods

MFA enrollment lives on the `authentication/methods` endpoint per user. Users with **only** a `passwordAuthenticationMethod` entry have no MFA.

```http
GET /v1.0/users/{userId}/authentication/methods
```

**Response — user WITH MFA:**
```json
{
  "value": [
    {
      "@odata.type": "#microsoft.graph.microsoftAuthenticatorAuthenticationMethod",
      "id": "aad-method-id",
      "displayName": "iPhone",
      "createdDateTime": "2023-06-01T10:00:00Z"
    },
    {
      "@odata.type": "#microsoft.graph.passwordAuthenticationMethod"
    }
  ]
}
```

**Response — user WITHOUT MFA (vulnerable):**
```json
{
  "value": [
    {
      "@odata.type": "#microsoft.graph.passwordAuthenticationMethod"
    }
  ]
}
```

### Bulk MFA Report

Use Microsoft Graph Reports for tenant-wide MFA status:

```http
GET /v1.0/reports/authenticationMethods/userRegistrationDetails
```

**Response per user:**
```json
{
  "id": "user-guid",
  "userPrincipalName": "jsmith@contoso.com",
  "isMfaRegistered": true,
  "isMfaCapable": true,
  "isSsprRegistered": false,
  "methodsRegistered": ["microsoftAuthenticator", "softwareOath"]
}
```

This is the fastest path to a full tenant MFA audit.

### MFA Method Risk Levels

| Method | Security Level | Notes |
|--------|---------------|-------|
| FIDO2 hardware key | Highest | Phishing-resistant |
| Windows Hello for Business | Highest | Device-bound |
| Microsoft Authenticator (passwordless) | High | Number matching recommended |
| OATH hardware token | High | |
| Microsoft Authenticator (OTP) | Medium | Better than SMS |
| Software OATH (other app) | Medium | |
| SMS/Phone | Low | Susceptible to SIM swap |
| Password only | None | **Unacceptable for business** |

## Sign-In Risk and Risky Users

### Get Risky Users (Entra ID P2 Required)

```http
GET /v1.0/identityProtection/riskyUsers?$filter=riskState eq 'atRisk'&$select=id,userPrincipalName,riskLevel,riskState,riskLastUpdatedDateTime
```

**Risk Levels:** `low`, `medium`, `high`

### Get Risky Sign-Ins

```http
GET /v1.0/auditLogs/signIns?$filter=riskLevelDuringSignIn ne 'none'&$select=userPrincipalName,riskLevelDuringSignIn,location,createdDateTime&$top=50
```

### Dismiss Risk for a User (After Remediation)

```http
POST /v1.0/identityProtection/riskyUsers/dismiss
Content-Type: application/json

{
  "userIds": ["user-guid"]
}
```

### Get Recent Sign-In Logs

```http
GET /v1.0/auditLogs/signIns?$filter=userPrincipalName eq 'user@contoso.com'&$select=createdDateTime,userPrincipalName,ipAddress,location,status,clientAppUsed,riskLevelDuringSignIn&$top=20&$orderby=createdDateTime desc
```

**Key fields for incident response:**
- `status.errorCode: 0` = success, nonzero = failure
- `ipAddress` and `location` for geolocation anomalies
- `clientAppUsed` — legacy auth clients are high risk
- `conditionalAccessStatus: notApplied` = CA policy gap

## Suspicious Inbox Rules

Attackers often create hidden inbox rules to forward mail or hide replies. Check for:

```http
GET /v1.0/users/{userId}/mailFolders/inbox/messageRules
```

**Red flags:**
- Rules forwarding to external addresses
- Rules deleting messages matching keywords ("invoice", "password", "wire transfer")
- Rules moving messages to obscure folders
- Rules created at unusual times

```json
{
  "displayName": "hidden rule",
  "conditions": { "subjectContains": ["invoice"] },
  "actions": { "forwardTo": [{ "emailAddress": { "address": "attacker@external.com" } }] },
  "isEnabled": true
}
```

## Legacy Authentication

Legacy auth protocols (IMAP, POP3, SMTP AUTH, basic auth) bypass MFA. Identify users still using them:

```http
GET /v1.0/auditLogs/signIns?$filter=clientAppUsed eq 'IMAP' or clientAppUsed eq 'POP3' or clientAppUsed eq 'Exchange ActiveSync'&$select=userPrincipalName,clientAppUsed,createdDateTime&$top=100
```

Recommended: Block legacy auth via Conditional Access policy.

## Conditional Access Overview

Check if CA policies are configured:

```http
GET /v1.0/identity/conditionalAccess/policies?$select=id,displayName,state,conditions,grantControls
```

**`state` values:** `enabled`, `disabled`, `enabledForReportingButNotEnforced` (report-only)

**MSP baseline CA policies to verify exist:**
1. Require MFA for all users
2. Block legacy authentication protocols
3. Require compliant device for admin roles
4. Block sign-in from high-risk countries (optional)

## Security Score

Get the tenant's Microsoft Secure Score:

```http
GET /v1.0/security/secureScores?$top=1
```

**Response:**
```json
{
  "value": [{
    "currentScore": 52.4,
    "maxScore": 120.0,
    "averageComparativeScores": [
      { "basis": "AllTenants", "averageScore": 38.2 }
    ]
  }]
}
```

Score improvement recommendations:
```http
GET /v1.0/security/secureScoreControlProfiles?$select=title,maxScore,implementationStatus,controlCategory
```

## Account Compromise Indicators

When a user reports suspicious activity, check these in order:

| Check | Command | Red Flag |
|-------|---------|----------|
| Recent sign-ins | `GET /auditLogs/signIns` | Unfamiliar IP, country, time |
| MFA changes | `GET /auditLogs/directoryAudits` | MFA method added/removed |
| Inbox rules | `GET /mailFolders/inbox/messageRules` | External forwarding |
| Sent items | `GET /messages` from Sent folder | Phishing sent from account |
| OAuth apps | `GET /oauth2PermissionGrants` | Unknown app granted access |

### Full Compromise Response Checklist

1. **Revoke sessions**: `POST /v1.0/users/{id}/revokeSignInSessions`
2. **Reset password** via admin center (forces re-auth)
3. **Remove suspicious inbox rules**
4. **Review mail sent** in the compromised window
5. **Check OAuth app consents** and revoke suspicious ones
6. **Notify user** and require MFA re-enrollment
7. **File incident** in PSA with timeline

## Permissions Required

| Task | Microsoft Graph Permission |
|------|---------------------------|
| MFA registration report | `UserAuthenticationMethod.Read.All` |
| Authentication methods | `UserAuthenticationMethod.Read.All` |
| Sign-in logs | `AuditLog.Read.All` |
| Risky users | `IdentityRiskyUser.Read.All` (P2) |
| Conditional access | `Policy.Read.All` |
| Security score | `SecurityEvents.Read.All` |
| Revoke sessions | `Directory.ReadWrite.All` |

## Related Skills

- [M365 Users](../users/SKILL.md) - Disable account, revoke sessions
- [M365 Mailboxes](../mailboxes/SKILL.md) - Inbox rule details, send-on-behalf audit
- [M365 API Patterns](../api-patterns/SKILL.md) - Auth, audit log query patterns
