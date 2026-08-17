---
name: "Agreement Reconciliation"
description: >
  Reconciling PSA contract/agreement entitlements (seats, hours, recurring
  services) against invoiced reality in an accounting platform, across any
  combination of PSA (Autotask, HaloPSA, ConnectWise, Syncro) and accounting
  platform (QuickBooks Online, Xero). Covers building the entitlement ledger,
  the cross-system matching priority, and the gap classes — under-billing,
  over-billing, lapsed agreements still invoiced, active agreements never
  billed, and price drift.
when_to_use: >-
  When checking whether a client's PSA contract terms (seats, hours, recurring
  services) match what is actually being invoiced. Use when: billing drift,
  contract vs invoice mismatch, are we billing correctly, agreement
  reconciliation, under-billing, over-billing, lapsed agreement still invoiced,
  billing audit, contract compliance check.
---

# Agreement Reconciliation

## Overview

MSP revenue is only as reliable as the agreement it is billed against. A contract
signed for 25 managed seats drifts silently when 5 new hires never get added to
the invoice line, or when a client offboards a location and the recurring service
never gets removed. This skill teaches Claude how to pull the **entitlement**
(what the PSA contract/agreement says the client should be paying for) and the
**invoiced reality** (what the accounting platform actually billed), and surface
every place they disagree.

The reconciliation answers one question: **"Does every active PSA agreement have
a matching, correctly-quantified line item on the client's accounting invoices —
and does every invoiced recurring line item still have a live agreement behind
it?"**

### How this differs from `shared/skills/billing-reconciliation`

The repo already ships [`shared/skills/billing-reconciliation`](../../../shared/skills/billing-reconciliation/SKILL.md),
which is narrower and vendor-specific: it reconciles **Pax8 marketplace
subscriptions** against **Xero/QuickBooks invoices** — a two-system,
distribution-to-accounting comparison. This skill covers a different pair:
**PSA contract/agreement entitlements** against **accounting invoices**, and it is
written to be PSA-agnostic (Autotask, HaloPSA, ConnectWise, or Syncro — whichever
is actually connected) rather than assuming a single accounting platform.

The two skills are complementary, not competing, and a full month-end close often
runs both:

| | `shared/skills/billing-reconciliation` | `agreement-reconciliation` (this skill) |
|---|---|---|
| Entitlement source | Pax8 active subscriptions | PSA contract/agreement (seats, hours, recurring services) |
| Comparison target | Xero / QuickBooks invoice lines | Xero / QuickBooks invoice lines |
| PSA involved? | No | Yes — required |
| Distributor involved? | Yes — required (Pax8) | No (see `license-true-up` for Pax8/Sherweb seat matching) |
| Typical gap found | Unbilled marketplace seat | Under-billed contract, over-billed contract, lapsed agreement still invoiced |

Reuse its matching strategy (fuzzy product/company name matching, amount
tolerance bands, severity tiers) rather than re-deriving one — the logic
transfers directly from "subscription line vs invoice line" to "contract term vs
invoice line."

## Anti-triggers

- **Working a contract record itself** — contract types, service and service-
  bundle associations, block hours, and renewals are the PSA's surface; use
  `autotask-contracts` or `halopsa-contracts`.
- **Working an invoice itself** — creating, sending, or querying invoices is
  the accounting connector's surface; use `xero-invoices` or
  `qbo-invoices`.

## Connected Systems

| System | Role | Required? |
|--------|------|-----------|
| PSA — Autotask / HaloPSA / ConnectWise / Syncro | Source of contract/agreement entitlements (seats, hours, recurring service lines, status, term dates) | Yes (at least one) |
| Accounting — QuickBooks Online / Xero | Source of invoiced reality (line items, quantities, amounts, invoice status) | Yes (at least one) |

## Reconciliation Workflow

### Step 1: Discover what's actually connected

