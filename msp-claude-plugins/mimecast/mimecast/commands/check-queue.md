---
description: Check Mimecast email delivery queue status and identify stuck or deferred messages
argument-hint: "[status]"
arguments: [status]
---

# Mimecast Queue Check

Check the Mimecast email delivery queue to identify stuck messages, delivery backlogs, deferred outbound email, and delivery failures. Use this command when users report missing or delayed email, or as part of a daily mail flow health check.

## Prerequisites

- Mimecast MCP server connected with valid credentials
- MCP tools `mimecast_get_queue_status` and `mimecast_find_message` available

## Steps

1. **Retrieve queue status**

   Call `mimecast_get_queue_status`. It takes no arguments — there is no
   direction or status filter on this tool, and every call returns the
   whole-gateway snapshot with `inbound` and `outbound` keys.

2. **Assess queue health**

   For each direction present, derive the backlog age from `oldest`, which
   is an ISO 8601 timestamp rather than a duration — compute `now − oldest`:
   - Under 60 seconds: healthy, no action needed
   - 60–300 seconds: minor delay, monitor
   - Over 300 seconds: investigate further
   - Over 1800 seconds (30 minutes): alert, likely an outage or configuration issue

   Read `count` per direction for the size of the backlog. If a direction
   key is missing entirely, report it as "not returned" — not as zero.

3. **Identify stuck messages**

   If the user named a `status`, call `mimecast_find_message` with that
   `status` to pull just those messages; the queue tool cannot filter.
   Otherwise scan `details[]` from step 1.

   Flag messages with:
   - `status` of `deferred` and a `created` timestamp over 15 minutes old
   - a `reason` that carries a 5xx permanent failure

   There is no `retryCount` and no `nextRetry` on either tool, so do not
   rank or escalate by attempt count. Age and `reason` are what you have.

   If `count` is non-zero but `details[]` came back empty or absent, say so
   explicitly rather than reporting a clean queue.

4. **Diagnose delivery failures**

   `reason` is free text. When it carries an SMTP response, interpret it:
   - `5xx`: permanent rejection — notify sender of bounce
   - `4xx`: temporary failure — messages will auto-retry; check if recipient server is down
   - Domain-wide `4xx` pattern: possible recipient server outage

   When `reason` is empty or prose, fall back to `mimecast_get_message_info`
   for the message's routing and rejection detail.

5. **Report findings**

   Present a structured queue summary:
   - Queue health status per direction (inbound/outbound), with the age you computed
   - `count` of queued messages per direction, plus how many of the returned `details[]` are deferred or held
   - List of stuck messages with sender, recipient, age, and reason
   - Recommended actions per issue

6. **Recommend next steps**

   - For 5xx permanent failures: advise sender; no further retry will occur after bounce
   - For 4xx temporary failures affecting a domain: check recipient server status; messages will auto-retry
   - For held messages: use `/trace-message` to review and release if legitimate

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | all | Narrow step 3 to one message status via `mimecast_find_message`: queued, deferred, held, bounced, failed, delivered, accepted, blocked, or processing |

There is no direction parameter. Neither `mimecast_get_queue_status` nor
`mimecast_find_message` accepts one — the queue tool always returns both
directions, and message tracking filters by address and status instead.

## Examples

### Full Queue Health Check

```
/check-queue
```

### Check Deferred Messages Only

```
/check-queue --status deferred
```

### Check Held Messages

```
/check-queue --status held
```

## Error Handling

- **Empty queue when delays reported:** The message may have already been processed; use `/trace-message` to check its final status
- **`count` above zero but no `details[]`:** The snapshot returned totals without per-message entries. Report the counts and pivot to `mimecast_find_message` for the messages themselves
- **Authentication errors:** Verify Mimecast credentials and region configuration
- **5xx errors on outbound messages:** Permanent failure — these messages will bounce to the sender; notify them promptly

## Related Commands

- `/trace-message` - Trace a specific message for delivery history and threat details
- `/review-threats` - Review TTP threat logs
