---
name: "Stripe Payments & Refunds"
description: "Use this skill for Stripe payment operations: looking up payment intents and charges, tracing a customer's payment history, issuing and tracking refunds, and reading account balance and payout status. Covers the money-movement surface — what was charged, what succeeded or failed and why, and what was refunded or paid out."
when_to_use: "When investigating a charge or payment intent, issuing or checking a refund, tracing why a payment failed, or reconciling balance and payouts for a Stripe account"
triggers:
  - stripe payment
  - stripe charge
  - payment intent
  - stripe refund
  - issue refund
  - failed payment
  - payment failed
  - stripe balance
  - stripe payout
  - payout reconciliation
  - card declined
---

# Stripe Payments & Refunds

Operate Stripe's money-movement surface: payment intents, charges, refunds, balance, and payouts. Tool names below are the gateway-prefixed form (`stripe__*`); the hosted Stripe MCP server (`mcp.stripe.com`) serves the authoritative tool list — confirm exact names against a live `tools/list` after connecting.

## Core operations

### Look up a payment

```
stripe__list_payment_intents(customer='cus_...', limit=20)
stripe__retrieve_payment_intent(id='pi_...')
# A PaymentIntent carries: status (succeeded | processing | requires_payment_method | canceled),
# amount, currency, customer, latest_charge, and last_payment_error (decline reason).
```

The `status` + `last_payment_error.code` answer "why did this payment fail?" — common codes: `card_declined`, `insufficient_funds`, `expired_card`, `authentication_required` (SCA). A `requires_payment_method` status after a decline means the customer must re-enter a card.

### Trace a customer's payment history

```
stripe__list_charges(customer='cus_...', limit=50)
# Each charge: amount, paid, refunded, disputed, payment_method_details, receipt_url, failure_message.
```

Use this for "show me everything <customer> has paid" — and cross-reference `disputed: true` with the disputes skill, `refunded: true`/`amount_refunded` with refunds below.

### Issue & track refunds

```
stripe__create_refund(payment_intent='pi_...', amount=<cents>, reason='requested_by_customer')
# Omit amount for a FULL refund; pass amount (in the smallest currency unit) for a PARTIAL refund.
# reason ∈ requested_by_customer | duplicate | fraudulent.
stripe__list_refunds(payment_intent='pi_...')
# Refund status: pending | succeeded | failed | canceled.
```

**Refunds are irreversible and move real money — always confirm the exact amount + the target charge with the operator before calling `create_refund`.** A `failed` refund (rare) usually means the original payment method can no longer receive funds; surface it, don't silently retry.

### Balance & payouts (reconciliation)

```
stripe__retrieve_balance()
# { available: [...], pending: [...] } per currency — what's settled vs in transit.
stripe__list_payouts(limit=20)        # bank transfers out of the Stripe balance
stripe__list_balance_transactions(payout='po_...')  # what a payout was composed of
```

For "does this payout match our books?", list the balance transactions for the payout and sum `net` by type (charge, refund, fee, adjustment).

## Workflow: "a customer says they were charged twice"

1. `stripe__list_charges(customer=...)` — find the duplicate charges (same amount, close timestamps).
2. Confirm both `paid: true` and neither already `refunded`.
3. Confirm with the operator which charge to refund (keep one).
4. `stripe__create_refund(payment_intent=<the duplicate>, reason='duplicate')`.
5. `stripe__list_refunds(...)` to confirm `succeeded`; share the refund id + amount.

## Safety
- Refunds, dispute responses, and any write operation should be operator-confirmed with the exact id + amount echoed back.
- Never expose full card numbers (Stripe only returns last4 + brand — keep it that way in summaries).
