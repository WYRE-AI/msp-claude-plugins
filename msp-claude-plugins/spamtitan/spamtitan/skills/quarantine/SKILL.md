---
name: "SpamTitan Quarantine"
description: >
  SpamTitan quarantine queue: quarantine types, release vs. delete
  semantics, message aging, multi-domain scoping, bulk quarantine
  operations, and email flow statistics.
when_to_use: >-
  When reviewing the SpamTitan quarantine queue, or releasing or deleting held messages. Use
  when: quarantine, held email, spam quarantine, release email, delete spam, spamtitan
  quarantine, review quarantine, quarantined message, spamtitan queue, or email held.
---

# SpamTitan Quarantine Management

## Overview

SpamTitan's quarantine holds inbound emails that its filtering engine determines are likely spam, phishing, or malware. Administrators and end users can review held messages and either release legitimate emails (false positives) or permanently delete spam. For MSPs managing multiple clients, efficient quarantine management is critical to preventing false positives from disrupting business communications while ensuring malicious mail is never delivered.

## Key Concepts

### Quarantine Types

SpamTitan maintains separate quarantine queues for different threat categories:

- **Spam** — High-confidence unsolicited commercial email
- **Probable Spam** — Lower-confidence spam; may include false positives
- **Phishing** — Detected phishing or credential harvesting attempts
- **Virus/Malware** — Emails containing detected malware (generally never released)
- **Blocked** — Emails matching admin blocklist rules

### Release vs. Delete

- **Release** — Delivers the held message to the recipient's inbox. Use for confirmed false positives.
- **Delete** — Permanently removes the message. Use for confirmed spam or malicious mail.
- **Virus-quarantined messages should never be released** — malware detections are high-confidence.

### Message Aging

Quarantined messages are retained for a configurable period (typically 30 days). Messages older than the retention period are automatically purged. Review the queue regularly to catch time-sensitive false positives before they expire.

### Multi-Domain Management

In MSP deployments, SpamTitan typically filters mail for multiple client domains. Always filter by domain when reviewing a specific client's quarantine to avoid accidental cross-client actions.

## API Patterns

### List Quarantine Queue

```
spamtitan_get_queue
```

Parameters:
- `domain` — Filter by recipient domain (recommended in multi-tenant setups)
- `quarantine_type` — Filter by type (`spam`, `probable_spam`, `phishing`, `virus`, `blocked`)
- `date_from` — Start date for results (ISO 8601)
- `date_to` — End date for results (ISO 8601)
- `recipient` — Filter by recipient email address
- `sender` — Filter by sender email address
- `page` — Page number (1-based)
- `limit` — Results per page (max 200)

**Example response:**

```json
{
  "messages": [
    {
      "id": "q-00192873",
      "from": "noreply@vendor-newsletter.com",
      "to": "jdoe@clientcorp.com",
      "subject": "Your Weekly Industry Update",
      "received_at": "2026-03-02T07:30:00Z",
      "quarantine_type": "probable_spam",
      "score": 6.8,
      "size_bytes": 42120,
      "domain": "clientcorp.com"
    },
    {
      "id": "q-00192874",
      "from": "invoice@fake-billing.ru",
      "to": "accounting@clientcorp.com",
      "subject": "OVERDUE INVOICE - IMMEDIATE ACTION REQUIRED",
      "received_at": "2026-03-02T08:15:44Z",
      "quarantine_type": "phishing",
      "score": 9.9,
      "size_bytes": 18340,
      "domain": "clientcorp.com"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 100
}
```

### Get Message Details

```
spamtitan_get_message
```

Parameters:
- `message_id` — The quarantine message ID

**Example response:**

```json
{
  "id": "q-00192873",
  "from": "noreply@vendor-newsletter.com",
  "to": "jdoe@clientcorp.com",
  "subject": "Your Weekly Industry Update",
  "received_at": "2026-03-02T07:30:00Z",
  "quarantine_type": "probable_spam",
  "score": 6.8,
  "score_breakdown": {
    "rdns": 0.5,
    "spf": 0.0,
    "dkim": 0.0,
    "content": 5.2,
    "uri": 1.1
  },
  "headers": {
    "reply_to": "noreply@vendor-newsletter.com",
    "received_spf": "pass",
    "dkim": "pass",
    "list_unsubscribe": "<mailto:unsub@vendor-newsletter.com>"
  },
  "links": ["https://vendor-newsletter.com/weekly-update/2026-03-02"],
  "attachments": [],
  "domain": "clientcorp.com"
}
```

### Release a Quarantined Message

```
spamtitan_release_message
```

Parameters:
- `message_id` — The quarantine message ID to release
- `add_to_allowlist` — Optional: also add the sender to the allowlist (`true`/`false`)

**Example:**

```json
{
  "message_id": "q-00192873",
  "add_to_allowlist": true
}
```

