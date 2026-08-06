---
name: "SpamTitan Quarantine"
description: >
  SpamTitan quarantine queue: quarantine types, release vs. delete
  semantics, message aging, email flow statistics, and the tenant-isolation
  limit — the queue listing accepts no domain filter, so on a multi-tenant
  appliance it spans every customer.
when_to_use: >-
  When reviewing the SpamTitan quarantine queue, or releasing or deleting held messages. Use
  when: quarantine, held email, spam quarantine, release email, delete spam, spamtitan
  quarantine, review quarantine, quarantined message, spamtitan queue, or email held.
---

# SpamTitan Quarantine Management

## Overview

SpamTitan's quarantine holds inbound emails that its filtering engine determines are likely spam, phishing, or malware. Administrators and end users can review held messages and either release legitimate emails (false positives) or permanently delete spam. For MSPs managing multiple clients, efficient quarantine management is critical to preventing false positives from disrupting business communications while ensuring malicious mail is never delivered.

## Anti-triggers

- **Managing a sender list as a decision in its own right** — allowlisting
  the sender of one released message is a follow-up call, covered here.
  Auditing, scoping, or removing list entries is `SpamTitan Lists`.
- **Mail that already reached the mailbox** — SpamTitan filters in front
  of the tenant and cannot reach into an inbox. Clawing back delivered
  mail is `Abnormal Security Threats` or `IRONSCALES Incidents`.
- **A quarantine belonging to a different gateway** — every mail security
  product in this fleet has one and none of them share message IDs. Use
  `Mimecast Message Tracking` for its hold queue, `Proofpoint Quarantine`,
  or `Checkpoint Avanan Quarantine`.

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

### Multi-Domain Management — the queue is not tenant-scoped

In MSP deployments SpamTitan typically filters mail for multiple client
domains, and the natural instinct is to scope the quarantine listing to one
customer. **You cannot.** `spamtitan_get_queue` accepts no `domain`
parameter. Its shipped input schema is exactly `page`, `per_page`, `sender`,
`recipient`, `subject`, `reason`
(`spamtitan-mcp/src/domains/quarantine.ts:21-53`).

What follows from that:

- An operator who asks for "customer X's quarantine" gets the **appliance-wide
  queue, across every tenant**, unless you narrow it yourself.
- Per-customer filtering is a client-side operation on the `recipient` field
  after the results come back. There is no server-side tenant boundary on this
  call other than the API key itself.
- Never describe an unfiltered listing as belonging to one customer, and never
  act on "the first result" from one. The release and delete that follow are
  scoped only by `message_id`, so a cross-tenant listing leads directly to a
  cross-tenant action.
- The asymmetry is what makes this easy to miss: the sibling
  `spamtitan_get_stats` **does** take `domain`, so per-domain statistics are
  genuinely scoped while the queue beside them is not.

The server does help a little: calling `spamtitan_get_queue` with none of
`sender`, `recipient`, `subject`, or `reason` triggers an elicitation asking
the caller for a recipient filter. That is a prompt, not a control — an
unattended agent cannot answer it, and a caller can decline it.

## API Patterns

### List Quarantine Queue

```
spamtitan_get_queue
```

Parameters (this is the complete list — there is no `domain`,
`quarantine_type`, `date_from`, or `date_to`):
- `page` — Page number (1-based, default 1)
- `per_page` — Results per page (default 50, max 200)
- `sender` — Filter by sender email address
- `recipient` — Filter by recipient email address. **The only lever that
  approximates per-customer scope, and it matches a full address, not a domain**
- `subject` — Filter by subject (partial match)
- `reason` — Filter by quarantine reason (e.g. `spam`, `virus`, `policy`)

