---
description: Pull full detail for one Checkpoint Harmony Email detection and the message behind it
argument-hint: "<event-id> [include-entity] [include-related]"
arguments: [event-id, include-entity, include-related]
---

# Check Threat Details

Retrieve the full record for a single security detection in Checkpoint Harmony Email & Collaboration (Avanan), resolve it to the message that triggered it, and optionally scope the surrounding campaign.

Obtain the event id from `/search-threats`.

## Prerequisites

- A working Harmony Email connection (see [README](../README.md) for configuration)
- The connection must resolve to at least one `farm:customer` scope
- Access to `hec_get_event` and `hec_get_email`; see [GOVERNANCE.md](../GOVERNANCE.md) for the permission tiers

## Steps

1. **Fetch the event**
   ```json
   { "eventId": "evt-a1b2c3" }
   ```
   `hec_get_event` returns the query summary fields plus `entityId`, `customerId`, `data`, `additionalData` and the `actions` history.

2. **Read `availableEventActions` before proposing anything**
   - It states what this event will actually accept right now. An event's state constrains its options — do not assume quarantine or restore is still on offer.

3. **Resolve to the message** (default; skip with `--include-entity false`)
   - Take `entityId` from step 1 and call `hec_get_email`:
   ```json
   { "entityId": "ent-x9y8z7" }
   ```
   - This is where sender, recipients, subject, `combinedVerdict` and the `attachments` array live. The event carries the verdict; the entity carries the evidence.

4. **Scope the campaign** (only with `--include-related`)
   - Call `hec_search_emails` filtered on the sender over the same window, to find messages from the same source that were *not* flagged:
   ```json
   {
     "saas": "office365_emails",
     "startDate": "2026-07-28T00:00:00Z",
     "filters": [
       { "saasAttrName": "fromEmail", "saasAttrOp": "is",
         "saasAttrValue": "noreply@d0cusign.net" }
     ]
   }
   ```

5. **Report the disposition** with its justification, and say what remains unknown.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| event-id | string | Yes | - | The `eventId` to retrieve |
| include-entity | boolean | No | true | Resolve `entityId` and pull the full message record |
| include-related | boolean | No | false | Search for other messages from the same sender |

## What This Command Cannot Do

Named here because the surface invites the assumption:

- **No IOC extraction.** There is no call returning URLs, domains or IPs as a structured indicator set. What exists is the entity's attachment metadata (name, MIME type, size, MD5) and whatever the event's `data` / `additionalData` blobs happen to carry. Read those; do not present them as a curated IOC list.
- **No timeline.** There is no per-detection engine timeline. The `actions` array on the full event record is the nearest equivalent, and it records actions taken, not scan stages.
- **No message body or attachment download.** Names, sizes, MIME types and MD5 hashes are exposed; content is not.
- **No SHA-256.** Attachment `MD5` is the only hash the payload carries, despite SHA-256 being the more common currency downstream.
- **No threat-intelligence lookup, no reputation scoring, no sandbox detonation on demand.** Feed the MD5 hashes to your endpoint and network controls; this plugin has no enrichment of its own.
- **No incident object.** No case, status, assignee or note anywhere in this surface. There is nothing to "open an investigation" against.
- **No false-positive marking.** Closing a detection as a false positive is a console action, or an exception — see the `exceptions` skill.

## Examples

### Full Detail

```
/check-threat evt-a1b2c3
```

### Event Record Only

```
/check-threat evt-a1b2c3 --include-entity false
```

### With Campaign Scoping

```
/check-threat evt-a1b2c3 --include-related
```

## Output

```
========================================================
EVENT evt-a1b2c3
========================================================

DETECTION
  Type:            phishing
  State:           new
  Severity:        Critical
  Confidence:      High
  SaaS:            office365_emails
  Created:         2026-07-30T08:45:03Z
  Description:     Credential harvesting page impersonating a document service
  Entity ID:       ent-x9y8z7

AVAILABLE ACTIONS
  quarantine, restore

ACTION HISTORY
  (none — event is untouched)

MESSAGE  (hec_get_email ent-x9y8z7)
  Subject:         Your DocuSign Document is Ready
  From:            noreply@d0cusign.net  ("DocuSign")
  To:              john@example.com
  Received:        2026-07-30T08:45:00Z
  Quarantined:     false
  Restored:        false
  Combined verdict: malicious
  Attachments:     none

ASSESSMENT
  fromName "DocuSign" over an unrelated sending domain, and d0cusign.net is a
  digit-substitution lookalike for docusign.net. Type is phishing with High
  confidence and the entity's combinedVerdict agrees. Not a false positive.

RELATED  (--include-related)
  2 further messages from noreply@d0cusign.net in the same window, neither
  flagged. Both remain deliverable.
    ent-p3q4r5  "Document shared with you"     2026-07-30T08:41Z  quarantined: false
    ent-s6t7u8  "Reminder: signature needed"   2026-07-29T16:02Z  quarantined: false

RECOMMENDED
  1. Quarantine this entity and the two related ones — /release-quarantine
     is the reverse operation if this proves wrong.
  2. Consider a blacklist exception on senderDomain d0cusign.net. Note the
     default senderDomainMatching is "endswith", which is a suffix match —
     set it deliberately.
  3. No IOC set is available from this API. The lookalike domain above is
     the indicator; feed it to your other controls manually.
========================================================
```

## Error Handling

### Event Not Found

```
Error: no event returned for evt-invalid123.

An empty response is not the same as "does not exist" here. Check:
- the id came from hec_query_events, not from an entity search
  (entity ids and event ids are different namespaces)
- the event is within retention
- region and farm scope — a key with no farm association returns zero
  records rather than an error
```

### Entity Not Resolvable

```
Warning: event evt-a1b2c3 has no entityId.

Not every event resolves to a message — shadow_it and some alert events
describe activity rather than mail. Report the event record alone and say
so, rather than searching for a message that was never there.
```

## Related Commands

- `/search-threats` - Sweep detections to find event ids
- `/search-quarantine` - Find messages by sender, subject or quarantine state
- `/release-quarantine` - Deliver a held message back to its recipients
