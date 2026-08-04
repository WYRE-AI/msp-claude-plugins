---
name: "Pax8 Subscriptions"
description: >
  Pax8 subscriptions: license and seat counts, the full subscription lifecycle and its
  states, change history, filtering by company or product, and quantity management for
  license optimization.
when_to_use: >-
  When checking license status, seat counts, subscription state, or change history for a
  client's Pax8 subscriptions. Use when: pax8 subscription, pax8 license, pax8 seat,
  pax8 provision, pax8 cancel, subscription management, license management, seat count,
  pax8 activate, license optimization, subscription lifecycle, or subscription status.
---

# Pax8 Subscription Lifecycle Management

## Overview

Subscriptions in Pax8 represent active cloud product licenses assigned to a client company. When an order is placed and provisioned, it creates a subscription. Subscriptions are the core ongoing entity that MSPs manage -- adjusting seat counts as clients hire or leave, upgrading plans, or cancelling when a product is no longer needed. Every subscription is tied to a company and a product, with a quantity (seat count), billing term, and status.

## Anti-triggers

- **Licences bought through Sherweb** — the other CSP marketplace in this
  marketplace. Same concepts, different account, no shared IDs; use
  `sherweb-subscriptions`. A client's licences may sit in either, or
  split across both, so establish which distributor holds the product
  before reasoning about seat counts.
- **A licence assigned to a named user** — Pax8 tracks what the MSP
  *purchased*; who it is *assigned to* lives in the tenant. Use
  `m365-licensing` or `cipp-licenses`. Purchased seats and assigned seats
  legitimately differ, and reconciling them is a cross-tool comparison.
- **Changing a seat count** — no tool here does it. This surface is
  read-only; quantity changes and cancellations happen in the Pax8 portal.
  See `pax8-api-patterns` for the full read-only scope.
- **The purchase event rather than the resulting licence** — use
  `pax8-orders`; an order is the transaction, a subscription is what it
  created.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pax8-list-subscriptions` | List and filter subscriptions | `page`, `size`, `sort`, `status`, `billingTerm`, `companyId`, `productId` |
| `pax8-get-subscription-by-uuid` | Get a single subscription | `uuid` (required) |

### List Subscriptions

Call `pax8-list-subscriptions` with optional parameters:

- **Filter by company:** Set `companyId` to a company UUID
- **Filter by status:** Set `status` to one of the allowed values (see below)
- **Filter by billing term:** Set `billingTerm` to `monthly`, `annual`, `two-year`, `three-year`, `one-time`, `trial`, or `activation`
- **Filter by product:** Set `productId` to a product UUID
- **Paginate:** Set `page` (0-based) and `size` (up to 200)

**Example: List all active subscriptions for a company:**
- `pax8-list-subscriptions` with `companyId=a1b2c3d4-...`, `status=Active`, `size=200`

**Example: List all trial subscriptions:**
- `pax8-list-subscriptions` with `status=Trial`, `size=200`

**Example: List all annual subscriptions:**
- `pax8-list-subscriptions` with `billingTerm=annual`, `status=Active`, `size=200`

### Get a Single Subscription

Call `pax8-get-subscription-by-uuid` with the `uuid` parameter.

**Example:**
- `pax8-get-subscription-by-uuid` with `uuid=s1u2b3s4-c5r6-7890-abcd-ef1234567890`

## Key Concepts

### Subscription Lifecycle

```
Order Placed --> Provisioning --> Active --> [Modify/Cancel] --> Cancelled
                     |                          |
                 PendingManual            ActivePendingChange
                 PendingAutomated         PendingCancel
                 WaitingForDetails
