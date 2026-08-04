---
name: "Quote-to-Close Tracking"
description: >
  The quote-to-close handoff chain — a Pax8/Sherweb/Kaseya Quote Manager
  quote or SalesBuildr proposal, through a PandaDoc document's
  sent/viewed/signed status, to a closed-won CRM deal — and the four distinct
  stall points along it (quote built with no proposal document, proposal sent
  but not opened, viewed but not signed, signed but the CRM deal never marked
  closed-won), including cross-system record matching and what to report when
  only part of the chain is connected.
when_to_use: >-
  When connecting the dots across the full quote lifecycle — from a
  distributor quote or SalesBuildr proposal, through a PandaDoc document, to
  a closed-won CRM deal — to find exactly where a deal has stalled in the
  handoff chain. Use when: quote to close, where is this deal stuck, proposal
  status, quote status, deal not closing, follow up on quote, follow up on
  proposal, PandaDoc status, quote sent but no proposal.
---

# Quote-to-Close Tracking

## Overview

A deal doesn't close in one system — it moves through a chain of handoffs,
and MSP quote-to-close chains stall at the seams between tools far more often
than within any single tool. A rep quotes hardware or licensing in a
distributor or quoting tool, turns that into a client-facing proposal in
PandaDoc, and is supposed to mark the CRM deal closed-won once it's signed.
Any one of those handoffs can silently drop: a quote gets built but nobody
ever sends the proposal, a proposal sits opened-but-unsigned for three weeks,
or — most commonly — a proposal gets signed and the CRM deal just never gets
updated, so it keeps showing as open in every pipeline report.

This skill's job is narrow and specific: given a deal (or a full sweep), walk
the chain and name the exact stage it's stuck at, not just "this deal seems
stale." That distinction matters because the fix is different at every stage
— chasing a rep to build a proposal is a different action than following up
with a client who hasn't opened their inbox.

## Anti-triggers

- **Building or sending the artifact** — creating a quote, generating a
  proposal from a template, or sending a document for signature is each
  tool's own surface; use `pandadoc-documents`, `connectwise-cpq-quotes`,
  `kaseya-quote-manager-quotes`, `salesbuildr-quotes`, or `scalepad-quoter`.
- **One document's status in isolation** — the full status enum and its
  transition errors live in `pandadoc-documents`; this skill uses that status
  only to locate a stall in the chain.

## The quote-to-close chain

```
Quote                Proposal Document              CRM Deal
(Pax8 / Sherweb /     (PandaDoc)                     (HubSpot, or
 Kaseya Quote                                         whatever CRM
 Manager / SalesBuildr)                                is connected)

[quote built] ──────▶ [document created] ──────▶ [deal exists, open]
                       │
                       ├─▶ [sent]
                       │     │
                       │     ├─▶ [viewed]
                       │     │     │
                       │     │     └─▶ [signed] ──────▶ [deal marked
                       │     │                            closed-won]
                       │     │
                       │     └─ (not viewed — stuck here)
                       │
                       └─ (not sent — stuck here)
```

Four distinct stall points, in the order a deal should pass through them:

1. **Quote built, no proposal document yet** — a quote/estimate exists in
   the distributor or quoting tool, but no corresponding PandaDoc document
   has been created. The handoff from quoting to proposal drafting never
   happened.
2. **Proposal sent, not opened** — a PandaDoc document has been sent to the
   recipient but its status has not progressed past `sent` (no `viewed`
   timestamp). The client hasn't engaged with it at all.
3. **Proposal viewed, not signed** — the document shows a `viewed` (or
   multiple `viewed`) event but no `completed`/`signed` status. The client
   opened it and didn't act — the most common place for a deal to go quiet,
   because it looks like progress happened but nothing is actually moving.
4. **Signed, but CRM deal not marked closed-won** — the PandaDoc document
   status is `completed`, but the associated CRM deal is still showing as
   open (or in a pre-closed-won stage). This is a pure data-hygiene stall —
   the sale is done, but pipeline reporting doesn't know it yet, which
   pollutes every pipeline-health read until it's corrected.

## Discovering available tools first

This skill is inherently cross-vendor by construction — it composes across
up to four tool families. Never assume all of them are connected. Before
tracing any chain:

