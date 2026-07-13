---
description: Check Mimecast email delivery queue status and identify stuck or deferred messages
argument-hint: "[direction] [status]"
arguments: [direction, status]
---

# Mimecast Queue Check

Check the Mimecast email delivery queue to identify stuck messages, delivery backlogs, deferred outbound email, and delivery failures. Use this command when users report missing or delayed email, or as part of a daily mail flow health check.

## Prerequisites

- Mimecast MCP server connected with valid credentials
- MCP tool `mimecast_get_queue` available

## Steps

1. **Retrieve queue status**

   Call `mimecast_get_queue` with the specified `direction` and `status` filters. If no filters are provided, retrieve the full queue overview.

2. **Assess queue health**

   For each queue segment, evaluate `oldestMessageAge`:
   - Under 60 seconds: healthy, no action needed
   - 60–300 seconds: minor delay, monitor
   - Over 300 seconds: investigate further
   - Over 1800 seconds (30 minutes): alert, likely an outage or configuration issue

3. **Identify stuck messages**

   Flag messages with:
   - High `retryCount` (5 or more)
   - `status=deferred` with `ageSeconds` over 900 (15 minutes)
   - `lastError` indicating a 5xx permanent failure

4. **Diagnose delivery failures**

   Interpret `lastError` codes:
   - `5xx` errors: permanent rejection — notify sender of bounce
   - `4xx` errors: temporary failure — messages will auto-retry; check if recipient server is down
   - Domain-wide `4xx` pattern: possible recipient server outage

5. **Report findings**

   Present a structured queue summary:
   - Queue health status per segment (inbound/outbound)
   - Count of queued, deferred, and held messages
   - List of stuck messages with sender, recipient, age, retry count, and last error
   - Recommended actions per issue

6. **Recommend next steps**

   - For 5xx permanent failures: advise sender; no further retry will occur after bounce
   - For 4xx temporary failures affecting a domain: check recipient server status; messages will auto-retry
   - For held messages: use `/trace-message` to review and release if legitimate

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| direction | string | No | both | Queue to check: inbound, outbound, or both |
| status | string | No | all | Message status filter: queued, retrying, deferred, held |

## Examples

### Full Queue Health Check

```
/check-queue
```

### Check Outbound Deferred Messages Only

```
/check-queue --direction outbound --status deferred
```

### Check Inbound Queue for Backlog

```
/check-queue --direction inbound
```

## Error Handling

- **Empty queue when delays reported:** The message may have already been processed; use `/trace-message` to check its final status
- **Authentication errors:** Verify Mimecast credentials and region configuration
- **5xx errors on outbound messages:** Permanent failure — these messages will bounce to the sender; notify them promptly

## Related Commands

- `/trace-message` - Trace a specific message for delivery history and threat details
- `/review-threats` - Review TTP threat logs
