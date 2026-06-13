---
name: "Stripe Subscriptions & Invoices"
description: "Use this skill for Stripe recurring-billing operations: inspecting products and prices, auditing a customer's subscriptions (plan, status, renewal, trial), changing or canceling subscriptions, and walking the invoice lifecycle (draft → open → paid → void/uncollectible) including line items and failed-payment dunning."
when_to_use: "When auditing or changing a subscription, reading plan/price config, or investigating an invoice's state and payment-collection history"
triggers:
  - stripe subscription
  - subscription audit
  - cancel subscription
  - change plan
  - upgrade plan
  - downgrade plan
  - stripe invoice
  - unpaid invoice
  - dunning
  - stripe price
  - stripe product
  - trial ending
---

# Stripe Subscriptions & Invoices

Operate Stripe's recurring-billing surface. Gateway-prefixed tool names (`stripe__*`); confirm exact names against the hosted server's live `tools/list`.

## Products & prices (the catalog)

```
stripe__list_products(active=true)
stripe__list_prices(product='prod_...')
# A Price carries: unit_amount, currency, recurring.interval (month|year), and the product it belongs to.
```

Plans are modeled as Product + Price(s). "What does the Pro plan cost?" = the Price's `unit_amount`/`interval` for that product.

## Subscriptions (the customer's plan state)

```
stripe__list_subscriptions(customer='cus_...', status='all')
stripe__retrieve_subscription(id='sub_...')
# status ∈ trialing | active | past_due | canceled | unpaid | incomplete.
# Key fields: current_period_end (renewal date), cancel_at_period_end, trial_end, items[].price.
```

Read the status carefully:
- `past_due` / `unpaid` → a renewal payment failed; cross-reference the latest invoice (below) + the payments skill for the decline reason.
- `cancel_at_period_end: true` → still active but won't renew; "canceled" but not yet ended.
- `trialing` with a near `trial_end` → conversion opportunity / will start charging.

### Changing a subscription

```
stripe__update_subscription(id='sub_...', items=[{ id:'si_...', price:'price_...' }], proration_behavior='create_prorations')
stripe__cancel_subscription(id='sub_...', invoice_now=false, prorate=true)   # or cancel_at_period_end via update
```

**Plan changes and cancellations affect what the customer is billed — operator-confirm the target subscription + the new price + the proration choice before calling.** Prefer `cancel_at_period_end` (graceful, no mid-period clawback) unless an immediate cancel + proration is explicitly intended.

## Invoices (the billing record)

```
stripe__list_invoices(customer='cus_...', status='open', limit=20)
stripe__retrieve_invoice(id='in_...')
# status ∈ draft | open | paid | void | uncollectible.
# Fields: amount_due, amount_paid, attempt_count, next_payment_attempt, lines[], hosted_invoice_url.
```

- `open` + rising `attempt_count` + a `next_payment_attempt` = active **dunning** (Stripe retrying a failed payment). Share the `hosted_invoice_url` so the customer can pay directly.
- `uncollectible` = Stripe gave up after retries — a churn/AR signal.

## Workflow: "audit a customer's billing health"

1. `stripe__list_subscriptions(customer=..., status='all')` — current plan(s) + status.
2. For any `past_due`/`unpaid`: `stripe__list_invoices(customer=..., status='open')` → the failing invoice + `attempt_count`.
3. Pull the invoice's PaymentIntent (payments skill) for the decline reason.
4. Summarize: plan, MRR (price × interval), renewal date, and any at-risk dunning state + the hosted pay link.

## Safety
- `update_subscription` / `cancel_subscription` are billing-affecting writes — confirm + echo the subscription id, the price change, and the proration behavior before executing.
