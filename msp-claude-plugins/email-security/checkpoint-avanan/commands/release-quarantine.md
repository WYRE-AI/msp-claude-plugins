---
description: Restore quarantined mail to its recipients in Checkpoint Harmony Email, with task polling
argument-hint: "<entity-id> [event-id] [entity-type]"
arguments: [entity-id, event-id, entity-type]
---

# Release Quarantined Email

Deliver held messages back to their recipients in Checkpoint Harmony Email & Collaboration (Avanan) with `hec_restore_emails` (entity ids) or `hec_restore_events` (event ids).

**Restore is the sharp operation on this surface, and the tool metadata says the opposite.** The two quarantine tools carry `destructiveHint: true`; the two restore tools carry **no annotations at all**. A client that gates confirmation on `destructiveHint` will stop you on a quarantine and wave a restore straight through — the inverse of the real risk ordering. Require a named human approver explicitly. Do not rely on the tool metadata to ask.

Restoring delivers a message the security stack already judged malicious into a real person's inbox, and **there is no un-deliver**. When the detection was malware or BEC, an erroneous restore is precisely the outcome the product exists to prevent.

## Prerequisites

- A working Harmony Email connection (see [README](../README.md) for configuration)
- Restore sits at the `admin` tier in Conduit — see [GOVERNANCE.md](../GOVERNANCE.md). Conduit compares tiers; it does **not** enforce per-call approval, so the approval discipline below is a policy you impose, not one the platform guarantees.
- Entity ids from `/search-quarantine`, or event ids from `/search-threats`

## Steps

1. **Read the message before touching it**
   - `hec_get_email` on each entity id. Check `entitySecurityResult.combinedVerdict` rather than the search summary line, and read `entityAvailableActions` — an entity's state constrains what it still accepts.
   - Confirm `isQuarantined` is actually true. An entity with `isRestored` already true was delivered previously.

2. **Establish why it was held**
   - There is no quarantine-reason field. Pivot through `/search-threats` and `/check-threat` to the detection. The release posture depends on the detection type — see the table below.

3. **Get out-of-band confirmation**
   - Confirm the sender's legitimacy with the customer by a channel other than the mail in question.
   - Check whether other recipients received the same message; a single release on a campaign is rarely the whole answer.

4. **Get named approval, then restore**
   ```json
   { "entityIds": ["ent-x9y8z7"], "entityType": "email" }
   ```
   Or, if you hold event ids instead:
   ```json
   { "eventIds": ["evt-a1b2c3"] }
   ```
   Both reach the same underlying action; use whichever id namespace you already have.

5. **Poll every task**
   - The call returns **one `taskId` per entity** and reports acceptance, not completion.
   - Call `hec_get_task_status` for each `taskId`. Poll all of them, not just the last.
   - **An agent that reports "released" off the back of the action call alone is reporting an intention.**

6. **Report per-entity outcomes**, including any task that did not reach a terminal state.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| entity-id | string[] | Conditional | - | `entityIds` for `hec_restore_emails` |
| event-id | string[] | Conditional | - | `eventIds` for `hec_restore_events` |
| entity-type | string | No | `email` | `entityType`, entity-id path only |

One of `entity-id` or `event-id` is required.

## What This Command Cannot Do

The previous revision of this command offered three flags that have no backing:

- **No `--allow-list`.** Releasing a message and creating a sender exception are two separate operations against two different tools. There is no release-with-allow-list. If the sender should stop being flagged, that is a `hec_add_exception` call with `excType: "whitelist"` — a separate, deliberate security decision. Say which of the two you are proposing.
- **No `--notify`.** Nothing on this surface tells a recipient their mail was held or released.
- **No `--reason`.** The restore action accepts only ids and an optional entity type. There is no reason field, no audit note, and nothing written back to the record. Your justification lives in the ticket, not in Harmony Email.

Also absent: there is **no delete**. This surface has quarantine and restore only; permanently removing a held message is a console action.

