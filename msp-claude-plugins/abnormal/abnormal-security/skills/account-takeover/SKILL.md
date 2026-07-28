---
name: "Abnormal Security Account Takeover"
description: >
  Abnormal Security account takeover (ATO) detection: suspicious sign-in
  signals, impossible travel, mailbox rule changes, lateral-movement
  indicators, ATO case structure, investigation workflows, and remediation
  actions.
when_to_use: >-
  When investigating or remediating a mailbox account that Abnormal Security
  flags as potentially compromised. Use when: account takeover, abnormal
  ato, compromised account, suspicious sign-in, impossible travel, mailbox
  rule change, account compromise, sign-in anomaly, lateral movement,
  abnormal account security, unauthorized access, or suspicious login.
---

# Abnormal Security Account Takeover Detection

## Overview

Abnormal Security's Account Takeover Protection monitors sign-in activity and mailbox behavior to detect compromised internal accounts. By analyzing user behavior patterns, device fingerprints, sign-in locations, and mailbox rule changes, Abnormal identifies accounts that have been taken over by attackers. This skill covers ATO case management, investigation workflows, and remediation actions.

## Account Takeover Indicators

| Indicator | Description | Risk Level |
|-----------|-------------|------------|
| **Impossible Travel** | Sign-ins from geographically distant locations in short time | High |
| **Unusual Sign-in Location** | Sign-in from a country or region not seen before | Medium |
| **New Device** | Sign-in from an unrecognized device or browser | Medium |
| **Suspicious Mailbox Rules** | Auto-forward, delete, or move rules targeting sensitive emails | Critical |
| **Bulk Email Sending** | Account sending mass emails to internal or external recipients | High |
| **Password Change** | Unexpected password or MFA changes | High |
| **Lateral Phishing** | Compromised account sending phishing to internal users | Critical |
| **Data Exfiltration** | Large file downloads or email forwarding to external addresses | Critical |
| **Token Theft** | Session token stolen and used from different location/device | High |

## ATO Case Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `caseId` | string | Unique account takeover case ID |
| `affectedUser` | string | Email address of the compromised account |
| `severity` | string | Critical, High, Medium, Low |
| `detectedAt` | datetime | When the takeover was first detected |
| `status` | string | Open, Investigating, Remediated, Closed |

### Sign-in Activity Fields

| Field | Type | Description |
|-------|------|-------------|
| `signInEvents` | object[] | List of suspicious sign-in events |
| `signInEvents[].timestamp` | datetime | When the sign-in occurred |
| `signInEvents[].ipAddress` | string | IP address of the sign-in |
| `signInEvents[].location` | string | Geographic location (city, country) |
| `signInEvents[].device` | string | Device or browser fingerprint |
| `signInEvents[].status` | string | Success, Failed, MFA Challenged |
| `signInEvents[].riskLevel` | string | Risk assessment of the sign-in |

### Mailbox Activity Fields

| Field | Type | Description |
|-------|------|-------------|
| `mailboxRules` | object[] | Suspicious mailbox rules created |
| `mailboxRules[].type` | string | Forward, Delete, Move |
| `mailboxRules[].target` | string | External email or folder target |
| `mailboxRules[].createdAt` | datetime | When the rule was created |
| `emailsSent` | int | Number of emails sent during compromise |
| `emailsForwarded` | int | Number of emails auto-forwarded |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `abnormal_ato_cases_list` | List account takeover cases | `pageSize`, `pageNumber`, `filter`, `fromDate`, `toDate` |
| `abnormal_ato_cases_get` | Get ATO case details | `caseId` |
| `abnormal_ato_activity` | Get sign-in and mailbox activity for a user | `email`, `fromDate`, `toDate` |
| `abnormal_ato_remediate` | Take remediation action on an ATO case | `caseId`, `action` |

### Tool Usage Examples

**List open ATO cases:**
```json
{
  "tool": "abnormal_ato_cases_list",
  "parameters": {
    "filter": "status eq 'Open'",
    "pageSize": 25
  }
}
```

**Get ATO case details:**
```json
{
  "tool": "abnormal_ato_cases_get",
  "parameters": {
    "caseId": "ato-abc123"
  }
}
```

