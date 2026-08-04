---
name: "Checkpoint Avanan Quarantine"
description: >
  Checkpoint Harmony Email & Collaboration (Avanan) quarantine management:
  quarantine reasons and severity mapping, the quarantine field reference,
  release and bulk-operation workflows, and quarantine expiry/retention
  behavior for held emails.
when_to_use: >-
  When listing, searching, releasing, or deleting quarantined emails in Checkpoint
  Harmony Email. Use when: checkpoint quarantine, avanan quarantine, quarantined
  email, release quarantine, delete quarantine, quarantine search, email blocked,
  email held, quarantine review, bulk release, quarantine policy, false positive
  email, email restore, or quarantine management.
---

# Checkpoint Harmony Email Quarantine Management

## Overview

Checkpoint Harmony Email & Collaboration (Avanan) quarantines emails that match security policies before they reach the end user's inbox. The quarantine system is the primary interface for reviewing flagged emails, releasing false positives, and managing email flow. This skill covers comprehensive quarantine management including search, review, release workflows, bulk operations, and quarantine configuration.

## Anti-triggers

- **Why the message was flagged, or the IOCs inside it** — the
  quarantine entry is the held message; the detection record that
  produced it is a separate object with its own URLs, hashes, and
  verdicts — use `checkpoint-avanan-threats`.
- **Changing what gets quarantined, or curating the allow/block lists**
  — releasing with `addToAllowList` writes a single exception; policy
  tuning and list administration are `checkpoint-avanan-policies`.
- **Removing a message that already reached the mailbox** — Avanan
  quarantine holds mail pre-delivery only and has no mailbox-purge
  tool. Post-delivery removal on a Proofpoint tenant is
  `proofpoint-forensics` (TRAP search-and-destroy).
- **Another vendor's quarantine** — "release from quarantine" is shared
  vocabulary across the email-security stack. Proofpoint is
  `proofpoint-quarantine`, SpamTitan is `spamtitan-quarantine`, and
  Mimecast calls it the held queue: `mimecast-queue-management`.

## Quarantine Reasons

Emails are quarantined based on the detection engine that flagged them:

| Reason Code | Name | Description | Typical Action |
|-------------|------|-------------|----------------|
| **PHISHING** | Phishing | Suspected phishing attempt | Review sender, URLs, release if legitimate |
| **MALWARE** | Malware | Malicious attachment or link detected | Almost never release; escalate to incident |
| **SPAM** | Spam | Bulk or unsolicited email | Release if legitimate business email |
| **DLP** | Data Loss Prevention | Outbound email violates DLP policy | Review content, release if authorized |
| **BEC** | Business Email Compromise | Impersonation or fraud attempt | Investigate thoroughly before any release |
| **ANOMALY** | Anomaly Detection | Unusual sender behavior detected | Compare against known sender patterns |
| **POLICY** | Policy Violation | Custom policy rule triggered | Check which policy matched, release if appropriate |
| **BULK** | Bulk Mail | Marketing or newsletter content | Release if subscribed/wanted |

### Severity Mapping

| Severity | Quarantine Reasons | Auto-Release Eligible |
|----------|-------------------|----------------------|
| Critical | MALWARE, BEC | No - requires manual review |
| High | PHISHING | No - requires manual review |
| Medium | DLP, ANOMALY, POLICY | Configurable per policy |
| Low | SPAM, BULK | Yes - if admin configured |

## Complete Quarantine Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `entityId` | string | Unique quarantine entry identifier |
| `messageId` | string | Email message ID (RFC 5322) |
| `subject` | string | Email subject line |
| `sender` | string | Sender email address |
| `senderDisplayName` | string | Sender display name (may differ from address) |
| `recipients` | string[] | List of recipient email addresses |
| `receivedDate` | datetime | When the email was received |
| `quarantinedDate` | datetime | When the email was quarantined |

### Classification Fields

| Field | Type | Description |
|-------|------|-------------|
| `quarantineReason` | string | Why the email was quarantined (see codes above) |
| `confidenceLevel` | string | Detection confidence: HIGH, MEDIUM, LOW |
| `severity` | string | Threat severity: CRITICAL, HIGH, MEDIUM, LOW |
| `detectionEngine` | string | Which engine flagged the email |
| `policyName` | string | Name of the policy that triggered quarantine |

### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `hasAttachments` | boolean | Whether email contains attachments |
| `attachmentNames` | string[] | List of attachment filenames |
| `attachmentHashes` | string[] | SHA-256 hashes of attachments |
| `containsUrls` | boolean | Whether email body contains URLs |
| `urlCount` | int | Number of URLs in the email |
| `bodyPreview` | string | First 200 characters of email body |

