# Sales & Deal Desk (`sales-pack`)

The sales motion end to end: pipeline health, quote-to-close tracking,
proposal follow-up, and warm-lead routing — cross-vendor, wired to whatever
CRM, proposal, distribution, and scheduling tools you have connected through
the WYRE MCP Gateway / [Conduit](https://conduit.wyre.ai).

This is a **workflow pack**, not a vendor plugin: it doesn't teach any single
tool's API in depth. It bundles the judgment layer — stall diagnosis, warmth
scoring, follow-up drafting — on top of whatever HubSpot, PandaDoc, Pax8/
Sherweb, Calendly, and/or SalesBuildr/Kaseya Quote Manager data your
connected tools return. It is distinct from finance-pack, which covers
billing and reconciliation *after* a sale closes; this pack covers the sale
itself, from lead through signed quote to a correctly-closed CRM deal.

## What it needs connected

| Category | Required? | Vendors |
|---|---|---|
| CRM | Recommended (required for most of this pack's output) | HubSpot |
| Proposal tool | Optional — needed for quote-to-close handoff tracking and proposal follow-up | PandaDoc |
| Quoting / distribution | Optional — needed for the upstream end of the quote-to-close chain | Pax8, Sherweb, SalesBuildr, or Kaseya Quote Manager |
| Scheduling | Optional — strengthens warm-lead scoring | Calendly |
| Intent signals | Optional — strengthens warm-lead scoring | Warmly |

Every skill, agent, and command in this pack discovers what's actually
connected via `conduit__search_tools` before running — it never assumes a
fixed vendor stack. Most of the pack works with partial coverage: a CRM
alone still produces a pipeline-health read and a coarser warm-lead score;
adding PandaDoc and a quoting tool unlocks the full quote-to-close chain
diagnosis; adding Warmly and Calendly sharpens lead-warmth precision. The
pack reports "unable to verify" per missing connector rather than silently
narrowing its output or guessing.

## What's included

**Skills**
- `pipeline-health` — CRM pipeline stage-velocity norms, stalled-deal
  detection, and pipeline coverage ratio, with graceful degradation if no
  CRM is connected
- `quote-to-close-tracking` — traces a deal across quote → PandaDoc proposal
  → CRM closed-won, naming the exact handoff point a deal is stuck at
- `warm-lead-routing` — scores lead warmth from Warmly/Calendly/CRM intent
  and engagement signals, falling back to CRM-only signals when intent tools
  aren't connected

**Agents**
- `pipeline-auditor` — full cross-vendor pipeline sweep, stalled/at-risk
  deals ranked by value, with the quote-to-close handoff diagnosis baked in
- `proposal-follow-up-tracker` — finds stalled proposals/quotes at each
  handoff stage and drafts a stage-appropriate follow-up action per item
- `warm-lead-router` — proposes a rep-assignment plan for currently-warm
  leads with rationale

**Commands**
- `/sales-pack:pipeline-pulse` — pipeline snapshot: value, stalled count,
  deals closing this period, biggest movers (no arguments)
- `/sales-pack:stalled-deals [window]` — deals/proposals with no forward
  movement within a window, sorted by value (default `14d`)
- `/sales-pack:warm-leads` — currently-warm leads with routing
  recommendations (no arguments)

## How this pack relates to other sales-adjacent tooling in this marketplace

This marketplace already ships several pieces of sales-relevant tooling.
`sales-pack` is written to compose with them, not duplicate them:

- **`hubspot` vendor plugin** (`hubspot/hubspot/`) — deep, single-vendor
  HubSpot API knowledge (deals, contacts, companies, tickets, activities).
  `sales-pack` doesn't reteach HubSpot's API surface; it discovers whichever
  CRM is connected via `conduit__search_tools` and works at the level of
  cross-vendor sales judgment, not vendor-specific API mechanics. For deep
  HubSpot-native work, use the `hubspot` plugin directly.

- **`hubspot/hubspot/agents/pipeline-health-reporter.md`** — a HubSpot-only
  agent that computes stage-conversion funnels, deal-velocity baselines, and
  a weighted revenue forecast, all directly against HubSpot's own
  stage-transition properties. It assumes HubSpot rather than discovering a
  CRM, and it has no visibility outside HubSpot — it cannot tell a genuinely
  dead deal from one that's actually signed in PandaDoc and just never got
  its CRM stage updated. `sales-pack`'s `pipeline-auditor` agent is
  complementary: it discovers whichever CRM is connected (not assumed to be
  HubSpot) and bakes in the quote-to-close handoff trace across PandaDoc and
  the connected quoting tool, so a flagged deal comes with a diagnosis of
  *where* it's stuck, not just a CRM-inactivity flag. A full pipeline review
  often runs both — `pipeline-health-reporter` for HubSpot-native forecast/
  conversion math, `pipeline-auditor` for the full quote-to-close stall
  diagnosis. See `pipeline-auditor.md`'s own documentation for the full
  comparison.

- **`pandadoc` vendor plugin** (`pandadoc/pandadoc/`) — deep, single-vendor
  PandaDoc API knowledge (documents, templates, recipients, proposals).
  `sales-pack`'s `quote-to-close-tracking` skill and
  `proposal-follow-up-tracker` agent use PandaDoc as one link in a larger
  cross-vendor chain, not as a target for template management or document
  authoring — for that, use the `pandadoc` plugin directly.

- **`wyre-gateway/agents/renewal-risk-analyzer.md`** — a portfolio churn-risk
  agent for *existing* clients approaching renewal, scoring risk from PSA
  ticket trends, billing health, and CRM relationship signals. It answers
  "which current clients might not renew." `sales-pack` answers a different
  question — "how is the net-new and expansion sales motion performing right
  now" — and doesn't touch renewal churn risk at all. The two are
  complementary across the client lifecycle: `renewal-risk-analyzer` for
  keeping existing revenue, `sales-pack` for closing new revenue.

- **`finance-pack`** — billing and agreement reconciliation *after* a sale
  closes (PSA contract vs. accounting invoice, license true-up, margin
  analysis). `sales-pack` stops at "the deal closed correctly in the CRM and
  the quote/proposal chain resolved cleanly" — it does not verify billing
  accuracy once the contract exists. See `finance-pack`'s
  `agreement-reconciliation` skill for that next stage.

## Install

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install sales-pack@msp-claude-plugins
```

On first use, Claude Code will prompt to connect the `conduit` MCP server
(`https://conduit.wyre.ai/v1/mcp`). Connect at least a CRM through Conduit
before running any command in this pack — add PandaDoc, a quoting/
distribution tool, Calendly, and/or Warmly to unlock the fuller quote-to-close
and warm-lead-scoring output.

## Related

- [wyre-gateway](../wyre-gateway) — the underlying multi-vendor gateway
  plugin these packs are built on top of
- [finance-pack](../finance-pack) — billing and agreement reconciliation
  after a sale closes
- Individual vendor plugins (`hubspot`, `pandadoc`, `pax8`, `sherweb`,
  `salesbuildr`, `kaseya-quote-manager`, `warmly`) — for deep, single-vendor
  API work this pack deliberately does not duplicate
