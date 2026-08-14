---
name: "Hardware Lifecycle Audit"
description: >
  Auditing a supplied client hardware inventory (list or CSV of part numbers/models)
  against the public EOSL.ai MCP: normalizing the input, batching through the bulk-check
  tool in groups of 200, classifying each item as past-EOSL / approaching-within-window /
  supported / not-found, and producing a prioritized renewal-and-migration report with a
  vendor-bulletin URL per item. Covers the configurable approaching-window (default 12
  months) and the verify-against-vendor-bulletin caveat.
when_to_use: >-
  When you have a list or CSV of hardware part numbers or models and need a prioritized
  end-of-service-life report for renewal or migration planning. Use when: hardware
  inventory audit, EOSL audit, bulk EOSL check, which of these devices are past EOSL,
  hardware refresh report, renewal planning list, migration planning inventory, audit
  this CSV of part numbers, or EOSL report for a client fleet.
---

# Hardware Lifecycle Audit

## Overview

This skill turns a **supplied inventory** — a list or CSV of hardware part
numbers/models a client owns — into a prioritized end-of-service-life report
for renewal and migration planning, using the **public EOSL.ai service**.
The output is ordered for action: what's already past EOSL (replace now),
what crosses EOSL within a planning window (budget this cycle), and what's
supported, each line carrying the vendor-bulletin URL that sources its
dates. It differs from a single lookup by operating over a whole list at
once and by ranking the result rather than reporting one record.

This skill sends **every part number / model in the supplied inventory to
EOSL.ai, a third-party service.** Confirm that's acceptable for the client's
data before running an audit, and see the caveat below.

## Anti-triggers

- **A single known part** — one lookup, with no batching or ranking, is the
  `eosl-lookup` skill.
- **Discovering the inventory from a connected RMM rather than being handed
  it** — pulling live device inventory and grading it by criticality across
  connected tools is `assets-pack`'s `eol-eos-flagging` skill; this skill
  starts from a list you already have.
- **Pulling the inventory from a PSA (Autotask / ConnectWise)** — that's the
  `eosl-psa-lifecycle-audit` workflow, which feeds its pulled asset list into
  this skill.

## Key Concepts

### Input normalization

Inventories arrive messy. Before checking anything:

1. Extract the **part number / model identifier** column — the field EOSL.ai
   matches on. Serial numbers, asset tags, and hostnames are **not**
   lookup keys; don't send them as part numbers.
2. De-duplicate identical models — a fleet of 50 identical laptops is **one**
   EOSL question, not 50. Audit the distinct model, then note the count it
   represents in the report.
3. Keep a count of rows you couldn't resolve to a model identifier and
   surface them as an explicit "un-checkable input" bucket rather than
   dropping them.

### Batching through the bulk tool

EOSL.ai's bulk tool (`eosl__bulk_check`) accepts **up to 200 items per
call**. Split the de-duplicated model list into batches of 200 and call the
tool once per batch; don't loop single `eosl__lookup_part` calls over a large
list when the bulk tool exists. Reassemble the batches before ranking.

### The approaching window

An item is "approaching EOSL" when its EOSL date falls within a lookahead
window measured from today. The **default window is 12 months**; honor a
different window if the caller specifies one (e.g. a 24-month budget
horizon). State the window you used in the report header so the reader knows
what "approaching" meant.

### Classification buckets

| Bucket | Rule |
|--------|------|
| Past EOSL | EOSL date is in the past — replace now |
| Approaching EOSL | EOSL date within the window (default 12 months) — plan/budget this cycle |
| Supported | EOSL date beyond the window, or still active |
| Not found | No EOSL.ai record — report as unknown, never as "supported" |
| Un-checkable input | Row had no usable part/model identifier |

Sort the report past-EOSL first, then approaching (soonest date first),
then the not-found and un-checkable buckets surfaced explicitly — never
dropped, because a device with no record is an open question, not a
clean bill of health.

### The vendor-bulletin caveat — always attach it

EOSL.ai is a **new, anonymously-operated third-party aggregator**. Every
cited date must carry the note that it should be **verified against the
vendor-bulletin URL in that item's record** before it drives a purchase,
renewal, or migration commitment. Put the caveat in the report once,
prominently, and keep the per-item bulletin URLs so the reader can act on it.

## Common Workflow

### Audit a supplied inventory

1. Normalize the input: extract model identifiers, de-duplicate (retain
   counts), set aside un-checkable rows.
2. Batch the distinct models into groups of ≤ 200 and call `eosl__bulk_check`
   per batch. For any model the bulk tool returns no record for, optionally
   retry with `eosl__lookup_part` or a `eosl__search_families` fallback on
   vendor + series before declaring it not-found.
3. Classify each result into the buckets above against the approaching
   window.
4. Emit the prioritized report (shape below), header stating the window used
   and the verify-against-vendor-bulletin caveat, each line carrying its
   vendor-bulletin URL and the count of units it represents.

### Report shape

```
================================================================================
EOSL Hardware Lifecycle Audit — [client / inventory name]
Source: public EOSL.ai service — verify every date against the linked vendor
bulletin before any purchase/renewal/migration. Approaching window: [N] months.
================================================================================

PAST EOSL — REPLACE NOW ([N] models / [M] units)
--------------------------------------------------------------------------------
[Vendor Model]  (x[count])
  status: [status]   end-of-sale: [date]   EOSL: [date]   runway: [score]
  vendor bulletin: [url]

APPROACHING EOSL (within [N] months) ([N] models / [M] units)
--------------------------------------------------------------------------------
[same shape, soonest EOSL date first]

SUPPORTED ([N] models / [M] units)
--------------------------------------------------------------------------------
[same shape]

NOT FOUND IN EOSL.ai ([N] models)  — status unknown, verify with vendor
--------------------------------------------------------------------------------
[model identifiers]

UN-CHECKABLE INPUT ([N] rows)  — no usable part/model identifier
--------------------------------------------------------------------------------
[what was supplied]
================================================================================
```

## Error Handling

### Empty or unusable inventory

If no rows resolve to a model identifier, say so and stop — report the
un-checkable rows rather than fabricating an audit.

### Bulk tool returns partial results

If a batch comes back short or errors, retry that batch; if it still fails,
report the affected models under a "could not check" note rather than
silently dropping them from the totals.

### Large fraction not found

If many models return no record, say plainly that EOSL.ai's coverage is
incomplete for this inventory and recommend confirming the not-found items
against vendor bulletins directly — don't let a coverage gap read as "these
are fine."

## Related Skills

- [EOSL Lookup](../lookup/SKILL.md) — single-part and family lookups; the
  fallback path for models the bulk tool misses
- [PSA Lifecycle Audit](../psa-lifecycle-audit/SKILL.md) — pulls the
  inventory from a PSA and feeds it into this audit