## Release Posture by Detection Type

| Detection | Posture |
|-----------|---------|
| `malware` | **Do not release.** Escalate. |
| `suspicious malware` | Do not release without sandbox or hash corroboration. |
| `phishing` (incl. BEC) | Release only after out-of-band sender confirmation. |
| `dlp` | Outbound. This is a data-handling decision, not a security one — it needs the data owner, not the helpdesk. |
| `anomaly` | Usually a genuine sender behaving unusually. Highest legitimate release rate. |
| `malicious_url` | Check whether the link is still live before judging. |

A `malicious_url_click` event means a user already reached the destination. Releasing or holding the message is then secondary to credential response.

## Examples

### Single Message

```
/release-quarantine ent-x9y8z7
```

### By Event ID

```
/release-quarantine --event-id evt-a1b2c3
```

### Several at Once

```
/release-quarantine ent-x9y8z7,ent-p3q4r5,ent-s6t7u8
```

## Output

```
RESTORE — 3 entities submitted

Pre-flight:
  ent-x9y8z7  "Weekly Newsletter"   news@partner.example   verdict: clean    held: yes
  ent-p3q4r5  "Monthly Report"      reports@partner.example verdict: clean   held: yes
  ent-s6t7u8  "Partner Update"      news@partner.example   verdict: clean    held: yes

  Detection type: anomaly (bulk sender, first send from this domain)
  Sender confirmed out of band with the client on 2026-08-06.
  Approved by: <named approver>

Submitted. Task ids returned:
  ent-x9y8z7 -> task-11aa22
  ent-p3q4r5 -> task-33bb44
  ent-s6t7u8 -> task-55cc66

Polling hec_get_task_status:
+------------+-----------+-----------+
| Entity ID  | Task ID   | Status    |
+------------+-----------+-----------+
| ent-x9y8z7 | task-11aa22 | completed |
| ent-p3q4r5 | task-33bb44 | completed |
| ent-s6t7u8 | task-55cc66 | completed |
+------------+-----------+-----------+

3 of 3 delivered. All tasks reached a terminal state.
No sender exception was created — the messages were released, nothing standing changed.
```

### Partial Completion

```
Submitted. Task ids returned:
  ent-x9y8z7 -> task-11aa22   completed
  ent-p3q4r5 -> task-33bb44   completed
  ent-s6t7u8 -> task-55cc66   still pending

2 of 3 confirmed delivered. One task has not reached a terminal state —
this is NOT a failure and NOT a success. Re-poll task-55cc66 before
reporting an outcome for ent-s6t7u8.
```

## Error Handling

### Batches Are Not Transactional

```
The API caps a single action call at 100 entities (see GOVERNANCE.md).

Splitting a larger action into batches performs several independent
irreversible operations. A failure partway leaves a mixed state with
nothing to roll back. Poll every taskId, not just the last, and report
the mixed state honestly rather than as an aggregate.
```

### Entity Not Found

```
Error: no entity returned for ent-invalid123.

Check:
- the id is an entity id, not an event id (different namespaces —
  use hec_restore_events for event ids)
- quarantine expiry: entries auto-delete after the tenant's retention
  period (30 days by default) and cannot be recovered
- region and farm scope
```

### Already Restored

```
ent-x9y8z7 has isRestored: true — it was already delivered.

No action taken. Note that isQuarantined and isRestored can both be
true; that means held and then released, not held now.
```

### Quarantine Expiry

```
Warning: quarantine expiry is a hard deletion.

Entries age out after the retention period and cannot be recovered.
There is no tool that reads or extends retention. The only documented
workaround — release and re-quarantine — means briefly delivering
the message, which is itself the risk you were trying to avoid.
```

## Related Commands

- `/search-quarantine` - Find held messages and their entity ids
- `/check-threat` - Full detail on the detection before you judge it
- `/search-threats` - Sweep detections to find related activity
