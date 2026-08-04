---
name: "Abnormal Security Threats"
description: >
  Abnormal Security threat detection: threat types (BEC, phishing, malware,
  socially-engineered attacks, spam, graymail, credential theft), attack
  vectors, severity assessment, remediation actions, and investigation
  workflows.
when_to_use: >-
  When investigating an email-borne threat detected by Abnormal Security's
  behavioral engine. Use when: abnormal threat, abnormal security threat,
  email threat, bec detection, business email compromise, phishing
  detection, credential phishing, malware email, socially engineered attack,
  threat analysis abnormal, email attack, threat severity, or abnormal
  threat investigation.
---

# Abnormal Security Threat Detection & Analysis

## Overview

Abnormal Security uses behavioral AI to detect email threats that bypass traditional secure email gateways (SEGs). Unlike signature or rule-based detection, Abnormal profiles normal communication patterns and detects deviations indicative of attacks. This skill covers threat types, attack vectors, severity assessment, remediation, and investigation workflows.

## Anti-triggers

- **An email a user reported to the abuse mailbox** — those arrive as
  cases carrying their own AI judgment and action set; use
  `Abnormal Security Cases`.
- **A mailbox behaving strangely rather than an email arriving** —
  impossible travel, new inbox rules, and lateral sending are account
  compromise; use `Abnormal Security Account Takeover`.
- **Header, SPF/DKIM/DMARC, or attachment forensics on one message** —
  use `Abnormal Security Messages`.
- **Releasing something from a quarantine queue** — Abnormal has no
  gateway queue. It inspects mail post-delivery through the M365 API and
  pulls it back out of inboxes. Anything sitting in a hold queue belongs
  to the gateway holding it: `SpamTitan Quarantine`,
  `Mimecast Message Tracking`, or `Proofpoint Quarantine`.
- **A threat the gateway already stopped** — mail blocked before
  delivery never reaches the mailbox, so Abnormal never sees it. Search
  the gateway's own logs.
- **The same mail flagged by Check Point Harmony Email** — Avanan is
  the other API-based, post-delivery platform on this stack and
  produces its own threat records; use `checkpoint-avanan-threats`.

## Threat Types

| Type | Description | Severity Range |
|------|-------------|----------------|
| **BEC (Business Email Compromise)** | Impersonation of executives or trusted contacts to request financial actions | High - Critical |
| **Credential Phishing** | Emails designed to harvest credentials via fake login pages | Medium - Critical |
| **Malware** | Emails containing malicious attachments or links to malware downloads | High - Critical |
| **Extortion** | Threatening emails demanding payment (sextortion, DDoS threats) | Medium - High |
| **Social Engineering** | Manipulation attacks using urgency, authority, or trust | Medium - Critical |
| **Spam** | Unsolicited bulk email | Low |
| **Graymail** | Marketing, newsletters, and promotional content | Low |
| **Scam** | Advance-fee fraud, fake invoices, lottery scams | Medium - High |
| **Supply Chain Compromise** | Attacks from compromised vendor or partner email accounts | Critical |

### Detection Approach

| Engine | Description | What It Detects |
|--------|-------------|-----------------|
| **Behavioral AI** | Models normal communication patterns per user/org | BEC, social engineering, impersonation |
| **Content Analysis** | NLP analysis of email body and intent | Urgency, financial requests, credential harvesting |
| **Sender Profiling** | Reputation and authentication of sender | Spoofing, domain impersonation, first-time senders |
| **URL Analysis** | Real-time scanning of embedded links | Credential phishing pages, malware delivery |
| **Attachment Analysis** | File inspection and sandboxing | Malware, ransomware payloads |
| **VendorBase** | Vendor risk intelligence network | Supply chain compromise, compromised vendor accounts |

## Threat Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `threatId` | string | Unique threat identifier (UUID) |
| `abxMessageId` | long | Abnormal internal message ID |
| `abxPortalUrl` | string | Direct link to threat in Abnormal portal |
| `attackType` | string | BEC, PHISHING, MALWARE, EXTORTION, SPAM, etc. |
| `attackStrategy` | string | Specific attack strategy (e.g., "Invoice/Payment Fraud") |
| `sentTime` | datetime | When the email was sent |
| `receivedTime` | datetime | When the email was received |
| `attackVector` | string | How the attack was delivered (Link, Attachment, Text) |
| `summaryInsights` | string[] | AI-generated summary of why this is a threat |

### Sender Fields

| Field | Type | Description |
|-------|------|-------------|
| `senderAddress` | string | Sender email address |
| `senderName` | string | Sender display name |
| `fromAddress` | string | From header address |
| `fromName` | string | From header display name |
| `replyToEmails` | string[] | Reply-to addresses |
| `returnPath` | string | Return-path/envelope sender |
| `senderIpAddress` | string | Originating IP address |
| `senderDomain` | string | Sender domain |
| `impersonatedParty` | string | Who is being impersonated (if applicable) |

### Recipient Fields

| Field | Type | Description |
|-------|------|-------------|
| `recipientAddress` | string | Primary recipient |
| `toAddresses` | string[] | All To: addresses |
| `ccAddresses` | string[] | All CC: addresses |

### Remediation Fields