**Example response:**

```json
{
  "success": true,
  "message_id": "q-00192873",
  "action": "released",
  "delivered_at": "2026-03-02T10:05:33Z",
  "sender_allowlisted": true
}
```

### Delete a Quarantined Message

```
spamtitan_delete_message
```

Parameters:
- `message_id` — The quarantine message ID to delete

**Example response:**

```json
{
  "success": true,
  "message_id": "q-00192874",
  "action": "deleted"
}
```

### Get Email Statistics

```
spamtitan_get_stats
```

Parameters:
- `domain` — Filter by domain (omit for global stats)
- `period` — Stats period: `today`, `yesterday`, `7d`, `30d`, or custom date range
- `date_from` — Start date (ISO 8601, for custom range)
- `date_to` — End date (ISO 8601, for custom range)

**Example response:**

```json
{
  "period": "7d",
  "domain": "clientcorp.com",
  "inbound": {
    "total": 4821,
    "delivered": 4102,
    "quarantined": 687,
    "blocked": 32
  },
  "quarantine_breakdown": {
    "spam": 512,
    "probable_spam": 143,
    "phishing": 28,
    "virus": 4,
    "blocked": 0
  },
  "spam_rate": 0.1424,
  "virus_rate": 0.0008,
  "top_quarantine_senders": [
    {"sender": "bulk@spam-domain.com", "count": 84},
    {"sender": "promo@marketing-blaster.net", "count": 47}
  ]
}
```

## Common Workflows

### Daily Quarantine Review

1. Call `spamtitan_get_stats` for `period=today` to get a quick overview of email volume and spam rates
2. Call `spamtitan_get_queue` filtered to the last 24 hours to see held messages
3. Sort by score — low-scoring probable_spam messages are most likely to be false positives
4. Review subject lines and senders for obvious spam vs. legitimate business mail
5. Release confirmed false positives with `spamtitan_release_message`
6. Delete confirmed spam and phishing with `spamtitan_delete_message`
7. For frequently falsely-quarantined senders, add to allowlist during release

### Investigating a Specific Held Message

1. Get full message details with `spamtitan_get_message`
2. Review the score breakdown — high content and URI scores indicate spam/phishing; high rdns scores may indicate misconfigured legitimate senders
3. Check SPF and DKIM pass/fail status — passing auth for a low-score message suggests a legitimate sender
4. Look for `List-Unsubscribe` headers — legitimate marketing mail from reputable senders includes this
5. Evaluate the links — legitimate newsletters link to recognizable domains
6. Release if confident it is legitimate; delete if spam or phishing

### Handling a Client Complaint About Missing Email

1. Identify the expected sender and recipient
2. Call `spamtitan_get_queue` with `sender` and `recipient` filters to find the held message
3. Review the message details and score to confirm it was incorrectly quarantined
4. Release the message with `add_to_allowlist=true` to prevent recurrence
5. Communicate the resolution to the client with a note that the sender has been allowlisted

### Monitoring for Phishing Campaigns

1. Call `spamtitan_get_queue` filtered to `quarantine_type=phishing` for the last 24 hours
2. Review sender domains and subject patterns for coordinated campaign indicators
3. If multiple recipients received the same phishing mail, check whether any slipped through (quarantine miss)
4. Delete all confirmed phishing messages
5. If the sending domain is new, add it to the blocklist to prevent future delivery

## Error Handling

### Message Not Found

**Cause:** Invalid message ID, or message has already expired from the retention period
**Solution:** List the quarantine queue to verify the correct ID; check retention settings if messages are expiring sooner than expected

### Release Failed — Virus Quarantine

**Cause:** SpamTitan blocks release of virus-quarantined messages by default
**Solution:** Virus-quarantined messages should not be released; if a false positive is suspected, contact TitanHQ support for manual review

### Permission Denied on Domain

**Cause:** The API key may not have access to all domains in multi-tenant deployments
**Solution:** Verify the API key scope and ensure it has access to the target domain

### Statistics Return Zero

**Cause:** Domain filter may not match the configured domain name exactly
**Solution:** Call `spamtitan_get_domain_stats` without filters first to see all available domains and their exact names

## Best Practices

- Review the quarantine queue at least once per business day; twice daily for high-volume clients
- Filter by domain in multi-tenant deployments to avoid cross-client confusion
- Always use `add_to_allowlist=true` when releasing repeat false positives from the same sender
- Never release virus-quarantined messages — deletion is the only appropriate action
- Use statistics to identify domains with unusually high spam rates that may need additional filtering rules
- Keep an eye on the `top_quarantine_senders` list — persistent senders should be blocklisted
- Document bulk delete actions in your PSA ticketing system for client audit trails

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, and error handling
- [lists](../lists/SKILL.md) - Allowlist and blocklist management
