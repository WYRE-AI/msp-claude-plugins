---
name: "Inforcer Audit Events"
description: >
  Inforcer's read-only record of changes and activity: searching and
  filtering auditEvents by type and date window (the search is account-wide
  — there is no tenant filter), enumerating the event-type catalog to build
  valid filters, and the continuationToken paging audit searches require.
when_to_use: >-
  When searching Inforcer audit events, or listing the available event types, across the
  managed portfolio. Use when:
  inforcer audit, audit events, auditevents, event types, change history inforcer, who changed
  inforcer, inforcer activity log, or audit search inforcer.
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

## Anti-triggers

- **The Microsoft 365 unified audit log** — this is Inforcer's own
  record of what *it* observed, a much narrower feed than M365's. For
  sign-ins, inbox-rule creation, app consents, or admin operations in
  the tenant, use `cipp-alerts` (`cipp_list_audit_logs`).
- **A security detection or alert to triage** — an audit event is
  history, not a finding. Use `blumira-findings`,
  `huntress-incidents`, or `cipp-alerts`.
- **The current state that drifted** — audit answers *when and by
  whom*; the state itself is `inforcer-baseline-alignment`.

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

### `inforcer_audit_search`

Search the audit event history. Every filter is optional, and they are:
`event_types` (an array of values from the catalog), `date_from` /
`date_to`, `page_size`, and `continuation_token`.

```
inforcer_audit_search(
  event_types=["<from the event-type catalog>"],
  date_from="2024-02-01",
  date_to="2024-02-29"
)
```

Returns event objects describing what occurred, when, and (where the API
exposes it) the actor and target, plus a continuation token for the next
page.

**There is no tenant filter.** The search is account-wide across every
managed tenant — the tool takes no `tenant` argument, unlike the rest of
this plugin's surface. To answer "what changed on *this* tenant", filter by
type and window, then attribute each returned event to a tenant from its own
payload and discard the rest. Budget for that: a narrow per-tenant question
still pulls the whole portfolio's events for the window, so keep windows
tight and page to completion before you filter.

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
types  = inforcer_audit_event_types()              # discover valid types
events = inforcer_audit_search(
            event_types=[types[...]],              # values from the catalog
            date_from="2024-02-01", date_to="2024-02-29")
mine   = [e for e in events if tenant_of(e) == "Acme"]   # filter client-side
```

Discover the event types first so your filter uses real values; an invalid
type quietly returns nothing and looks like "no activity." Page
`continuation_token` to completion before concluding the window is empty —
and before filtering to a tenant, since the tenant you want may only appear
on a later page.

### Drift corroboration

When [baseline-alignment](../baseline-alignment/SKILL.md) shows a tenant has
drifted, search the audit trail around the drift window and pick out the
events belonging to that tenant to find the change(s) that produced it.
Audit gives the *narrative* behind the alignment delta — useful in a report
and in client conversations.

## Caveats

- This surface is **read-only**. You can search and read the audit trail,
  but you cannot create, edit, or delete audit events, and audit events are
  history — they don't let you undo or remediate anything.
- The API is **community-sourced** (no official public docs); the
  `auditEvents` shape, the event-type catalog values, and the exact filter
  parameter names are illustrative and credited to
  [`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity).
  Confirm filter field names against the catalog on first use.
- An empty result is more often a wrong filter (an invalid event type or a
  too-narrow window) than genuine silence — widen and re-check before
  reporting "no activity." The same goes for a tenant that vanishes from a
  client-side filter: confirm you paged the whole window first.
- Page to completion. An un-paged audit search is the easiest way to
  under-report a change window.

## Related Skills

- [tenant-management](../tenant-management/SKILL.md) - the managed-tenant roster you attribute returned events against
- [identity-governance](../identity-governance/SKILL.md) - attribute change events to the identities/roles that made them
- [baseline-alignment](../baseline-alignment/SKILL.md) - the drift the audit trail helps explain
- [api-patterns](../api-patterns/SKILL.md) - envelope, continuationToken pagination, region, and the integer-id gotcha
