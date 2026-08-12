---
name: "PSA Lifecycle Audit Workflow"
description: >
  A documented workflow that wires PSA asset/configuration data (Autotask, ConnectWise
  PSA) to EOSL.ai hardware-lifecycle data: pull a client's configuration items from the
  PSA, extract their part numbers/models, run the EOSL hardware-lifecycle audit, and flag
  renewals back for the account team. Defines the integration points and marks the
  PSA-pull step as a stub to wire against your connected PSA — it does not hardcode PSA
  API calls.
when_to_use: >-
  When you want an end-of-service-life renewal sweep sourced from a client's PSA asset
  records rather than a hand-supplied list. Use when: PSA hardware EOSL audit, pull
  configuration items and check EOSL, Autotask asset lifecycle audit, ConnectWise
  configuration EOSL, renewal flagging from PSA assets, or connect PSA inventory to
  EOSL.ai.
---

# PSA Lifecycle Audit Workflow

## Overview

This is a **workflow scaffold**, not a self-contained tool. It composes two
sides that already exist: a **PSA** (Autotask or ConnectWise PSA) that holds
the client's asset / configuration-item records, and the **public EOSL.ai
service** that returns hardware end-of-service-life dates. The workflow pulls
configuration items from the PSA, extracts their part numbers/models, runs
the EOSL hardware-lifecycle audit over them, and flags renewals for the
account team — closing the loop from "what the client owns, per the PSA" to
"what's aging out, per EOSL.ai."

The **PSA-pull step is deliberately a stub / integration point** (see the
TODO below): the exact tools and field names depend on which PSA plugin you
have connected, and this skill does not invent PSA API calls it cannot
verify. The EOSL side and the flag-back side are fully specified.

This workflow sends the part numbers / models drawn from the client's PSA
records to **EOSL.ai, a third-party service** — confirm that's acceptable for
the client's data before running it.

## Anti-triggers

- **You were handed the inventory as a list/CSV** — skip the PSA pull
  entirely and use `eosl-hardware-lifecycle-audit` directly.
- **A single known part** — use `eosl-lookup`.
- **Cross-RMM fleet EOL/EOS ranking from live device inventory** — that's a
  discovery-and-rank job over connected RMMs, not a PSA-asset pull; use
  `assets-pack`.

## Workflow

### Step 1 — Pull configuration items from the PSA  *(integration point — see TODO)*

The client's owned hardware lives in the PSA as **configuration items /
assets**. Pull them for the target client, then extract the **part
number / model** field from each — that is the only field EOSL.ai matches on
(serial numbers, asset tags, and PSA record ids are not lookup keys).

Which plugin and tools provide this depends on the connected PSA:

- **Autotask** — configuration items and their fields are covered by the
  `autotask` plugin's `autotask-configuration-items` skill. Discover that
  plugin's actual tools and use its documented configuration-item query;
  extract the model/part field it exposes.
- **ConnectWise PSA** — configurations are covered by the `connectwise-psa`
  plugin; its `connectwise-psa-lookup-config` command resolves a client's
  configuration records. Discover that plugin's tools and extract the
  model/part field.

> **TODO / STUB — wire this to your connected PSA.** Do **not** hardcode a
> PSA request here. The concrete tool names and the exact field that holds
> the manufacturer part/model vary by PSA (and by how the client populates
> their asset records). Before running this workflow in anger:
> 1. Confirm which PSA plugin is connected and discover its real tools.
> 2. Identify the configuration-item field that holds a **manufacturer part
>    number or model** usable as an EOSL.ai lookup key — not the serial,
>    asset tag, or PSA id.
> 3. Verify a small sample pulls the field you expect before trusting a
>    full-client pull.
>
> If no reliable part/model field exists in the PSA records, say so and fall
> back to a hand-supplied inventory (`eosl-hardware-lifecycle-audit`) rather
> than guessing models from descriptions.

### Step 2 — Run the EOSL hardware-lifecycle audit

Feed the extracted, de-duplicated part/model list into the
`eosl-hardware-lifecycle-audit` skill: it batches through EOSL.ai's
`eosl__bulk_check` tool (≤ 200 per call), classifies each item as past-EOSL /
approaching-within-window (default 12 months) / supported / not-found, and
attaches the vendor-bulletin URL per item. Everything about batching,
windowing, and the mandatory verify-against-vendor-bulletin caveat is
governed by that skill — don't reimplement it here.

### Step 3 — Flag renewals back for the account team

Turn the audit into an actionable flag list, joined back to the PSA records
so each flagged item is traceable to a client asset:

1. **Past EOSL** → renewal/replacement candidates for this budget cycle;
   pair each with the PSA configuration-item it came from.
2. **Approaching EOSL** → watch-list for the next planning conversation,
   ordered by soonest EOSL date.
3. Carry the **vendor-bulletin URL** and the verify caveat through to the
   flag list — the account team should confirm dates against the bulletin
   before quoting a renewal.

How the flag is delivered (a note back on the PSA configuration item, a
ticket, a summary to the account manager) is an org choice; if you write
anything back to the PSA, that is a separate mutating action — confirm the
target PSA plugin actually supports it and that a write is wanted before
doing so. This skill's job ends at producing the flagged, sourced list.

## Assumptions and limits

- **No PSA API is hardcoded.** Step 1 is intentionally a stub; the workflow
  is only as reliable as the part/model field in the client's PSA records.
- **EOSL.ai coverage is partial and unofficial.** Not-found PSA assets are
  unknowns to resolve against vendor bulletins, not clean results.
- **Read-oriented by default.** Steps 1–3 read PSA data and read EOSL.ai;
  writing flags back to the PSA is an explicit, separate, opt-in action.

## Related Skills

- [Hardware Lifecycle Audit](../hardware-lifecycle-audit/SKILL.md) — Step 2's
  engine; the batching/classification/caveat logic lives there
- [EOSL Lookup](../lookup/SKILL.md) — single-part fallback for models the
  bulk audit misses
