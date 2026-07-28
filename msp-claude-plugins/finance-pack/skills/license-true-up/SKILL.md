---
name: "License True-Up"
description: >
  Three-way seat reconciliation per client per SKU: seats provisioned in a
  cloud marketplace (Pax8, Sherweb) vs. seats billed in accounting or PSA
  billing vs. seats actually deployed in the tenant (microsoft-graph or CIPP).
  Covers the finding class for each pairwise mismatch, disabled users holding
  paid licenses, intentional-buffer caveats, and how to degrade to a two-way
  check when an axis isn't connected.
when_to_use: >-
  When checking whether marketplace-purchased seats, billed seats, and
  actually-deployed seats all agree for a client or across the portfolio. Use
  when: license true-up, seat reconciliation, unused licenses, unassigned
  licenses, license waste, license leakage, paying for seats we're not using,
  billing for more seats than deployed, subscription vs deployed mismatch,
  seat count audit.
---

# License True-Up

## Overview

Cloud subscriptions purchased through a distributor (Pax8, Sherweb) are the
MSP's real, recurring cost. What the client is billed for that subscription is
a separate number set in the accounting system or PSA. What is actually
deployed and in active use in the client's tenant is a third number, pulled
from M365/Entra directly or via CIPP. These three numbers drift independently
and constantly — a new hire gets a mailbox before procurement adds a seat, a
termed employee's license sits unassigned for months, a client asks to "add 5
seats" and only the marketplace order gets updated, not the invoice.

This skill teaches a three-way seat reconciliation per client, per SKU:
**provisioned** (marketplace) vs. **billed** (accounting/PSA) vs. **deployed**
(M365/CIPP actual assignment). Any two of the three disagreeing is a finding;
all three disagreeing is usually the highest-dollar problem in the report.

This is a narrower, client/SKU-level version of the four-way reconciliation the
`wyre-gateway` plugin's `license-true-up-reconciler` agent performs at
portfolio scale (which adds a fourth axis — the PSA *contract* entitlement).
Use this skill directly when the question is "are our marketplace seats,
invoice, and tenant in agreement" without needing the full contract-entitlement
layer; pair it with `agreement-reconciliation` when the contract layer matters
too.

## Connected Systems

| System | Role | Required? |
|--------|------|-----------|
| Pax8 / Sherweb | Provisioned seat count, unit cost, SKU, renewal/commitment term | Yes (at least one) |
| Accounting (QuickBooks Online / Xero) or PSA billing (Autotask/HaloPSA/ConnectWise/Syncro billing items) | Billed seat count and sell price | Yes (at least one) |
| Microsoft 365 / Entra (via `microsoft-graph`) or CIPP | Actually assigned/active seat count, per-user license and account status | Optional — strongly recommended when available |

## Workflow

### Step 1: Discover what's connected

Call `conduit__search_tools` and search for `"subscription"`, `"license"`,
`"invoice"`, and `"user"` to see which of Pax8, Sherweb, QBO, Xero, the
connected PSA's billing tools, microsoft-graph, and CIPP are actually live for
this org. Proceed with whichever combination is available; name explicitly in
the output which axes could and could not be checked.

### Step 2: Pull provisioned seats from the marketplace

- **Pax8** — `pax8__list_subscriptions` filtered to active status, grouped by
  client/company. Extract SKU/product, quantity, unit cost, billing term,
  commitment/renewal date.
- **Sherweb** — the equivalent active-subscription listing tool, same fields.

### Step 3: Pull billed seats

- **Accounting** — `qbo__list_invoices` or `xero__list_invoices` for the most
  recent billing period, filtered to license/subscription line items for the
  client.
- **PSA billing** (if seats are billed as a PSA-managed recurring service
  rather than a direct pass-through invoice) — the PSA's billing-item search
  tool (e.g. `autotask__search_billing_items`), filtered to the relevant
  service.

### Step 4: Pull deployed/active seats

- **microsoft-graph** — list assigned licenses per user for the tenant,
  including account enabled/disabled status and last sign-in where available.
