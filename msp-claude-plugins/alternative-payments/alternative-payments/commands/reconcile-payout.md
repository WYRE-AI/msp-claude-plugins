---
name: reconcile-payout
description: Reconcile an Alternative Payments payout by listing its transactions and matching them against invoices and customers
arguments:
  - name: payout_id
    description: The payout id to reconcile
    required: true
  - name: show_transactions
    description: Include the full line-by-line transaction list in the output (default true)
    required: false
---

# Reconcile Payout

Reconcile a single Alternative Payments payout: retrieve the payout, list every
transaction it settled, sum those transactions, confirm the total matches the
payout amount, and trace each transaction back to its invoice and customer. This
command is entirely read-only.

## Prerequisites

- Valid Alternative Payments OAuth2 credentials configured (`AP_CLIENT_ID`, `AP_CLIENT_SECRET`)
- Environment selected (`AP_ENVIRONMENT` = `production` or `demo`)
- Scope `payments:read`

## Steps

1. **Authenticate with Alternative Payments**

   ```bash
   BASE=https://public-api.alternativepayments.io
   TOKEN=$(curl -s -X POST "${BASE}/oauth/token" \
     -u "${AP_CLIENT_ID}:${AP_CLIENT_SECRET}" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials" \
     | jq -r '.access_token')
   ```

2. **Retrieve the payout**

   ```bash
   curl -s "${BASE}/payouts/${PAYOUT_ID}" \
     -H "Authorization: Bearer ${TOKEN}"
   ```

3. **List the payout's transactions (cursor-paginated)**

   ```bash
   curl -s "${BASE}/payouts/${PAYOUT_ID}/transactions?limit=100" \
     -H "Authorization: Bearer ${TOKEN}"
   ```

   Loop on `has_more` / `next_cursor`, passing `cursor=<next_cursor>` per page.

4. **Sum and compare** — total the transaction `amount` values and compare to the
   payout's `amount`. Agreement within rounding = reconciled; otherwise flag a
   discrepancy.

5. **Trace each transaction** — for each transaction, resolve its `invoice_id`
   and `customer_id` so the deposit can be tied to specific receivables. Optionally
   fetch the customer name:

   ```bash
   curl -s "${BASE}/customers/${CUSTOMER_ID}" \
     -H "Authorization: Bearer ${TOKEN}"
   ```

6. **Format and return the reconciliation report**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| payout_id | string | Yes | - | Payout id to reconcile |
| show_transactions | boolean | No | true | Include the line-by-line list |

## Examples

### Reconcile a Payout

```
/reconcile-payout po_2026_06_15
```

### Summary Only (No Line Items)

```
/reconcile-payout po_2026_06_15 --show_transactions false
```

## Output

### Reconciled Payout

```
Payout Reconciliation: po_2026_06_15
================================================================

Payout:
  Amount:        $6,800.00 USD
  Status:        paid
  Arrival Date:  2026-06-17

Reconciliation:
  Transactions:        4
  Transaction Total:   $6,800.00
  Verdict:             RECONCILED (matches payout amount)

Transactions:
+--------------+-------------------+-----------+----------------+-----------+
| Transaction  | Customer          | Invoice   | Method         | Amount    |
+--------------+-------------------+-----------+----------------+-----------+
| txn_a1       | Acme Corp         | inv_0042  | card           | $2,500.00 |
| txn_b2       | TechStart Inc     | inv_0044  | standard_ach   | $1,800.00 |
| txn_c3       | GlobalHealth      | inv_0045  | standard_ach   | $1,500.00 |
| txn_d4       | Acme Corp         | inv_0046  | card           | $1,000.00 |
+--------------+-------------------+-----------+----------------+-----------+
================================================================
```

### Discrepancy Found

```
Payout Reconciliation: po_2026_06_15
================================================================

Payout:
  Amount:        $6,800.00 USD
  Status:        paid

Reconciliation:
  Transactions:        3
  Transaction Total:   $5,800.00
  Verdict:             DISCREPANCY — $1,000.00 unaccounted for

Action:
  - Review the payout in the Partner Dashboard
  - One transaction may belong to a different payout or be missing a link
================================================================
```

## Error Handling

### Payout Not Found

```
Error: Payout "po_xxx" not found (404)

Suggestions:
  - Verify the payout id
  - List recent payouts: GET /payouts
```

### Authentication Failed

```
Error: OAuth2 token request failed

Possible causes:
  - Invalid AP_CLIENT_ID or AP_CLIENT_SECRET
  - Wrong AP_ENVIRONMENT (production vs demo)

Resolution:
  - Verify credentials in the Alternative Payments Partner Dashboard
```

### Rate Limited

```
Error: Rate limit exceeded (429)

Resolution:
  - Alternative Payments allows 5 requests/second
  - This command makes several calls for large payouts; pace pagination
  - Respect the Retry-After header
```

## Related Commands

- `/list-overdue-invoices` - List open and overdue invoices and generate hosted payment links

## Related Skills

- [Alternative Payments Payments & Payouts](../skills/payments/SKILL.md) - Read-only transactions and payouts
- [Alternative Payments Invoicing](../skills/invoicing/SKILL.md) - Invoices and hosted payment links
- [Alternative Payments API Patterns](../skills/api-patterns/SKILL.md) - Auth, pagination, rate limits
