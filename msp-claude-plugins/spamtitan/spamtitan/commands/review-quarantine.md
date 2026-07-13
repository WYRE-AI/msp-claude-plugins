---
description: Review the SpamTitan quarantine queue, show email statistics summary, and list recent held messages with release and delete actions
argument-hint: "[domain] [quarantine_type] [period] [limit]"
arguments: [domain, quarantine_type, period, limit]
---

# SpamTitan Quarantine Review

Review the SpamTitan quarantine queue for held messages. Starts with an email flow statistics summary, then lists recent quarantined messages grouped by type. Presents release and delete recommendations based on message content and spam scores. This is the primary daily workflow for MSP email security management.

## Prerequisites

- SpamTitan MCP server connected with valid API credentials
- MCP tools `spamtitan_get_stats`, `spamtitan_get_queue`, `spamtitan_get_message`, `spamtitan_release_message`, and `spamtitan_delete_message` available

## Steps

1. **Get email statistics summary**

   Call `spamtitan_get_stats` with the specified `period` (default: `today`) and `domain` if provided. Display a summary showing total inbound volume, quarantine counts by type, spam rate, and top quarantine senders.

2. **Fetch the quarantine queue**

   Call `spamtitan_get_queue` filtered by `domain` and `quarantine_type` if provided. Limit results to the specified `limit`. Filter to messages from the last 24 hours unless the queue is small, in which case extend to 48 hours.

3. **Group messages by type**

   Organize the queue by quarantine type:
   - **Phishing** — Always present first; these require urgent attention
   - **Virus** — Display but do not recommend release; deletion is the only safe action
   - **Spam** — High-confidence spam; recommend deletion
   - **Probable Spam** — Lower-confidence; present for manual review
   - **Blocked** — Rule-based blocks; review for intended vs. unintended blocks

4. **Identify likely false positives**

   For probable_spam messages, flag likely false positives based on:
   - Low spam score (below 5.0)
   - Passing SPF and DKIM authentication
   - Presence of `List-Unsubscribe` header (legitimate bulk mail)
   - Sender domain is a recognizable service (monitoring systems, SaaS vendors)

5. **Present release and delete recommendations**

   For each message, recommend either:
   - **Release** — Confirmed false positive; will deliver to recipient inbox
   - **Release + Allowlist** — Repeat false positive; release and add sender to allowlist
   - **Delete** — Confirmed spam, phishing, or virus
   - **Review** — Ambiguous; present details for manual decision

6. **Execute actions**

   For messages with clear recommendations, call `spamtitan_release_message` or `spamtitan_delete_message` as appropriate. When releasing a repeat sender, include `add_to_allowlist=true`.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| domain | string | No | all | Client domain to scope the review |
| quarantine_type | string | No | all | Type of quarantine to review (spam, probable_spam, phishing, virus, blocked) |
| period | string | No | today | Statistics period (today, yesterday, 7d, 30d) |
| limit | integer | No | 50 | Maximum number of messages to list |

## Examples

### Full Quarantine Review (All Domains, Today)

```
/review-quarantine
```

### Review Specific Client Domain

```
/review-quarantine --domain clientcorp.com
```

### Review Phishing Queue Only

```
/review-quarantine --quarantine_type phishing
```

### Weekly Summary Review

```
/review-quarantine --period 7d --limit 200
```

## Error Handling

- **Authentication Error:** Verify `SPAMTITAN_API_KEY` is set correctly
- **Domain Not Found:** Check that the domain name matches exactly what is configured in SpamTitan
- **No Statistics Returned:** The domain filter may not match; try without the domain filter to confirm connectivity
- **Cannot Release Virus Message:** Virus-quarantined messages cannot be released via API; this is a security control — delete instead

## Related Commands

- `/manage-lists` - Add or remove sender allowlist and blocklist entries after identifying patterns from the quarantine queue
