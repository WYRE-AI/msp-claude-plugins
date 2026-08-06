---
name: "Abnormal Security Messages"
description: >
  Abnormal Security message analysis: message retrieval, email header
  inspection, attachments, sender reputation, delivery context, and
  SPF/DKIM/DMARC authentication results.
when_to_use: >-
  When performing deep analysis or forensics on an individual email message
  in Abnormal Security. Use when: abnormal message, message analysis, email
  headers, email attachments, sender reputation, spf dkim dmarc, email
  authentication, message metadata, email delivery, abnormal email analysis,
  message inspection, or email forensics.
---

# Abnormal Security Message Analysis

## Overview

Abnormal Security provides deep message analysis capabilities beyond basic threat detection. This skill covers message retrieval, header inspection, attachment analysis, sender authentication results, and delivery context. Use it when performing forensic analysis of specific emails or investigating delivery patterns.

## Anti-triggers

- **Where a message went, or why it never arrived** — Abnormal sees
  messages only as evidence attached to a detected threat. It has no
  delivery pipeline, no queue, and no bounce record, so "trace this
  email" questions belong to the gateway: use
  `Mimecast Message Tracking`.
- **Removing the message from inboxes, or putting it back** — that is
  the remediation surface; use `Abnormal Security Threats`.
- **Inspecting a message a gateway is holding** — everything Abnormal
  can show was already delivered. Pre-delivery holds are
  `SpamTitan Quarantine` or `Proofpoint Quarantine`.

## Message Field Reference

These are **response** fields describing what Abnormal reports about a
message. They are not tool parameters — the only parameters the message
tools accept are `threatId` and `messageId`. Availability varies by
message and by tenant configuration; treat any single field as
best-effort.

### Core Message Fields

| Field | Type | Description |
|-------|------|-------------|
| `abxMessageId` | string | Abnormal's identifier for the message, as returned in the `abnormal_messages_list` response |
| `subject` | string | Email subject line |
| `fromAddress` | string | From header email address |
| `fromName` | string | From header display name |
| `toAddresses` | string[] | All To: recipients |
| `ccAddresses` | string[] | All CC: recipients |
| `bccAddresses` | string[] | All BCC: recipients (if available) |
| `sentTime` | datetime | When the email was sent |
| `receivedTime` | datetime | When the email was received by Abnormal |
| `internetMessageId` | string | RFC 5322 Message-ID header |

### Sender Analysis Fields

| Field | Type | Description |
|-------|------|-------------|
| `senderAddress` | string | Envelope sender address |
| `senderName` | string | Sender display name |
| `senderDomain` | string | Sender domain |
| `senderIpAddress` | string | Originating IP address |
| `returnPath` | string | Return-Path header (envelope sender) |
| `replyToEmails` | string[] | Reply-To header addresses |

### Authentication Fields

| Field | Type | Description |
|-------|------|-------------|
| `spfResult` | string | SPF check result: pass, fail, softfail, neutral, none |
| `dkimResult` | string | DKIM signature result: pass, fail, none |
| `dmarcResult` | string | DMARC policy result: pass, fail, none |
| `authenticationResults` | string | Full Authentication-Results header |

### Attachment Fields

| Field | Type | Description |
|-------|------|-------------|
| `attachmentCount` | int | Number of attachments |
| `attachmentNames` | string[] | Filenames of attachments |
| `attachmentTypes` | string[] | MIME types of attachments |
| `attachmentSizes` | int[] | Sizes of attachments in bytes |

### URL Fields

| Field | Type | Description |
|-------|------|-------------|
| `urls` | string[] | All URLs found in message body |
| `urlCount` | int | Total number of URLs |

### Delivery Context

| Field | Type | Description |
|-------|------|-------------|
| `isRead` | boolean | Whether the recipient has read the email |
| `isInternal` | boolean | Whether the email is internal (within org) |
| `isExternal` | boolean | Whether the email is from outside the org |
| `remediationStatus` | string | Current remediation status |

## MCP Tools

Two tools, and both are scoped to a single threat. There is no separate
headers tool and no tenant-wide message search — you cannot ask "show me
every message from this sender". Every message lookup starts from a
`threatId`.

| Tool | Description | Parameters |
|------|-------------|------------|
| `abnormal_messages_list` | List the messages inside one threat case. Returns message IDs and summary data. | `threatId` (required) |
| `abnormal_messages_get` | Full analysis of one message: metadata, headers, URLs, attachments, and AI threat analysis — all in a single payload. | `threatId` (required), `messageId` (required) |

### Headers arrive inline, not from a separate call