1. Call `conduit__search_tools` to discover which of the following are live
   for this org: a CRM (e.g. `hubspot__*`), a proposal tool
   (`pandadoc__*`), and a quoting/distribution tool (`pax8__*`,
   `sherweb__*`, `salesbuildr__*`, or a Kaseya Quote Manager tool surface).
2. Scope the trace to whatever subset is actually connected — see
   Graceful Degradation below for exactly what to report when a link in the
   chain is missing.
3. Never guess a tool name speculatively; an unrecognized tool call is worse
   than stating a vendor family isn't connected.

## Common Workflows

### Trace a single deal through the chain

1. Discover connected tools (see above).
2. Starting from the CRM deal (or the quote, if entering from that end),
   resolve the linked quote and/or PandaDoc document — match by client/
   company name, deal name, or an explicit cross-reference field if one
   exists (e.g. a PandaDoc document tagged with the CRM deal ID, or a quote
   number referenced in deal notes). If no explicit link exists, match by
   company name and approximate value/date, and say so — this is a
   best-effort match, not a guaranteed one.
3. Pull the quote status, PandaDoc document status (and its status
   timestamps: sent/viewed/completed), and CRM deal stage.
4. Walk the chain in order (quote → document created → sent → viewed →
   signed → CRM closed-won) and report the furthest point reached and the
   date it was reached — that combination identifies both the stall point
   and how long it's been stalled there.

### Sweep for stalled quote-to-close deals

1. Discover connected tools.
2. Pull all open CRM deals, and separately pull all non-terminal PandaDoc
   documents (not yet completed/declined) and open quotes from the
   connected quoting/distribution tool.
3. Match records across systems by client/company name and approximate
   value, flagging ambiguous or unmatched records rather than silently
   dropping them.
4. For each matched chain, classify into one of the four stall points above,
   or "on pace" if the most recent transition happened within a reasonable
   window (default: 5 business days since the last chain event before
   calling it stalled — shorter than the CRM-only 14-day stalled-deal
   threshold from `pipeline-health`, because a proposal that's been sitting
   viewed-not-signed for 5 days is a much hotter signal than a CRM deal with
   no note logged).
5. Report grouped by stall point, ranked by value within each group.

## Graceful Degradation

| Missing / Unavailable | Handling |
|---|---|
| No CRM connected | Report quote and proposal-document status standalone (quote → document chain only); state plainly that closed-won correlation can't be checked without a CRM. |
| No PandaDoc (or other proposal tool) connected | Report quote status and, if a CRM deal exists, its stage — but state that proposal engagement (sent/viewed/signed) can't be assessed. This is the most common partial-coverage case; be explicit about the gap rather than guessing proposal status from deal stage alone. |
| No quoting/distribution tool connected (Pax8/Sherweb/SalesBuildr/Kaseya Quote Manager) | Start the trace from the PandaDoc document or CRM deal instead; note that the upstream quote-built stage can't be verified. |
| Only one of the three families connected | Report what that single system shows and state explicitly that this is a partial view, not a full quote-to-close trace. |
| No explicit cross-reference between systems (matching only by name/value/date) | Say so per match — "matched by company name and approximate value, not a confirmed cross-reference" — rather than presenting a fuzzy match as certain. |
| Multiple quotes or documents for the same deal (revisions) | Use the most recent one for chain status, but note if older un-superseded artifacts exist — an old sent-but-unopened proposal sitting alongside a newer one can itself be a hygiene problem worth flagging. |

## Error Handling

### None of the three tool families connected

State plainly that quote-to-close tracking requires at least one of a CRM,
a proposal tool, or a quoting/distribution tool to be connected, and that
none was found. Do not fabricate a chain.

### Ambiguous match across systems

Flag it for manual review rather than guessing — list the candidate records
and why the match is uncertain (e.g. two open PandaDoc documents for
similarly-named companies).

## Best Practices

- Report the date of the most recent chain event alongside the stall point,
  so staleness within that stall point is visible (a proposal viewed
  yesterday and one viewed three weeks ago are both "viewed, not signed,"
  but very different urgency).

## Related Skills

- [Pipeline Health](../pipeline-health/SKILL.md) — CRM-only stalled-deal
  detection; this skill extends that detection across the proposal and quote
  artifacts sitting outside the CRM
- [Warm Lead Routing](../warm-lead-routing/SKILL.md) — upstream of this
  chain, for leads that haven't yet reached the quoting stage
