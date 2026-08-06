---
name: "Checkpoint Avanan API Patterns"
description: >
  Shape of the Checkpoint Harmony Email (Avanan) `hec_*` tool surface: the
  thirteen tools and what each reaches, the event/entity split that governs
  which tool accepts which id, the `responseEnvelope`/`responseData` result
  shape, `scrollId` pagination, and the auth, regional-routing and
  farm-scope behaviour behind every call.
when_to_use: >-
  When orienting in the Harmony Email tool surface, choosing between the event
  and entity tools, paging a large result set, or reading an authentication,
  region or scope failure. Use when: checkpoint api, avanan api, hec api,
  harmony email api, checkpoint authentication, checkpoint region, hec scopes,
  scrollId, avanan pagination, or an `HEC API error (...)` message.
---

# Checkpoint Harmony Email API Patterns

## Overview

Harmony Email & Collaboration (formerly Avanan) sits alongside Microsoft 365
and Google Workspace via API rather than in the mail path. MSPs use it to
review what the detection engines caught, pull the message behind a
detection, quarantine or restore mail, and maintain the sender exception
lists. Every call in this plugin goes through the Conduit gateway to the
Harmony Email Smart API v1.50.

## Anti-triggers

- **`avanan_*` tool names** — a separate `avanan-legacy-mcp` server serves
  MSP-partner, tenant and licence management under `avanan_*` names
  (`avanan_create_tenant`, `avanan_assign_license`). None of them reach
  quarantine, events or exceptions. This vendor's security surface is
  `hec_*` only; if you want tenant or licence administration, that is the
  legacy server, not this plugin.
- **Detection records and their verdicts** — use `checkpoint-avanan-threats`.
- **Finding or acting on the message itself** — use
  `checkpoint-avanan-quarantine`.
- **Sender allow/block entries** — use `checkpoint-avanan-exceptions`.
- **Another vendor's auth** — "client id and secret against a regional
  gateway" describes most of the email-security stack. Mimecast is
  `mimecast-api-patterns`, Proofpoint is `proofpoint-api-patterns`.

## The tool surface

Thirteen tools, all prefixed `hec_`.

| Tool | Reaches | Required args |
|---|---|---|
| `hec_query_events` | Detection records, filtered | — |
| `hec_get_event` | One detection record | `eventId` |
| `hec_search_emails` | Mail/SaaS entities, filtered | `saas`, `startDate` |
| `hec_get_email` | One entity, full payload | `entityId` |
| `hec_quarantine_events` | Quarantine by event id | `eventIds` |
| `hec_restore_events` | Restore by event id | `eventIds` |
| `hec_quarantine_emails` | Quarantine by entity id | `entityIds` |
| `hec_restore_emails` | Restore by entity id | `entityIds` |
| `hec_get_task_status` | Progress of an action | `taskId` |
| `hec_list_exceptions` | Whitelist or blacklist | `excType` |
| `hec_add_exception` | New list entry | `excType` |
| `hec_update_exception` | Edit a list entry | `excType`, `excId` |
| `hec_delete_exception` | Remove a list entry | `excType`, `excId` |

