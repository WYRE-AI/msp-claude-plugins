---
description: View payable charges for a Sherweb billing period with pricing breakdown
argument-hint: "[period] [customer] [charge_type]"
arguments: [period, customer, charge_type]
---

# Sherweb Billing Summary

View payable charges for a billing period with detailed pricing breakdown including list prices, net prices, deductions, fees, and taxes. Useful for monthly reconciliation, margin analysis, and cost reporting.

## Prerequisites

- Sherweb MCP server connected with valid credentials
- MCP tools `sherweb_billing_get_billing_periods`, `sherweb_billing_get_payable_charges`, and `sherweb_customers_list` available

## Steps

1. **Resolve billing period** - Find the target billing period

   - If "latest" or no period specified, call `sherweb_billing_get_billing_periods` with `pageSize=1` to get the most recent period
   - If a specific period ID was provided, use it directly

2. **Fetch payable charges** for the billing period

   Call `sherweb_billing_get_payable_charges` with:
   - `billingPeriodId` set to the resolved period ID
   - `pageSize=100` for maximum results per page
   - Paginate through all pages if needed

3. **Filter results** if customer or charge type filters were specified

   - If a customer name was provided, call `sherweb_customers_list` with `search` to resolve the customer ID, then filter charges by `customerId`
   - If a charge type was specified (not "all"), filter charges by `chargeType`

4. **Calculate summary totals** from the charges

   - Sum `subTotal`, `deductions`, `fees`, `taxes`, and `total` across all matching charges
   - Group by customer for per-customer breakdowns
   - Group by charge type for category breakdowns

5. **Format and return** the billing summary with pricing details

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period | string | No | latest | Billing period ID or "latest" |
| customer | string | No | - | Customer name or ID to filter by |
| charge_type | string | No | all | Charge type filter (Setup, Recurring, Usage, all) |

## Examples

### Latest Billing Period Summary

```
/billing-summary
```

### Specific Billing Period

```
/billing-summary --period "bp-2026-02"
```

### Filter by Customer

```
/billing-summary --customer "Acme Corp"
```

### Filter by Charge Type

```
/billing-summary --charge_type Recurring
```

### Customer + Charge Type

```
/billing-summary --customer "Acme Corp" --charge_type Usage
```

## Output

### Full Billing Summary

```
Sherweb Billing Summary
================================================================

Billing Period: February 2026 (bp-2026-02)
Period: 2026-02-01 to 2026-02-28
Status: Closed

Charges by Customer:
+------------------------------+----------+-----------+------------+---------+----------+
| Customer                     | Charges  | Subtotal  | Deductions | Taxes   | Total    |
+------------------------------+----------+-----------+------------+---------+----------+
| Acme Corporation             | 8        | $2,847.50 | -$85.43    | $221.07 | $2,983.14|
| Beta Industries              | 5        | $1,420.00 | -$42.60    | $110.17 | $1,487.57|
| Gamma Solutions              | 3        | $680.00   | $0.00      | $52.80  | $732.80  |
| Delta Corp                   | 6        | $3,200.00 | -$160.00   | $243.20 | $3,283.20|
+------------------------------+----------+-----------+------------+---------+----------+
| TOTAL                        | 22       | $8,147.50 | -$288.03   | $627.24 | $8,486.71|
+------------------------------+----------+-----------+------------+---------+----------+

Charges by Type:
  Setup:     2 charges    $450.00
  Recurring: 18 charges   $7,197.50
  Usage:     2 charges    $500.00

Deductions Applied:
  PromotionalMoney:       -$120.00
  PromotionalPercentage:  -$72.03
  PerformancePercentage:  -$96.00

================================================================
```

### Customer-Filtered Summary

```
Sherweb Billing Summary - Acme Corporation
================================================================

Billing Period: February 2026 (bp-2026-02)

+--------------------------------------------+----------+---------+-----+--------+--------+--------+
| Product                                    | Type     | Qty     | Net | SubTot | Deduct | Total  |
+--------------------------------------------+----------+---------+-----+--------+--------+--------+
| Microsoft 365 Business Premium             | Recurring| 25      |$17.10|$427.50| -$12.83|$414.67 |
| Microsoft 365 Business Basic               | Recurring| 10      | $5.40| $54.00|  $0.00 | $54.00 |
| Exchange Online Plan 1                     | Recurring| 5       | $3.60| $18.00|  $0.00 | $18.00 |
| Microsoft Defender for Business            | Recurring| 25      | $2.70| $67.50|  $0.00 | $67.50 |
| SentinelOne Singularity Control            | Recurring| 40      | $4.50|$180.00| -$5.40 |$174.60 |
| Acronis Cyber Protect Cloud                | Usage    | 500 GB  | $4.20|$2,100.00|-$67.20|$2,032.80|
| New Server Setup                           | Setup    | 1       |$0.00 | $0.00 |  $0.00 | $0.00  |
+--------------------------------------------+----------+---------+-----+--------+--------+--------+

Subtotal:    $2,847.50
Deductions:  -$85.43
Fees:        $0.00
Taxes:       $221.07
TOTAL:       $2,983.14

================================================================
```

### No Charges Found

```
No payable charges found for the specified criteria.

Suggestions:
  - Verify the billing period ID is correct
  - Check if the customer name matches a Sherweb customer
  - Try without filters: /billing-summary
  - List available periods: check sherweb_billing_get_billing_periods
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to Sherweb MCP server

Check your MCP configuration and verify credentials at cumulus.sherweb.com > Security > APIs
```

### Invalid Billing Period

```
Error: Billing period not found: "bp-invalid"

List available periods and try again.
```

### Authentication Error

```
Error: Authentication failed (401)

Your Sherweb OAuth token may have expired. The MCP server will attempt to re-authenticate automatically.
If the issue persists, verify your Client ID and Client Secret.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `sherweb_billing_get_billing_periods` | Find available billing periods |
| `sherweb_billing_get_payable_charges` | Get charges for the period |
| `sherweb_customers_list` | Resolve customer name to ID |

## Related Commands

- `/list-customers` - List all customers to find customer names/IDs
- `/subscription-status` - Check subscription details for a customer
- `/change-quantity` - Modify subscription seat counts