**Get sign-in activity for a user:**
```json
{
  "tool": "abnormal_ato_activity",
  "parameters": {
    "email": "user@company.com",
    "fromDate": "2026-03-20T00:00:00Z",
    "toDate": "2026-03-27T00:00:00Z"
  }
}
```

## ATO Investigation Workflows

### Standard ATO Investigation

1. **Review case details:**
   - What indicators triggered the detection?
   - Which user is affected?
   - When was the compromise detected?
2. **Analyze sign-in activity:**
   - Check for impossible travel (locations too far apart in timeframe)
   - Identify the attacker's IP address and location
   - Check if MFA was bypassed or not enrolled
3. **Review mailbox changes:**
   - Check for auto-forwarding rules to external addresses
   - Check for delete rules targeting security notifications
   - Check for inbox rules hiding incoming emails
4. **Assess damage:**
   - How many emails were sent from the compromised account?
   - Were any internal users phished (lateral movement)?
   - Was sensitive data forwarded or downloaded?
5. **Remediate:**
   - Force password reset
   - Revoke active sessions and tokens
   - Remove malicious mailbox rules
   - Re-enable MFA if it was disabled
6. **Post-incident:**
   - Notify affected users who received emails from the compromised account
   - Check if credentials were used elsewhere
   - Update security policies if gaps found

### Impossible Travel Investigation

1. **Map sign-in locations** - Plot the geographic locations and timestamps
2. **Calculate travel feasibility** - Could the user physically travel between locations?
3. **Check VPN usage** - Verify if the organization uses VPNs that could explain the location change
4. **Identify legitimate sign-in** - Contact the user to confirm which sign-in was theirs
5. **Block attacker access** - Revoke the session from the illegitimate location

### Mailbox Rule Investigation

1. **List all mailbox rules** - Get current rules for the affected account
2. **Identify suspicious rules:**
   - Forwarding to external addresses
   - Deleting emails from security team or IT
   - Moving emails to hidden folders
3. **Remove malicious rules** - Delete any rules created during the compromise window
4. **Check forwarded data** - Determine what emails were forwarded to the attacker

## Remediation Actions

| Action | Description | When to Use |
|--------|-------------|-------------|
| `FORCE_PASSWORD_RESET` | Reset the user's password | Confirmed account compromise |
| `REVOKE_SESSIONS` | Terminate all active sessions | Active compromise with attacker logged in |
| `DISABLE_ACCOUNT` | Temporarily disable the account | Severe compromise with ongoing activity |
| `REMOVE_RULES` | Remove suspicious mailbox rules | Malicious forwarding/delete rules found |

## Severity Assessment

| Factor | Medium | High | Critical |
|--------|--------|------|----------|
| Indicator Type | New device, unusual location | Impossible travel, password change | Lateral phishing, data exfiltration |
| User Role | Standard user | Manager, finance | Executive, admin |
| Activity | Suspicious sign-in only | Mailbox rules created | Emails sent to internal users |
| MFA Status | MFA active, blocked | MFA bypassed | MFA disabled by attacker |
| Data Access | No sensitive access | Read sensitive emails | Forwarded sensitive data |

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid email format | Check email address format |
| 401 | Unauthorized | Check API token |
| 403 | Insufficient permissions | Token needs ATO scope |
| 404 | Case not found | Verify case ID |
| 429 | Rate limited | Wait and retry |

## Best Practices

1. **Respond to ATO cases immediately** - Account takeovers are time-sensitive
2. **Always revoke sessions first** - Stop active attacker access before investigating
3. **Check mailbox rules early** - Forwarding rules can silently exfiltrate data
4. **Verify with the user** - Confirm which sign-ins were legitimate
5. **Check for lateral movement** - Compromised accounts often target internal users
6. **Enforce MFA** - Accounts without MFA are prime takeover targets
7. **Monitor post-remediation** - Attackers may attempt to re-compromise the account
8. **Correlate with vendor risk** - Account takeover may originate from a compromised vendor

## Related Skills

- [Abnormal Threats](../threats/SKILL.md) - Threat detection and analysis
- [Abnormal Vendors](../vendors/SKILL.md) - Vendor risk assessment
- [Abnormal Messages](../messages/SKILL.md) - Message analysis
- [Abnormal API Patterns](../api-patterns/SKILL.md) - API authentication and usage
