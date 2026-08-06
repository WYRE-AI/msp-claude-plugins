---
description: Review and triage abuse mailbox cases in Abnormal Security
argument-hint: "[status] [judgment] [start-date] [end-date] [limit]"
arguments: [status, judgment, start-date, end-date, limit]
---

# Case Review

Review and triage abuse mailbox cases in Abnormal Security. These are user-reported suspicious emails that have been analyzed by Abnormal's AI.

## Prerequisites

- Valid Abnormal Security API token configured (ABNORMAL_API_TOKEN)
- API token must have abuse mailbox/cases read permissions

## Steps

1. **Build case filter**
   - Parse all provided arguments
   - Construct OData filter expression for overallStatus and judgment

2. **Fetch cases**
   ```http
   GET /v1/cases?filter=...&pageSize=...
   Authorization: Bearer <token>
   ```

3. **Sort and prioritize**
   - Malicious judgments first
   - Then by severity and report time

4. **Format triage report**
   - Display case list with AI judgment
   - Include recommended actions per case

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | open | open/acknowledged/done/all |
| judgment | string | No | - | malicious/spam/safe/no-action-needed |
| start-date | string | No | 7d ago | ISO 8601 date |
| end-date | string | No | now | ISO 8601 date |
| limit | int | No | 25 | Max results (1-100) |

## Examples

### Review All Open Cases

```
/case-review
```

### Malicious Cases Only

```
/case-review --judgment malicious
```

### All Cases This Month

```
/case-review --status all --start-date "2026-03-01"
```

### Acknowledged Cases Needing Follow-Up

```
/case-review --status acknowledged
```

## Output

```
Abuse Mailbox Case Review (last 7 days)
========================================

Found 6 open cases

+---------+------------+-------------------+----------------------------+-----------------------------------+-----------+
| Case ID | Judgment   | Reported By       | Sender                     | Subject                           | Reported  |
+---------+------------+-------------------+----------------------------+-----------------------------------+-----------+
| 12345   | Malicious  | john@company.com  | ceo@c0mpany.com            | Urgent: Wire Transfer             | 03-27 09h |
| 12346   | Malicious  | sara@company.com  | noreply@m1crosoft.co       | Verify Your Account Now           | 03-27 08h |
| 12347   | Spam       | mike@company.com  | deals@bulk-sender.com      | Amazing Offer Just For You        | 03-26 16h |
| 12348   | Spam       | lisa@company.com  | newsletter@marketing.com   | Monthly Newsletter                | 03-26 14h |
| 12349   | Safe       | dave@company.com  | support@vendor.com         | Invoice #4521                     | 03-26 11h |
| 12350   | No Action  | jane@company.com  | security@company.com       | Phishing Awareness Test           | 03-25 15h |
+---------+------------+-------------------+----------------------------+-----------------------------------+-----------+

Summary:
- Malicious: 2 | Spam: 2 | Safe: 1 | No Action Needed: 1

Recommended Actions:
1. Case 12345 (Malicious BEC) - REMEDIATE across organization
2. Case 12346 (Malicious Phishing) - REMEDIATE across organization
3. Cases 12347-12348 (Spam) - DISMISS
4. Case 12349 (Safe) - DISMISS, reply to reporter confirming safe
5. Case 12350 (Phishing Simulation) - DISMISS

Quick Actions:
- View case details: Use abnormal_cases_get with the numeric case ID
- Remediate the mail behind a case: find the threat, then
  abnormal_messages_list + abnormal_remediation_manage per message
- Dismiss / acknowledge / close: Abnormal portal only — no tool does this
```

## What this command cannot do

Cases are **read-only** through this server. `abnormal_cases_list` and
`abnormal_cases_get` are both GETs, and there is no tool that changes a
case's state, assigns an analyst, or closes a case. This command produces
a triage recommendation; a human enters the disposition in the Abnormal
portal.

The one action available is message remediation, and it is reached
through the *threat*, not the case: `abnormal_remediation_manage`
requires a `threatId` and a `messageId`, and a `caseId` is neither. Note
also that `caseId` is a **number** while `threatId` is a **UUID string** —
they are not interchangeable.

## Judgment Reference

| Judgment | Description | Recommended Action |
|----------|-------------|-------------------|
| Malicious | Confirmed threat (BEC, phishing, malware) | Remediate across org |
| Spam | Unsolicited bulk email | Dismiss or junk |
| Safe | Legitimate email, no threat | Dismiss, notify reporter |
| No Action Needed | Phishing simulation or already handled | Dismiss |

## Error Handling

### No Open Cases

```
No open abuse mailbox cases found.

Your abuse mailbox is clear! All cases have been triaged.

Suggestions:
- Check completed cases with --status done
- View all cases with --status all
```

### Authentication Error

```
Error: Invalid or expired API token.

Regenerate your token at Abnormal Security Portal > Settings > Integrations > API.
```

## Related Commands

- `/threat-triage` - Triage recent threats
- `/search-threats` - Search for specific threats
