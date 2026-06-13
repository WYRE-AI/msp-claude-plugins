---
name: subscription-audit
description: Audit a customer's Stripe subscription + billing health (plan, status, renewal, dunning)
arguments:
  - name: customer
    description: Stripe customer id (cus_...) to audit
    required: true
---

# Stripe Subscription Audit

Produce a billing-health snapshot for one customer — plan, status, renewal, and any at-risk dunning — for support and conversion/retention triage.

## Steps

1. `stripe__list_subscriptions(customer={{customer}}, status='all')` — every subscription + status.
2. For each subscription, resolve its `items[].price` (and product) to name the plan + compute its recurring amount (`unit_amount` × `interval`).
3. For any subscription in `past_due` or `unpaid`: `stripe__list_invoices(customer={{customer}}, status='open')` → the failing invoice (`amount_due`, `attempt_count`, `next_payment_attempt`, `hosted_invoice_url`), then pull its PaymentIntent for the `last_payment_error` decline reason.
4. Note `trialing` subscriptions near `trial_end` (conversion opportunity) and `cancel_at_period_end: true` (will-not-renew).

## Output

- **Plans:** each subscription → plan name, status, recurring amount, `current_period_end` (renewal).
- **MRR:** sum of active recurring amounts (normalized to monthly).
- **At risk:** any `past_due`/`unpaid` with the decline reason + the hosted pay link; any `cancel_at_period_end`; any trial ending soon.
- **Health verdict:** one line (healthy / at-risk-dunning / churning / trialing).

Read-only — this command never changes a subscription. Plan changes/cancellations are operator-confirmed writes handled by the billing-support agent.
