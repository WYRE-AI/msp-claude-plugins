---
description: Build a timeline of ThreatLocker audit events around a security incident
argument-hint: "[target] [start_time] [end_time] [organization_id]"
arguments: [target, start_time, end_time, organization_id]
---

# ThreatLocker Audit Investigation

Investigate ThreatLocker audit logs around a security event. Builds a chronological timeline highlighting blocked actions, policy bypasses, and repeated denials so an analyst can quickly understand attacker / user behavior on a host.

## Prerequisites

- ThreatLocker MCP server connected with a valid `THREATLOCKER_API_KEY`
- Tools available: `threatlocker_audit_search`, `threatlocker_audit_file_history`

## Steps

1. **Determine the search shape**

   - If `target` looks like a file path (contains `\` or `/` or ends with an extension), plan to call BOTH `threatlocker_audit_search` and `threatlocker_audit_file_history` - the file history endpoint surfaces denies/allows over time for that exact path
   - If `target` looks like a hostname, filter `threatlocker_audit_search` by computer
   - If `target` looks like a username (contains `\` or `@`), filter by user
   - If no target, search the full org over the time window and let volume guide the pivot

2. **Run the searches**

   Call `threatlocker_audit_search` with the inferred filters and the supplied time window. If a file path was given, also call `threatlocker_audit_file_history` for that path. Paginate as needed.

3. **Build a chronological timeline**

   Sort events by timestamp. For each event surface: timestamp, computer, user, action (Allow/Deny/Elevate), application/file, policy that matched, hash.

4. **Call out high-signal patterns**

   Highlight specifically:
   - **Blocked actions** - Denies, especially for known tooling (PsExec, mimikatz, BloodHound, AnyDesk, etc.)
   - **Policy bypasses** - Elevations, ringfence violations, or one-off allows
   - **Repeated denials from the same source** - Five+ blocks for the same hash on one host suggests the user is fighting the policy (or malware is retrying)
   - **Off-hours activity** - Anything outside the user's normal working hours

5. **Summarize and recommend next steps**

   Two-paragraph summary: what happened, and what to do (approve, tighten policy, isolate host via RMM, escalate to IR).

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| target | string | No | none | Computer name, file path, or username |
| start_time | string | No | last 24h | ISO 8601 start of window |
| end_time | string | No | now | ISO 8601 end of window |
| organization_id | string | No | primary org | Scope to a child organization |

## Examples

### Investigate a specific computer last 24h

```
/audit-investigation --target "WIN-DC01"
```

### Trace a suspicious file path

```
/audit-investigation --target "C:\\Users\\jsmith\\AppData\\Local\\Temp\\update.exe"
```

### Investigate a user across a time window

```
/audit-investigation --target "CONTOSO\\jsmith" --start_time "2026-04-28T00:00:00Z" --end_time "2026-04-29T00:00:00Z"
```

## Related Commands

- `/approval-triage` - Pivot from a denied audit event to its approval request
- `/offline-agents` - Check whether the host went silent during the window
