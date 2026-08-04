---
name: "Mimecast Queue Management"
description: >
  Mimecast email delivery queues: inbound and outbound queue types, queue
  message states, retry behavior, and the signals that identify stuck
  messages, delivery delays, and backlog conditions.
when_to_use: >-
  When checking Mimecast delivery queue health or diagnosing delayed or stuck mail. Use when:
  mimecast queue, email queue, delivery queue, mimecast backlog, mimecast delivery delay, stuck
  email, mimecast outbound queue, or mimecast inbound queue.
---

# Mimecast Queue Management

## Overview

The Mimecast delivery queue holds messages that are in transit — inbound messages being scanned and processed, outbound messages awaiting delivery to recipient servers. Queue monitoring is essential for detecting delivery backlogs, identifying stuck messages due to recipient server issues, and understanding the state of mail flow during incidents (e.g. a downstream mail server outage). A healthy queue processes messages within seconds; messages sitting in the queue for minutes or longer indicate a potential problem.

## Anti-triggers

- **Releasing or deleting a held message** — this skill reports queue
  contents and cannot change a message's disposition; use
  `Mimecast Message Tracking`.
- **Finding one specific email** — the queue shows current in-transit
  state only. Anything already delivered, bounced, or rejected has left
  it; search with `Mimecast Message Tracking`.
- **Why a message was blocked** — queueing is a delivery outcome, not a
  security verdict. For the threat reasoning use
  `Mimecast Threat Intelligence`.

## Key Concepts

### Queue Types

| Queue | Description |
|-------|-------------|
| **Inbound** | Messages received from external senders, being scanned before delivery to internal mailboxes |
| **Outbound** | Messages from internal users being delivered to external recipients |
| **Hold Queue** | Messages explicitly held by policy or administrator action (see message-tracking skill) |

### Queue Message States

| State | Meaning |
|-------|---------|
| `queued` | Waiting to be processed |
| `retrying` | Delivery failed, scheduled for retry |
| `deferred` | Recipient server temporarily unavailable; Mimecast will retry |
| `held` | Manually held or policy-blocked |

### Retry Behavior

When Mimecast cannot deliver a message (e.g. the recipient mail server is down), it enters the message into a retry schedule:
- First retry: ~5 minutes
- Subsequent retries: exponential backoff, up to 4 days
- After 4 days without successful delivery: bounce notification sent to sender

## API Patterns

### Get Delivery Queue

```
mimecast_get_queue
```

Returns current queue contents with message counts and delivery status.

Parameters:
- `direction` — Queue direction: `inbound` or `outbound` (optional, returns both if omitted)
- `status` — Filter by status: `queued`, `retrying`, `deferred`, `held` (optional)

**Example — Get full queue overview:**

```json
{}
```

**Example response:**

```json
{
  "meta": { "status": 200 },
  "data": [
    {
      "direction": "inbound",
      "status": "queued",
      "count": 12,
      "oldestMessageAge": 45,
      "messages": [
        {
          "id": "eNqrVkpJLU...",
          "from": "vendor@external.com",
          "to": "user@client.com",
          "subject": "Purchase Order #4892",
          "received": "2026-03-02T09:00:00Z",
          "ageSeconds": 45,
          "status": "queued",
          "retryCount": 0
        }
      ]
    },
    {
      "direction": "outbound",
      "status": "deferred",
      "count": 3,
      "oldestMessageAge": 1800,
      "messages": [
        {
          "id": "eNqrVkpABC...",
          "from": "user@client.com",
          "to": "recipient@destination.com",
          "subject": "Report Q1 2026",
          "received": "2026-03-02T08:30:00Z",
          "ageSeconds": 1800,
          "status": "deferred",
          "retryCount": 4,
          "lastError": "550 5.1.1 The email account does not exist",
          "nextRetry": "2026-03-02T09:45:00Z"
        }
      ]
    }
  ]
}
```