### Status Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Current status: QUARANTINED, RELEASED, DELETED |
| `releasedBy` | string | Who released the email (if released) |
| `releasedDate` | datetime | When the email was released |
| `expiresDate` | datetime | When quarantine entry auto-deletes |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `avanan_quarantine_list` | List quarantined emails with filters | `startDate`, `endDate`, `reason`, `severity`, `status`, `limit`, `offset` |
| `avanan_quarantine_get` | Get detailed quarantine entry | `entityId` |
| `avanan_quarantine_release` | Release email(s) from quarantine | `entityIds`, `releaseToRecipients`, `addToAllowList` |
| `avanan_quarantine_delete` | Permanently delete quarantined email(s) | `entityIds`, `reason` |
| `avanan_quarantine_search` | Search quarantine by sender, recipient, subject | `query`, `field`, `startDate`, `endDate` |
| `avanan_quarantine_stats` | Get quarantine statistics and trends | `startDate`, `endDate`, `groupBy` |

### Tool Usage Examples

**List recent quarantined emails:**
```json
{
  "tool": "avanan_quarantine_list",
  "parameters": {
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-02-15T23:59:59Z",
    "status": "QUARANTINED",
    "limit": 50
  }
}
```

**Search by sender:**
```json
{
  "tool": "avanan_quarantine_search",
  "parameters": {
    "query": "suspicious@external-domain.com",
    "field": "sender",
    "startDate": "2024-02-01T00:00:00Z"
  }
}
```

**Release with allow-list:**
```json
{
  "tool": "avanan_quarantine_release",
  "parameters": {
    "entityIds": ["qe-abc123", "qe-def456"],
    "releaseToRecipients": true,
    "addToAllowList": true
  }
}
```

## Common Workflows

### False Positive Review Workflow

1. **User reports missing email** - Check quarantine for the expected message
2. **Search quarantine** by sender address and date range
3. **Review quarantine entry** - Check reason, confidence, severity
4. **Verify legitimacy:**
   - Compare sender address vs display name (BEC indicator)
   - Check if sender is known/expected
   - Review attachment types and URL destinations
   - Check confidence level of detection
5. **Release if legitimate:**
   - Release to original recipients
   - Optionally add sender to allow list
   - Document the false positive for policy tuning
6. **If suspicious** - Escalate to incident investigation

### Bulk Quarantine Review Workflow

1. **List quarantined emails** for the review period (e.g., last 24 hours)
2. **Group by quarantine reason** to prioritize review
3. **Review SPAM/BULK first** - highest false positive rate
4. **Review POLICY matches** - check if policy is too broad
5. **Review PHISHING/BEC last** - most likely true positives
6. **Bulk release** confirmed false positives
7. **Bulk delete** confirmed threats

### Quarantine Expiry Management

Quarantined emails auto-delete after the configured retention period (default: 30 days).

```
Day 1-7:   Email in quarantine, available for review
Day 8-14:  Email still available, notification sent to admin
Day 15-30: Email nearing expiry
Day 30+:   Email permanently deleted
```

**To extend retention:** Release and re-quarantine, or export before expiry.

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid date range | Ensure startDate is before endDate, max 90-day range |
| 400 | Invalid entity ID | Verify the quarantine entity ID exists |
| 401 | Unauthorized | Check API credentials and token expiry |
| 403 | Insufficient permissions | API key needs quarantine management scope |
| 404 | Quarantine entry not found | Entry may have expired or been deleted |
| 409 | Already released | Email was already released from quarantine |
| 429 | Rate limited | Implement exponential backoff |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Date range too wide | Exceeds 90-day maximum | Narrow the date range |
| Too many entity IDs | Bulk operation exceeds 100 items | Split into smaller batches |
| Invalid reason filter | Unrecognized quarantine reason | Use valid reason codes from reference above |
| Expired entry | Quarantine retention period passed | Entry cannot be recovered |

## Best Practices

1. **Review quarantine daily** - Prevents legitimate emails from expiring undelivered
2. **Never release MALWARE without investigation** - Even if the user requests it
3. **Use allow lists judiciously** - Over-broad allow lists weaken security posture
4. **Document release decisions** - Helps tune policies and track patterns
5. **Monitor quarantine volume trends** - Sudden spikes may indicate a targeted attack
6. **Batch operations for efficiency** - Use bulk release/delete for large review sets

## Related Skills

- [Checkpoint Threats](../threats/SKILL.md) - Threat detection and analysis
- [Checkpoint Incidents](../incidents/SKILL.md) - Incident investigation
- [Checkpoint Policies](../policies/SKILL.md) - Policy management
- [Checkpoint API Patterns](../api-patterns/SKILL.md) - Authentication and API usage