| Field | Type | Description |
|-------|------|-------------|
| `remediationStatus` | string | Auto-Remediated, Not Remediated, Post-Remediated |
| `remediationTimestamp` | datetime | When remediation action was taken |
| `postRemediated` | boolean | Whether email was remediated after delivery |
| `isRead` | boolean | Whether the recipient read the email |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `abnormal_threats_list` | List detected threats with filters | `pageSize`, `pageNumber`, `filter`, `fromDate`, `toDate` |
| `abnormal_threats_get` | Get detailed threat by ID | `threatId` |
| `abnormal_threats_actions` | Get remediation actions for a threat | `threatId` |
| `abnormal_threats_remediate` | Remediate a threat (move to junk/trash/quarantine) | `threatId`, `action` |
| `abnormal_threats_unremediate` | Undo remediation on a threat | `threatId` |

### Tool Usage Examples

**List recent threats:**
```json
{
  "tool": "abnormal_threats_list",
  "parameters": {
    "fromDate": "2026-03-20T00:00:00Z",
    "toDate": "2026-03-27T00:00:00Z",
    "pageSize": 25
  }
}
```

**Get threat details:**
```json
{
  "tool": "abnormal_threats_get",
  "parameters": {
    "threatId": "184def76-3c28-4e1b-9ef0-a5abc123def4"
  }
}
```

**Remediate a threat:**
```json
{
  "tool": "abnormal_threats_remediate",
  "parameters": {
    "threatId": "184def76-3c28-4e1b-9ef0-a5abc123def4",
    "action": "QUARANTINE"
  }
}
```

## Threat Investigation Workflows

### BEC Investigation Workflow

1. **Review threat details** - Check attackType, attackStrategy, summaryInsights
2. **Analyze impersonation:**
   - Who is being impersonated (impersonatedParty)
   - Display name vs actual email address mismatch
   - Reply-to vs from address mismatch
   - First-time sender or unusual communication pattern
3. **Check financial indicators:**
   - Wire transfer, ACH, or gift card requests
   - Invoice or payment redirection
   - Urgency language ("urgent", "today", "confidential")
4. **Assess scope:**
   - Search for same sender across all recipients
   - Check if other users received similar attacks
5. **Remediate:**
   - Quarantine message if still in inbox
   - Alert targeted recipients directly
   - Block sender domain if confirmed malicious
6. **Document** - Record findings and IOCs

### Credential Phishing Investigation Workflow

1. **Get threat details** - Focus on attackVector and embedded URLs
2. **Analyze URLs:**
   - Check for brand impersonation (Microsoft, Google, Dropbox)
   - Look for redirect chains and URL shorteners
   - Identify credential harvesting pages
3. **Check sender authentication:**
   - SPF, DKIM, DMARC results
   - Domain age and reputation
4. **Assess user interaction:**
   - Was the email read (isRead)?
   - Was it post-remediated (delivered then removed)?
5. **Remediate:**
   - Quarantine all instances
   - Force password reset if credentials may have been entered
   - Block phishing domain

### Malware Investigation Workflow

1. **Get attachment details** - File name, type, size
2. **Review AI insights** - Check summaryInsights for behavioral indicators
3. **Assess delivery:**
   - Was the attachment opened?
   - How many users received the same attachment?
4. **Remediate:**
   - Quarantine all instances across the organization
   - Block file hash at endpoint level
   - Isolate affected endpoints if attachment was executed

## Severity Assessment Matrix

| Factor | Low | Medium | High | Critical |
|--------|-----|--------|------|----------|
| Attack Type | Spam, Graymail | Scam, Extortion | Phishing, BEC | Supply Chain, ATO |
| Recipients | 1 user | 2-10 users | 10-50 users | 50+ or executives |
| User Interaction | Not read | Read, no click | Link clicked | Credentials entered |
| Sender Profile | Known spam | Unknown external | Impersonation | Compromised internal |
| Financial Impact | None | Low value request | Wire/ACH request | Active fraud |

## Remediation Actions

| Action | Description | When to Use |
|--------|-------------|-------------|
| `QUARANTINE` | Move to quarantine (user cannot access) | Confirmed malicious threats |
| `MOVE_TO_JUNK` | Move to junk/spam folder | Spam, graymail, low-confidence threats |
| `DELETE` | Permanently delete the message | High-severity confirmed threats |
| `UNREMEDIATE` | Undo remediation, restore to inbox | False positives |

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid filter parameter | Check filter syntax and valid field names |
| 401 | Unauthorized | Check API token validity |
| 403 | Insufficient permissions | Token needs threat detection scope |
| 404 | Threat not found | Verify threat ID |
| 429 | Rate limited | Wait and retry with exponential backoff |

## Best Practices

1. **Prioritize by attack type** - BEC and supply chain threats first
2. **Check user interaction** - Prioritize threats that were read or clicked
3. **Review AI insights** - summaryInsights explains why Abnormal flagged the email
4. **Correlate with account takeover** - A phishing campaign may lead to account compromise
5. **Monitor remediation status** - Ensure auto-remediation is working as expected
6. **Track post-remediation** - Emails remediated after delivery need immediate attention
7. **Never release confirmed threats** - Even if users request it; escalate to management

## Related Skills

- [Abnormal Cases](../cases/SKILL.md) - Abuse mailbox case management
- [Abnormal Messages](../messages/SKILL.md) - Message analysis
- [Abnormal Vendors](../vendors/SKILL.md) - Vendor risk assessment
- [Abnormal Account Takeover](../account-takeover/SKILL.md) - Account takeover detection
- [Abnormal API Patterns](../api-patterns/SKILL.md) - API authentication and usage
