---
description: Snapshot of 3CX queue staffing and active call load
argument-hint: "[queue name or ID]"
arguments: [queue]
---

# Queue Status

A read-only staffing snapshot for one queue, or every queue the connected
account can access if none is specified: who's logged in, and how many
calls are active against it right now.

## Prerequisites

- A 3CX PBX connected (directly or through Conduit's BYO connector) with a
  valid, authenticated MCP session — see the `api-patterns` skill
- MCP tools available for listing queues, a queue's agents, and currently
  active calls (see the `calls-queues` skill)

## Steps

1. **Resolve the queue(s) in scope**

   If a queue name or ID was given, use it directly. Otherwise, list
   queues the user can access/manage and cover all of them.

2. **Pull staffing for each queue**

   List each queue's agents. Note which are logged in versus logged out —
   a queue can look adequately staffed by headcount while most agents are
   actually logged out.

3. **Cross-reference active call load**

   List currently active calls and match them against the queue(s) in
   scope, where the tool's response makes that association available.

4. **Report**

   For each queue: agent count, logged-in count, and active call count.
   Flag any queue with active calls but zero logged-in agents — that's the
   pattern that actually matters, not raw call volume.

## Examples

```
/queue-status
/queue-status "Support"
/queue-status queue-42
```

## Error Handling

- **Queue not found:** Re-list queues the user can access/manage — the
  requested name or ID may not match, or may belong to a queue this
  connection's account can't see.
- **No active calls returned but the queue is known to be busy:** Confirm
  the MCP session hasn't gone stale (see `/pbx-health-check`) before
  reporting the queue as idle.

## Related Commands

- `/find-contact` — resolve who a specific agent extension belongs to
- `/pbx-health-check` — broader PBX liveness check if queue data looks stale or missing
