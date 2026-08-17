---
name: "Checkpoint Avanan Threats"
description: >
  The Checkpoint Harmony Email (Avanan) security-event surface: the event
  type, state, severity and SaaS enums accepted by `hec_query_events`, what a
  detection record does and does not carry, how `availableEventActions`
  governs what you can do next, and phishing, BEC and malware triage built on
  those fields.
when_to_use: >-
  When sweeping for or investigating detections in Checkpoint Harmony Email —
  what the engines caught, how severe, and whether it was acted on. Use when:
  checkpoint threat, avanan threat, harmony email detection, hec_query_events,
  phishing detection, malware email, bec, dlp event, shadow it, malicious url
  click, email threat sweep, or security event triage.
---

# Checkpoint Harmony Email Threat Detection

## Overview

Harmony Email runs several detection engines over mail and SaaS content and
records each verdict as a **security event**. The event is the engine's
finding — type, state, severity, confidence — not the message itself. MSP work
here is sweeping events across a window, judging which are real, and
following the ones that are through to the message.

## Anti-triggers

- **The message behind the detection** — subject, sender, recipients,
  attachments, and the quarantine and restore actions all live on the entity,
  not the event. Use `avanan-quarantine`.
- **Exempting a sender so the engines stop firing** — use
  `avanan-exceptions`.
- **Which id a tool wants, paging, or an auth failure** — use
  `avanan-api-patterns`.
- **Another vendor's detections** — "threat", "BEC", "phishing" and "IOC" are
  shared currency across the email-security stack. Abnormal is
  `abnormal-security-threats`, Proofpoint is `proofpoint-tap`, Mimecast is
  `mimecast-threat-intelligence`, IRONSCALES is `ironscales-incidents`.

## Querying events

`hec_query_events` takes only filters — no required argument, and no `limit`.
Every filter is an array except the dates.

| Argument | Accepts |
|---|---|
| `eventTypes` | see type table |
| `eventStates` | `new`, `detected`, `pending`, `remediated`, `dismissed`, `exception` |
| `severities` | free-form strings, e.g. `Critical`, `High`, `Medium`, `Low` |
| `startDate` / `endDate` | ISO 8601; `endDate` defaults to now |
| `saas` | see platform table |
| `eventIds` | fetch specific events by id |
| `scrollId` | next page cursor |

### Event types

| Value | What fired |
|---|---|
| `phishing` | Credential harvesting, impersonation, deceptive links |
| `malware` | Confirmed malicious attachment or link |
| `suspicious malware` | Probable malware, below the confirmed threshold |
| `dlp` | Outbound or internal content matched a data-loss rule |
| `anomaly` | Behavioural outlier — unusual sender, volume or pattern |
| `shadow_it` | Unsanctioned SaaS application activity |
| `malicious_url` | A malicious link was present in content |
| `malicious_url_click` | A user actually clicked one |
| `alert` | Generic platform alert |

`suspicious malware` contains a space and no underscore, unlike every other
multi-word value. Sending `suspicious_malware` filters to nothing.

There is no separate `bec`, `ato`, `ransomware`, `spear_phishing` or `spam`
type. Business email compromise and targeted phishing arrive as `phishing`;
ransomware arrives as `malware`. Judge those distinctions from the event's
`description` and `confidenceIndicator`, not from the type filter.

### Event states

`new` and `detected` are open; `remediated` means an action completed;
`dismissed` and `exception` mean a human or an exception rule closed it.

**Omitting `eventStates` does not return everything** — it defaults to
`new`/`detected`. A sweep that means to include already-handled events must
name the states explicitly. This is the most common cause of an event
"disappearing" between two queries: it moved to `remediated`.

### SaaS platforms

`email`, `office365_emails`, `office365_onedrive`, `office365_sharepoint`,
`google_mail`, `google_drive`, `slack`, `ms_teams`, `box2`, `dropbox2`.

Box and Dropbox carry a `2` suffix. `email` and `office365_emails` are not
synonyms — a tenant may report under either depending on how it was
onboarded, so a mail-only sweep that names just one can miss the other.

