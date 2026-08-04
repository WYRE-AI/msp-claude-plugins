---
name: "Proofpoint Quarantine"
description: >
  Proofpoint quarantine management fundamentals: quarantine reasons and folders,
  message states, search/filter parameters, and release/delete workflows for
  admin and end-user quarantine.
when_to_use: >-
  When listing, searching, releasing, or deleting quarantined messages in Proofpoint. Use when:
  proofpoint quarantine, quarantined email, release quarantine, quarantine search, email
  quarantine, quarantine management, blocked email, quarantine release, quarantine delete,
  quarantine folder, spam quarantine, phishing quarantine, or bulk quarantine.
---

# Proofpoint Quarantine Management

## Overview

Proofpoint quarantine holds messages that have been identified as threats, spam, or policy violations. The quarantine API allows administrators to search, preview, release, and delete quarantined messages. This is a critical workflow for MSP help desk teams who need to respond to "missing email" requests from end users.

Quarantine operates at two levels:
- **Admin quarantine** - Managed by administrators, holds threats and policy violations
- **End-user quarantine** - Self-service spam quarantine with digests

## Anti-triggers

- **Removing a message that already reached the mailbox** — quarantine
  only holds mail that was stopped before delivery. Pulling a delivered
  message back out of Microsoft 365 or Google Workspace is TRAP
  auto-pull and search-and-destroy: use `proofpoint-forensics`.
- **Why the message scored the way it did** — the quarantine entry
  carries the scores but not the threat event, its classification, or
  its campaign; use `proofpoint-tap`.
- **A rewritten link found inside a quarantined message** — decoding
  and re-checking `urldefense.proofpoint.com` URLs is
  `proofpoint-url-defense`.
- **Another vendor's quarantine** — release and delete vocabulary is
  shared across the stack. Checkpoint Harmony is
  `checkpoint-avanan-quarantine`, SpamTitan is `spamtitan-quarantine`,
  and Mimecast calls it the held queue: `mimecast-queue-management`.

## Key Concepts

### Quarantine Reasons

| Reason | Description | Default Retention |
|--------|-------------|-------------------|
| `spam` | Message scored above spam threshold | 30 days |
| `phish` | Message identified as phishing | 30 days |
| `malware` | Message contained malware | 30 days |
| `impostor` | Message flagged as BEC/impostor | 30 days |
| `bulk` | Bulk/marketing email | 14 days |
| `adult` | Adult content filter match | 30 days |
| `policy` | Custom policy rule match | Configurable |
| `dmarc` | Failed DMARC authentication | 30 days |
| `dkim` | Failed DKIM verification | 30 days |
| `spf` | Failed SPF check | 30 days |

### Quarantine Folders

| Folder | Contents | Release Allowed |
|--------|----------|-----------------|
| `quarantine` | Admin quarantine (threats, policy) | Admin only |
| `spam` | End-user spam quarantine | End-user or admin |
| `bulk` | Bulk/graymail quarantine | End-user or admin |

### Message States

| State | Description |
|-------|-------------|
| `quarantined` | Message is held in quarantine |
| `released` | Message was released to recipient |
| `deleted` | Message was permanently deleted |
| `expired` | Message exceeded retention period and was removed |

## Field Reference

### Quarantine Message Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique quarantine message identifier |
| `GUID` | string | Message GUID (links to TAP events) |
| `QID` | string | Queue ID from mail server |
| `sender` | string | Envelope sender address |
| `recipients` | string[] | List of recipient addresses |
| `subject` | string | Message subject line |
| `date` | datetime | When the message was received |
| `quarantineDate` | datetime | When the message was quarantined |
| `reason` | string | Why the message was quarantined |
| `folder` | string | Which quarantine folder holds the message |
| `size` | int | Message size in bytes |
| `headerFrom` | string | Display From address (may differ from envelope sender) |
| `replyTo` | string | Reply-To address if present |
| `spamScore` | int | Spam confidence score |
| `phishScore` | int | Phishing confidence score |
| `malwareScore` | int | Malware confidence score |
| `impostorScore` | int | Impostor/BEC confidence score |

