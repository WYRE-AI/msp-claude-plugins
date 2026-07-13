---
description: Azure cost and pricing analysis for a subscription — Advisor cost recommendations, retail pricing lookups, and quota-driven right-sizing signals, scoped to one subscription
argument-hint: "<subscription> [detail]"
arguments: [subscription, detail]
---

# Azure Cost Analysis

Produces a read-only cost picture for a single Azure subscription. Suitable for monthly cost reviews, pre-QBR prep, right-sizing investigations, and "why is this subscription expensive?" questions.

This command is **read-only** — it analyzes and recommends; it never changes resources, SKUs, or reservations.

## Arguments

- `subscription` (required) — Azure subscription ID or display name to analyze
- `detail` (optional) — summary (default) — top findings and estimated savings; full — every recommendation and price; executive — client-facing cost summary

## What it does

1. **Scope** — resolve the subscription via the `subscription` namespace; confirm it is `Enabled`.
2. **Advisor cost recommendations** — pull `advisor` recommendations filtered to the **Cost** category, sorted by impact (High first) and estimated annual savings. These are the concrete optimization opportunities: idle resources, underutilized VMs, reservation/savings-plan candidates.
3. **Retail pricing** — for the SKUs implicated in the recommendations (or SKUs the user asks about), look up retail meter rates via the `pricing` namespace to quantify the spread between current and recommended configurations.
4. **Capacity signal** — optionally check `quota` headroom; quotas near their limit hint at over-provisioning or imminent scaling cost.

## Detail levels

- **summary** (default): top cost recommendations, estimated total savings, one-line cost verdict
- **full**: every Advisor cost recommendation with affected resources, plus the retail price for each relevant SKU
- **executive**: plain-language cost summary suitable for a client-facing email — savings framed in currency, not SKU jargon

## Important caveats

- Retail pricing is **list price** — not the customer's EA/CSP/MCA-discounted rate and not actual billed consumption. Present figures as estimates and state the currency and region.
- This command **cannot apply** any recommendation — resizing, deleting idle resources, or buying reservations are write operations outside this read-only connector. Report the opportunity and hand off to a write-capable path.

## When to use the agent instead

For multi-subscription cost comparison, narrative reporting, or combining cost with health/Advisor posture, delegate to the `azure-ops-analyst` agent. This command produces the cost data for one subscription; the agent produces the cross-subscription story.
