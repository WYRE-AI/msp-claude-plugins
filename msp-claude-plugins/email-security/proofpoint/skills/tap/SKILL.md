---
name: "Proofpoint TAP"
description: >
  Proofpoint Targeted Attack Protection (TAP) fundamentals: threat events across
  URL, attachment, and message-level vectors, click tracking, message disposition,
  SIEM integration feeds, and campaign correlation.
when_to_use: >-
  When retrieving TAP threat events, click activity, message delivery/blocking data, or SIEM
  feeds. Use when: proofpoint tap, targeted attack protection, proofpoint threats, email threats,
  tap events, proofpoint clicks, click tracking, proofpoint messages, message blocked, message
  delivered, proofpoint siem, tap api, threat events, proofpoint malware, or proofpoint
  phishing.
---

# Proofpoint Targeted Attack Protection (TAP)

## Overview

Proofpoint TAP is the core threat detection engine in the Proofpoint email security stack. It analyzes email messages, URLs, and attachments in real time using sandboxing, behavioral analysis, and threat intelligence. The TAP SIEM API provides programmatic access to all threat events, click activity, and message disposition data.

TAP identifies three primary threat vectors:
- **URL threats** - Malicious links in email bodies
- **Attachment threats** - Malicious files attached to messages
- **Message-level threats** - Threats classified at the message level (e.g., BEC, impostor)

## Anti-triggers

- **Anything older than 24 hours** — the SIEM API's maximum lookback is
  24 hours and it answers an out-of-range window with an empty result,
  not an error. "Did we see this last week?" needs
  `proofpoint-forensics` for a specific message or
  `proofpoint-threat-intel` for a campaign.
- **Acting on a message** — TAP is a read-only event feed. Release and
  delete are `proofpoint-quarantine`; removing delivered mail is
  `proofpoint-forensics`.
- **Which people are most targeted** — TAP returns per-event rows; the
  per-user rollup, Attack Index, and VAP list are `proofpoint-people`.
- **Another vendor's threat events** — Checkpoint Harmony is
  `checkpoint-avanan-threats`, Abnormal is `abnormal-security-threats`,
  and Mimecast message-level delivery tracking is
  `mimecast-message-tracking`.
- **A rewritten link and what happened when it was clicked** — URL
  Defense rewriting, click verdicts, and decoding a
  `urldefense.proofpoint.com` target are `proofpoint-url-defense`;
  TAP reports the click event without explaining the rewrite.

## Key Concepts

### Threat Classifications

| Classification | Description | Typical Action |
|---------------|-------------|----------------|
| `malware` | Known or sandboxed malware payload | Block and quarantine |
| `phish` | Credential harvesting or phishing | Block and quarantine |
| `spam` | Unsolicited bulk email | Quarantine or tag |
| `impostor` | Business Email Compromise (BEC) | Quarantine or warn |

### Threat Dispositions

| Disposition | Description |
|-------------|-------------|
| `allowed` | Message was delivered to the recipient |
| `blocked` | Message was blocked before delivery |
| `quarantined` | Message was placed in quarantine |

### Click Verdicts

| Verdict | Description |
|---------|-------------|
| `permitted` | Click was allowed (URL was clean at time of click) |
| `blocked` | Click was blocked (URL was malicious at time of click) |

### Time Windows

TAP SIEM API supports relative and absolute time windows:

| Parameter | Format | Example | Max Window |
|-----------|--------|---------|------------|
| `sinceSeconds` | Integer (seconds) | `3600` (1 hour) | 86400 (24 hours) |
| `sinceTime` | ISO 8601 | `2024-02-15T00:00:00Z` | 24 hours from now |
| `interval` | ISO 8601 duration | `PT1H` (1 hour) | 1 hour |

**Important:** The maximum lookback window is 24 hours. For historical data beyond 24 hours, use the forensics or campaign APIs instead.

## Field Reference

### Message Event Fields

| Field | Type | Description |
|-------|------|-------------|
| `GUID` | string | Unique message identifier |
| `QID` | string | Queue ID from the mail server |
| `sender` | string | Envelope sender address |
| `recipient` | string[] | List of recipient addresses |
| `subject` | string | Message subject line |
| `messageTime` | datetime | When the message was processed |
| `threatsInfoMap` | object[] | Array of threat details |
| `malwareScore` | int | 0-100 malware confidence score |
| `phishScore` | int | 0-100 phishing confidence score |
| `spamScore` | int | 0-100 spam confidence score |
| `impostorScore` | int | 0-100 impostor/BEC confidence score |
| `cluster` | string | Proofpoint cluster that processed the message |
| `messageParts` | object[] | Breakdown of message MIME parts |
| `completelyRewritten` | boolean | Whether all URLs were rewritten by URL Defense |
| `policyRoutes` | string[] | Policy rules that matched |

### Threat Info Map Fields

| Field | Type | Description |
|-------|------|-------------|
| `threat` | string | The threat indicator (URL, hash, etc.) |
| `threatID` | string | Unique threat identifier |
| `threatStatus` | string | `active`, `cleared`, `falsePositive` |
| `threatTime` | datetime | When the threat was first identified |
| `threatType` | string | `url`, `attachment`, `messageText` |
| `classification` | string | `malware`, `phish`, `spam`, `impostor` |
| `threatUrl` | string | URL to threat detail in TAP dashboard |

