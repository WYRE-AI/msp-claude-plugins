---
name: "Inforcer Audit Events"
when_to_use: "When searching Inforcer audit events or listing the available event types — reading the read-only change/activity history for a managed tenant or across the portfolio"
description: >
  Use this skill when searching Inforcer audit events and listing the
  available event types — the read-only history of changes and activity
  Inforcer has recorded. Covers searching/filtering auditEvents,
  enumerating the event-type catalog to build valid filters, and the
  continuationToken paging that audit searches require. Read-only.
triggers:
  - inforcer audit
  - audit events
  - auditevents
  - event types
  - change history inforcer
  - who changed inforcer
  - inforcer activity log
  - audit search inforcer
---

# Inforcer Audit Events

Inforcer records an **audit trail** of activity and changes it observes.
This skill covers searching that trail (`auditEvents`) and enumerating the
**event-type catalog** you filter against. It is a **read-only** history
surface — it tells you *what happened and when*, which is the evidence
layer behind a drift or posture report.

Read [api-patterns](../api-patterns/SKILL.md) first for the gateway
headers, the region requirement, the `{success, message, errors, data}`
envelope, and `continuationToken` pagination. Audit searches commonly span
many pages — paging to completion matters more here than almost anywhere
else, because a partial page silently drops events from the window you
think you searched.

## Tools

### `inforcer_audit_event_types`

List the **event-type catalog** — the set of event types Inforcer can
record. Returns the type identifiers/labels you use to filter a search.

```
inforcer_audit_event_types()
```

Pull this first when you need to filter `auditEvents` by type: it tells you
the valid type values rather than guessing. The catalog is also a useful
map of *what kinds of activity* Inforcer tracks at all.

### `inforcer_audit_events_search`

Search the audit event history. Supports filtering — typically by tenant
(integer Client Tenant ID), event type, and a time window — and returns the
matching events.

```
inforcer_audit_events_search(
  clientTenantId=1423,
  eventType="<from the event-type catalog>",
  from="2024-02-01",
  to="2024-02-29"
)
```

Returns event objects describing what occurred, when, and (where the API
exposes it) the actor and target. This is the primary input for "what
changed on this tenant in the last month?" questions.

## What to look for in an audit review

| Pattern | Why it matters |
|---------|----------------|
| Change events that line up with a drift finding | Connects "the tenant drifted" to "here is the change that caused it" |
| Privileged-role or policy changes | Highest blast radius; worth corroborating against identity review |
| A burst of activity around an incident window | Helps reconstruct a timeline for post-incident review |
| No events where you expected some | May indicate a filter mismatch (wrong type or window) rather than genuine quiet |

## Workflow patterns

### Build a valid filter, then search

```
types = inforcer_audit_event_types()               # discover valid types
ctid  = resolve("Acme")                             # integer Client Tenant ID
events = inforcer_audit_events_search(
            clientTenantId=ctid,
            eventType=types[...],                   # a value from the catalog
            from="2024-02-01", to="2024-02-29")
```

Discover the event types first so your filter uses real values; an invalid
type quietly returns nothing and looks like "no activity." Page
`continuationToken` to completion before concluding the window is empty.

### Drift corroboration

When [baseline-alignment](../baseline-alignment/SKILL.md) shows a tenant has
drifted, search `auditEvents` for the same tenant around the drift window to
find the change(s) that produced it. Audit gives the *narrative* behind the
alignment delta — useful in a report and in client conversations.

## Caveats

- This surface is **read-only**. You can search and read the audit trail,
  but you cannot create, edit, or delete audit events, and audit events are
  history — they don't let you undo or remediate anything.
- The API is **community-sourced** (no official public docs); the
  `auditEvents` shape, the event-type catalog values, and the exact filter
  parameter names are illustrative and credited to
  [`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity).
  Confirm filter field names against the catalog on first use.
- Tenant-scoped audit searches use the **integer Client Tenant ID**. An
  empty result is more often a wrong filter (unresolved tenant id, invalid
  event type, or a too-narrow window) than genuine silence — widen and
  re-check before reporting "no activity."
- Page to completion. An un-paged audit search is the easiest way to
  under-report a change window.

## Related Skills

- [tenant-management](../tenant-management/SKILL.md) - resolve a tenant to the integer Client Tenant ID before scoping a search
- [identity-governance](../identity-governance/SKILL.md) - attribute change events to the identities/roles that made them
- [baseline-alignment](../baseline-alignment/SKILL.md) - the drift the audit trail helps explain
- [api-patterns](../api-patterns/SKILL.md) - envelope, continuationToken pagination, region, and the integer-id gotcha
