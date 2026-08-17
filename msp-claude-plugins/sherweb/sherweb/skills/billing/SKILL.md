---
name: "Sherweb Billing"
description: >
  Sherweb distributor billing: explicit billing date ranges, Setup/Recurring/Usage
  charge types, billing cycles (OneTime, Monthly, Yearly), the pricing breakdown
  (listPrice, netPrice, prorated, subTotal), promotional and performance deductions,
  fees, taxes, and MSP margin calculation. Also covers what this plugin cannot
  retrieve: there is no billing-period enumeration and no invoice surface.
when_to_use: >-
  When reviewing Sherweb payable charges, costs, or MSP margins — or when asked for a
  Sherweb invoice, which this plugin cannot retrieve. Use when:
  sherweb billing, sherweb invoice, sherweb charges, sherweb payable, sherweb pricing,
  sherweb deductions, sherweb fees, sherweb taxes, sherweb margin, sherweb cost,
  sherweb billing period, sherweb recurring, or sherweb prorated.
---

# Sherweb Distributor Billing

## Overview

Billing in Sherweb represents the financial data flowing from the distributor to the service provider (MSP). When Sherweb provisions or manages cloud subscriptions on behalf of an MSP's customers, it generates payable charges dated within a billing period. Each charge includes detailed pricing breakdown with list prices, net prices, proration, deductions (promotional and performance), fees, and taxes. Understanding Sherweb billing data is critical for MSPs to calculate margins, reconcile costs, and ensure accurate client billing. Note that the tool surface reaches charges, not periods and not invoices — see *What this plugin cannot retrieve*.

## Anti-triggers

- **An invoice the MSP sends to a client** — Sherweb charges are money the
  MSP *owes* the distributor, the opposite direction to the accounting and
  PSA plugins. Client-facing invoices are `qbo-invoices`,
  `xero-invoices`, `autotask-billing`, or `halopsa-invoices`. Getting the
  direction wrong inverts every margin calculation.
- **The equivalent cost from the other CSP marketplace** — use
  `pax8-invoices`.
- **Comparing the two sides to find unbilled subscriptions** — that is the
  cross-vendor reconciliation itself; use `shared-skills-billing-reconciliation`.
- **Aged receivables on the MSP's own books** — Sherweb's per-customer AR
  view is the distributor platform's ledger, not the accounting system's.
  Collections work runs off `qbo-reports` or `xero-reports`; see
  `sherweb-customers` for what Sherweb's own AR data covers.

## MCP Tools

### Available Tools

