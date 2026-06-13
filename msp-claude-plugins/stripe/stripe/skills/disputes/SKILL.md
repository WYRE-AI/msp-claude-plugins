---
name: "Stripe Disputes & Chargebacks"
description: "Use this skill for Stripe disputes (chargebacks): listing open disputes and their deadlines, reading the dispute reason and what evidence Stripe needs, assembling and submitting evidence, and tracking dispute outcomes. Disputes are time-critical and bank-adjudicated — missing the evidence deadline forfeits the funds automatically."
when_to_use: "When a chargeback/dispute is opened, when assembling or submitting dispute evidence, or when reviewing dispute deadlines and win/loss outcomes"
triggers:
  - stripe dispute
  - chargeback
  - dispute evidence
  - respond to dispute
  - dispute deadline
  - fraudulent charge dispute
  - inquiry
  - early fraud warning
---

# Stripe Disputes & Chargebacks

A dispute (chargeback) is the cardholder's bank reversing a charge and asking Stripe (on your behalf) to justify it. **They are deadline-driven and adjudicated by the card network, not by Stripe — if `evidence_details.due_by` passes with no submission, the dispute is lost automatically and the funds + a dispute fee are gone.** This skill is read-heavy with one high-stakes write (evidence submission). Gateway-prefixed tools (`stripe__*`); confirm against the live `tools/list`.

## Triage open disputes

```
stripe__list_disputes(limit=50)
stripe__retrieve_dispute(id='dp_...')
# Key fields:
#   status         ∈ warning_needs_response | needs_response | under_review | won | lost
#   reason         ∈ fraudulent | product_not_received | duplicate | subscription_canceled | ...
#   amount, currency, charge (the disputed charge id)
#   evidence_details.due_by   ← the hard deadline (unix ts)
#   evidence_details.has_evidence, .submission_count
```

Sort the queue by `evidence_details.due_by` ascending — **soonest deadline first, always.** A `needs_response` dispute with a `due_by` inside 48h is the top priority.

## Read what the reason demands

The `reason` dictates which evidence wins:
- `fraudulent` → proof the cardholder authorized it: AVS/CVC match, device/IP, prior undisputed purchases, signed delivery.
- `product_not_received` → shipment tracking, delivery confirmation, access logs (for digital), service-rendered records.
- `subscription_canceled` → your cancellation policy + records the subscription was active/used through the period.
- `duplicate` → evidence the two charges were for distinct purchases (or that you already refunded one).

## Assemble & submit evidence

```
stripe__update_dispute(id='dp_...', evidence={
  product_description: '...', customer_email_address: '...',
  shipping_tracking_number: '...', receipt: '<file_id>',
  uncategorized_text: '<the written rebuttal>'
}, submit=false)
# submit=false SAVES a draft; submit=true FINALIZES (irreversible — no edits after).
```

**Submission is one-shot and irreversible. Assemble the full evidence set as a draft (`submit=false`), have the operator review it, and only then submit (`submit=true`).** Never auto-submit. If the evidence is weak and the amount is small, the operator may choose to accept the loss rather than pay to fight — surface that trade-off, don't decide it.

## Workflow: "a fraudulent-reason dispute just opened"

1. `stripe__retrieve_dispute(id=...)` — note `due_by`, `amount`, the `charge`.
2. Pull the charge (payments skill): `payment_method_details` (AVS/CVC), `billing_details`, any prior charges from the same customer.
3. Draft `update_dispute(..., submit=false)` with the authorization evidence + a clear `uncategorized_text` rebuttal.
4. Operator reviews the draft.
5. `update_dispute(..., submit=true)` before `due_by`. Confirm `submission_count` incremented; track to `won`/`lost`.

## Safety
- Deadline first: never let `due_by` pass un-actioned — flag urgent disputes immediately.
- Submission is irreversible + operator-gated. Draft → review → submit.
