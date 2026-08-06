---
description: Find messages in Checkpoint Harmony Email by sender, subject, attachment hash or quarantine state
argument-hint: "<saas> <start-date> [end-date] [sender] [subject] [recipient] [quarantined] [attachment-md5]"
arguments: [saas, start-date, end-date, sender, subject, recipient, quarantined, attachment-md5]
---

# Search Quarantine

Locate mail and SaaS entities in Checkpoint Harmony Email & Collaboration (Avanan) with `hec_search_emails`, including messages currently held in quarantine.

This searches **entities** — the things that were scanned. To find out *why* something was held, follow its detection with `/check-threat`.

## Prerequisites

- A working Harmony Email connection (see [README](../README.md) for configuration)
- The connection must resolve to at least one `farm:customer` scope
- Read access to `hec_search_emails`; see [GOVERNANCE.md](../GOVERNANCE.md) for the permission tiers

## Steps

1. **Establish the two mandatory inputs**
   - `saas` (a **single string**, not an array — unlike the events surface) and `startDate`. Both are required. There is no way to search everything.

2. **Express matching as `filters` triples**
   - Each filter is `{ saasAttrName, saasAttrOp, saasAttrValue }`. There is no free-text `query` argument and no `field` argument.

3. **Call `hec_search_emails`**
   ```json
   {
     "saas": "office365_emails",
     "startDate": "2026-07-28T00:00:00Z",
     "filters": [
       { "saasAttrName": "fromEmail", "saasAttrOp": "is",
         "saasAttrValue": "sender@example.com" },
       { "saasAttrName": "isQuarantined", "saasAttrOp": "is",
         "saasAttrValue": true }
     ]
   }
   ```

4. **Page to exhaustion** with the returned `scrollId`. There is no `limit`.

5. **Format results**, stating the platform and window searched.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| saas | string | **Yes** | - | Single platform string — see the platform list |
| start-date | string | **Yes** | - | ISO 8601 |
| end-date | string | No | now | ISO 8601 |
| sender | string | No | - | `fromEmail` filter |
| subject | string | No | - | `subject` filter |
| recipient | string | No | - | `recipients` filter |
| quarantined | boolean | No | - | `isQuarantined` filter |
| attachment-md5 | string | No | - | `attachmentMd5` filter |

### Filter Operators

`is`, `isNot`, `contains`, `notContains`, `startsWith`, `isEmpty`, `isNotEmpty`, `greaterThan`, `lessThan`.

`isEmpty` and `isNotEmpty` take no `saasAttrValue`.

**The operator list has no `or`, and filters do not nest.** Multiple filters combine as AND. An either/or sender search is two calls whose results you merge yourself.

### SaaS Platforms

`email`, `office365_emails`, `office365_onedrive`, `office365_sharepoint`, `google_mail`, `google_drive`, `slack`, `ms_teams`, `box2`, `dropbox2`.

`email` and `office365_emails` are **not** synonyms — a tenant may report under either depending on how it was onboarded. `saas` takes one value per call, so covering both is two searches.

## What This Command Cannot Do

- **No quarantine-reason filter.** Harmony Email exposes no "quarantine reason" field on the entity. The reason is the detection that caused it, which lives on the event — sweep with `/search-threats` and pivot through `entityId`. There is no `PHISHING`/`MALWARE`/`SPAM`/`BEC`/`POLICY`/`BULK` reason enum on this surface.
- **No severity filter.** Severity is an event attribute, not an entity attribute.
- **No free-text search.** All matching goes through `filters` triples on named attributes.
- **No `limit`.** Result size is controlled by paging with `scrollId`.
- **No status filter for released or deleted.** The entity carries two flags — `isQuarantined` and `isRestored` — and both being true means it was held and then delivered. There is no "deleted" state, because this surface has no delete.
- **No body preview.** The payload exposes headers, recipients and attachment metadata, not content.

## Examples

### Everything Currently Held, Last 7 Days

```
/search-quarantine office365_emails "2026-07-28T00:00:00Z" --quarantined true
```

### A Specific Sender

```
/search-quarantine office365_emails "2026-07-01T00:00:00Z" --sender "suspicious@external-domain.com"
```

### Subject Substring

```
/search-quarantine office365_emails "2026-07-01T00:00:00Z" --subject "invoice payment"
```

### A Recipient's Held Mail

```
/search-quarantine office365_emails "2026-07-01T00:00:00Z" --recipient "cfo@example.com" --quarantined true
```

### Blast Radius of a Known Attachment

```
/search-quarantine office365_emails "2026-07-01T00:00:00Z" --attachment-md5 "d41d8cd98f00b204e9800998ecf8427e"
```

## Output

```
4 entities — office365_emails, 2026-07-28T00:00:00Z to now
(scroll exhausted, 1 page)

+------------+-----------------------------+--------------------------+-------------+----------+----------+
| Entity ID  | Subject                     | From                     | Verdict     | Held     | Restored |
+------------+-----------------------------+--------------------------+-------------+----------+----------+
| ent-x9y8z7 | Your DocuSign Document      | noreply@d0cusign.net     | malicious   | yes      | no       |
| ent-p3q4r5 | Invoice #4521 Attached      | billing@unknown-corp.com | malicious   | yes      | no       |
| ent-s6t7u8 | Urgent: Wire Transfer       | ceo@examp1e.com          | malicious   | yes      | no       |
| ent-v9w0x1 | Weekly Newsletter           | news@marketing-blast.com | clean       | yes      | yes      |
+------------+-----------------------------+--------------------------+-------------+----------+----------+

Available actions per entity are on each record — read them before proposing one.

Note: this covers office365_emails only. If the tenant also reports under
"email", run a second search to cover it.

Quick actions:
- Why was it held: /search-threats then /check-threat <event-id>
- Full message record: hec_get_email with the entity id
- Deliver it: /release-quarantine <entity-id>
```

## Error Handling

### No Results

```
No entities found matching criteria.

An empty search is not proof of absence. Check, in order:
- saas — is the tenant reporting under "email" rather than "office365_emails"?
- the window — startDate is mandatory and retention bounds how far back it can reach
- operator choice — "is" is exact; a partial address needs "contains"
- region and farm scope — a key with no farm association returns zero records
  rather than an error
```

### Missing Required Argument

```
Error: hec_search_emails requires both saas and startDate.

There is no "search everything" on this surface. For a message a user
reports from "a while ago", guess a window and widen it — but retention
bounds how far back you can go.
```

### Date Range Too Wide

```
Error: the date range maxes at 90 days.

Split the search into multiple windows and page each to exhaustion.
A single query also returns at most 10,000 results, silently.
```

## Related Commands

- `/search-threats` - Sweep detections to learn why something was held
- `/check-threat` - Full detail for one detection and its message
- `/release-quarantine` - Deliver a held message back to its recipients
