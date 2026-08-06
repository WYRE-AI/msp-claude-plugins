---
description: Triage recent email threats detected by Abnormal Security by severity and attack type
argument-hint: "[severity] [type] [status] [start-date] [end-date] [limit]"
arguments: [severity, type, status, start-date, end-date, limit]
---

# Threat Triage

Triage recent email threats detected by Abnormal Security, prioritized by severity and attack type.

## Prerequisites

- Valid Abnormal Security API token configured (ABNORMAL_API_TOKEN)
- API token must have threat detection read permissions

## Steps

1. **Build search filter**
   - Parse all provided arguments
   - Map text values to API codes (type, severity, status)
   - Construct OData filter expression

2. **Fetch recent threats**
   ```http
   GET /v1/threats?filter=...&pageSize=...
   Authorization: Bearer <token>
   ```

3. **Sort by priority**
   - Critical severity first, then High, Medium, Low
   - Within same severity, BEC and supply chain threats first

4. **Format triage report**
   - Display threat list with key details
   - Include severity indicators and recommended actions

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| severity | string | No | - | critical/high/medium/low |
| type | string | No | - | bec/phishing/malware/extortion/scam/spam/supply-chain |
| status | string | No | not-remediated | remediated/not-remediated/post-remediated/all |
| start-date | string | No | 24h ago | ISO 8601 date |
| end-date | string | No | now | ISO 8601 date |
| limit | int | No | 25 | Max results (1-100) |

## Examples

### Triage All Recent Threats

```
/threat-triage
```

### Critical Threats Only

```
/threat-triage --severity critical
```

### BEC Threats This Week

```
/threat-triage --type bec --start-date "2026-03-20T00:00:00Z"
```

### All Threats Including Remediated

```
/threat-triage --status all --limit 50
```

## Output

```
Abnormal Security Threat Triage (last 24 hours)
================================================

Found 8 unremediated threats

+-----------+------------------+----------+---------------------+-----------------------------------+-------------------+
| Threat ID | Attack Type      | Severity | Sender              | Subject                           | Received          |
+-----------+------------------+----------+---------------------+-----------------------------------+-------------------+
| 184def76  | BEC              | Critical | ceo@c0mpany.com     | Urgent: Wire Transfer Request     | 2026-03-27 09:15  |
| 29abc134  | Supply Chain     | Critical | ap@vendor-acct.com  | Updated Payment Details           | 2026-03-27 08:42  |
| 3f4e5d6c  | Credential Phish | High     | noreply@m1crosoft.co| Verify Your Account               | 2026-03-27 07:30  |
| 4a5b6c7d  | Malware          | High     | invoice@unknown.com | Invoice #8821 Attached            | 2026-03-27 06:15  |
| 5b6c7d8e  | Credential Phish | High     | admin@dr0pbox.net   | Shared Document Ready             | 2026-03-26 22:10  |
| 6c7d8e9f  | Extortion        | Medium   | anon@proton.me      | We Have Your Data                 | 2026-03-26 20:45  |
| 7d8e9f0a  | Scam             | Medium   | deals@scam-co.com   | Invoice Payment Overdue           | 2026-03-26 18:30  |
| 8e9f0a1b  | Spam             | Low      | promo@bulk-send.com | Limited Time Offer!               | 2026-03-26 16:00  |
+-----------+------------------+----------+---------------------+-----------------------------------+-------------------+

Summary:
- Critical: 2 | High: 3 | Medium: 2 | Low: 1
- Types: BEC (1), Supply Chain (1), Credential Phishing (2), Malware (1), Extortion (1), Scam (1), Spam (1)
- Auto-Remediated: 0 | Not Remediated: 8

Priority Actions:
1. Investigate BEC threat 184def76 - wire transfer request targeting CFO
2. Investigate Supply Chain threat 29abc134 - vendor payment redirect
3. Remediate credential phishing threats 3f4e5d6c, 5b6c7d8e

Quick Actions:
- View threat details: /search-threats --type bec
- Inspect one threat: abnormal_threats_get with the threat UUID
- Remediate: abnormal_messages_list, then abnormal_remediation_manage per message
```

## Error Handling

### No Results

```
No unremediated threats found in the last 24 hours.

Suggestions:
- Expand the date range with --start-date
- Include remediated threats with --status all
- Remove severity/type filters
```

### Authentication Error

```
Error: Invalid or expired API token.

Regenerate your token at Abnormal Security Portal > Settings > Integrations > API.
```

## Related Commands

- `/search-threats` - Search for specific threat patterns
- `/case-review` - Review abuse mailbox cases
