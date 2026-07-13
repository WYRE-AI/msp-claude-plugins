---
description: Show ImmyBot maintenance session status — active sessions, or detail and logs for a specific session
argument-hint: "[session]"
arguments: [session]
---

# ImmyBot Maintenance Status

Report ImmyBot maintenance session status. With a session ID, show
detail and logs for "$ARGUMENTS.session"; without one, list all
active sessions.

## Arguments

- `session` (optional) — Maintenance session ID (optional; omit to list all active sessions)

## Prerequisites

- ImmyBot MCP server connected
- Tools: `immybot_maintenance_sessions_active`,
  `immybot_maintenance_sessions_get`,
  `immybot_maintenance_sessions_logs`,
  `immybot_maintenance_sessions_results`

## Instructions

### No session ID — fleet view

1. Call `immybot_maintenance_sessions_active`.
2. Present a table: session ID, target (computer/tenant), type,
   status, started.
3. Summarize total running sessions.

### Session ID given — detail view

1. `immybot_maintenance_sessions_get` for status and metadata.
2. `immybot_maintenance_sessions_logs` for recent log lines.
3. If the session is terminal, `immybot_maintenance_sessions_results`
   for per-task outcomes.
4. Report: status, progress, any failing tasks, and the recommended
   next step (wait, re-run, investigate).

## Example Output

| Session | Target | Type | Status | Started |
|---------|--------|------|--------|---------|
| 8841 | Acme Corp (tenant) | Reconcile | Running | 12 min ago |
| 8839 | WS-ACCT-04 | Reconcile | Completed | 40 min ago |

## Example

```
/maintenance-status 8841
```

## Related Commands

- `/deploy-software` — starts the sessions this command monitors
- `/compliance-report` — confirm post-session compliance
