---
name: "Checkpoint Avanan Threats"
description: >
  Use this skill when working with Checkpoint Harmony Email threat detection
  and analysis - phishing, malware, BEC, account takeover, IOC extraction,
  threat timelines, and severity assessment. Covers threat types, detection
  engines, indicator analysis, and threat intelligence workflows.
  Essential for MSP security analysts investigating email-borne threats
  detected by Checkpoint Harmony Email & Collaboration (Avanan).
when_to_use: >-
  When phishing, malware, BEC, account takeover, IOC extraction, threat timelines, and severity
  assessment. Use when: checkpoint threat, avanan threat, email threat, phishing detection,
  malware email, bec detection, business email compromise, account takeover, threat analysis, ioc
  extraction, threat indicators, email security threat, threat timeline, or threat severity.
---

# Checkpoint Harmony Email Threat Detection & Analysis

## Overview

Checkpoint Harmony Email & Collaboration (Avanan) uses multiple detection engines to identify email-borne threats before they reach end users. The threat detection system covers phishing, malware, business email compromise (BEC), account takeover (ATO), and zero-day attacks. This skill covers threat types, detection engines, IOC extraction, timeline analysis, and investigation workflows.

## Threat Types

| Type | Code | Description | Severity Range |
|------|------|-------------|----------------|
| **Phishing** | `PHISHING` | Credential harvesting via fake login pages or deceptive links | Medium - Critical |
| **Spear Phishing** | `SPEAR_PHISHING` | Targeted phishing aimed at specific individuals | High - Critical |
| **Malware** | `MALWARE` | Malicious attachments or drive-by download links | High - Critical |
| **Ransomware** | `RANSOMWARE` | Ransomware payload in attachment or link | Critical |
| **BEC** | `BEC` | Business email compromise / CEO fraud | High - Critical |
| **Account Takeover** | `ATO` | Compromised internal account sending malicious email | Critical |
| **Zero-Day** | `ZERO_DAY` | Previously unknown threat detected by sandbox | Critical |
| **Spam** | `SPAM` | Unsolicited bulk email | Low |
| **Bulk** | `BULK` | Marketing/newsletter content | Low |
| **DLP Violation** | `DLP` | Outbound data loss prevention trigger | Medium - High |

### Detection Engines

| Engine | Description | Threat Types Detected |
|--------|-------------|----------------------|
| **Anti-Phishing** | URL reputation, page similarity, brand impersonation | PHISHING, SPEAR_PHISHING |
| **Anti-Malware** | Signature-based and heuristic file scanning | MALWARE, RANSOMWARE |
| **Sandbox** | Dynamic analysis of attachments in isolated environment | MALWARE, RANSOMWARE, ZERO_DAY |
| **AI/ML Engine** | Machine learning models for anomaly and impersonation detection | BEC, ATO, SPEAR_PHISHING |
| **URL Rewriting** | Click-time URL scanning and rewriting | PHISHING, MALWARE |
| **DLP Engine** | Content inspection against data loss policies | DLP |
| **Anti-Spam** | Reputation and content-based spam filtering | SPAM, BULK |

## Complete Threat Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `threatId` | string | Unique threat identifier |
| `type` | string | Threat type code (see table above) |
| `severity` | string | CRITICAL, HIGH, MEDIUM, LOW |
| `confidenceScore` | int | Detection confidence 0-100 |
| `detectedDate` | datetime | When the threat was first detected |
| `detectionEngine` | string | Which engine identified the threat |
| `status` | string | DETECTED, QUARANTINED, REMEDIATED, FALSE_POSITIVE |

### Email Context Fields

| Field | Type | Description |
|-------|------|-------------|
| `messageId` | string | Email message ID (RFC 5322) |
| `subject` | string | Email subject line |
| `sender` | string | Sender email address |
| `senderDisplayName` | string | Sender display name |
| `senderIp` | string | Originating IP address |
| `recipients` | string[] | Target recipient addresses |
| `recipientCount` | int | Number of recipients targeted |
| `direction` | string | INBOUND, OUTBOUND, INTERNAL |

### Indicator of Compromise (IOC) Fields

| Field | Type | Description |
|-------|------|-------------|
| `urls` | object[] | Malicious URLs found in email body/attachments |
| `urls[].url` | string | The full URL |
| `urls[].verdict` | string | MALICIOUS, SUSPICIOUS, CLEAN |
| `urls[].category` | string | Phishing page, malware host, C2 server, etc. |
| `domains` | string[] | Suspicious domains extracted from URLs and headers |
| `ipAddresses` | string[] | IP addresses associated with the threat |
| `fileHashes` | object[] | Hashes of malicious attachments |
| `fileHashes[].sha256` | string | SHA-256 hash |
| `fileHashes[].md5` | string | MD5 hash |
| `fileHashes[].fileName` | string | Original filename |
| `fileHashes[].verdict` | string | MALICIOUS, SUSPICIOUS, CLEAN |

### Timeline Fields

| Field | Type | Description |
|-------|------|-------------|
| `receivedDate` | datetime | When email entered the mail system |
| `scannedDate` | datetime | When scanning completed |
| `quarantinedDate` | datetime | When email was quarantined (if applicable) |
| `remediatedDate` | datetime | When threat was remediated |
| `reportedDate` | datetime | When user reported (if user-reported) |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `avanan_threats_list` | List detected threats with filters | `startDate`, `endDate`, `type`, `severity`, `status`, `limit`, `offset` |
| `avanan_threats_get` | Get detailed threat analysis | `threatId` |
| `avanan_threats_iocs` | Extract IOCs from a threat | `threatId`, `iocTypes` |
| `avanan_threats_timeline` | Get threat detection timeline | `threatId` |
| `avanan_threats_search` | Search threats by various criteria | `query`, `field`, `startDate`, `endDate`, `type` |
| `avanan_threats_stats` | Get threat statistics and trends | `startDate`, `endDate`, `groupBy` |
| `avanan_threats_mark_false_positive` | Mark threat as false positive | `threatId`, `reason` |