### Search Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sender` | string | Filter by sender address (exact or partial) |
| `recipient` | string | Filter by recipient address |
| `subject` | string | Filter by subject (substring match) |
| `startDate` | datetime | Start of date range |
| `endDate` | datetime | End of date range |
| `reason` | string | Filter by quarantine reason |
| `folder` | string | Filter by quarantine folder |
| `limit` | int | Maximum results (default 25, max 500) |
| `offset` | int | Pagination offset |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `proofpoint_quarantine_search` | Search quarantined messages | `sender`, `recipient`, `subject`, `reason`, `startDate`, `endDate` |
| `proofpoint_quarantine_list` | List recent quarantined messages | `folder`, `limit`, `offset` |
| `proofpoint_quarantine_get` | Get details of a specific quarantined message | `id` |
| `proofpoint_quarantine_preview` | Preview message content without releasing | `id` |
| `proofpoint_quarantine_release` | Release message to original recipient | `id`, `recipient` |
| `proofpoint_quarantine_delete` | Permanently delete quarantined message | `id` |
| `proofpoint_quarantine_bulk_release` | Release multiple messages at once | `ids[]` |
| `proofpoint_quarantine_bulk_delete` | Delete multiple messages at once | `ids[]` |

## Common Workflows

### User Reports Missing Email

1. Get the sender and approximate time from the user
2. Call `proofpoint_quarantine_search` with `recipient=<user>` and `sender=<expected_sender>` and appropriate date range
3. If found, call `proofpoint_quarantine_preview` to verify the message is legitimate
4. If legitimate, call `proofpoint_quarantine_release` to deliver the message
5. If the sender is consistently quarantined, consider adding a safe sender policy

### Daily Quarantine Review

1. Call `proofpoint_quarantine_list` with `folder=quarantine` and `limit=100`
2. Review messages grouped by reason
3. Release any false positives
4. Delete confirmed threats
5. Note recurring senders for blocklist consideration

### Bulk Release for Known-Good Sender

1. Call `proofpoint_quarantine_search` with `sender=<known_good_sender>`
2. Collect all message IDs from results
3. Call `proofpoint_quarantine_bulk_release` with the collected IDs
4. Recommend adding the sender to the organization's safe sender list

### Investigate Quarantine Spike

1. Call `proofpoint_quarantine_search` with a narrow time window
2. Group results by `reason` to identify what type of messages increased
3. Group by `sender` to identify if a single source is responsible
4. Cross-reference with TAP data using message GUIDs
5. Determine if this is a targeted attack or spam campaign

### Clean Up Expired Threats

1. Call `proofpoint_quarantine_search` with `reason=malware` and date range > 14 days
2. Review any remaining malware-quarantined messages
3. Call `proofpoint_quarantine_bulk_delete` to remove confirmed threats
4. Document any messages that were released for audit trail

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid date range | Ensure startDate is before endDate |
| 400 | Invalid folder | Use `quarantine`, `spam`, or `bulk` |
| 401 | Authentication failed | Verify service principal and secret |
| 403 | Insufficient permissions | Ensure quarantine management is enabled |
| 404 | Message not found | Message may have expired or been deleted |
| 409 | Message already released | Message was already released by another admin |
| 429 | Rate limit exceeded | Implement backoff; limit bulk operations |

### Release Failures

If a release fails:
- The message may have been deleted or expired
- The recipient mailbox may be full or invalid
- The downstream mail server may be rejecting delivery
- Check the message ID is correct and the message still exists in quarantine

### Search Returning Too Many Results

- Narrow the date range
- Add more specific filters (sender + recipient + subject)
- Use pagination with `limit` and `offset`
- Filter by specific quarantine reason

## Best Practices

1. **Preview before release** - Always preview a message before releasing to verify it is legitimate
2. **Document releases** - Keep a log of released messages for audit purposes
3. **Use bulk operations carefully** - Bulk release should only be used for verified false positives
4. **Monitor quarantine volume** - Spikes may indicate a targeted attack or misconfigured policy
5. **Set up digests** - Enable end-user quarantine digests to reduce help desk load
6. **Review retention policies** - Ensure quarantine retention matches your compliance requirements
7. **Never release confirmed threats** - If a message is confirmed malware or phishing, delete it
8. **Cross-reference with TAP** - Use the GUID to check TAP threat data before releasing
9. **Safe sender lists** - For recurring false positives, add the sender to the safe sender list rather than releasing each time
10. **Train users** - Educate users on checking their quarantine digest before contacting the help desk

## Related Skills

- [Proofpoint TAP](../tap/SKILL.md) - Threat event data and click tracking
- [Proofpoint Threat Intelligence](../threat-intel/SKILL.md) - Threat campaign details
- [Proofpoint URL Defense](../url-defense/SKILL.md) - URL rewriting and analysis
- [Proofpoint API Patterns](../api-patterns/SKILL.md) - Authentication and rate limits
