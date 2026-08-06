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

- **A compromised mailbox rather than a reported email** — sign-in
  anomalies, new inbox rules, and session revocation have no surface on
  this server at all; investigate identity in the M365 tenant, use
  `cipp-users`.
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
| `caseId` | number | Unique case identifier — numeric, unlike `threatId` |
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

**The cases domain is read-only.** Two tools, both GETs. There is no tool
that changes a case's state, assigns it to an analyst, dismisses it, or
closes it. Case state changes happen in the Abnormal portal, not through
this server — an agent can read and reason about a case, then it has to
hand the actual disposition to a human in the UI.

| Tool | Description | Parameters |
|------|-------------|------------|
| `abnormal_cases_list` | List cases | `pageSize` (default 100, max 100), `pageNumber` (1-indexed), `filter` (OData string) |
| `abnormal_cases_get` | Get one case by ID | `caseId` (required, **number**) |

There is no date-range parameter. Narrow by time through the OData
`filter` string: `createdTime gt 2026-03-01T00:00:00Z`.

### ID vocabulary

`caseId` is a **number** — `12345`, not `"12345"`. The neighbouring
`threatId` used by `abnormal_threats_get` is a **UUID string**. Both are
called "the ID" in conversation and they are not interchangeable; a
threat UUID passed to `abnormal_cases_get` is a type error, not a lookup
miss.

The one action this server *can* take on the mail behind a case is
message remediation, and it is reached through the threat, not the case:
`abnormal_remediation_manage` needs a `threatId` and a `messageId`, and a
`caseId` is neither.

### Tool Usage Examples

**List cases from this month:**
```json
{
  "tool": "abnormal_cases_list",
  "parameters": {
    "filter": "createdTime gt 2026-03-01T00:00:00Z",
    "pageSize": 25
  }
}
```

**Get case details:**
```json
{
  "tool": "abnormal_cases_get",
  "parameters": {
    "caseId": 12345
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
4. **Decide** - produce the disposition and the evidence for it
5. **Hand off** - the case's own state (Open → Acknowledged → Done) can
   only be changed in the Abnormal portal. If mail still needs pulling
   from inboxes, that runs through the threat:
   `abnormal_messages_list` then `abnormal_remediation_manage` per
   message.

### Bulk Triage Workflow

1. **Filter cases by judgment** - Start with cases judged as Malicious
2. **Review Suspicious** - Manually review cases without clear judgment
3. **Batch the read, not the write** - paginate `abnormal_cases_list` to
   build the full picture in one pass. There is no bulk case action to
   follow it with; dispositions are entered in the portal one at a time.

### Escalation Criteria

Escalate a case when:
- Multiple users report the same email
- The reported email impersonates an executive
- The email contains active malware or ransomware
- Credentials may have been entered on a phishing page
- The sender is a known vendor or partner (supply chain risk)

## Case Actions — where they actually happen

The dispositions below are portal actions. None of them is an MCP tool,
and none can be driven from this server.

| Disposition | Effect | Where |
|-------------|--------|-------|
| Remediate | Remove the email from recipients' inboxes | Abnormal portal — or, per message, via `abnormal_remediation_manage` on the underlying threat |
| Mark not spam | Release email back to inbox | Abnormal portal only |
| Dismiss | Close case without action | Abnormal portal only |

The gap matters for automation design: an agent can fully triage the
queue from `abnormal_cases_list` and `abnormal_cases_get`, but the case
stays Open until a human touches the portal. Write the handoff into the
workflow rather than assuming the agent closed anything.

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid filter | Check OData filter syntax |
| 401 | Unauthorized | Check API token |
| 403 | Insufficient permissions | Token needs abuse mailbox scope |
| 404 | Case not found | Verify the case ID — and that you passed a numeric `caseId`, not a threat UUID |
| 429 | Rate limited | Wait and retry |

## Best Practices

1. **Triage daily** - Review abuse mailbox cases at least once per day
2. **Trust the AI judgment** - Abnormal's accuracy is high; use it to prioritize
3. **Remediate every message, not "the case"** - remediation is per message on the underlying threat; loop `abnormal_remediation_manage` and confirm each one, or you will leave the campaign half-pulled
4. **Respond to reporters** - Let users know their report was reviewed
5. **Track phishing simulation reports** - Monitor security awareness training effectiveness
6. **Correlate with threats** - Check if reported emails match known threat campaigns
7. **Monitor false positive rate** - High FP rates may indicate policy tuning needed

## Related Skills

- [Abnormal Threats](../threats/SKILL.md) - Threat detection and analysis
- [Abnormal Messages](../messages/SKILL.md) - Message analysis
- [Abnormal API Patterns](../api-patterns/SKILL.md) - API authentication and usage
