---
name: "EOSL Lookup"
description: >
  Single-part and product-family hardware end-of-service-life lookups against the
  public EOSL.ai MCP: reading a lifecycle record (status, end-of-sale date, EOSL
  date, support-runway score, vendor-bulletin URL), the difference between a part
  lookup and a family search, when to escalate a part lookup to the full family
  record, and the mandatory verify-against-the-vendor-bulletin caveat before any
  purchase, renewal, or migration decision.
when_to_use: >-
  When checking the end-of-service-life status of a specific hardware part number,
  model, or product family and you have the identifier in hand. Use when: eosl
  status, end of service life, is this part EOSL, end of sale date, EOSL date,
  support runway, hardware lifecycle date, is this model still supported, EOSL.ai
  lookup, product family lifecycle, or vendor bulletin for a part.
---

# EOSL Lookup

## Overview

EOSL — end-of-service-life — is the date after which a hardware vendor no
longer provides support, updates, or spare parts for a product, regardless
of whether the unit still powers on. It is the hard planning deadline for an
MSP: a switch or array past EOSL is running on borrowed time with no vendor
recourse when it fails. This skill reads EOSL lifecycle records for a
specific part or product family from the **public EOSL.ai service** so a
renewal or migration conversation can start from concrete, sourced dates
rather than guesswork.

This skill sends the part numbers / models you look up to **EOSL.ai, a
third-party service** — see the caveat below before submitting anything
sensitive.

## Anti-triggers

- **Cross-fleet EOL/EOS risk across connected RMMs** — when the question is
  "across the devices in my connected RMM(s), what's aging out," that's a
  discovery-and-rank job over live inventory, not a lookup of a known part;
  use `assets-pack`'s `eol-eos-flagging` skill.
- **Auditing a whole supplied inventory list/CSV** — batching many parts and
  producing a prioritized renewal report is a different workflow; use
  `eosl-hardware-lifecycle-audit`.
- **OS / firmware support windows** — EOSL.ai tracks *hardware* lifecycle.
  Operating-system and firmware end-of-support is general-knowledge
  reasoning; use `assets-pack`'s `eol-eos-flagging` skill.

## Key Concepts

### What an EOSL record contains

Every record EOSL.ai returns carries these fields:

| Field | Meaning |
|-------|---------|
| `status` | Lifecycle state of the part/family (e.g. active, end-of-sale announced, past EOSL) |
| end-of-sale date | Last date the vendor sells the product new — after this, only existing stock/renewals |
| EOSL date | Last date the vendor supports the product — the hard deadline |
| support-runway score | The service's summary score for how much supported life remains |
| vendor-bulletin URL | Link to the vendor's own lifecycle bulletin — the source of record |

The **support-runway score is EOSL.ai's own summary metric**, not a vendor
figure. Use it to sort/triage, not as a date. The two dates and the
vendor-bulletin URL are what a renewal decision actually turns on.

### Part lookup vs. family search

- **Part lookup** (`eosl__lookup_part`) — you have an exact part number or
  model and want its single record. This is the common case.
- **Family search** (`eosl__search_families`) — you have a vendor and a
  series/line but not an exact part (e.g. "Cisco Catalyst 2960-X"), or you
  want every variant's dates at once. Search returns matching families; feed
  a match to `eosl__get_family_lifecycle` for the complete per-model records.

Escalate from a part lookup to a family search when a part isn't found, when
the identifier is partial, or when the client owns a mix of models in the
same line and you want them all in one pass.

### The vendor-bulletin caveat — always attach it

EOSL.ai is a **new, anonymously-operated third-party aggregator**, and the
service itself says to confirm critical dates against the linked vendor
bulletin. Never present an EOSL or end-of-sale date from this service as
final. Attach, every time, that the date should be verified against the
**vendor bulletin linked in the record** before it is used to justify a
purchase, a renewal, or a migration deadline in front of a client. Vendors
revise lifecycle dates, publish extended-support options, and correct
aggregator errors — the bulletin is the source of record, EOSL.ai is a
convenience layer over it.

## Common Workflows

### Single part

1. Call `eosl__lookup_part` with the part number / model.
2. Read back `status`, end-of-sale date, EOSL date, support-runway score,
   and the vendor-bulletin URL.
3. Present the dates **with the vendor-bulletin URL and the verify caveat**.
4. If the part isn't found, fall back to a family search (below) using the
   vendor + series rather than guessing a date.

### Product family

1. Call `eosl__search_families` with the vendor and series/line.
2. If one family matches, call `eosl__get_family_lifecycle` for the full
   per-model records; if several match, confirm which line the client owns
   before pulling.
3. Present each model's dates, score, and bulletin URL — caveated.
4. Use `eosl__list_vendors` first only if you're unsure the service covers
   the vendor at all.

## Error Handling

### Part / family not found

Say so plainly — "EOSL.ai has no record for this part" — and offer a family
search on the vendor + series. Do not synthesize a date from the model name;
an absent record is not evidence the product is current.

### Vendor not covered

If `eosl__list_vendors` doesn't list the vendor, report that EOSL.ai has no
coverage for it and fall back to the vendor's own lifecycle page. Don't
present a "no data" result as "no EOSL risk."

### Record present but dates blank / disputed

Report the fields that are populated, flag the blank ones as unknown rather
than inferred, and point at the vendor-bulletin URL for the authoritative
figure. A blank EOSL date is "unknown," never "no EOSL."

## Related Skills

- [Hardware Lifecycle Audit](../hardware-lifecycle-audit/SKILL.md) — batch a
  whole supplied inventory through the bulk-check tool into a prioritized
  renewal report
- [PSA Lifecycle Audit](../psa-lifecycle-audit/SKILL.md) — wire these lookups
  to PSA asset/configuration data for renewal flagging