There is no policy surface, no reporting or statistics surface, and no
incident object. See [Capability gaps](#capability-gaps).

## Events and entities are two id namespaces

This is the distinction that determines every tool choice, and getting it
wrong produces a not-found error that reads like a stale id.

- An **event** is a detection: an engine's verdict, with a type, state,
  severity and confidence. Its id is `eventId`.
- An **entity** is the object that was scanned — usually the email itself,
  with subject, sender, recipients, attachments and body. Its id is
  `entityId`.

They are related but not interchangeable. `hec_get_event` will not accept an
`entityId`, and `hec_quarantine_emails` will not accept an `eventId`. The
bridge is the `entityId` field carried **on the event record**: read an event,
take its `entityId`, then call `hec_get_email` to see the message the
detection was about.

Both action endpoints exist in parallel for the same reason —
`hec_quarantine_events` posts event ids, `hec_quarantine_emails` posts entity
ids, and they resolve to the same underlying mail action. Use whichever id
you already hold rather than converting between them.

## Result shape and pagination

Every tool returns the same envelope beneath the formatted text:

```json
{
  "responseEnvelope": {
    "requestId": "…",
    "responseCode": 0,
    "responseText": "…",
    "recordsNumber": 237,
    "scrollId": "…"
  },
  "responseData": [ … ]
}
```

`recordsNumber` is the envelope's own count; when it is absent the page length
is the only figure available. Do not read it as a page size, and do not report
it as a total until the scroll is exhausted.

Pagination is **scroll-based, not offset-based**. There is no `limit`, `offset`,
`page` or `sortBy` parameter anywhere in the surface. When a result carries a
`scrollId`, pass it back as the `scrollId` argument on the *same* tool with
the *same* filters to get the next page; a response with no `scrollId` is the
last page. Changing the filters mid-scroll invalidates the cursor.

Only `hec_query_events` and `hec_search_emails` paginate. The exception,
action and get-by-id tools return complete results.

## Auth, region and scopes

Handled for you by the gateway, but the failure modes surface as tool errors,
so the shape matters. Full request detail is in
[references/http-api.md](references/http-api.md).

**Authentication** posts `clientId` and `accessKey` — not `client_secret` — and
returns a JWT. Tokens are short-lived (the API reports `expiresIn`, defaulting
to 1800 seconds) and are refreshed transparently.

**Region is decoded from the token, not configured.** The auth call always goes
to the EU host; the returned JWT carries a `region` claim (`eu`, `us`, `au`,
`in`) that selects the host every subsequent data call uses. A tenant's
credentials therefore work from anywhere — you do not pick a region — but a
credential whose region claim is wrong sends data calls to a host that holds
no data for it.

**Scopes are `farm:customer` pairs**, e.g. `mt-prod-cp-eu-1:examplecorp`. A key
may hold one or several. With one scope the API infers it; with several,
scopes are injected into the request automatically. A key that returns an
empty scope string has no farm association at all and every data call will
come back empty — that is a provisioning problem at Checkpoint, not a query
problem.

## Gotchas

- **Empty results are the default failure mode.** A wrong region, a scopeless
  key, or a date range outside retention all return a well-formed response
  with zero records rather than an error. Before concluding "no threats
  found", confirm the query returned a non-zero `recordsNumber` on some
  broader window.
- **Errors carry the vendor's text, not an error code.** Failures surface as
  `HEC API error (<status>): <responseText>` — the API's own prose from
  `responseEnvelope.responseText`. There is no stable machine-readable error
  code catalogue to switch on; read the text.
- **A 401 is as likely to be a region or scope problem as a bad credential.**
  Rotating a working credential is a common wrong response to it.
- **Requests time out at 30 seconds.** A wide `hec_search_emails` over a long
  window can exceed it. Narrow the window rather than retrying identically.
- **Every date is ISO 8601 and is interpreted as UTC.** Passing a local-time
  string without an offset silently shifts the window.

## Capability gaps

The tool surface is smaller than the Harmony Email console. Nothing here
reaches:

- **Policies** — no tool lists, enables, disables or edits a security policy.
  Policy work is console-only.
- **Incidents** — there is no incident object, status, assignee or note.
  Do not attempt to open, update or close one.
- **Reporting** — no statistics, trend or aggregation tool. Counts must be
  derived by paging a query.
- **Message bodies and attachment content** — `hec_get_email` returns the
  entity payload including attachment names, sizes and MD5 hashes, but not
  the file itself.

## Related Skills

- [Checkpoint Threats](../threats/SKILL.md) — the event surface
- [Checkpoint Quarantine](../quarantine/SKILL.md) — the entity and action surface
- [Checkpoint Exceptions](../exceptions/SKILL.md) — whitelist and blacklist
