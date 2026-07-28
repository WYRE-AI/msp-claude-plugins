# Reconciliation Report Format

Present the reconciliation results in this structured format:

```
═══════════════════════════════════════════════════════════════════
BILLING RECONCILIATION REPORT
Period: February 2026
Accounting Platform: Xero
Generated: 2026-02-23
═══════════════════════════════════════════════════════════════════

SUMMARY
  Companies Checked:    12
  Subscriptions Matched: 45 of 52
  Gaps Found:            7
    CRITICAL:  2  (estimated $512.50/month revenue leakage)
    HIGH:      2  (estimated $185.00/month discrepancy)
    MEDIUM:    1
    LOW:       1
    INFO:      1

───────────────────────────────────────────────────────────────────
CRITICAL GAPS (Unbilled Subscriptions)
───────────────────────────────────────────────────────────────────

  [CRITICAL] Acme Corporation
    Pax8 Subscription:  Microsoft 365 Business Premium
    Quantity:           25 seats @ $17.10 (Pax8 cost)
    Expected Invoice:   25 seats @ $22.00 (sell price) = $550.00
    Invoice Found:      NONE
    Revenue Leakage:    $550.00/month
    Action:             Add line item to next invoice

  [CRITICAL] Gamma Industries
    Pax8 Subscription:  Acronis Cyber Protect Cloud (500GB)
    Quantity:           1 @ $85.00 (Pax8 cost)
    Expected Invoice:   1 @ $110.00 (sell price) = $110.00
    Invoice Found:      NONE
    Revenue Leakage:    $110.00/month
    Action:             Add line item to next invoice

───────────────────────────────────────────────────────────────────
HIGH DISCREPANCIES (Quantity Mismatches)
───────────────────────────────────────────────────────────────────

  [HIGH] Acme Corporation
    Product:            SentinelOne Singularity Complete
    Pax8 Quantity:      25 seats
    Invoice Quantity:   20 seats
    Difference:         5 seats unbilled (20% mismatch)
    Invoice:            INV-0247 (line 3)
    Revenue Impact:     5 x $6.00 = $30.00/month
    Action:             Update invoice line to 25 seats

  [HIGH] Delta Corp
    Product:            Microsoft 365 Business Basic
    Pax8 Quantity:      15 seats
    Invoice Quantity:   10 seats
    Difference:         5 seats unbilled (33% mismatch)
    Invoice:            INV-0251 (line 1)
    Revenue Impact:     5 x $9.00 = $45.00/month
    Action:             Update invoice line to 15 seats

───────────────────────────────────────────────────────────────────
MEDIUM DISCREPANCIES (Price / Margin Issues)
───────────────────────────────────────────────────────────────────

  [MEDIUM] Beta LLC
    Product:            Microsoft 365 Business Premium
    Pax8 Cost:          $17.10/seat
    Invoice Price:      $18.00/seat
    Current Margin:     5.0%
    Target Margin:      25.0%
    Suggested Price:    $22.80/seat
    Invoice:            INV-0249 (line 2)
    Action:             Review and adjust pricing

───────────────────────────────────────────────────────────────────
LOW (Naming Mismatches)
───────────────────────────────────────────────────────────────────

  [LOW] Epsilon Inc
    Pax8 Product:       Microsoft Azure AD P1
    Invoice Description: Cloud Identity Licenses
    Match Confidence:   Amount and quantity match, name differs
    Invoice:            INV-0253 (line 4)
    Action:             Confirm mapping, update mapping table

───────────────────────────────────────────────────────────────────
INFO (Cancelled Still Billed)
───────────────────────────────────────────────────────────────────

  [INFO] Acme Corporation
    Product:            Datto SaaS Protection
    Pax8 Status:        Cancelled (2026-02-10)
    Invoice:            INV-0247 (line 5) -- still present
    Amount Billed:      $75.00/month
    Action:             Remove from next invoice

───────────────────────────────────────────────────────────────────
MATCHED (No Issues)
───────────────────────────────────────────────────────────────────

  45 subscription-to-invoice matches confirmed with no discrepancies.
  See detailed match log for full list.

═══════════════════════════════════════════════════════════════════
```