### Click Event Fields

| Field | Type | Description |
|-------|------|-------------|
| `campaignId` | string | Associated campaign identifier |
| `clickIP` | string | IP address of the clicker |
| `clickTime` | datetime | When the click occurred |
| `GUID` | string | Message GUID containing the URL |
| `recipient` | string | Who clicked |
| `sender` | string | Who sent the message |
| `threatID` | string | Threat identifier for the URL |
| `threatTime` | datetime | When URL was classified as threat |
| `threatURL` | string | The malicious URL that was clicked |
| `url` | string | The original URL before rewrite |
| `userAgent` | string | Browser user agent of the clicker |
| `classification` | string | `malware`, `phish` |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `proofpoint_tap_get_all_threats` | Retrieve all TAP events (messages + clicks) | `sinceSeconds`, `sinceTime`, `interval`, `threatStatus`, `format` |
| `proofpoint_tap_get_messages_blocked` | Get messages blocked by TAP | `sinceSeconds`, `sinceTime`, `interval`, `threatStatus` |
| `proofpoint_tap_get_messages_delivered` | Get messages delivered despite threats | `sinceSeconds`, `sinceTime`, `interval`, `threatStatus` |
| `proofpoint_tap_get_clicks_permitted` | Get clicks that were permitted | `sinceSeconds`, `sinceTime`, `interval`, `threatStatus` |
| `proofpoint_tap_get_clicks_blocked` | Get clicks that were blocked | `sinceSeconds`, `sinceTime`, `interval`, `threatStatus` |

**Top clickers is not a TAP tool.** The ranked list of users who click
threats lives in the People domain as `proofpoint_people_get_top_clickers`
(`window`, `page`, `size`) — see the `proofpoint-people` skill. There is no
`threatType` filter on any of the SIEM tools either; filter the returned
events client-side by classification.

## Common Workflows

### Check Recent Threats (Last Hour)

1. Call `proofpoint_tap_get_all_threats` with `sinceSeconds=3600`
2. Separate results into messages blocked, messages delivered, clicks permitted, clicks blocked
3. Prioritize any delivered threats or permitted clicks for immediate investigation
4. Group threats by classification (malware, phish, impostor)

### Investigate a Specific Time Window

1. Call `proofpoint_tap_get_messages_blocked` with `sinceTime` set to start of window
2. Call `proofpoint_tap_get_messages_delivered` with same time window
3. Cross-reference delivered messages against click data
4. Identify any users who received and clicked on threats

### Monitor for Business Email Compromise

1. Call `proofpoint_tap_get_messages_delivered` with `sinceSeconds=3600`
2. Filter for `impostorScore > 50` in results
3. Check if any impostor messages were delivered without quarantine
4. Alert on high-confidence impostor messages that reached users

### Daily Threat Summary

1. Call `proofpoint_tap_get_all_threats` with `sinceSeconds=86400`
2. Aggregate by classification: malware, phish, spam, impostor counts
3. Identify top targeted recipients
4. List any permitted clicks with threat details
5. Generate summary report with trend comparison

### Click Investigation

1. Call `proofpoint_tap_get_clicks_permitted` with relevant time window
2. For each permitted click, note the `recipient`, `threatURL`, and `clickTime`
3. Cross-reference `campaignId` to find related threats
4. Check if the user's credentials may be compromised
5. Initiate password reset if phishing click was to a credential harvester

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid time range | Ensure `sinceSeconds` <= 86400 or `sinceTime` is within 24 hours |
| 400 | Invalid threatType | Use `url`, `attachment`, or `messageText` |
| 401 | Authentication failed | Verify service principal and secret |
| 403 | Insufficient permissions | Ensure TAP API access is enabled for your service principal |
| 404 | No data available | No events in the specified time window |
| 429 | Rate limit exceeded | Implement backoff; TAP API allows ~1000 requests/hour |

### Empty Results

If no events are returned:
- The time window may be too narrow - expand to full 24 hours
- The organization may not have had any threat events in the window
- Check that the service principal has access to the correct organization

## Best Practices

1. **Poll regularly** - Set up periodic polling (every 5-15 minutes) for near-real-time threat awareness
2. **Focus on delivered threats** - Blocked threats are handled; delivered threats need human review
3. **Track permitted clicks** - These indicate users who interacted with threats and may need remediation
4. **Correlate with campaigns** - Use `campaignId` to connect individual events to broader threat campaigns
5. **Monitor impostor scores** - BEC attacks are high-value and may bypass traditional filters
6. **Use threatID for dedup** - The same threat may appear in multiple events; deduplicate by `threatID`
7. **Export to SIEM** - Forward TAP events to your SIEM for long-term retention and correlation
8. **Check message parts** - Inspect `messageParts` for multi-vector attacks (URL + attachment)

## Related Skills

- [Proofpoint Quarantine](../quarantine/SKILL.md) - Manage quarantined messages
- [Proofpoint Threat Intelligence](../threat-intel/SKILL.md) - Campaign and IOC data
- [Proofpoint Forensics](../forensics/SKILL.md) - Deep threat investigation
- [Proofpoint People](../people/SKILL.md) - Very Attacked People reports
- [Proofpoint API Patterns](../api-patterns/SKILL.md) - Authentication and rate limits
