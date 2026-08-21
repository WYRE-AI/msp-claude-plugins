---
description: Quick health check for a connected 3CX PBX
argument-hint: ""
arguments: []
---

# PBX Health Check

A quick read-only sweep of PBX liveness: current server time, service
status, and a recent-window scan of the structured event log for a
failure pattern.

## Prerequisites

- A 3CX PBX connected (directly or through Conduit's BYO connector) with a
  valid, authenticated MCP session — see the `api-patterns` skill

## Steps

1. **Confirm connectivity**

   Get the current PBX server time. A successful response confirms the
   session is live and authenticated before spending calls on anything
   else.

2. **Check service status**

   List PBX services and their state. Note any service not in a healthy
   running state.

3. **Scan the recent event log**

   Search/list the structured PBX event log for a recent window (start
   with the last few hours). Look for a *pattern* of related failures
   rather than treating a single isolated entry as significant — PBX event
   logs are noisy by nature.

4. **Synthesize**

   Report:
   - Whether the PBX responded and server time looks correct (not wildly
     skewed from expected)
   - Any service not in a healthy state, named explicitly
   - Any recurring event-log pattern in the recent window, with
     timestamps

   Do not report "PBX is healthy" as a single yes/no if any service is
   degraded or the event log shows a repeating pattern — state each
   finding explicitly so the reader can judge severity themselves.

## Examples

```
/pbx-health-check
```

## Error Handling

- **Server time call fails or times out:** The MCP session itself may have
  expired — re-authenticate per the `api-patterns` skill before assuming
  the PBX itself is down.
- **Event log search returns nothing:** Confirm the queried time window is
  correct before reporting "no events" — an empty result for an
  unexpectedly narrow or misaligned window looks identical to a genuinely
  quiet PBX.

## Related Commands

- `/queue-status` — staffing-specific check, narrower than this general health sweep
