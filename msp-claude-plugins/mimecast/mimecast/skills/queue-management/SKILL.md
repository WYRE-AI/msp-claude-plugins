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

### Get Delivery Queue Status

```
mimecast_get_queue_status
```

**This tool takes no arguments.** Its input schema is empty — there is no
`direction` filter, no `status` filter, and no paging. Every call returns
the same whole-gateway snapshot, and any narrowing happens in your own
code after the fact.

**Example response:**

```json
{
  "inbound": {
    "count": 12,
    "oldest": "2026-03-02T09:00:00Z",
    "details": [
      {
        "id": "eNqrVkpJLU...",
        "created": "2026-03-02T09:00:00Z",
        "status": "queued",
        "from": "vendor@external.com",
        "to": ["user@client.com"],
        "subject": "Purchase Order #4892",
        "reason": ""
      }
    ]
  },
  "outbound": {
    "count": 3,
    "oldest": "2026-03-02T08:30:00Z",
    "details": [
      {
        "id": "eNqrVkpABC...",
        "created": "2026-03-02T08:30:00Z",
        "status": "deferred",
        "from": "user@client.com",
        "to": ["recipient@destination.com"],
        "subject": "Report Q1 2026",
        "reason": "550 5.1.1 The email account does not exist"
      }
    ]
  }
}
```

Key fields:
- `inbound` / `outbound` — the two queue directions, each an object. Either
  may be absent; treat a missing key as "no data returned", not as zero.
- `count` — messages currently in that direction's queue
- `oldest` — an **ISO 8601 timestamp**, not an age in seconds. Compute the
  age yourself as `now − oldest` before comparing against a threshold.
- `details[]` — per-message entries. **Every field is optional and the
  array itself may be absent even when `count` is non-zero.** An agent that
  iterates `details` without checking `count` will report a clean queue on
  a backlogged gateway.
- `reason` — free text explaining the current state. It often carries the
  SMTP response, but it is not guaranteed to, and it is not a parsed error
  code.

### What this tool does not give you

The queue snapshot has no per-message retry accounting: there is no
`retryCount` and no `nextRetry`. You cannot tell how many delivery
attempts a message has had or when the next one is due, so any rule of the
form "escalate after N retries" is not implementable against this tool.
Use age (`created`) and `reason` instead.

To work with a *subset* of messages — deferred only, held only, one
sender, one recipient — use `mimecast_find_message`, which does take
filters, including `status` with `queued`, `deferred`, `held`, `bounced`,
`failed`, `delivered`, `accepted`, `blocked`, and `processing`. The queue
tool is a gauge; message tracking is the query interface.

## Common Workflows

### Daily Queue Health Check

1. Call `mimecast_get_queue_status` — it takes no arguments and returns
   both directions at once
2. For each of `inbound` and `outbound`, derive the age of the backlog from
   `oldest` (`now − oldest`), then compare:
   - Under 60 seconds: healthy
   - 60–300 seconds: minor delay, monitor
   - Over 300 seconds: investigate
3. Read `count` per direction. A rising outbound `count` with an ageing
   `oldest` is the backlog signal
4. Scan `details[].status` for `deferred` entries and read their `reason`.
   If `count` is non-zero but `details` is empty or missing, say so —
   do not report the queue as clean

### Investigate a Stuck Message

1. Call `mimecast_find_message` with `status: "deferred"` — the queue tool
   cannot filter, and message tracking is the only way to pull just the
   stuck messages
2. Rank candidates by age from `created`. There is no `retryCount`
   available, so attempt-count heuristics do not apply
3. Read `reason` for the failure text. When it carries an SMTP response:
   - `5xx` — permanent rejection by the recipient server (invalid address, policy block)
   - `4xx` — temporary failure (server down, greylisting)
   Treat `reason` as a hint, not a parsed code; it may be empty or prose
4. For `5xx`, notify the sender that delivery failed permanently
5. For `4xx`, confirm the recipient server is online; messages auto-retry
6. Use `mimecast_get_message_info` with the message `id` for full routing
   and rejection detail

### Detect a Downstream Outage

1. Call `mimecast_find_message` with `status: "deferred"` and, where you
   already suspect a partner, `recipient_address` for that domain
2. Group the results by recipient domain yourself — neither tool aggregates
   by domain
3. Many deferred messages to one destination domain with consistent 4xx
   text in `reason` points at that recipient's server being down
4. Confirm the scale against `mimecast_get_queue_status` — the outbound
   `count` tells you how much mail is affected in total
5. Notify the client that outbound delivery to that domain is affected and
   messages will auto-retry

### Identify Incorrectly Held Messages

1. Call `mimecast_find_message` with `status: "held"`. Held mail is not a
   queue-status filter — the queue snapshot has no held segment
2. Review held messages for false positives — legitimate emails held by
   overly strict policy
3. For legitimate emails, use `mimecast_release_message` (see
   message-tracking skill) to release them. Releasing is the plugin's one
   destructive tool: it delivers mail the platform decided not to deliver,
   and it cannot be undone
4. Document the release and consider adjusting the Mimecast policy to
   prevent recurrence

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
- A `5xx` response in `reason` means permanent delivery failure — these messages will eventually bounce; notify senders promptly
- `4xx` deferred messages auto-retry — only escalate once `now − oldest` exceeds 2 hours
- Treat `count` as the source of truth for how much mail is queued, and `details[]` as a sample of it — never infer "queue is empty" from an absent `details` array
- Reach for `mimecast_find_message` whenever the question is about a subset; `mimecast_get_queue_status` only answers "how bad is it overall"

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, error codes
- [message-tracking](../message-tracking/SKILL.md) - Trace individual messages and manage held mail
- [threat-intelligence](../threat-intelligence/SKILL.md) - TTP threat logs
