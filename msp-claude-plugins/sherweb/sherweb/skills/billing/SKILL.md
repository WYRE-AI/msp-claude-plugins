---
name: "Sherweb Billing"
description: >
  Sherweb distributor billing: billing periods, Setup/Recurring/Usage charge types,
  billing cycles (OneTime, Monthly, Yearly), the pricing breakdown (listPrice,
  netPrice, prorated, subTotal), promotional and performance deductions, fees,
  taxes, invoices, and MSP margin calculation.
when_to_use: >-
  When reviewing Sherweb payable charges, invoices, costs, or MSP margins. Use when:
  sherweb billing, sherweb invoice, sherweb charges, sherweb payable, sherweb pricing,
  sherweb deductions, sherweb fees, sherweb taxes, sherweb margin, sherweb cost,
  sherweb billing period, sherweb recurring, or sherweb prorated.
---

# Sherweb Distributor Billing

## Overview

Billing in Sherweb represents the financial data flowing from the distributor to the service provider (MSP). When Sherweb provisions or manages cloud subscriptions on behalf of an MSP's customers, it generates payable charges that roll up into billing periods. Each charge includes detailed pricing breakdown with list prices, net prices, proration, deductions (promotional and performance), fees, and taxes. Understanding Sherweb billing data is critical for MSPs to calculate margins, reconcile invoices, and ensure accurate client billing.

## Anti-triggers

- **An invoice the MSP sends to a client** — Sherweb charges are money the
  MSP *owes* the distributor, the opposite direction to the accounting and
  PSA plugins. Client-facing invoices are `quickbooks-online-invoices`,
  `xero-invoices`, `autotask-billing`, or `halopsa-invoices`. Getting the
  direction wrong inverts every margin calculation.
- **The equivalent cost from the other CSP marketplace** — use
  `pax8-invoices`.
- **Comparing the two sides to find unbilled subscriptions** — that is the
  cross-vendor reconciliation itself; use `shared-skills-billing-reconciliation`.
- **Aged receivables on the MSP's own books** — Sherweb's per-customer AR
  view is the distributor platform's ledger, not the accounting system's.
  Collections work runs off `quickbooks-online-reports` or `xero-reports`; see
  `sherweb-customers` for what Sherweb's own AR data covers.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sherweb_billing_get_payable_charges` | Get payable charges for a billing period | `billingPeriodId`, `page`, `pageSize` |
| `sherweb_billing_get_billing_periods` | List available billing periods | `page`, `pageSize` |
| `sherweb_billing_get_charge_details` | Get detailed breakdown of a specific charge | `chargeId` |
| `sherweb_billing_get_invoices` | List invoices for the service provider | `page`, `pageSize`, `status` |
| `sherweb_billing_get_invoice_details` | Get a specific invoice with line items | `invoiceId` |

### Get Billing Periods

Call `sherweb_billing_get_billing_periods` to list available billing periods:

- **Paginate:** Set `page` (1-based) and `pageSize` (default 25)
- Returns billing period IDs, start/end dates, and status

**Example: List recent billing periods:**
- `sherweb_billing_get_billing_periods` with `pageSize=10`

### Get Payable Charges

Call `sherweb_billing_get_payable_charges` with a `billingPeriodId`:

- **Required:** `billingPeriodId` from the billing periods list
- **Paginate:** Set `page` and `pageSize` for large result sets
- Returns all charges for the period with full pricing breakdown

**Example: Get charges for a billing period:**
- `sherweb_billing_get_payable_charges` with `billingPeriodId=bp-2026-02`, `pageSize=100`

### Get Invoices

Call `sherweb_billing_get_invoices` to list invoices:

- **Filter by status:** Set `status` to filter (e.g., `Paid`, `Unpaid`, `Overdue`)
- **Paginate:** Set `page` and `pageSize`

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

### Billing Period Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Billing period identifier |
| `startDate` | date | Period start date |
| `endDate` | date | Period end date |
| `status` | string | Period status (Open, Closed, Processing) |
| `totalAmount` | decimal | Total charges for the period |

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

### Invoice Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Invoice unique identifier |
| `invoiceNumber` | string | Human-readable invoice number |
| `invoiceDate` | date | Date invoice was issued |
| `dueDate` | date | Payment due date |
| `status` | string | Invoice status (Paid, Unpaid, Overdue) |
| `totalAmount` | decimal | Invoice total |
| `currency` | string | Currency code (e.g., USD, CAD) |
| `lineItems` | array | Itemized charges on the invoice |

## Common Workflows

### Monthly Billing Reconciliation

1. Call `sherweb_billing_get_billing_periods` to find the current or most recent closed period
2. Call `sherweb_billing_get_payable_charges` with the `billingPeriodId`, paginating through all results
3. Group charges by `customerId` to see per-customer totals
4. Compare Sherweb charges against what you bill each customer in your PSA
5. Flag discrepancies where MSP cost exceeds or is too close to client billing

### Margin Analysis Across Customers

1. Fetch all payable charges for the billing period
2. For each customer, sum the `total` field across all charges
3. Compare against your retail billing to that customer
4. Calculate margin per customer and overall portfolio margin
5. Identify customers with negative or sub-target margins

### Deduction Tracking

1. Fetch payable charges and filter for entries with non-empty `deductions` arrays
2. Group deductions by type (PromotionalMoney, PromotionalPercentage, PerformancePercentage)
3. Sum total savings from each deduction category
4. Track performance percentage deductions over time to monitor volume rebate trends

### Invoice Verification

1. Call `sherweb_billing_get_invoices` to list recent invoices
2. For each invoice, call `sherweb_billing_get_invoice_details` with the `invoiceId`
3. Cross-reference invoice line items with payable charges from the billing period
4. Verify totals match and flag any discrepancies

### Cost Forecasting

1. Pull 3-6 months of historical billing periods
2. For each period, get all payable charges
3. Calculate average monthly cost per customer and per product
4. Identify trends (growing seat counts, new products, usage spikes)
5. Project next month's Sherweb costs for budget planning

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
| Billing period not found | Invalid `billingPeriodId` | List available periods with `sherweb_billing_get_billing_periods` |
| No charges found | Period has no charges or wrong period selected | Verify the billing period dates cover the expected range |
| Charge details unavailable | Charge ID does not exist | Verify the charge ID from the payable charges list |
| Invoice not found | Invalid `invoiceId` | List invoices with `sherweb_billing_get_invoices` |
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
