---
name: list-overdue-invoices
description: List open and overdue Alternative Payments invoices and optionally generate hosted payment links for them
arguments:
  - name: customer_id
    description: Limit results to a single customer (optional)
    required: false
  - name: include_open
    description: Include open (not-yet-overdue) invoices, not just overdue ones (default false)
    required: false
  - name: with_links
    description: Generate a hosted payment link for each listed invoice (default false)
    required: false
---

# List Overdue Invoices

List open and overdue invoices in Alternative Payments, segment them by how far
past due they are, and optionally generate a hosted payment link for each so the
customer can choose to pay. This command never charges a customer — it only reads
invoices and, when asked, produces hosted payment-link URLs.

## Prerequisites

- Valid Alternative Payments OAuth2 credentials configured (`AP_CLIENT_ID`, `AP_CLIENT_SECRET`)
- Environment selected (`AP_ENVIRONMENT` = `production` or `demo`)
- Scope `payments:read` (plus `payments:write` only if `with_links` is used)

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

2. **List invoices (cursor-paginated)**

   ```bash
   curl -s "${BASE}/invoices?limit=100" \
     -H "Authorization: Bearer ${TOKEN}"
   ```

   Loop on `has_more` / `next_cursor`, passing `after=<cursor>` for each page.
   If `customer_id` is supplied, filter the results to that customer.

3. **Separate overdue from open**
   - Keep invoices with `status` of `overdue` (and `open` when `include_open` is true)
   - Compute days past `due_date` for each overdue invoice

4. **Segment by aging** — current, 1–30, 31–60, 61–90, 90+ days past due

5. **(Optional) Generate hosted payment links** when `with_links` is true

   ```bash
   curl -s "${BASE}/invoices/${INVOICE_ID}/payment-link" \
     -H "Authorization: Bearer ${TOKEN}"
   ```

   This returns a URL the customer visits to pay. No money moves until the
   customer completes payment.

6. **Format and return the summary**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| customer_id | string | No | - | Limit to one customer |
| include_open | boolean | No | false | Include not-yet-overdue invoices |
| with_links | boolean | No | false | Generate a hosted payment link per invoice |

## Examples

### All Overdue Invoices

```
/list-overdue-invoices
```

### Overdue Invoices for One Customer

```
/list-overdue-invoices --customer_id cus_abc123
```

### Open and Overdue, with Payment Links

```
/list-overdue-invoices --include_open true --with_links true
```

## Output

### Overdue Invoices Found

```
Overdue Invoices (Alternative Payments)
================================================================

Summary:
  Total Overdue:   $7,300.00 across 4 invoices, 3 customers
  Total Open:      $2,500.00 across 1 invoice (not yet due)

Aging:
  Current (not yet due):  $2,500.00
  1-30 days overdue:      $2,500.00
  31-60 days overdue:     $2,300.00
  61-90 days overdue:     $0.00
  90+ days overdue:       $2,500.00

Overdue Invoices:
+-------------+-------------------+------------+------------+-----------+-------------------+
| Invoice     | Customer          | Due Date   | Amount Due | Days Over | Payment Link      |
+-------------+-------------------+------------+------------+-----------+-------------------+
| inv_0042    | Acme Corp         | 2026-05-05 | $2,500.00  | 31        | https://pay.ap... |
| inv_0039    | TechStart Inc     | 2026-05-20 | $2,300.00  | 16        | https://pay.ap... |
| inv_0031    | Problem Co LLC    | 2026-03-06 | $2,500.00  | 91        | https://pay.ap... |
+-------------+-------------------+------------+------------+-----------+-------------------+

Actions:
  - Send the 90+ day link (Problem Co LLC) and escalate to the account manager
  - Email the remaining links to each customer's billing user
================================================================
```

### Nothing Overdue

```
Overdue Invoices (Alternative Payments)
================================================================
No overdue invoices. 1 open invoice not yet due ($2,500.00, due 2026-07-05).
================================================================
```

## Error Handling

### Authentication Failed

```
Error: OAuth2 token request failed

Possible causes:
  - Invalid AP_CLIENT_ID or AP_CLIENT_SECRET
  - Wrong AP_ENVIRONMENT (production vs demo)

Resolution:
  - Verify credentials in the Alternative Payments Partner Dashboard
  - Confirm AP_ENVIRONMENT matches the credentials' environment
```

### Rate Limited

```
Error: Rate limit exceeded (429)

Resolution:
  - Alternative Payments allows 5 requests/second
  - Respect the Retry-After header and pace pagination loops
```

## Related Commands

- `/reconcile-payout` - Reconcile a payout's transactions against invoices and customers

## Related Skills

- [Alternative Payments Invoicing](../skills/invoicing/SKILL.md) - Invoices and hosted payment links
- [Alternative Payments Payments & Payouts](../skills/payments/SKILL.md) - Read-only transactions and payouts
- [Alternative Payments API Patterns](../skills/api-patterns/SKILL.md) - Auth, pagination, rate limits