### Tool Usage Examples

**List critical threats from last 24 hours:**
```json
{
  "tool": "avanan_threats_list",
  "parameters": {
    "startDate": "2024-02-14T00:00:00Z",
    "endDate": "2024-02-15T00:00:00Z",
    "severity": "CRITICAL",
    "status": "DETECTED",
    "limit": 50
  }
}
```

**Extract IOCs from a threat:**
```json
{
  "tool": "avanan_threats_iocs",
  "parameters": {
    "threatId": "threat-abc123",
    "iocTypes": ["urls", "domains", "fileHashes", "ipAddresses"]
  }
}
```

**Search for phishing threats targeting a specific user:**
```json
{
  "tool": "avanan_threats_search",
  "parameters": {
    "query": "cfo@company.com",
    "field": "recipients",
    "type": "PHISHING",
    "startDate": "2024-02-01T00:00:00Z"
  }
}
```

## Threat Analysis Workflows

### Phishing Investigation Workflow

1. **Get threat details** - Retrieve full threat record with IOCs
2. **Analyze sender:**
   - Check sender address vs display name mismatch
   - Look up sender domain age and reputation
   - Check SPF/DKIM/DMARC results
3. **Analyze URLs:**
   - Extract all URLs from body and attachments
   - Check URL reputation and redirect chains
   - Identify brand impersonation (login page similarity)
4. **Check scope:**
   - Search for same sender across all recipients
   - Identify how many users received the same campaign
5. **Remediate:**
   - Quarantine all related messages if not already quarantined
   - Add sender domain to block list if confirmed malicious
   - Notify affected users
6. **Document** - Create incident with findings and IOCs

### BEC Investigation Workflow

1. **Review impersonation indicators:**
   - Display name matches executive but email address differs
   - Reply-to address differs from sender
   - Unusual urgency language or financial requests
2. **Check sender authentication:**
   - SPF, DKIM, DMARC results
   - Whether sender domain is a lookalike (typosquatting)
3. **Analyze email content:**
   - Wire transfer or gift card requests
   - Urgency indicators ("immediately", "today", "confidential")
   - Unusual sender behavior patterns
4. **Check for account compromise:**
   - Search for ATO indicators on the impersonated account
   - Review recent login activity and impossible travel
5. **Remediate and report:**
   - Block sender domain
   - Alert targeted recipients
   - Report to incident management

### Malware Analysis Workflow

1. **Get attachment details** - File name, type, size, hashes
2. **Check hash reputation** - Look up SHA-256 in threat intelligence
3. **Review sandbox results** - Dynamic analysis behavior indicators
4. **Extract IOCs:**
   - C2 server addresses
   - Dropped file hashes
   - Registry modifications
   - Network connections
5. **Assess blast radius:**
   - How many users received the attachment
   - Whether any users opened/executed it
6. **Remediate:**
   - Quarantine all instances
   - Block file hash at endpoint level
   - Block C2 domains/IPs at firewall

## Severity Assessment Matrix

| Factor | Low | Medium | High | Critical |
|--------|-----|--------|------|----------|
| Recipients | 1 user | 2-10 users | 10-50 users | 50+ users or executives |
| Threat Type | SPAM, BULK | DLP, ANOMALY | PHISHING, BEC | MALWARE, RANSOMWARE, ATO |
| Confidence | < 50% | 50-75% | 75-90% | > 90% |
| User Interaction | None | Email opened | Link clicked | Attachment executed |
| Data Exposure | None | Metadata only | Credentials entered | Data exfiltrated |

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid threat type | Use valid type codes from reference above |
| 400 | Invalid date range | Max 90-day range, startDate before endDate |
| 401 | Unauthorized | Check API credentials and token expiry |
| 403 | Insufficient permissions | API key needs threat detection scope |
| 404 | Threat not found | Verify threat ID exists |
| 429 | Rate limited | Implement exponential backoff |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Invalid severity filter | Unrecognized severity value | Use CRITICAL, HIGH, MEDIUM, or LOW |
| Too many IOC types | Requested more than supported | Use valid iocTypes: urls, domains, fileHashes, ipAddresses |
| Threat expired | Older than retention period | Data no longer available |

## Best Practices

1. **Prioritize by severity** - Critical threats first, then high, then medium
2. **Check blast radius early** - Know how many users are affected before deep analysis
3. **Extract and share IOCs** - Feed IOCs to other security tools (SIEM, firewall, EDR)
4. **Correlate across threat types** - A phishing campaign may precede an ATO
5. **Document investigation steps** - Maintains chain of evidence for incident response
6. **Review false positive rates** - High FP rates indicate policy tuning needed
7. **Monitor threat trends** - Track threat volume by type over time for reporting
8. **Never release malware to users** - Even if they insist; escalate to management

## Related Skills

- [Checkpoint Quarantine](../quarantine/SKILL.md) - Quarantine management
- [Checkpoint Incidents](../incidents/SKILL.md) - Incident investigation
- [Checkpoint Policies](../policies/SKILL.md) - Policy management
- [Checkpoint API Patterns](../api-patterns/SKILL.md) - Authentication and API usage
