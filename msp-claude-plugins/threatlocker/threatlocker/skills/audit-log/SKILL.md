---
name: "ThreatLocker Audit Log"
description: >
  The ThreatLocker Action Log (the API name is "audit"): incident timelines, tracing a
  file's history across endpoints, repeated-denial detection, and correlating policy
  bypasses or audit-only matches with user and computer context.
when_to_use: >-
  When investigating a security event timeline, tracing a file path or hash across
  endpoints, looking up repeated denials, or correlating policy bypasses to specific
  actions. Use when: threatlocker audit log, threatlocker action log, threatlocker
  investigate, threatlocker file history, threatlocker timeline, threatlocker denied
  execution, what happened on, threatlocker policy bypass, or threatlocker forensics.
---

# ThreatLocker Audit Log

What the API calls the "audit" endpoints, the ThreatLocker UI calls the
**Action Log** — the same data either way. Every execution attempt,
every block, every permit, every audit-only match generates an entry.
This is your forensics surface: when something happened on an endpoint,
this is where you find out what.

## API Tools

### Search Action Log

```
threatlocker_audit_search
```

POST-based `GetByParameters`. Common filters via the body:

- `searchText` — substring across file name, path, computer name, user
- Date-range fields (typically `fromDate` / `toDate` in ISO 8601 UTC)
- `pageNumber`, `pageSize`, `orderBy: "actionTime"`,
  `isAscending: false` (newest first is the usual default)
- `organizationId` header for tenant scoping

Each row typically includes `actionId`, `actionTime`, `kindOfAction`
(Block, Permit, Audit), `fileName`, `filePath`, `fileHash`, `signer`,
`computerName`, `userName`, `policyName`, and `processChain` (parent
process info).

### Get Action Detail

```
threatlocker_audit_get
```

Returns a single action with full context — full process tree, command
line, network endpoints contacted (when available), and any related
actions clustered around the same event.

### File History

```
threatlocker_audit_file_history
```

Aggregates all Action Log entries for a given file path or hash. Use
this when you have a candidate IOC and want to know everywhere it
appeared in the fleet, when, and what happened each time.

## `kindOfAction` Categorization

| Action | Meaning |
|--------|---------|
| **Block** | Policy denied execution — the binary did not run |
| **Permit** | Policy allowed execution — the binary ran |
| **Audit** | Audit-only — observed but not acted on (often Learning Mode) |

Block + Audit together is the high-signal pair for hunting:

- A **Block** event is your control working as designed.
- An **Audit** event in Secured Mode means something matched a watch
  rule but was not stopped — investigate.
- An **Audit** event in Learning Mode is just baseline data, less
  actionable.

## Common Workflows

### Timeline Around a Security Event

When given "something happened on host X around time T":

1. `threatlocker_audit_search` with `searchText: "<host>"`,
   `fromDate: T - 1h`, `toDate: T + 1h`,
   `orderBy: "actionTime"`, `isAscending: true`.
2. Read forward through the timeline and look for the inflection —
   the first unusual binary, the first child process from a known LOLBin
   parent, the first network-active process.
3. For any anomaly, call `threatlocker_audit_get` for the full detail
   and add the parent process to your investigation list.
4. Pivot on `fileHash` of the suspicious binary using
   `threatlocker_audit_file_history` to see where else in the fleet it
   appeared.

### File-Path-Across-Endpoints Investigation

When given an IOC (path or hash):

1. `threatlocker_audit_file_history` with the IOC.
2. Bucket results by `computerName` — which endpoints saw it?
3. For each affected endpoint, note the earliest `actionTime` —
   the spread pattern often points to patient zero.
4. For every Permit action against the IOC, that endpoint may have
   been impacted. For every Block, you have evidence the control
   stopped it.

### Repeated Denials From the Same Source

A pattern worth surfacing: same user or same computer generating many
Block events in a short window.

1. Search a recent window with `kindOfAction: "Block"`.
2. Group results client-side by `userName` and `computerName`.
3. Anyone with > N blocks in a short window is either:
   - A user fighting their tooling (open an approval — see
     `approval-requests` skill).
   - A compromised account or malware retrying execution.

### Policy Bypass / Audit-Only Match Correlation

1. Search with `kindOfAction: "Audit"`.
2. Filter to Secured-Mode endpoints (cross-reference computers via
   `threatlocker_computers_get` — `policyMode`).
3. Each Audit hit on a Secured endpoint indicates a watch rule fired
   without enforcement — review the rule and decide if it should
   become a Block.

## Date-Range Filter Patterns

- **Last hour** — `now - 1h` to `now`. Tight, high-signal.
- **Last 24h** — Daily triage and report scope.
- **Last 7d** — Threat-hunting baseline.
- **Around an alert** — `alertTime ± 30m` is usually enough; expand
  if the parent process is unclear.

Always send dates in ISO 8601 UTC. The Action Log itself stores UTC.

## Edge Cases

- **High-volume endpoints** — Build servers, dev workstations and
  jump boxes can generate thousands of audit rows per day. Use tight
  date windows or `signer` filters to keep result sets manageable.
- **Duplicate-looking events** — A single execution can produce
  multiple log rows (file open, hash check, network connect). Always
  read the `actionId` to confirm uniqueness.
- **Truncated process chains** — `processChain` is best-effort. If
  the parent is empty or `unknown`, treat the row as a starting point
  for further investigation, not a final answer.

## Best Practices

- Start with the tightest possible time window; expand only if needed.
- Always pivot on `fileHash` rather than `filePath` for IOC work —
  attackers rename binaries, hashes don't change.
- Capture `actionId` references in any incident write-up so a
  reviewer can re-pull the exact source rows.
- Cross-reference findings with `approval-requests` — a recent
  approval may explain an otherwise suspicious Permit.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — Auth and pagination
- [computers](../computers/SKILL.md) — Endpoint policy mode context
- [approval-requests](../approval-requests/SKILL.md) — Decisions that
  produce Permit actions
- [organizations](../organizations/SKILL.md) — Multi-tenant pivot