```

### Subscription States

| State | Description |
|-------|-------------|
| `Active` | Subscription is live and billing |
| `Cancelled` | Subscription has been terminated |
| `PendingManual` | Awaiting manual provisioning by vendor |
| `PendingAutomated` | Automated provisioning in progress |
| `PendingCancel` | Cancellation request submitted, not yet complete |
| `WaitingForDetails` | Additional information needed for provisioning |
| `Trial` | Free trial period active |
| `Converted` | Trial converted to paid subscription |
| `PendingActivation` | Activation pending |
| `Activated` | Recently activated |

### Billing Terms

| Term | Description | Commitment |
|------|-------------|------------|
| Monthly | Month-to-month | Cancel anytime |
| Annual | 12-month commitment | Locked for 12 months |
| Two-Year | 24-month commitment | Locked for 24 months |
| Three-Year | 36-month commitment | Locked for 36 months |
| One-Time | Single purchase | No recurring billing |
| Trial | Free trial | No commitment |

### Quantity Management

The `quantity` field represents the number of licenses (seats, devices, or units depending on the product). Changing quantity triggers a billing adjustment:

- **Increase**: Additional seats are prorated for the current billing period
- **Decrease**: Seat reduction may be restricted by vendor commitment terms
- **Annual plans**: Seat decreases may only be allowed at renewal

## Field Reference

### Subscription Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Subscription unique identifier |
| `companyId` | UUID | Associated company ID |
| `productId` | UUID | Associated product ID |
| `quantity` | integer | Number of licenses/seats |
| `startDate` | date | Subscription start date |
| `endDate` | date | Subscription end date (for commitments) |
| `createdDate` | datetime | When the subscription was created |
| `billingStart` | date | When billing begins |
| `status` | string | Current subscription state |
| `billingTerm` | string | Billing term (Monthly, Annual) |
| `price` | decimal | Current unit price |
| `commitmentTermId` | UUID | Commitment term identifier |

### Usage Summary Fields

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | UUID | Associated subscription |
| `resourceGroup` | string | Usage resource group |
| `quantity` | decimal | Usage quantity |
| `unitOfMeasure` | string | Usage unit |
| `currentCharges` | decimal | Charges for this period |
| `date` | date | Usage date |

## Common Workflows

### Check Subscriptions for a Company

1. Find the company UUID using `pax8-list-companies` with `company_name`
2. Call `pax8-list-subscriptions` with `companyId` and `status=Active`
3. For each subscription, optionally call `pax8-get-product-by-uuid` with the `productId` to get product names

### License Optimization Across All Clients

This is one of the most valuable MSP workflows -- finding unused or underutilized licenses:

1. Call `pax8-list-companies` with `size=200` to get all companies
2. For each company, call `pax8-list-subscriptions` with `companyId` and `status=Active`
3. Build a list of all subscriptions with company name, product, quantity, billing term, and monthly cost (`quantity * price`)
4. Sort by monthly cost descending to surface the biggest savings opportunities
5. Flag subscriptions with very low seat counts or monthly billing that could switch to annual

### Subscription Status Report by Company

1. Find the company with `pax8-list-companies` or `pax8-get-company-by-uuid`
2. Call `pax8-list-subscriptions` with `companyId` and `size=200` (no status filter to get all)
3. Group results by status and calculate total monthly cost for active subscriptions

### Renewal Management

1. Call `pax8-list-subscriptions` with `status=Active` and `billingTerm=annual`
2. Review each subscription's `endDate` to find upcoming renewals
3. For renewals within the next 30 days, prepare a review list with company name, product, seat count, and pricing

### Get Usage Data for a Subscription

For usage-based products (e.g., Azure):

1. Call `pax8-get-usage-summary` with `subscriptionId` (required)
2. Optionally filter by `resourceGroup` or `companyId`
3. For detailed line-item usage, call `pax8-get-detailed-usage-summary` with the `usageSummaryId`

## Response Examples

**Subscription:**

```json
{
  "id": "s1u2b3s4-c5r6-7890-abcd-ef1234567890",
  "companyId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "productId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "quantity": 25,
  "startDate": "2025-06-01",
  "endDate": "2026-05-31",
  "createdDate": "2025-05-28T14:30:00.000Z",
  "billingStart": "2025-06-01",
  "status": "Active",
  "billingTerm": "Annual",
  "price": 17.10
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Subscription not found | Invalid UUID | Verify the UUID with `pax8-list-subscriptions` |
| Invalid status filter | Wrong status value | Use one of: Active, Cancelled, PendingManual, PendingAutomated, PendingCancel, WaitingForDetails, Trial, Converted, PendingActivation, Activated |
| Invalid billingTerm | Wrong billing term value | Use one of: monthly, annual, two-year, three-year, one-time, trial, activation |

### State Transition Errors

| Current State | Attempted Action | Notes |
|---------------|-----------------|-------|
| Cancelled | Modify quantity | Cannot modify cancelled subscription |
| PendingCancel | Modify quantity | Cannot modify during cancellation |
| PendingManual | Cancel | Cannot cancel during provisioning |
| ActivePendingChange | Modify quantity | Wait for current change to complete |

## Best Practices

1. **Check state before modifying** - Always verify the subscription is in `Active` state before making changes
2. **Understand commitment terms** - Annual subscriptions restrict quantity decreases
3. **Optimize regularly** - Review subscriptions monthly to find unused licenses
4. **Use company filter** - Always filter by `companyId` when checking a specific client's subscriptions
5. **Monitor pending states** - Subscriptions in pending states need attention
6. **Plan renewals** - Track end dates and plan renewal conversations with clients
7. **Batch operations carefully** - When checking multiple companies, respect rate limits (1000/min)
8. **Document changes** - Note why quantities were changed in your PSA or documentation
9. **Use billing term filter** - Filter by `billingTerm=monthly` to quickly find candidates for annual commitment savings

## Related Skills

- [Pax8 API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [Pax8 Companies](../companies/SKILL.md) - Company management
- [Pax8 Products](../products/SKILL.md) - Product catalog and pricing
- [Pax8 Orders](../orders/SKILL.md) - Creating new subscriptions via orders
- [Pax8 Invoices](../invoices/SKILL.md) - Billing for subscriptions
