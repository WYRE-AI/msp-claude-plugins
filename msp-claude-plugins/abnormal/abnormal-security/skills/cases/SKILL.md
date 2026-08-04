---
name: "Abnormal Security Cases"
description: >
  Abnormal Security abuse mailbox cases: user-reported email submissions,
  case statuses and judgments, the case lifecycle, bulk and remediation
  actions, and phishing simulation handling.
when_to_use: >-
  When triaging or remediating user-reported suspicious emails in the
  Abnormal Security abuse mailbox. Use when: abnormal case, abuse mailbox,
  user reported email, reported phishing, case triage, case review, abnormal
  cases, abuse case management, phishing report, user submission, case
  remediation, or case judgment.
---

# Abnormal Security Abuse Mailbox Cases

## Overview

Abnormal Security's Abuse Mailbox automatically processes user-reported suspicious emails. When users forward or report emails to a designated abuse mailbox address, Abnormal analyzes the reported message and creates a case with an AI-generated judgment. This skill covers case lifecycle, triage workflows, remediation actions, and bulk operations.

## Anti-triggers

- **A `caseId` that came from an account-takeover alert** — ATO cases are
  a separate object with their own IDs and remediation set, and both
  skills call the identifier `caseId`; use
  `Abnormal Security Account Takeover`.
- **Threats Abnormal found on its own** — no user reported them, so no
  case exists; use `Abnormal Security Threats`.
- **User-reported phishing in a different platform** — IRONSCALES runs
  its own report-to-incident loop from its Outlook and Gmail add-ins,
  with separate IDs and its own classification verbs; use
  `IRONSCALES Incidents`.
- **A user who reported a simulated phish** — campaign reporting rates
  belong to the training platform; use `KnowBe4 Phishing`.

## Case Lifecycle

```
User Reports Email
       |
       v
  Case Created (status: Open)
       |
       v
  AI Analysis (judgment generated)
       |
       +---> Malicious   ---> Auto-Remediate (if configured)
       |
       +---> Suspicious  ---> Analyst Review Required
       |
       +---> Spam         ---> Auto-Dismiss (if configured)
       |
       +---> Safe         ---> Auto-Dismiss (if configured)
       |
       v
  Analyst Action
       |
       +---> Remediate (quarantine/delete across org)
       |
       +---> Mark Not Spam (release to inbox)
       |
       +---> Dismiss (close case, no action)
       |
       v
  Case Closed (status: Done)
```

## Case Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `caseId` | string | Unique case identifier |
| `severity` | string | Severity level of the case |
| `affectedEmployee` | string | Email address of the user who reported |
| `firstReported` | datetime | When the case was first reported |

### Judgment Fields

| Field | Type | Description |
|-------|------|-------------|
| `overallStatus` | string | Case status: Open, Acknowledged, Done |
| `judgmentStatus` | string | AI judgment: Malicious, Spam, Safe, No Action Needed |
| `customerVisibleTime` | datetime | When the case became visible in portal |

### Reported Message Fields

| Field | Type | Description |
|-------|------|-------------|
| `reportedMessage.subject` | string | Subject of the reported email |
| `reportedMessage.senderAddress` | string | Sender of the reported email |
| `reportedMessage.senderName` | string | Display name of the sender |
| `reportedMessage.recipientAddress` | string | Recipient of the reported email |
| `reportedMessage.receivedTime` | datetime | When the reported email was received |
| `reportedMessage.attackType` | string | Detected attack type (if malicious) |

## Case Judgments

| Judgment | Description | Recommended Action |
|----------|-------------|-------------------|
| **Malicious** | Confirmed threat (BEC, phishing, malware) | Remediate across organization |
| **Spam** | Unsolicited bulk email, marketing | Dismiss or move to junk |
| **Safe** | Legitimate email, no threat detected | Dismiss, notify user it is safe |
| **No Action Needed** | Phishing simulation or already remediated | Dismiss |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `abnormal_cases_list` | List abuse mailbox cases | `pageSize`, `pageNumber`, `filter`, `fromDate`, `toDate` |
| `abnormal_cases_get` | Get detailed case by ID | `caseId` |
| `abnormal_cases_actions` | Get available actions for a case | `caseId` |
| `abnormal_cases_action` | Take action on a case | `caseId`, `action` |

### Tool Usage Examples

**List open cases:**
```json
{
  "tool": "abnormal_cases_list",
  "parameters": {
    "filter": "overallStatus eq 'Open'",
    "pageSize": 25
  }
}
```

**Get case details:**
```json
{
  "tool": "abnormal_cases_get",
  "parameters": {
    "caseId": "12345"
  }
}
```

**Remediate a case:**
```json
{
  "tool": "abnormal_cases_action",
  "parameters": {
    "caseId": "12345",
    "action": "REMEDIATE"
  }
}
```

## Triage Workflows

### Standard Triage Workflow

1. **List open cases** - Get all cases with `overallStatus eq 'Open'`
2. **Sort by severity** - Address critical and high severity first
3. **Review AI judgment:**
   - If Malicious: verify and remediate across organization
   - If Spam: dismiss or move to junk
   - If Safe: dismiss and respond to reporter
   - If No Action Needed: dismiss (likely phishing simulation)
4. **Take action** - Remediate, dismiss, or mark not spam
5. **Close case** - Case moves to Done status after action

### Bulk Triage Workflow

1. **Filter cases by judgment** - Start with cases judged as Malicious
2. **Batch remediate** - Remediate all confirmed Malicious cases
3. **Review Suspicious** - Manually review cases without clear judgment
4. **Auto-dismiss Safe/Spam** - Close remaining low-risk cases

### Escalation Criteria

Escalate a case when:
- Multiple users report the same email
- The reported email impersonates an executive
- The email contains active malware or ransomware
- Credentials may have been entered on a phishing page
- The sender is a known vendor or partner (supply chain risk)

## Case Actions

| Action | Description | When to Use |
|--------|-------------|-------------|
| `REMEDIATE` | Remove the email from all recipients' inboxes | Confirmed malicious email |
| `MARK_NOT_SPAM` | Release email back to inbox | False positive, legitimate email |
| `DISMISS` | Close case without action | Safe email, phishing simulation, spam |

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid filter | Check OData filter syntax |
| 401 | Unauthorized | Check API token |
| 403 | Insufficient permissions | Token needs abuse mailbox scope |
| 404 | Case not found | Verify case ID |
| 409 | Case already actioned | Case was already remediated/dismissed |
| 429 | Rate limited | Wait and retry |

## Best Practices

1. **Triage daily** - Review abuse mailbox cases at least once per day
2. **Trust the AI judgment** - Abnormal's accuracy is high; use it to prioritize
3. **Remediate org-wide** - When a threat is confirmed, remediate for all recipients
4. **Respond to reporters** - Let users know their report was reviewed
5. **Track phishing simulation reports** - Monitor security awareness training effectiveness
6. **Correlate with threats** - Check if reported emails match known threat campaigns
7. **Monitor false positive rate** - High FP rates may indicate policy tuning needed

## Related Skills

- [Abnormal Threats](../threats/SKILL.md) - Threat detection and analysis
- [Abnormal Messages](../messages/SKILL.md) - Message analysis
- [Abnormal API Patterns](../api-patterns/SKILL.md) - API authentication and usage