Key fields:
- `oldestMessageAge` — Age in seconds of the oldest message in this queue segment (high values indicate a backlog)
- `retryCount` — Number of delivery attempts made
- `lastError` — SMTP error from the last delivery attempt
- `nextRetry` — Scheduled time for next delivery attempt

**Example — Outbound deferred queue only:**

```json
{
  "direction": "outbound",
  "status": "deferred"
}
```

## Common Workflows

### Daily Queue Health Check

1. Call `mimecast_get_queue` with no filters to get a full queue snapshot
2. Check `oldestMessageAge` for each queue segment:
   - Under 60 seconds: healthy
   - 60–300 seconds: minor delay, monitor
   - Over 300 seconds: investigate
3. Check `count` for deferred messages — any deferred outbound messages need attention
4. For deferred messages, read `lastError` to diagnose the cause

### Investigate a Stuck Message

1. Call `mimecast_get_queue` with `status=deferred`
2. Identify messages with high `retryCount` (5+) and long `ageSeconds`
3. Read `lastError` to diagnose:
   - `5xx` errors — Permanent rejection by recipient server (invalid address, policy block)
   - `4xx` errors — Temporary failure (server down, greylisting)
4. For `5xx` errors, notify the sender that delivery failed permanently
5. For `4xx` errors, confirm the recipient server is online; messages will auto-retry
6. Cross-reference with `mimecast_find_message` using the message ID for full delivery history

### Detect a Downstream Outage

1. Call `mimecast_get_queue` filtering for `direction=outbound` and `status=deferred`
2. If many messages to the same destination domain are deferred with 4xx errors, the recipient server may be down
3. Check `lastError` for all affected messages — consistent errors to the same domain confirm an outage
4. Notify the client that outbound delivery to that domain is affected and messages will auto-retry
5. Monitor the queue; when the recipient server recovers, deferred messages will deliver automatically

### Identify Incorrectly Held Messages

1. Call `mimecast_get_queue` with `status=held`
2. Review held messages for false positives — legitimate emails held by overly strict policy
3. For legitimate emails, use `mimecast_release_message` (see message-tracking skill) to release them
4. Document the release and consider adjusting the Mimecast policy to prevent recurrence

## Error Handling

### Queue Returns Empty When Delays Are Reported

**Cause:** The queue may have cleared by the time you query, or the affected messages may be in a different queue segment.
**Solution:** Use `mimecast_find_message` with the specific sender/recipient to trace the message directly by its delivery status.

### Persistent 5xx Deferred Messages

**Cause:** The recipient mail server is permanently rejecting delivery. Common causes: invalid recipient address, the recipient domain's MX records are wrong, or their server has a policy block against your client's domain.
**Solution:** Notify the sender of the bounce reason (`lastError` content). If the recipient address is valid, ask the client to contact the recipient to have your domain allowlisted.

### High Inbound Queue Count

**Cause:** Mimecast is processing a high volume of inbound messages, or scanning is taking longer than usual (e.g. an attachment sandbox backlog).
**Solution:** Monitor the `oldestMessageAge` — if it grows over 5 minutes, contact Mimecast support. Temporary spikes during high-volume periods (e.g. start of business day) are normal.

## Best Practices

- Run a queue health check at the start of each business day to catch overnight delivery failures
- A sudden spike in deferred outbound messages often indicates a recipient server outage — investigate by domain
- High `retryCount` with `5xx` errors means permanent delivery failure — these messages will eventually bounce; notify senders promptly
- `4xx` deferred messages auto-retry — only escalate if `oldestMessageAge` exceeds 2 hours
- Correlate queue data with `mimecast_find_message` for full message history when investigating specific reports

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, error codes
- [message-tracking](../message-tracking/SKILL.md) - Trace individual messages and manage held mail
- [threat-intelligence](../threat-intelligence/SKILL.md) - TTP threat logs
