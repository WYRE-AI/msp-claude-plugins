---
name: "Checkpoint Avanan Quarantine"
description: >
  Finding and acting on mail in Checkpoint Harmony Email (Avanan): the
  `hec_search_emails` attribute-filter syntax, what an entity payload carries,
  the asynchronous quarantine and restore actions and their task polling, and
  the judgement a restore requires because delivery cannot be undone.
when_to_use: >-
  When locating a specific message, checking whether it was held, or
  quarantining or releasing mail in Checkpoint Harmony Email. Use when:
  checkpoint quarantine, avanan quarantine, quarantined email, release
  quarantine, restore email, hec_search_emails, hec_quarantine_emails, email
  held, false positive email, missing email, or blast-radius search.
---

# Checkpoint Harmony Email Quarantine and Message Actions

## Overview

Where an event is a verdict, an **entity** is the thing that was scanned —
usually the email, with its subject, sender, recipients and attachments.
Quarantine and restore operate on entities. Day-to-day MSP work here is
finding a message a user says is missing, judging whether the detection was
right, and either leaving it held or delivering it.

## Anti-triggers

- **Why the message was flagged** — the engine verdict, type, severity and
  confidence are on the detection record. Use `checkpoint-avanan-threats`.
- **Stopping a sender being flagged again** — a release delivers one message
  and changes nothing standing. Sender allow entries are
  `checkpoint-avanan-exceptions`.
- **Search-and-destroy in a delivered mailbox on another stack** — Proofpoint
  TRAP is `proofpoint-forensics`; Microsoft 365 mailbox operations are
  `cipp-mailboxes`.
- **Another vendor's quarantine** — "release from quarantine" is shared
  vocabulary. Proofpoint is `proofpoint-quarantine`, SpamTitan is
  `spamtitan-quarantine`, Mimecast calls it the held queue
  (`mimecast-queue-management`), Abnormal is `abnormal-security-cases`.

## Finding a message

`hec_search_emails` requires **`saas` and `startDate`**. `saas` here is a
single string, not an array — unlike the events surface, which takes a list.
Everything else is optional.

Attribute matching goes in `filters`, an array of triples:

```json
{
  "saas": "office365_emails",
  "startDate": "2026-07-01T00:00:00Z",
  "filters": [
    { "saasAttrName": "fromEmail", "saasAttrOp": "is",
      "saasAttrValue": "sender@example.com" },
    { "saasAttrName": "isQuarantined", "saasAttrOp": "is",
      "saasAttrValue": true }
  ]
}
```

Operators: `is`, `isNot`, `contains`, `notContains`, `startsWith`, `isEmpty`,
`isNotEmpty`, `greaterThan`, `lessThan`. `isEmpty` and `isNotEmpty` take no
`saasAttrValue`.

Useful attribute names: `fromEmail`, `subject`, `recipients`,
`isQuarantined`, `attachmentMd5`.

There is no free-text `query` argument and no `field` argument — all matching
is through this structure. The operator list has no `or` and filters do not
nest, so an either/or sender search is two calls whose results you merge.

## What an entity carries

The search result summarises each hit as `entityId`, `saas`, `entityCreated`,
`subject`, `from`, `to`, `isQuarantined`, `isRestored`, `verdict` and
`availableActions`. `hec_get_email` returns the full record:

- **`entityPayload`** — `internetMessageId`, `subject`, `received`,
  `fromEmail`, `fromName`, `to`, `cc`, `recipients`, `attachmentCount`, and
  `attachments` with each file's `name`, `mimetype`, `size` and `MD5`.
- **`entitySecurityResult.combinedVerdict`** — the engines' combined judgement.
- **`entityAvailableActions`** — what this entity will accept right now.
- **`isQuarantined` / `isRestored`** — the two flags that answer "where is
  this message". Both true means it was held and then delivered.

Attachment `MD5` is the hash the payload exposes; there is no SHA-256 field
here despite SHA-256 being the more common currency downstream.

## Acting on mail

Four tools, two operations, two id namespaces:

| Tool | Takes |
|---|---|
| `hec_quarantine_emails` | `entityIds`, optional `entityType` (default `email`) |
| `hec_restore_emails` | `entityIds`, optional `entityType` |
| `hec_quarantine_events` | `eventIds` |
| `hec_restore_events` | `eventIds` |

Use whichever id you already hold. They reach the same underlying action.

### Actions are asynchronous

None of the four completes inline. Each returns one **`taskId` per entity**,
and the call returning successfully means the work was accepted, not done.
Poll each with `hec_get_task_status`. An agent that reports "released" off the
back of the action call alone is reporting an intention.

### Restore is the sharp one

Restoring delivers a message the security stack judged malicious into a real
person's inbox, and there is no un-deliver. When the detection was malware or
BEC, an erroneous restore is precisely the outcome the product exists to
prevent.

Note the asymmetry in how the tools are annotated: the two quarantine tools
carry `destructiveHint: true` and prompt for confirmation, while **the restore
tools carry no annotations at all**. A client that gates on `destructiveHint`
will therefore wave restores through and stop on quarantines — the opposite of
the risk ordering. Require a human on restores explicitly; do not rely on the
tool metadata to ask.

Before any restore, confirm the sender with the customer out of band, read
the entity's `combinedVerdict` rather than the summary alone, and check
whether other recipients received the same message.

## Reading a quarantine decision

Harmony Email does not expose a "quarantine reason" field. The reason is the
detection that caused it, so the mapping runs through the event type:

| Detection | Release posture |
|---|---|
| `malware` | Do not release. Escalate. |
| `suspicious malware` | Do not release without sandbox or hash corroboration. |
| `phishing` (incl. BEC) | Release only after out-of-band sender confirmation. |
| `dlp` | Outbound. Release is a data-handling decision, not a security one — it needs the data owner, not the helpdesk. |
| `anomaly` | Usually a genuine sender behaving unusually. Highest release rate. |
| `malicious_url` | Check whether the link is still live before judging. |

A `malicious_url_click` event means a user already reached the destination.
Releasing or holding the message is then secondary to credential response.

## Gotchas

- **Batches are not transactional.** The tool schema sets only `minItems: 1`
  with no upper bound, but the API caps a single action call (GOVERNANCE.md
  records 100 entities). Splitting a large action into batches performs
  several independent irreversible operations; a failure partway leaves a
  mixed state with nothing to roll back. Poll every `taskId`, not just the
  last.
- **`startDate` is mandatory, so "search everything" is impossible.** A user
  reporting a message from "a while ago" needs a window guessed and widened,
  and retention bounds how far back that can go.
- **Quarantine expiry is a hard deletion.** Entries age out after the
  tenant's retention period (30 days by default) and cannot be recovered.
  There is no tool that reads or extends retention; the only documented
  workaround — release and re-quarantine — means briefly delivering the
  message.
- **An empty search is not proof of absence.** Wrong `saas` value, wrong
  region, or a window that misses the message all return zero records
  without an error.

## Capability gaps

- **No delete.** The surface has quarantine and restore only. There is no way
  to permanently delete a held message; that is a console action.
- **No release-with-allow-list.** Releasing and creating a sender exception
  are two separate operations against two different tools.
- **No message body or attachment download.** Names, sizes, MIME types and
  MD5 hashes are exposed; the content is not.
- **No notification.** Nothing here tells a recipient their mail was held or
  released.

## Related Skills

- [Checkpoint Threats](../threats/SKILL.md) — why it was held
- [Checkpoint Exceptions](../exceptions/SKILL.md) — stopping it recurring
- [Checkpoint API Patterns](../api-patterns/SKILL.md) — ids, paging, auth