`abnormal_messages_get` returns the header set as part of its one
response, alongside URLs, attachments and the AI analysis. Everything the
*Header Analysis Workflow* below asks for comes out of that single call —
there is no second, header-only fetch to make, and nothing to page
through. The practical consequence is on the other side: one
`abnormal_messages_get` pulls the entire substance of a customer's email
into context, including recipient addresses and `Authentication-Results`,
whether or not you needed the headers. Call it when you intend to do
forensics on that message, not to browse.

### ID vocabulary

`threatId` is a **UUID string**. `messageId` is the message identifier
from the `abnormal_messages_list` response (URL-encoded when sent). Do
not confuse either with `caseId`, which `abnormal_cases_get` takes as a
**number**.

### Tool Usage Examples

**List messages associated with a threat:**
```json
{
  "tool": "abnormal_messages_list",
  "parameters": {
    "threatId": "184def76-3c28-4e1b-9ef0-a5abc123def4"
  }
}
```

**Get one message in full (metadata, headers, URLs, attachments):**
```json
{
  "tool": "abnormal_messages_get",
  "parameters": {
    "threatId": "184def76-3c28-4e1b-9ef0-a5abc123def4",
    "messageId": "<CA+8mv1x@mail.example.com>"
  }
}
```

## Message Analysis Workflows

### Header Analysis Workflow

1. **Retrieve the message** - `abnormal_messages_get` returns the headers
   inline; there is no separate header call
2. **Check authentication:**
   - SPF: Does the sending IP match the domain's SPF record?
   - DKIM: Is the DKIM signature valid and aligned?
   - DMARC: Does the message pass DMARC policy?
3. **Trace routing:**
   - Follow Received headers from bottom to top
   - Identify mail servers and relay hops
   - Check for unusual routing or delays
4. **Inspect key headers:**
   - From vs Return-Path mismatch (potential spoofing)
   - Reply-To vs From mismatch (redirect replies)
   - X-Mailer or User-Agent (sending client)
   - Content-Type and encoding

### Attachment Analysis Workflow

1. **List attachments** - Review filenames, types, and sizes
2. **Check for suspicious patterns:**
   - Double extensions (e.g., `invoice.pdf.exe`)
   - Macro-enabled Office files (`.docm`, `.xlsm`)
   - Archive files (`.zip`, `.rar`, `.7z`) containing executables
   - Unusual MIME types
3. **Cross-reference with threat data:**
   - Check if the attachment hash matches known malware
   - Review sandbox analysis results if available
4. **Assess risk:**
   - Was the attachment opened by the recipient?
   - How many users received the same attachment?

### Sender Reputation Workflow

1. **Check sender identity:**
   - Is this a first-time sender to this recipient?
   - Does the display name match the email address?
   - Is the domain recently registered?
2. **Verify authentication:**
   - SPF, DKIM, DMARC all passing?
   - Are there any authentication failures?
3. **Check sender IP:**
   - Is the IP on any blocklists?
   - Does it match the expected mail server for the domain?
4. **Review communication history:**
   - Has this sender contacted the organization before?
   - Is the communication pattern normal?

## Authentication Results Reference

### SPF Results

| Result | Meaning | Risk |
|--------|---------|------|
| `pass` | Sending IP authorized by domain | Low |
| `softfail` | IP not authorized but not explicitly denied | Medium |
| `fail` | IP explicitly not authorized | High |
| `neutral` | No SPF assertion | Medium |
| `none` | No SPF record exists | Medium |

### DKIM Results

| Result | Meaning | Risk |
|--------|---------|------|
| `pass` | Valid DKIM signature, aligned | Low |
| `fail` | DKIM signature invalid | High |
| `none` | No DKIM signature present | Medium |

### DMARC Results

| Result | Meaning | Risk |
|--------|---------|------|
| `pass` | Passes DMARC policy (SPF or DKIM aligned) | Low |
| `fail` | Fails DMARC policy | High |
| `none` | No DMARC record exists | Medium |

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid message ID | Use a `messageId` taken from `abnormal_messages_list`, not a hand-built one |
| 401 | Unauthorized | Check API token |
| 404 | Message not found | Message may have been purged or threat ID is wrong |
| 429 | Rate limited | Wait and retry |

## Best Practices

1. **Always check authentication** - SPF/DKIM/DMARC failures are strong spoofing indicators
2. **Compare From and Return-Path** - Mismatches often indicate spoofing or forwarding
3. **Review Reply-To** - Reply-To different from From is a common BEC indicator
4. **Check attachment types carefully** - Not all dangerous files have obvious extensions
5. **Trace Received headers** - Follow the email routing path for anomalies
6. **Check if email was read** - Read emails with credential phishing need password resets
7. **Cross-reference with threats** - Message context enriches threat investigations

## Related Skills

- [Abnormal Threats](../threats/SKILL.md) - Threat detection and analysis
- [Abnormal Cases](../cases/SKILL.md) - Abuse mailbox case management
- [Abnormal API Patterns](../api-patterns/SKILL.md) - API authentication and usage