- **CIPP** — `cipp__list_licenses` for the tenant's current license
  assignment, and `cipp__list_users` to cross-reference account status.

Flag any user holding an assigned license while disabled or soft-deleted —
these are immediate, no-judgment-call reclaim candidates regardless of what the
subscription or invoice says.

### Step 5: Reconcile the three counts per client per SKU

For each SKU:

- **Provisioned > Deployed** → over-provisioned. The MSP is paying the
  distributor for seats nobody is using. Dollar impact = gap × marketplace
  unit cost. This is waste the MSP eats unless a buffer policy explains it.
- **Deployed > Billed** → under-billed. Users are actively using the product
  but the client isn't being charged for all of them. Dollar impact = gap ×
  sell price. This is the classic "we're paying for 50 but billing for 45,"
  inverted onto the deployment side — it also covers "we deprovisioned 5 users
  but never reduced the subscription" once combined with the next case.
- **Provisioned > Billed** (independent of deployment data) → the direct
  version of "paying for 50 seats but billing for 45." Dollar impact = gap ×
  sell price, and separately the MSP may also be over-paying the distributor
  if deployed seats are lower still.
- **Billed > Provisioned** → billing risk / compliance exposure — the client is
  being charged for seats that don't exist in the marketplace at all. Flag as
  CRITICAL regardless of the dollar amount.
- **All three roughly equal** → clean, no finding.

Before flagging over-provisioning as pure waste, check whether the gap matches
a known intentional buffer (a documented spare-seat policy) — if a buffer
policy source isn't available in this context, note the finding but caveat that
intentional buffers weren't ruled out.

### Step 6: Report, sorted by dollar impact

Lead with the highest-dollar findings — disabled users holding paid licenses
are usually the fastest, cleanest wins and should be called out first even if
not the largest dollar figure, because they can typically be reclaimed
immediately with no client conversation required.

## Report Format

```
═══════════════════════════════════════════════════════════════════
LICENSE TRUE-UP REPORT
Scope: [Client / Portfolio]
Axes checked: Provisioned ✓ | Billed ✓ | Deployed [✓ / not connected]
Generated: [Date]
═══════════════════════════════════════════════════════════════════

QUICK WINS — Disabled/Soft-Deleted Users Holding Paid Licenses
  [Client] — [User] — [SKU] — disabled [date] — $[X]/month reclaimable

PER-CLIENT, PER-SKU LEDGER
  [Client] — [SKU]
    Provisioned: [N] @ $[cost]   Billed: [N] @ $[price]   Deployed: [N]
    Finding: [Over-provisioned / Under-billed / Billing risk / Clean]
    Dollar impact: $[X]/month

SUMMARY
  Total over-provisioned waste:  $[X]/month
  Total under-billed leakage:    $[X]/month
  Total billing-risk exposure:   $[X]/month
═══════════════════════════════════════════════════════════════════
```

## Graceful Degradation

| Missing / Unavailable | Handling |
|---|---|
| No Pax8 or Sherweb connected | Cannot run — no provisioned baseline. State this explicitly. |
| No accounting platform or PSA billing data | Degrade to provisioned-vs-deployed only; label the billed axis "not checked." |
| No microsoft-graph or CIPP connected | Degrade to provisioned-vs-billed only; label the deployed axis "not checked." |
| SKU names don't match across systems | Apply common MSP abbreviation expansion (M365 = Microsoft 365, S1 = SentinelOne, etc.); flag unresolved names as LOW-confidence matches rather than silently dropping them. |
| Client present in marketplace but not in accounting/PSA | Flag as CRITICAL — likely fully unbilled client. |

## Related Skills

- [`agreement-reconciliation`](../agreement-reconciliation/SKILL.md) — adds the PSA contract entitlement layer on top of billed vs. invoiced
- [`shared/skills/billing-reconciliation`](../../../shared/skills/billing-reconciliation/SKILL.md) — Pax8-to-accounting reconciliation with detailed fuzzy-matching and severity conventions this skill reuses
- [`margin-analysis`](../margin-analysis/SKILL.md) — uses true-up findings to correct revenue inputs before computing margin
