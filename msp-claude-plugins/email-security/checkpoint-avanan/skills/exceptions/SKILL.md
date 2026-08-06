---
name: "Checkpoint Avanan Exceptions"
description: >
  The Checkpoint Harmony Email (Avanan) whitelist and blacklist surface: the
  match fields and matching modes an exception accepts, the defaults that
  widen an entry beyond what was typed, the id mismatch between listing and
  editing, and the standing security consequence of a detection bypass.
when_to_use: >-
  When reading, adding, editing or removing sender exceptions in Checkpoint
  Harmony Email, or auditing accumulated ones. Use when: checkpoint whitelist,
  avanan whitelist, checkpoint blacklist, allow list, block list, sender
  exception, hec_list_exceptions, hec_add_exception, exempt sender, block
  domain, or exception hygiene review.
---

# Checkpoint Harmony Email Exceptions

## Overview

Exceptions are Harmony Email's two standing lists. A **whitelist** entry
exempts matching mail from the detection engines; a **blacklist** entry
condemns it. They are the only configuration surface this plugin can write,
and each entry persists tenant-wide until someone removes it. MSP work here
is adding narrow, justified entries and auditing the ones that accumulated.

## Anti-triggers

- **Policy configuration** — enabling, disabling, tuning or scoping a
  security policy, adjusting engine sensitivity, editing DLP rules or
  impersonation-protection rosters. **No tool in this plugin reaches any of
  it**, and no sibling skill covers it; that work is console-only. Exceptions
  are not policies.
- **Delivering one held message** — a release is a message action, not a list
  entry. Use `checkpoint-avanan-quarantine`.
- **Which policy or engine fired** — use `checkpoint-avanan-threats`.
- **Microsoft 365 tenant policy** — conditional access, transport rules and
  security baselines are not Harmony Email exceptions. Use `cipp-standards`
  or `cipp-mailboxes`.
- **Another vendor's lists** — SpamTitan is `spamtitan-lists`, Mimecast
  managed senders are `mimecast-policies`.

## The four tools

Every call requires `excType`, valued `whitelist` or `blacklist` — including
`hec_list_exceptions`, which lists one list at a time. Auditing both means
two calls.

| Tool | Requires | Notes |
|---|---|---|
| `hec_list_exceptions` | `excType` | Returns the whole list; no paging |
| `hec_add_exception` | `excType` + ≥1 match field | |
| `hec_update_exception` | `excType`, `excId` | Full replace of supplied fields |
| `hec_delete_exception` | `excType`, `excId` | Irreversible |

**The id argument is not the id field you were given.**
`hec_list_exceptions` returns each entry's identifier as `entityId`, but
`hec_update_exception` and `hec_delete_exception` take it as `excId`. Passing
it under the name it arrived with fails schema validation.

`excId` is also unrelated to the `entityId` of a mail entity, despite the
shared field name — an exception id is not a message id.

## Match fields

An add needs at least one of these; a bare `excType` is rejected.

| Field | Matches |
|---|---|
| `senderEmail` | Sender address |
| `senderDomain` | Sender domain |
| `senderName` | Sender display name |
| `recipient` | Recipient address |
| `subject` | Subject line |
| `attachmentMd5` | Attachment MD5 hash |
| `comment` | Free text — not a match field, but the audit trail |

Supplying several narrows the entry: they combine, so `senderEmail` plus
`subject` matches only mail meeting both.

### Matching modes and their defaults

Each mode governs how loosely its field matches, and **the defaults are wider
than most people intend**:

| Mode | Values | Default |
|---|---|---|
| `senderEmailMatching` | `matching`, `contains` | `matching` |
| `senderDomainMatching` | `contains`, `endswith` | `endswith` |
| `subjectMatching` | `matching`, `contains` | `contains` |

`senderDomain` defaults to `endswith`, so `example.com` also exempts
`notexample.com` and `evil-example.com`. Set `senderDomainMatching` to
`contains` only deliberately — it is wider still, not narrower. There is no
exact-match mode for a domain; a truly exact exemption has to be written as a
`senderEmail` entry, or as one `senderDomain` entry per address you accept.

`subject` defaults to `contains`, which makes a short subject exception
alarmingly broad.

### Fields the schema does not advertise

The handler also forwards `linkDomains`, `linkDomainMatching`,
`senderNameMatching`, `recipientMatching`, `ignoringSpfCheck`,
`senderClientIp`, `senderIp` and `actionNeeded` when supplied, but the
published input schema does not declare them. A strict MCP client will strip
them before the call. Treat them as unsupported unless you have confirmed
they survived — check the returned entry rather than assuming.

`ignoringSpfCheck` in particular turns a whitelist entry into a bypass of
sender authentication as well as content inspection.

## Security semantics

A whitelist entry is a **standing detection bypass**, not a note. It exempts
matching mail from the engines that would otherwise catch it, permanently and
tenant-wide, and it is the first thing an attacker wants. Mail spoofing the
exempted sender inherits the exemption — which is why a domain-level entry
with the default `endswith` mode is a materially different object from the
single-sender exemption someone thought they were creating.

Adding one changes no mail flow at the moment it runs, which is exactly why it
reads as harmless. A pattern of agent-created whitelist entries is a signal to
review, not a productivity win.

Deleting an exception is equally consequential in reverse: it re-admits
detection for a sender somebody deliberately exempted. That may be the right
fix, or it may break a customer's mail flow tomorrow. The delete is a POST to
a `/delete/` path and is annotated irreversible — there is no undo and no
soft-delete.

## Auditing accumulated exceptions

`hec_list_exceptions` returns `entityId`, the match fields, `comment`,
`addedBy` and `updateTime` — enough for a hygiene pass without any other call.

1. List both `whitelist` and `blacklist`.
2. Flag entries with an empty `comment` — no recorded justification.
3. Flag `senderDomain` entries where a `senderEmail` would have sufficed, and
   any entry relying on the `endswith` or `contains` defaults.
4. Sort by `updateTime` and flag anything unreviewed beyond the customer's
   agreed interval.
5. Cross-check `addedBy` against current staff — entries from departed
   technicians rarely have a live owner.
6. Produce a review list. Do not delete unilaterally: removal needs the
   technician or customer who can say whether the mail flow still matters.

Narrowing an over-broad entry is `hec_update_exception`, not delete-and-add —
it preserves the id and the `addedBy` history.

## Gotchas

- **No paging, no filtering.** `hec_list_exceptions` returns the entire list
  for one type. On a large tenant that is a large response; there is no
  server-side search.
- **No expiry.** Nothing in the surface sets a review or sunset date. A
  "temporary" exception is permanent unless a human returns to it, so the
  `comment` field is the only place a sunset date can live.
- **Updates replace what they touch.** `hec_update_exception` applies the
  fields you send; re-send the fields you intend to keep rather than assuming
  a partial merge preserves them.
- **`attachmentMd5` is MD5, not SHA-256.** Hashes carried from an EDR or
  threat feed usually need converting or re-sourcing.

## Related Skills

- [Checkpoint Quarantine](../quarantine/SKILL.md) — acting on one message
- [Checkpoint Threats](../threats/SKILL.md) — what the engines caught
- [Checkpoint API Patterns](../api-patterns/SKILL.md) — ids, auth, regions