The server registers exactly two billing tools
(`sherweb-mcp/src/domains/billing.ts:17-69`).

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sherweb_billing_payable_charges` | Get payable charges for a date range | `billingCycleType` (`OneTime`\|`Monthly`\|`Yearly`), `periodFrom`, `periodTo`, `page`, `pageSize` |
| `sherweb_billing_charge_details` | Get detailed breakdown of a specific charge | `chargeId` (required) |

### What this plugin cannot retrieve

Two capabilities that earlier revisions of this skill described do not exist
on the shipped server. Do not substitute a near-miss for either.

- **There is no billing-period enumeration.** No tool lists available
  billing periods, their IDs, dates, or open/closed status. You supply the
  window yourself as `periodFrom`/`periodTo` on
  `sherweb_billing_payable_charges`; you cannot ask the server which periods
  exist. If an operator says "the latest period", resolve that from the
  calendar and the MSP's own billing cycle, then pass explicit dates — never
  guess a `billingPeriodId`, which is not a parameter of any tool here.
- **There is no invoice surface at all.** Nothing on this server lists
  invoices, fetches an invoice by ID, or returns invoice line items. The two
  invoice-adjacent capabilities are narrower and are not substitutes:
  `sherweb_billing_charge_details` returns the line items of a *single
  charge* by charge ID, and `sherweb_customers_accounts_receivable` returns a
  customer's outstanding balance and aging. Neither is an invoice. When an
  operator asks for a Sherweb invoice, say so plainly and offer charge-level
  reconciliation or the AR balance instead. Invoice documents live in the
  Sherweb partner portal.

### Get Payable Charges

Call `sherweb_billing_payable_charges` with an explicit date range:

- **`periodFrom` / `periodTo`:** ISO 8601 dates bounding the window
  (e.g. `2026-02-01` to `2026-02-28`). You choose these; there is no period
  list to pick from.
- **`billingCycleType`:** `OneTime`, `Monthly`, or `Yearly`. If you call the
  tool with none of `billingCycleType`, `periodFrom`, or `periodTo`, the
  server elicits the cycle type from the caller before proceeding.
- **Paginate:** Set `page` (1-based) and `pageSize` for large result sets
- Returns all charges in the window with full pricing breakdown

**Example: Get monthly recurring charges for February 2026:**
- `sherweb_billing_payable_charges` with `billingCycleType=Monthly`,
  `periodFrom=2026-02-01`, `periodTo=2026-02-28`, `pageSize=100`

### Get Charge Details

Call `sherweb_billing_charge_details` with the `chargeId` of a charge returned
by `sherweb_billing_payable_charges` to see its line items, pricing tiers,
deductions, fees, and tax.

## Key Concepts

### Charge Types

Sherweb categorizes charges into three types:

| Charge Type | Description | When Generated |
|-------------|-------------|----------------|
| `Setup` | One-time provisioning or activation fees | When a new subscription is created |
| `Recurring` | Ongoing subscription charges | Each billing cycle (monthly/yearly) |
| `Usage` | Consumption-based charges (e.g., Azure metered) | Based on actual usage during the period |

### Billing Cycles

| Cycle | Description | Charge Frequency |
|-------|-------------|-----------------|
| `OneTime` | Single charge, no recurrence | Once at setup |
| `Monthly` | Charged every month | Monthly billing period |
| `Yearly` | Charged annually | Annual billing period |

### Pricing Breakdown

Every charge in Sherweb includes a detailed pricing structure:

| Field | Type | Description |
|-------|------|-------------|
| `listPrice` | decimal | Vendor's published list price per unit |
| `netPrice` | decimal | Partner's net price after distributor discounts |
| `quantity` | integer | Number of units (seats, licenses, etc.) |
| `prorated` | boolean | Whether the charge is prorated for a partial period |
| `proratedDays` | integer | Number of days in the prorated period |
| `subTotal` | decimal | Calculated subtotal before deductions (netPrice x quantity) |

### Deductions

Sherweb applies deductions to reduce the partner's cost. Deductions come in three types:

| Deduction Type | Description | Calculation |
|----------------|-------------|-------------|
| `PromotionalMoney` | Fixed dollar amount promotional discount | Subtracted from subTotal |
| `PromotionalPercentage` | Percentage-based promotional discount | Percentage off subTotal |
| `PerformancePercentage` | Performance-based rebate for hitting volume targets | Percentage off subTotal |

### Fees and Taxes

After deductions, additional line items may apply:

| Item | Description |
|------|-------------|
| `fees` | Administrative or platform fees added by Sherweb |
| `taxes` | Applicable sales tax, GST, HST, or VAT |
| `total` | Final amount payable (subTotal - deductions + fees + taxes) |

### MSP Margin Calculation

To calculate your MSP margin on a Sherweb charge:

```
MSP Cost     = charge.total (what you pay Sherweb)
Client Price = your retail price to the customer
Margin       = Client Price - MSP Cost
Margin %     = (Margin / Client Price) * 100
```

**Tips for margin analysis:**

1. Compare `listPrice` vs `netPrice` to see your distributor discount
2. Factor in deductions -- promotional discounts reduce your cost
3. Performance percentage deductions reward volume; track these quarterly
4. Setup charges are one-time -- amortize across the subscription term for accurate monthly margin
5. Usage charges fluctuate -- use historical averages for margin forecasting

## Field Reference

### Payable Charge Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Charge unique identifier |
| `customerId` | string | Customer the charge belongs to |
| `customerName` | string | Customer display name |
| `subscriptionId` | string | Associated subscription |
| `productName` | string | Product or SKU name |
| `chargeType` | string | Setup, Recurring, or Usage |
| `billingCycle` | string | OneTime, Monthly, or Yearly |
| `listPrice` | decimal | Vendor list price per unit |
| `netPrice` | decimal | Partner net price per unit |
| `quantity` | integer | Number of units |
| `prorated` | boolean | Whether charge is prorated |
| `proratedDays` | integer | Days in prorated period |
| `subTotal` | decimal | Subtotal before deductions |
| `deductions` | array | List of applied deductions |
| `fees` | decimal | Additional fees |
| `taxes` | decimal | Tax amount |
| `total` | decimal | Final payable amount |

> **No invoice fields are documented here** because no tool on this server
> returns an invoice. See *What this plugin cannot retrieve*, above.

## Common Workflows

### Monthly Billing Reconciliation

1. Determine the window you want from the calendar — there is no period list
   to read it from
2. Call `sherweb_billing_payable_charges` with `periodFrom` and `periodTo` set
   to that window and `billingCycleType` set to the cycle you are reconciling,
   paginating through all results
3. Group charges by `customerId` to see per-customer totals
4. Compare Sherweb charges against what you bill each customer in your PSA
5. Flag discrepancies where MSP cost exceeds or is too close to client billing

### Margin Analysis Across Customers

1. Fetch all payable charges for the date range
2. For each customer, sum the `total` field across all charges
3. Compare against your retail billing to that customer
4. Calculate margin per customer and overall portfolio margin
5. Identify customers with negative or sub-target margins

### Deduction Tracking

1. Fetch payable charges and filter for entries with non-empty `deductions` arrays
2. Group deductions by type (PromotionalMoney, PromotionalPercentage, PerformancePercentage)
3. Sum total savings from each deduction category
4. Track performance percentage deductions over time to monitor volume rebate trends

### Charge Verification (there is no invoice verification workflow)

Invoice retrieval is not available through this plugin — see *What this plugin
cannot retrieve*. Verify at the charge level instead:

1. Call `sherweb_billing_payable_charges` for the window under review
2. For each charge worth scrutiny, call `sherweb_billing_charge_details` with
   its `chargeId` to see the line items, deductions, fees, and tax
3. Cross-reference those line items against what you expected to be provisioned
4. Verify totals and flag discrepancies. To confirm the invoice document
   itself, open it in the Sherweb partner portal — no tool here returns it.

### Cost Forecasting

1. Pull 3-6 months of history by calling `sherweb_billing_payable_charges`
   once per month, with `periodFrom`/`periodTo` bounding each month explicitly
2. Calculate average monthly cost per customer and per product
3. Identify trends (growing seat counts, new products, usage spikes)
4. Project next month's Sherweb costs for budget planning

## Response Examples

**Payable Charge:**

```json
{
  "id": "chg-2026-02-001",
  "customerId": "cust-abc-123",
  "customerName": "Acme Corporation",
  "subscriptionId": "sub-def-456",
  "productName": "Microsoft 365 Business Premium",
  "chargeType": "Recurring",
  "billingCycle": "Monthly",
  "listPrice": 22.00,
  "netPrice": 17.10,
  "quantity": 25,
  "prorated": false,
  "proratedDays": null,
  "subTotal": 427.50,
  "deductions": [
    {
      "type": "PerformancePercentage",
      "description": "Volume rebate - Gold tier",
      "percentage": 3.0,
      "amount": 12.83
    }
  ],
  "fees": 0.00,
  "taxes": 33.17,
  "total": 447.84
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| No charges found | The `periodFrom`/`periodTo` window contains no charges, or the wrong `billingCycleType` was requested | Widen the date range and re-check the cycle type. There is no period list to validate against — the window is whatever you passed |
| Charge details unavailable | Charge ID does not exist | Verify the charge ID from the `sherweb_billing_payable_charges` result |
| Authentication error | Expired or invalid token | Re-authenticate using OAuth 2.0 client credentials flow |

## Best Practices

1. **Track deductions** - Monitor promotional and performance deductions to ensure you receive expected discounts
2. **Watch for proration** - Prorated charges indicate mid-cycle changes; verify they match subscription modifications
3. **Separate charge types** - Analyze Setup, Recurring, and Usage charges independently for accurate cost modeling
4. **Calculate true margin** - Include fees and taxes in margin calculations, not just netPrice vs listPrice
5. **Monitor usage charges** - Usage-based charges (Azure, etc.) can spike unexpectedly; set up alerts
6. **Plan for billing cycles** - Annual charges create cash flow events; plan for yearly renewal months
7. **Use performance rebates strategically** - Consolidate purchasing through Sherweb to maximize performance percentage deductions

## Related Skills

- [Sherweb API Patterns](../api-patterns/SKILL.md) - Authentication, endpoints, and rate limits
- [Sherweb Customers](../customers/SKILL.md) - Customer management and hierarchy
- [Sherweb Subscriptions](../subscriptions/SKILL.md) - Subscription lifecycle and quantity management
