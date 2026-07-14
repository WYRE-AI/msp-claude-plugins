# Finance & Billing (`finance-pack`)

Agreement and billing truth across PSA, accounting (QuickBooks Online, Xero),
and distribution (Pax8, Sherweb). This is a cross-vendor **industry workflow
pack** — job-shaped rather than tool-shaped — one of the first four packs on
the [roadmap](../ROADMAP.md#near-term-industry-workflow-packs).

It matches PSA contracts against accounting invoices and cloud-marketplace
subscriptions, catches license true-up gaps, and ranks client profitability —
all grounded in whichever vendors are actually connected for your org, never
hardcoded to one PSA or one accounting platform.

## What it needs connected

| Category | Required? | Vendors |
|---|---|---|
| PSA | Yes (at least one) | Autotask, HaloPSA, ConnectWise, or Syncro |
| Accounting | Yes (at least one) | QuickBooks Online or Xero |
| Marketplace distribution | Optional — needed for license true-up and full margin cost-of-goods | Pax8 or Sherweb |
| Microsoft 365 / CIPP | Optional — improves license true-up accuracy with actual deployed-seat data | microsoft-graph or CIPP |
| PSA time entries | Optional — improves margin analysis with labor cost estimates | Same PSA as above, if time tracking is used |

Every skill, agent, and command in this pack discovers what's actually
connected via `conduit__search_tools` before running — it never assumes a
fixed vendor stack, and it reports "unable to verify" rather than silently
skipping or guessing when a connector is missing.

## What's included

**Skills**
- `agreement-reconciliation` — PSA contract/agreement vs. accounting invoice reconciliation
- `license-true-up` — marketplace-provisioned vs. billed vs. deployed seat reconciliation
- `margin-analysis` — per-client/service-line margin, with explicit handling of missing cost data

**Agents**
- `billing-drift-detector` — portfolio-wide contract-vs-invoice mismatch sweep, ranked by dollar impact
- `renewal-calendar-builder` — forward-looking contract and subscription renewal calendar
- `profitability-ranker` — client profitability ranking, flagging clients operating at a loss

**Commands**
- `/finance-pack:month-end-recon [month]` — month-end billing-drift sweep report
- `/finance-pack:true-up [client]` — license true-up for one client or the whole portfolio
- `/finance-pack:renewals [window]` — upcoming renewals within a window, sorted by date

## How this pack relates to `shared/skills/billing-reconciliation`

That skill is a narrower, vendor-specific reconciliation: Pax8 marketplace
subscriptions against Xero/QuickBooks invoices. `agreement-reconciliation` in
this pack covers a different pair — PSA contract entitlements against
accounting invoices — and is written to work with whichever PSA is connected.
See the "How this differs" section in
[`skills/agreement-reconciliation/SKILL.md`](skills/agreement-reconciliation/SKILL.md)
for the full comparison; the two are complementary and a full month-end close
typically runs both.

## Install

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install finance-pack@msp-claude-plugins
```

Connects through the WYRE MCP Gateway via [Conduit](https://conduit.wyre.ai) —
installing prompts a one-time OAuth approval, and which vendor tools actually
appear is governed by your org's connected connectors. The pack itself never
carries credentials.
