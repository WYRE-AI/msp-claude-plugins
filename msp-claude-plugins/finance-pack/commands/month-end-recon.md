---
description: Run the full billing-drift sweep for a billing period, formatted as a month-end reconciliation report
argument-hint: "[month]"
arguments: [month]
---

# Month-End Reconciliation

Runs the `billing-drift-detector` agent's full contract-vs-invoice sweep for a
given billing period across whichever PSA and accounting connectors are live,
formatted as a month-end reconciliation report ready for a controller or
billing team review.

## Prerequisites

- WYRE MCP Gateway connected via Conduit (`.mcp.json` → `conduit`)
- At least one PSA connector (Autotask, HaloPSA, ConnectWise, or Syncro)
- At least one accounting connector (QuickBooks Online or Xero)
- If either category is entirely absent, the report is produced with the
  missing side stated explicitly rather than skipped silently

## Steps

1. Call `conduit__search_tools` to discover which PSA and accounting tools are
   actually connected for this org — do not assume a specific vendor.
2. Resolve the billing period: use `month` if given (format `YYYY-MM`,
   e.g. `2026-06`); otherwise default to the current calendar month.
3. Run the `agreement-reconciliation` skill's workflow for the resolved
   period: pull active PSA contracts/agreements, pull accounting invoices for
   the period, and match agreement lines to invoice lines.
4. Classify every mismatch as under-billing, over-billing, lapsed-agreement-
   still-invoiced, or active-agreement-with-no-invoice, and compute the dollar
   impact of each.
5. Rank all findings by dollar impact and format as a month-end reconciliation
   report, including a matched-clean tally and an explicit unable-to-verify
   section for any disconnected vendor family.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|--------------|
| month | string | No | current calendar month | Billing period to reconcile, `YYYY-MM` format (e.g. `2026-06`) |

## Examples

### Current month, whatever PSA/accounting is connected

```
/finance-pack:month-end-recon
```

### Specific month

```
/finance-pack:month-end-recon 2026-06
```

## Output

```
═══════════════════════════════════════════════════════════════════
MONTH-END RECONCILIATION REPORT
Period: June 2026
PSA: [connected PSA(s)]
Accounting: [connected platform(s)]
Generated: [Date]
═══════════════════════════════════════════════════════════════════

SUMMARY
  Clients Checked:          [N]
  Contract Lines Reviewed:  [N]
  Gaps Found:               [N]  (Total Dollar Impact: $[X]/month)

RANKED FINDINGS (by dollar impact)
  1. [Client] — [Category] — $[X]/month
  2. [Client] — [Category] — $[X]/month
  ...

MATCHED CLEAN
  [N] contract lines confirmed matching invoiced amounts within tolerance.

UNABLE TO VERIFY
  [Vendor family not connected, if any]

RECOMMENDED NEXT STEPS
  1. ...
  2. ...
═══════════════════════════════════════════════════════════════════
```

## Related

- Agent: `billing-drift-detector` — the underlying sweep this command runs
- Skill: `agreement-reconciliation` — the reconciliation methodology
- Command: `/finance-pack:true-up` — license-level (rather than contract-level) reconciliation