**Example response** (the `domain` field appears in the response payload; it is
not a request parameter):

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
      "domain": "clientcorp.com"
    }
  ],
  "page": 1,
  "per_page": 50
}
```

On a multi-tenant appliance the `messages` array will contain entries whose
`to` and `domain` belong to *other customers*. That is the expected result of
an unfiltered call, not a bug — filter on `to` before you use it.

### Get Message Details

```
spamtitan_get_message
```

Parameters:
- `message_id` — The quarantine message ID (required, and the only parameter)

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
  "score_breakdown": {"rdns": 0.5, "spf": 0.0, "dkim": 0.0, "content": 5.2, "uri": 1.1},
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
- `message_id` — The quarantine message ID to release (required, and the only
  parameter). There is **no `add_to_allowlist` option** — releasing and
  allowlisting are two separate calls.

To release *and* allowlist the sender, make the second call explicitly:
`spamtitan_manage_allowlist` with `action: "add"`, `sender`, and a `note`.
Doing it in two steps is not a workaround; it is the only shape the server
offers, and it means the allowlist grant is a deliberate decision of its own
rather than a checkbox on a release. Treat it that way — an allowlist entry is
a durable bypass of spam scoring for that sender, and spoofed mail claiming to
be that sender inherits it.

**Example** — `{"message_id": "q-00192873"}` returns
`{"success": true, "message": "Message q-00192873 released successfully"}`.

### Delete a Quarantined Message

```
spamtitan_delete_message
```

Parameters:
- `message_id` — The quarantine message ID to delete (required, and the only
  parameter). There is no bulk-delete tool; one call deletes one message.

**Example response:**

```json
{
  "success": true,
  "message": "Message q-00192874 deleted successfully"
}
```

### Get Email Statistics

```
spamtitan_get_stats
```

Parameters:
- `period` — One of `today`, `yesterday`, `last_7_days`, `last_30_days`,
  `last_90_days` (default `today`). These are the only accepted values; there
  is no custom date range.
- `domain` — Filter to a single customer domain (omit for appliance-wide
  stats). **This is the one place per-domain scoping works** — the queue
  listing has no equivalent.

**Example — one customer's last seven days:**

```json
{
  "period": "last_7_days",
  "domain": "clientcorp.com"
}
```

**Example response:**

```json
{
  "stats": {
    "inbound": {"total": 4821, "delivered": 4102, "quarantined": 687, "blocked": 32},
    "quarantine_breakdown": {"spam": 512, "probable_spam": 143, "phishing": 28, "virus": 4},
    "spam_rate": 0.1424,
    "top_quarantine_senders": [{"sender": "bulk@spam-domain.com", "count": 84}]
  },
  "period": "last_7_days",
  "domain": "clientcorp.com"
}
```

The server echoes `domain` as `"all"` when you omit it — a useful check that
the scope you got is the scope you meant.

## Common Workflows

### Daily Quarantine Review

1. Call `spamtitan_get_stats` with `period=today` (and `domain` for one
   customer) to get a quick overview of email volume and spam rates
2. Call `spamtitan_get_queue` to list held messages. There is no date filter,
   so page through and cut by `received_at` yourself; there is no domain
   filter either, so if this is a per-customer review, filter the results on
   the recipient's domain before you look at anything else
3. Sort by score — low-scoring probable_spam messages are most likely to be false positives
4. Review subject lines and senders for obvious spam vs. legitimate business mail
5. Release confirmed false positives with `spamtitan_release_message` (one
   `message_id` per call)
6. Delete confirmed spam and phishing with `spamtitan_delete_message`
7. For frequently falsely-quarantined senders, make a separate
   `spamtitan_manage_allowlist` call with `action: "add"` — release does not
   allowlist

### Investigating a Specific Held Message

1. Get full message details with `spamtitan_get_message`
2. Review the score breakdown — high content and URI scores indicate spam/phishing; high rdns scores may indicate misconfigured legitimate senders
3. Check SPF and DKIM pass/fail status — passing auth for a low-score message suggests a legitimate sender
4. Look for `List-Unsubscribe` headers — legitimate marketing mail from reputable senders includes this
5. Evaluate the links — legitimate newsletters link to recognizable domains
6. Release if confident it is legitimate; delete if spam or phishing

### Handling a Client Complaint About Missing Email

1. Identify the expected sender and recipient
2. Call `spamtitan_get_queue` with `sender` and `recipient` filters to find the
   held message — this is the one workflow where the available filters do
   scope tightly, because you have a full recipient address
3. Review the message details and score to confirm it was incorrectly quarantined
4. Release the message with `spamtitan_release_message`
5. To prevent recurrence, make a second call to `spamtitan_manage_allowlist`
   with `action: "add"`, the `sender`, and a `note` recording why. Verify the
   sender is genuinely legitimate first — this grants a durable scoring bypass
   that spoofed mail claiming to be that sender will inherit
6. Communicate the resolution to the client with a note that the sender has been allowlisted

### Monitoring for Phishing Campaigns

1. Call `spamtitan_get_queue` with `reason` set to the appliance's phishing
   reason string. There is no `quarantine_type` parameter and no date filter,
   so page the queue and cut to the last 24 hours yourself
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
**Solution:** Verify the API key scope. Note that the API key is the *only*
tenant boundary on the quarantine tools — there is no per-call domain scope to
fall back on.

### Statistics Return Zero

**Cause:** The `domain` value passed to `spamtitan_get_stats` may not match the configured domain name exactly
**Solution:** Call `spamtitan_get_stats` without `domain` to get appliance-wide
numbers, and `spamtitan_status` to see the domains the connection reports

## Best Practices

- Review the quarantine queue at least once per business day; twice daily for high-volume clients
- **Treat every `spamtitan_get_queue` result as cross-tenant until you have
  filtered it yourself.** There is no domain filter on the call; filter on
  `recipient`, or cut the results on the recipient's domain, before showing an
  operator anything labelled as one customer's quarantine
- Release and allowlist are separate calls — `spamtitan_release_message` then
  `spamtitan_manage_allowlist` with `action: "add"` and a `note`
- Never release virus-quarantined messages — deletion is the only appropriate action
- Use `spamtitan_get_stats` with `domain` to identify customers with unusually
  high spam rates; this is the one call that does scope per domain
- Keep an eye on the `top_quarantine_senders` list — persistent senders should be blocklisted
- Delete acts on one `message_id` at a time; document each batch you work
  through in your PSA ticketing system for client audit trails

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, and error handling
- [lists](../lists/SKILL.md) - Allowlist and blocklist management
