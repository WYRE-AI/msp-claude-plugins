---
description: Audit for account takeover indicators and suspicious sign-ins in Abnormal Security
argument-hint: "[user] [status] [severity] [start-date] [end-date] [limit]"
arguments: [user, status, severity, start-date, end-date, limit]
---

# Account Audit

Audit for account takeover indicators, suspicious sign-ins, and compromised accounts using Abnormal Security's Account Takeover Protection.

## Prerequisites

- Valid Abnormal Security API token configured (ABNORMAL_API_TOKEN)
- API token must have account takeover read permissions

## Steps

1. **Build audit query**
   - If a specific user is provided, fetch their ATO cases and activity
   - Otherwise, list all ATO cases filtered by status and severity

2. **Fetch ATO data**
   ```http
   GET /v1/account-takeover/cases?filter=...
   Authorization: Bearer <token>
   ```
   or for a specific user:
   ```http
   GET /v1/account-takeover/cases?filter=affectedUser eq '<email>'
   Authorization: Bearer <token>
   ```

3. **Format audit report**
   - Display ATO cases with indicators
   - Show sign-in anomalies and mailbox changes
   - Include recommended remediation actions

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| user | string | No | - | Email address to audit |
| status | string | No | open | open/investigating/remediated/closed/all |
| severity | string | No | - | critical/high/medium/low |
| start-date | string | No | 7d ago | ISO 8601 date |
| end-date | string | No | now | ISO 8601 date |
| limit | int | No | 25 | Max results (1-100) |

## Examples

### Audit All Open ATO Cases

```
/account-audit
```

### Audit a Specific User

```
/account-audit --user "user@company.com"
```

### Critical ATO Cases

```
/account-audit --severity critical
```

### All ATO Cases This Month

```
/account-audit --status all --start-date "2026-03-01"
```

## Output

### ATO Case Overview

```
Account Takeover Audit (last 7 days)
=====================================

Found 3 open ATO cases

+-----------+----------+---------------------+---------------------------+-------------------+-----------+
| Case ID   | Severity | Affected User       | Indicators                | Detected          | Status    |
+-----------+----------+---------------------+---------------------------+-------------------+-----------+
| ato-abc12 | Critical | cfo@company.com     | Impossible travel,        | 2026-03-27 06:30  | Open      |
|           |          |                     | mailbox rule created      |                   |           |
| ato-def34 | High     | sales@company.com   | Suspicious sign-in,       | 2026-03-26 22:15  | Open      |
|           |          |                     | new device                |                   |           |
| ato-ghi56 | Medium   | intern@company.com  | Unusual sign-in location  | 2026-03-25 14:40  | Open      |
+-----------+----------+---------------------+---------------------------+-------------------+-----------+

Summary:
- Critical: 1 | High: 1 | Medium: 1
- Accounts affected: 3

Priority Actions:
1. CRITICAL: cfo@company.com - Revoke sessions immediately, check mailbox rules
2. HIGH: sales@company.com - Verify sign-in with user, force password reset if unauthorized
3. MEDIUM: intern@company.com - Contact user to verify location
```

### Specific User Audit

```
Account Takeover Audit: cfo@company.com
=========================================

ATO Case: ato-abc12
Status:     Open
Severity:   Critical
Detected:   2026-03-27 06:30 UTC

Indicators:
- Impossible travel detected
  - Sign-in from New York, US at 06:00 UTC
  - Sign-in from Lagos, Nigeria at 06:25 UTC
  - Physical travel not possible in 25 minutes
- Suspicious mailbox rule created
  - Rule: Auto-forward all emails to ext-backup@proton.me
  - Created: 2026-03-27 06:28 UTC
- 12 emails sent from account during compromise window
  - 8 internal emails (potential lateral phishing)
  - 4 external emails

Sign-in Activity (last 48 hours):
  2026-03-27 06:25 UTC  Lagos, Nigeria      185.234.xxx.xxx  Chrome/Win  [SUSPICIOUS]
  2026-03-27 06:00 UTC  New York, US        72.45.xxx.xxx    Outlook/Mac [LEGITIMATE]
  2026-03-26 18:30 UTC  New York, US        72.45.xxx.xxx    Outlook/Mac [LEGITIMATE]
  2026-03-26 09:00 UTC  New York, US        72.45.xxx.xxx    Outlook/Mac [LEGITIMATE]

Mailbox Rules:
  [MALICIOUS] Auto-forward to ext-backup@proton.me (created 06:28 UTC)
  [NORMAL]    Move newsletters to "Newsletters" folder
  [NORMAL]    Flag emails from CEO as important

Recommended Actions:
1. IMMEDIATELY: Revoke all active sessions
2. IMMEDIATELY: Remove auto-forward rule to ext-backup@proton.me
3. Force password reset
4. Re-enable/verify MFA
5. Notify 8 internal recipients of potential phishing from this account
6. Block sender IP 185.234.xxx.xxx
7. Investigate emails sent during compromise window
8. Check for data exfiltration via forwarded emails
```

## Error Handling

### No ATO Cases

```
No open account takeover cases found.

No active account compromises detected. Good news!

Suggestions:
- Check historical cases with --status all
- Audit a specific user with --user "email@company.com"
```

### User Not Found

```
No account takeover data found for: unknown@company.com

This user may not have any ATO indicators or may not be monitored.
```

### Authentication Error

```
Error: Invalid or expired API token.

Regenerate your token at Abnormal Security Portal > Settings > Integrations > API.
```

## Related Commands

- `/threat-triage` - Triage recent threats
- `/search-threats` - Search for threats
- `/case-review` - Review abuse mailbox cases
- `/vendor-risk` - Check vendor risk scores
