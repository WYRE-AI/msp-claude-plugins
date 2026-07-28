---
name: "Mimecast Message Tracking"
description: >
  Mimecast message tracing: searching by sender, recipient, or subject;
  message states and message IDs; retrieving message metadata and headers;
  and holding or releasing messages.
when_to_use: >-
  When tracing an email through Mimecast, or holding or releasing a message. Use when: mimecast
  message trace, mimecast track email, find message, trace email mimecast, mimecast hold,
  mimecast release, mimecast message search, mimecast delivery, mimecast rejected, or mimecast
  bounced.
---

# Mimecast Message Tracking

## Overview

Message tracking is the primary diagnostic tool in Mimecast for investigating email delivery issues, tracing suspicious messages, and managing held email. The Mimecast MCP server provides tools to search messages across the full delivery pipeline, retrieve detailed per-message metadata, and control message disposition (hold or release). This is the first tool to reach for when investigating reported phishing emails, delivery failures, or missing messages.

## Key Concepts

### Message States

| State | Description |
|-------|-------------|
| `delivered` | Message successfully delivered to recipient mailbox |
| `held` | Message blocked pending review (policy or manual) |
| `rejected` | Message rejected at SMTP gateway |
| `bounced` | Message accepted but returned by recipient server |
| `processing` | Message in transit through the Mimecast pipeline |

### Held Messages

Messages can be held by Mimecast policy (spam threshold, attachment policy, URL scanning) or placed on hold manually via the API. Held messages require an administrator action — either release them for delivery or permanently delete them.

### Message IDs

Each message in Mimecast has:
- **Message ID** — The RFC 2822 `Message-ID` header (from the original email)
- **Mimecast ID** — A Mimecast-internal identifier used for API operations

When searching, you typically use sender/recipient/subject to find messages, then use the Mimecast ID for subsequent operations (get info, hold, release).

## API Patterns

### Search Messages

```
mimecast_find_message
```

Parameters:
- `from` — Sender email address (supports wildcard, e.g. `*@suspicious.com`)
- `to` — Recipient email address
- `subject` — Subject keyword (partial match supported)
- `start` — Start datetime (ISO 8601, e.g. `2026-03-01T00:00:00Z`)
- `end` — End datetime (ISO 8601)
- `status` — Filter by delivery status (delivered, held, rejected, bounced)
- `pageToken` — Pagination cursor from previous response

**Example call:**

```json
{
  "from": "phishing@external-domain.com",
  "to": "user@client.com",
  "start": "2026-03-01T00:00:00Z",
  "end": "2026-03-02T23:59:59Z",
  "status": "delivered"
}
```

**Example response:**

```json
{
  "meta": {
    "status": 200,
    "pagination": {
      "pageSize": 25,
      "totalCount": 3,
      "next": null
    }
  },
  "data": [
    {
      "id": "eNqrVkpJLU...",
      "messageId": "<abc123@external-domain.com>",
      "from": "phishing@external-domain.com",
      "to": ["user@client.com"],
      "subject": "Your account needs attention",
      "status": "delivered",
      "received": "2026-03-01T14:22:15Z",
      "size": 48293,
      "direction": "inbound"
    }
  ]
}
```

### Get Message Details

```
mimecast_get_message_info
```

Parameters:
- `id` — The Mimecast message ID (from `mimecast_find_message` response)

**Example response:**

```json
{
  "meta": { "status": 200 },
  "data": [
    {
      "id": "eNqrVkpJLU...",
      "messageId": "<abc123@external-domain.com>",
      "from": "phishing@external-domain.com",
      "to": ["user@client.com"],
      "subject": "Your account needs attention",
      "status": "delivered",
      "received": "2026-03-01T14:22:15Z",
      "direction": "inbound",
      "senderIP": "192.0.2.45",
      "spamScore": 8,
      "detectionLevel": "relaxed",
      "attachments": [
        {
          "filename": "invoice.pdf",
          "size": 42100,
          "mimeType": "application/pdf"
        }
      ],
      "headers": {
        "X-Originating-IP": "192.0.2.45",
        "Return-Path": "bounce@external-domain.com",
        "Authentication-Results": "spf=fail; dkim=fail; dmarc=fail"
      },
      "route": [
        {
          "action": "smtp_receive",
          "timestamp": "2026-03-01T14:22:14Z",
          "host": "mail.mimecast.com"
        },
        {
          "action": "deliver",
          "timestamp": "2026-03-01T14:22:15Z",
          "host": "mail.client.com"
        }
      ]
    }
  ]
}
```

