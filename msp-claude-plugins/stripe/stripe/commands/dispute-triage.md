---
name: dispute-triage
description: Triage open Stripe disputes by evidence deadline (soonest first)
arguments:
  - name: limit
    description: Maximum number of disputes to scan
    required: false
    default: "50"
---

# Stripe Dispute Triage

Pull open Stripe disputes and surface them as a deadline-ordered work queue — because a missed `evidence_details.due_by` forfeits the funds automatically.

## Steps

1. `stripe__list_disputes(limit={{limit}})` — fetch disputes.
2. Keep those in `needs_response` or `warning_needs_response` (these are on the clock); note `under_review` separately (submitted, awaiting bank).
3. Sort by `evidence_details.due_by` **ascending** — soonest deadline first.
4. For each, show: dispute id, amount + currency, `reason`, the disputed `charge`, hours-until-`due_by`, and whether evidence has been submitted (`evidence_details.has_evidence`).
5. Flag anything due within 48h as 🔴 URGENT at the top.

## Output

A table sorted by deadline:

| ⏰ due in | dispute | amount | reason | charge | evidence? |
|---|---|---|---|---|---|

Then a one-line recommendation per urgent dispute on which evidence the `reason` calls for (fraudulent → authorization proof; product_not_received → delivery; subscription_canceled → policy + usage; duplicate → distinct-purchase proof). Do **not** submit any evidence from this command — triage only; assembling + submitting evidence is an operator-reviewed step.
