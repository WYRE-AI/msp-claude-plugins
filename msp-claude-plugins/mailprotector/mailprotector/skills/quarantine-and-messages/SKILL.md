---
name: "Mailprotector Quarantine & Messages"
description: >
  Quarantine triage across all five scopes (reseller/customer/domain/
  user_group/user): message fields (`quarantine_type`, `decision`, `score`,
  scoring `results`), releasing a single message via `/deliver`, bulk
  release via `/deliver_many` with its silent scope-mismatch skip and the
  `all_selected` release-everything switch, and the release permission
  flags in configuration.
when_to_use: >-
  When reviewing or releasing quarantined Mailprotector messages. Use when:
  mailprotector quarantine, quarantined message, release message, deliver
  many, false positive, spam quarantine, held email mailprotector, message
  triage, quarantine_type, cloudfilter quarantine.
---

# Mailprotector Quarantine & Messages

## Overview

CloudFilter quarantines inbound mail it classifies as spam, policy
violations, or viruses. The quarantine is readable at any level of the
hierarchy — from one user's held mail up to the entire reseller — and
releasing a message delivers it to its recipients.

## Key Concepts

| Field | Detail |
|-------|--------|
| `quarantine_type` | Why it is held: `spam`, `policy`, or `virus` |
| `decision` | The filter verdict, e.g. `quarantine_spam`, `quarantine_policy` |
| `score.score` | Aggregate spam score; higher = more confident spam (1000 = certain) |
| `results[]` | The scoring tests that fired: `{id, mode, title, description, weight}` |
| `direction` | `inbound` / `outbound` |
| `address` / `recipients` | The quarantining mailbox and full recipient list |
| `id` vs `uuid` | Numeric `id` is what release calls take |

`results` is the triage evidence: entries like "No Reverse DNS"
(weight 40) or "Exploits Block List" (weight 200) sum toward the score.
A message held only by low-weight reputation tests from a known partner
domain reads like a false positive; XBL/RBL hits and high-weight tests
do not. `POST /results` with `{"code": "no_rdns", "mode": "inbound"}`
looks up a test by its `results_data` code from the logs.

## Common Workflows

### Listing (one tool, five scopes)

`mailprotector_messages_list` with `scope`
(`reseller|customer|domain|user_group|user`) and `scope_id` (defaults to
the bound reseller at reseller scope). Underlying endpoints:
`GET /{resellers|customers|domains|user_groups|users}/{id}/messages`.

- A scope's listing includes everything beneath it — reseller scope is
  the whole book of business.
- **Max page size is 50**; paginate with `page` until a short page.
- Filter with field query params to keep result sets reviewable.

### Releasing one message

`mailprotector_messages_release` →
`POST /messages/{message_id}/deliver` with

```json
{"include_original_recipients": 1, "recipients": "extra@domain.com"}
```

Returns **204 with an empty body** on success. `recipients` (optional,
comma-separated) adds addresses beyond the originals. Release is a
delivery — once released, the message is in the recipient's inbox and
cannot be recalled.

### Releasing many

`mailprotector_messages_release_many` →
`POST /{scope}/{scope_id}/messages/deliver_many` with

```json
{
  "include_original_recipients": 1,
  "all_selected": "false",
  "ids": "2015573567,2015573173"
}
```

Returns `{"delivered_messages": [ ... ]}` — the IDs actually released.

- `ids` is a **comma-separated string**, not an array.
- IDs that don't belong under the scope entity are **silently skipped**;
  always diff `delivered_messages` against what you sent and report any
  shortfall.
- `all_selected: "true"` releases **every** held message in the scope's
  quarantine and ignores `ids`. At reseller scope that is the entire
  client base — never use it without an explicit, scoped instruction.

### Triage workflow

1. List at the narrowest scope that answers the question (a user
   complaint → user scope; a "we're missing mail" ticket → domain).
2. For each candidate, weigh `quarantine_type`, `score`, and the fired
   `results` — never release on subject line alone.
3. Check the scope's configuration permission flags (below) before
   promising a release.
4. Release, verify via the 204 / `delivered_messages` response, and
   report exactly which IDs were delivered.
5. For repeat false positives from the same sender, propose an allow
   rule at the narrowest sufficient scope (see
   [allow-block-rules](../allow-block-rules/SKILL.md)) instead of
   releasing the same sender weekly.

## Gotchas

- **Release permissions live in configuration.**
  `permissions.messages.allow_spam_release`, `allow_policy_release`, and
  `allow_virus_release` (readable via `mailprotector_configuration_get`
  at reseller/customer/domain/user_group scope) gate what can be
  released. `allow_virus_release` is commonly `false` — treat a refused
  virus release as the control working, not an error to route around.
- **Silent skips in `deliver_many`** are the bulk-release trap: a wrong
  `scope_id` looks like success with an empty `delivered_messages`.
- **Quarantine listings are PII in bulk** — sender, recipients, and
  subject for every held message. At reseller scope that is every
  customer's mail metadata; scope down before pulling.
- **Message bodies are not exposed.** Triage decisions are made on
  metadata and scoring results; say so rather than implying content was
  read.

## Related Skills

- [allow-block-rules](../allow-block-rules/SKILL.md) — durable fix for repeat false positives
- [api-patterns](../api-patterns/SKILL.md) — scope/scope_id and pagination fundamentals
