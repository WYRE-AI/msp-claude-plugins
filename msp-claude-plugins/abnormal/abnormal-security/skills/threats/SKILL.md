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
  compromise, and this server exposes no account-takeover surface at all.
  Investigate identity in the M365 tenant instead; use `cipp-users`.
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
  produces its own threat records; use `avanan-threats`.

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

Two tools cover the threat domain. There is no threat-level action tool —
nothing here changes a threat's state, and `abnormal_threats_get` is a
read.

| Tool | Description | Parameters |
|------|-------------|------------|
| `abnormal_threats_list` | List detected threats. Returns threat IDs plus summary only — no message bodies, no headers. | `pageSize` (default 100, max 100), `pageNumber` (1-indexed), `filter` (OData string) |
| `abnormal_threats_get` | Get one threat by ID, including its related message IDs. | `threatId` (required) |

There is no date-range parameter. Narrow by time through the OData
`filter` string: `receivedTime gt 2026-03-20T00:00:00Z`.

### ID vocabulary

`threatId` is a **UUID string**. The neighbouring `caseId` used by
`abnormal_cases_get` is a **number**. The two identifiers read alike in
prose ("pull case 12345", "pull the case for that threat") and are not
interchangeable — passing a threat UUID to `abnormal_cases_get` is a type
error, not a lookup miss.

### Tool Usage Examples

**List recent threats:**
```json
{
  "tool": "abnormal_threats_list",
  "parameters": {
    "filter": "receivedTime gt 2026-03-20T00:00:00Z",
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
   - Re-run `abnormal_threats_list` over the window and correlate on
     sender in the results — there is no tenant-wide message search, so
     scope is assembled from threat records, not from a sender query
   - Check whether other threats in the window share the sender or domain
5. **Remediate** - `abnormal_messages_list`, then
   `abnormal_remediation_manage` per message (see *Remediation is
   per-message*). Alert targeted recipients directly. Sender-domain
   blocking is not an Abnormal action — do it at the gateway or in M365.
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
5. **Remediate** - loop `abnormal_remediation_manage` over every message
   in the threat. Password resets and domain blocks are outside this
   server entirely: run them through `cipp-users` or the M365 tenant.

### Malware Investigation Workflow

1. **Get attachment details** - File name, type, size
2. **Review AI insights** - Check summaryInsights for behavioral indicators
3. **Assess delivery:**
   - Was the attachment opened?
   - How many users received the same attachment?
4. **Remediate** - loop `abnormal_remediation_manage` over every message
   in the threat. Hash blocking and endpoint isolation are EDR actions,
   not Abnormal ones.

## Severity Assessment Matrix

| Factor | Low | Medium | High | Critical |
|--------|-----|--------|------|----------|
| Attack Type | Spam, Graymail | Scam, Extortion | Phishing, BEC | Supply Chain, compromised internal sender |
| Recipients | 1 user | 2-10 users | 10-50 users | 50+ or executives |
| User Interaction | Not read | Read, no click | Link clicked | Credentials entered |
| Sender Profile | Known spam | Unknown external | Impersonation | Compromised internal |
| Financial Impact | None | Low value request | Wire/ACH request | Active fraud |

## Remediation is per-message, not per-threat

Remediation does not live in this domain. The only mutating tool on the
server is `abnormal_remediation_manage`, and it requires **both**
`threatId` and `messageId`:

| Argument | Required | Notes |
|----------|----------|-------|
| `threatId` | yes | UUID of the containing threat |
| `messageId` | yes | one specific message inside that threat |
| `action` | yes | `remediate` \| `unremediate` \| `status` |

There is no "remediate this campaign" call. To act on a threat you must:

1. `abnormal_threats_get` — confirm the threat is what you think it is.
2. `abnormal_messages_list` — enumerate the messages inside it.
3. `abnormal_remediation_manage` — **once per message**, in a loop.

### Why the loop is the hazard

The shape of the risk is not "one big blast radius decision". It is an
N-call loop that can stop halfway.

- **Partial failure leaves a campaign half-remediated.** Rate limiting
  (60 req/min) or a single 4xx mid-loop means some recipients had the
  message pulled and others still have it in the inbox. Nothing in the
  API reports "the campaign is done" — only per-message results. Track
  which `messageId`s succeeded; do not infer completion from the first
  few.
- **The message list is a point-in-time snapshot.** A live campaign can
  land in more mailboxes while you are looping. Re-run
  `abnormal_messages_list` after the loop rather than trusting the
  original enumeration.
- **`action` — not the tool name — decides the blast radius.**
  `status` is a plain GET. `remediate` and `unremediate` are POSTs that
  move real mail. One tool name spans a safe read and a destructive
  write, so any allowlist keyed on tool name grants all three. An agent
  permitted to check `status` is, mechanically, permitted to
  `unremediate`.
- **`unremediate` is not an undo.** It delivers a message Abnormal
  classified as an attack back into a user's inbox. Treat it as a
  delivery decision requiring the same approval as the original
  remediation, not as a correction.

Verify with `action: "status"` per message after the loop.

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
4. **Correlate account compromise elsewhere** - A phishing campaign may lead to account compromise, but nothing on this server detects it; pivot to `cipp-users`
5. **Monitor remediation status** - Check `action: "status"` per message; there is no campaign-level status
6. **Track post-remediation** - Emails remediated after delivery need immediate attention
7. **Never release confirmed threats** - `unremediate` delivers a known attack; escalate to management instead

## Related Skills

- [Abnormal Cases](../cases/SKILL.md) - Abuse mailbox case management
- [Abnormal Messages](../messages/SKILL.md) - Message analysis
- [Abnormal API Patterns](../api-patterns/SKILL.md) - API authentication and usage