Call `conduit__search_tools` first — do not assume Autotask, HaloPSA,
ConnectWise, Syncro, QuickBooks Online, or Xero are connected just because they
appear in examples below. Search for terms like `"contract"`, `"agreement"`,
`"invoice"` to see which vendor-prefixed tools come back for this org, then
proceed only with what's live. If exactly one PSA and one accounting platform
are connected, the rest of this workflow is unambiguous. If multiple of either
are connected (e.g. a client base split across two PSAs post-acquisition), run
the reconciliation once per PSA and merge the reports.

### Step 2: Pull active PSA agreements/contracts

For each connected PSA, pull active contracts/agreements per client. Resolve
status and type IDs via each PSA's own list/lookup tools rather than hardcoding
IDs — they are tenant-specific.

- **Autotask** — `autotask__search_contracts` for active contracts, then
  `autotask__search_contract_services` (or the contract's service line detail)
  for the billed units per service (seats, block hours, recurring flat fee).
- **HaloPSA** — `halopsa__clients_list` / `halopsa__clients_get` for the client's
  contract detail, or a dedicated contract-listing tool if the org exposes one.
- **ConnectWise** — the agreement/contract search tool, expanded to include
  agreement additions (the line-item-equivalent of seats/services on a CW
  agreement).
- **Syncro** — the customer's active contract/recurring-invoice-schedule detail.

**Key fields to extract per agreement:**

- Client/company identifier (to correlate against the accounting contact)
- Service/product line description
- Contracted quantity (seats, block hours, or "flat" for fixed-fee lines)
- Unit price (billed rate — not the MSP's internal cost)
- Billing frequency (monthly, quarterly, annual)
- Contract status (active, expired, cancelled) and term end date

**Build an entitlement ledger**, one row per contract line:

```
PSA Agreement Ledger
────────────────────────────────────────────────────────────
Client          Contract              Line Item        Qty  Unit Price  Monthly
Acme Corp       Managed Services MSA  Managed Seat      42     $145.00   $6,090.00
Acme Corp       Managed Services MSA  After-Hours SLA    1     $250.00     $250.00
Beta LLC        Block Hours Q1        Prepaid Hours     20      $95.00   (prepaid, not recurring)
Gamma Inc       Legacy MSA (expired)  Managed Seat      18     $120.00   $2,160.00 [EXPIRED 2026-04-30]
────────────────────────────────────────────────────────────
```

Flag any contract whose term end date is in the past but status still shows
active in the PSA — that is itself a data-hygiene finding worth reporting
separately (the contract should have been renewed or closed).

### Step 3: Pull invoiced line items from accounting

For the same billing period, pull sales invoices from whichever accounting
platform(s) are connected.

- **QuickBooks Online** — `qbo__list_invoices` (or the equivalent search tool),
  filtered to the billing period and, where possible, the specific customer.
- **Xero** — `xero__list_invoices` for ACCREC (sales) invoices in the period,
  filtered by contact where possible.

**Key fields:** customer/contact name, line description, quantity, unit price,
line amount, invoice status (draft/authorised/paid), invoice date.

### Step 4: Match agreement lines to invoice lines

Use the same matching priority as `shared/skills/billing-reconciliation`:

1. Client/company name match (PSA client to accounting contact/customer) —
   exact, then contains, then DBA/trading-name fallback, then ask the user.
2. Line-description fuzzy match (contract service name to invoice line
   description) — MSPs abbreviate ("Managed Seat" vs "MSP Managed Service —
   per user").
3. Quantity comparison.
4. Amount comparison within a tolerance band (default ±5%; rounding and partial
   billing periods are common and not automatically a gap).

### Step 5: Classify gaps

- **Under-billing (CRITICAL/HIGH)** — Contract quantity exceeds invoiced
  quantity (e.g. contract says 42 seats, invoice reflects 37). Dollar impact =
  `(contracted qty − invoiced qty) × unit price`.
- **Over-billing (HIGH)** — Invoiced quantity exceeds contract quantity. This is
  a client-facing risk (overcharge, potential refund obligation), not just an
  MSP-favorable discrepancy — treat it with the same urgency as under-billing.
- **Lapsed agreement still invoiced (CRITICAL)** — Contract status is
  expired/cancelled/terminated in the PSA, but a recurring invoice line for it
  is still appearing on current invoices. This is billing a client for a
  contract that no longer exists.
- **Active agreement, no invoice found (CRITICAL)** — Contract is active in the
  PSA with no corresponding invoice line at all in the period. Distinct from a
  quantity mismatch — this is total non-billing.
- **Price drift (MEDIUM)** — Quantities match but unit price on the invoice
  differs from the contracted rate (rate never updated after a contract
  amendment, or a manual invoice override).

### Step 6: Report

Group findings by severity, always leading with dollar impact so the reader can
triage by size, not just category. See Report Format below.

## Report Format

```
═══════════════════════════════════════════════════════════════════
AGREEMENT RECONCILIATION REPORT
Period: [Month Year]
PSA: [Autotask / HaloPSA / ConnectWise / Syncro — whichever connected]
Accounting: [QuickBooks Online / Xero — whichever connected]
Generated: [Date]
═══════════════════════════════════════════════════════════════════

SUMMARY
  Clients Checked:          [N]
  Contract Lines Reviewed:  [N]
  Matched Clean:            [N]
  Gaps Found:               [N]
    CRITICAL: [N]  (est. $[X]/month impact)
    HIGH:     [N]  (est. $[X]/month impact)
    MEDIUM:   [N]

───────────────────────────────────────────────────────────────────
CRITICAL — Lapsed Agreements Still Invoiced
───────────────────────────────────────────────────────────────────
  [Client] — [Contract name], expired [date], still billing $[X]/month
    Action: Confirm with account manager — either renew the agreement or
    remove the recurring line.

───────────────────────────────────────────────────────────────────
CRITICAL — Active Agreements With No Invoice
───────────────────────────────────────────────────────────────────
  [Client] — [Contract line], [qty] contracted, $0 invoiced
    Action: Add missing invoice line; investigate why it was never billed.

───────────────────────────────────────────────────────────────────
HIGH — Under-Billing (Quantity Mismatch)
───────────────────────────────────────────────────────────────────
  [Client] — [Line], contracted [X], invoiced [Y], $[Z]/month underbilled

───────────────────────────────────────────────────────────────────
HIGH — Over-Billing (Client Risk)
───────────────────────────────────────────────────────────────────
  [Client] — [Line], contracted [X], invoiced [Y], $[Z]/month overbilled
    Action: Verify with account manager before next invoice — possible refund
    obligation.

───────────────────────────────────────────────────────────────────
MEDIUM — Price Drift
───────────────────────────────────────────────────────────────────
  [Client] — [Line], contracted rate $[X], invoiced rate $[Y]

───────────────────────────────────────────────────────────────────
MATCHED — No Issues
───────────────────────────────────────────────────────────────────
  [N] contract lines confirmed matching invoiced amounts within tolerance.
═══════════════════════════════════════════════════════════════════
```

## Graceful Degradation

| Missing / Unavailable | Handling |
|---|---|
| No PSA connected | Cannot run — no entitlement source. State this explicitly; do not substitute invoice-only guessing. |
| No accounting platform connected | Report the PSA agreement ledger as a standalone entitlement list; note reconciliation could not be performed. |
| Multiple PSAs connected | Run the workflow once per PSA, merge into one report, and label each finding with its source PSA. |
| Client exists in PSA but not in accounting | Flag as CRITICAL — likely an entirely unbilled client, same severity class as "active agreement, no invoice." |
| Contract line has no clear per-unit price (fully bundled flat fee) | Compare total line amount instead of per-unit; note the comparison basis in the report. |
| PSA contract data incomplete (e.g. missing term end date) | Note as a data-hygiene flag alongside billing findings — don't silently skip the line. |

## Related Skills

- [`shared/skills/billing-reconciliation`](../../../shared/skills/billing-reconciliation/SKILL.md) — Pax8 subscription vs. accounting invoice reconciliation (distribution layer, not PSA)
- [`license-true-up`](../license-true-up/SKILL.md) — Pax8/Sherweb subscription seats vs. billed vs. actually deployed seats
- [`margin-analysis`](../margin-analysis/SKILL.md) — turns reconciled revenue into per-client margin once billing is confirmed accurate