## What an event carries

The query result summarises each event as `eventId`, `type`, `state`,
`severity`, `saas`, `eventCreated`, `description`, `confidenceIndicator` and
`availableActions`. `hec_get_event` adds `entityId`, `customerId`, `data`,
`additionalData` and the `actions` history.

Two fields do most of the work:

- **`entityId`** is the bridge to the message. Almost every investigation goes
  event → `entityId` → `hec_get_email`.
- **`availableEventActions`** tells you what this event will actually accept.
  Read it before attempting an action rather than assuming quarantine is
  available — an event's state constrains what it still offers.

`confidenceIndicator` is the engine's own certainty and is the field to weigh
when deciding whether a detection deserves a human. `severity` is about
potential impact, not certainty — a high-severity, low-confidence phishing
event is exactly the shape of a false positive.

## Triage workflows

### Sweeping a window

1. `hec_query_events` with an explicit `startDate`, the types you care about,
   and — if you want more than open items — explicit `eventStates`.
2. Page with `scrollId` until no cursor comes back. Do not report a count
   before the scroll is exhausted.
3. Sort your attention by `severity` then `confidenceIndicator`.
4. For anything you will act on, `hec_get_event` for the `entityId`.

### Phishing and BEC

Both arrive as `phishing`. The distinguishing evidence is on the entity, not
the event, so pull the message with `hec_get_email` and compare:

- `fromName` against `fromEmail` — a display name matching an executive over
  an unrelated address is the classic BEC signature.
- The sending domain against the tenant's own and its known partners —
  lookalike and typosquatted domains.
- Recipients — finance, payroll and executive assistants concentrated in one
  event indicate targeting rather than a broad campaign.

Scope the campaign with `hec_search_emails` filtered on `fromEmail` or
`senderDomain` over the same window; the event surface will only show you the
detections, not the messages from the same sender that were not flagged.

### Malware

`malware` is confirmed; `suspicious malware` is not. For either, take the
`entityId` and read the entity's `attachments` array for names, MIME types,
sizes and MD5 hashes. Those hashes are what you feed to endpoint and network
controls — this plugin has no threat-intelligence lookup of its own.

### DLP

`dlp` events are usually outbound or internal. Treat the entity payload as
sensitive by construction: for a DLP detection the matched content is the
regulated data itself, so pull it only when the investigation needs it and
keep it out of anything long-lived.

## Gotchas

- **`severities` is not enum-validated.** Any string is accepted, and an
  unrecognised one silently matches nothing rather than erroring. Confirm
  casing against a value the API has actually returned before trusting an
  empty result.
- **`eventIds` and the filter arguments coexist awkwardly.** Pass `eventIds`
  to fetch known events; combining it with type or state filters narrows
  rather than broadens and is rarely what is meant.
- **An empty result is not an all-clear.** A wrong region, a scopeless key or
  a window outside retention all return zero records without an error. See
  `avanan-api-patterns`.
- **Event state is not agent-settable.** `dismissed` and `exception` are
  filterable states, but no tool transitions an event into them. Closing a
  detection as a false positive is a console action, or an exception via
  `avanan-exceptions`.

## Capability gaps

Present in the Harmony Email console, absent from this surface:

- **No IOC extraction tool.** There is no call that returns URLs, domains or
  IPs as a structured indicator set. What exists is the entity's attachment
  metadata and whatever the event's `data` / `additionalData` blobs carry.
- **No timeline tool.** The `actions` array on a full event record is the
  nearest equivalent.
- **No statistics or trend tool.** Counts come from paging a query.
- **No false-positive marking, and no incident object** — no case, status,
  assignee or note anywhere in the surface.

## Related Skills

- [Checkpoint Quarantine](../quarantine/SKILL.md) — the message and the actions
- [Checkpoint Exceptions](../exceptions/SKILL.md) — stopping repeat detections
- [Checkpoint API Patterns](../api-patterns/SKILL.md) — ids, paging, auth