Key fields to examine:
- `senderIP` — Originating IP address of the sender
- `spamScore` — Mimecast spam scoring (higher = more suspicious)
- `headers.Authentication-Results` — SPF/DKIM/DMARC authentication results
- `route` — Full delivery route through the Mimecast pipeline
- `attachments` — Attached files (names, types, sizes)

### Hold a Message

```
mimecast_hold_message
```

Places a message on hold to prevent delivery or further routing.

Parameters:
- `id` — The Mimecast message ID

**Example response:**

```json
{
  "meta": { "status": 200 },
  "data": [
    {
      "id": "eNqrVkpJLU...",
      "status": "held",
      "heldAt": "2026-03-02T09:15:00Z"
    }
  ]
}
```

> **Note:** You can only hold messages that are currently in a state that allows it (e.g. `processing` or `delivered` to held-queue). Already delivered messages may not be recallable depending on your Mimecast subscription.

### Release a Message

```
mimecast_release_message
```

Releases a held message for delivery.

Parameters:
- `id` — The Mimecast message ID

**Example response:**

```json
{
  "meta": { "status": 200 },
  "data": [
    {
      "id": "eNqrVkpJLU...",
      "status": "released",
      "releasedAt": "2026-03-02T09:20:00Z"
    }
  ]
}
```

## Common Workflows

### Investigate a Reported Phishing Email

1. Get sender and approximate send time from the user report
2. Call `mimecast_find_message` with `from`, `to`, and a narrow time range
3. Retrieve the Mimecast message ID from the results
4. Call `mimecast_get_message_info` to examine:
   - SPF/DKIM/DMARC authentication results
   - Originating IP address
   - Attachment filenames and types
   - Delivery route
5. If message was delivered and is malicious, escalate to threat remediation
6. If message is still in flight, call `mimecast_hold_message` to stop delivery

### Investigate a Missing Email

1. Call `mimecast_find_message` with sender, recipient, and broad time range
2. If found with `held` status — message is blocked by policy
3. If found with `rejected` status — check headers for rejection reason
4. If found with `bounced` status — the recipient server rejected delivery
5. If not found — the message may not have reached Mimecast (check SPF records)

### Release Held Legitimate Email

1. Call `mimecast_find_message` with `status=held` to find held messages for a user
2. Call `mimecast_get_message_info` to verify the message is legitimate
3. Call `mimecast_release_message` with the message ID
4. Confirm delivery by re-checking status

### Domain-Wide Phishing Sweep

1. Call `mimecast_find_message` with `from=*@suspicious-domain.com`
2. Use a broad time range (e.g. past 30 days)
3. Identify all recipients who received mail from that domain
4. Cross-reference with TTP logs using `mimecast_get_ttp_logs` to find URL clicks
5. Notify affected users and escalate to incident response

## Error Handling

### Message Not Found

**Cause:** The message ID is invalid, already purged from logs, or outside the retention window.
**Solution:** Mimecast retains message tracking data for 30 days by default. Use `mimecast_find_message` to search by sender/recipient rather than by ID.

### Cannot Hold Message

**Cause:** Message is already delivered past the hold window, or your subscription does not include message recall.
**Solution:** Use threat remediation tools or advise the user to delete the message manually.

### Date Range Too Broad

**Cause:** Queries without date filters or with very wide date ranges may be rejected or heavily paginated.
**Solution:** Always specify `start` and `end` within a reasonable window (7 days or less for efficient queries).

### SPF/DKIM Authentication Failure in Headers

**Cause:** `Authentication-Results: spf=fail; dkim=fail` indicates the sender is spoofed or the domain is misconfigured.
**Action:** This is a strong phishing indicator. Investigate further and consider blocking the sending domain.

## Best Practices

- Always use both `from` and `to` when tracing a specific message — reduces result noise significantly
- Examine `Authentication-Results` headers as the first indicator of spoofing or phishing
- A high `spamScore` (above 5) combined with `dmarc=fail` is a strong phishing signal
- When investigating phishing at scale, search by domain (`*@suspicious-domain.com`) rather than individual senders
- Cross-reference message tracking with TTP logs — a delivered message followed by a URL click confirms user interaction
- Retain message IDs when filing support tickets or PSA incidents — they are the fastest reference for Mimecast support

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, error codes
- [threat-intelligence](../threat-intelligence/SKILL.md) - TTP logs for URL clicks and attachments
- [queue-management](../queue-management/SKILL.md) - Delivery queue and held message monitoring
