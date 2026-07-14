---
description: Run the license true-up reconciliation for one client or the whole portfolio
argument-hint: "[client]"
arguments: [client]
---

# License True-Up

Runs the `license-true-up` skill's three-way seat reconciliation — provisioned
(Pax8/Sherweb) vs. billed (accounting/PSA) vs. deployed (M365/CIPP, where
connected) — for a single client or the entire portfolio.

## Prerequisites

- WYRE MCP Gateway connected via Conduit (`.mcp.json` → `conduit`)
- At least one marketplace distributor connector (Pax8 or Sherweb)
- Recommended: an accounting or PSA billing connector, and a Microsoft
  365/CIPP connector, for the full three-way check. Missing either degrades
  the check to two axes with the missing axis stated explicitly, rather than
  failing outright.

## Steps

1. Call `conduit__search_tools` to discover which distributor, accounting/PSA
   billing, and Microsoft 365/CIPP tools are actually connected for this org.
2. Resolve scope: if `client` is given, scope every step below to that client;
   otherwise run portfolio-wide.
3. Pull provisioned seats from whichever of Pax8/Sherweb is connected.
4. Pull billed seats from whichever of the accounting platform or PSA billing
   items is connected.
5. Pull deployed/active seats from microsoft-graph or CIPP, if connected,
   including account status (enabled/disabled/soft-deleted) for immediate
   reclaim candidates.
6. Reconcile the available axes per client per SKU, classify findings
   (over-provisioned waste, under-billed leakage, billing-risk exposure), and
   sort by dollar impact, leading with disabled-user quick wins.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|--------------|
| client | string | No | (omit for portfolio-wide) | Client/company name to scope the true-up to a single client |

## Examples

### Portfolio-wide true-up

```
/finance-pack:true-up
```

### Single client

```
/finance-pack:true-up "Acme Corporation"
```

## Output

```
═══════════════════════════════════════════════════════════════════
LICENSE TRUE-UP REPORT
Scope: [Client / Portfolio]
Axes checked: Provisioned ✓ | Billed [✓/not connected] | Deployed [✓/not connected]
Generated: [Date]
═══════════════════════════════════════════════════════════════════

QUICK WINS — Disabled Users Holding Paid Licenses
  [Client] — [User] — [SKU] — $[X]/month reclaimable

PER-CLIENT, PER-SKU LEDGER
  [Client] — [SKU]
    Provisioned: [N]   Billed: [N]   Deployed: [N]
    Finding: [category]  |  Dollar impact: $[X]/month

SUMMARY
  Total waste:    $[X]/month
  Total leakage:  $[X]/month
  Total exposure: $[X]/month
═══════════════════════════════════════════════════════════════════
```

## Related

- Skill: `license-true-up` — the underlying reconciliation methodology
- Skill: `agreement-reconciliation` — adds the PSA contract entitlement layer this command's billed-seats check does not independently verify
- Command: `/finance-pack:month-end-recon` — contract-level (rather than license-level) reconciliation
