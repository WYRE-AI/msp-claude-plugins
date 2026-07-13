---
name: "Sherweb Subscriptions"
description: >
  Use this skill when working with Sherweb subscriptions - viewing
  subscriptions, changing quantities, license management, subscription
  lifecycle, and quantity change workflows. Covers subscription states,
  seat adjustments, and provisioning status.
when_to_use: >-
  When viewing subscriptions, changing quantities, license management, subscription lifecycle, and
  quantity change workflows. Use when: sherweb subscription, sherweb license, sherweb seat,
  sherweb quantity, sherweb provision, sherweb activate, sherweb cancel subscription, subscription
  management sherweb, license management sherweb, seat count sherweb, change quantity sherweb, or
  subscription lifecycle sherweb.
---

# Sherweb Subscription Management

## Overview

Subscriptions in Sherweb represent active cloud product licenses assigned to a customer through the distributor platform. When the MSP provisions a product for a customer via Sherweb, a subscription is created that tracks the product, quantity (seats/licenses), billing cycle, and status. Subscriptions are the core ongoing entity that MSPs manage -- adjusting seat counts as clients grow or contract, monitoring provisioning status, and ensuring license compliance.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sherweb_subscriptions_list` | List subscriptions, optionally filtered by customer | `customerId`, `page`, `pageSize`, `status` |
| `sherweb_subscriptions_get` | Get detailed information about a specific subscription | `subscriptionId` (required) |
| `sherweb_subscriptions_change_quantity` | Change the seat/license quantity on a subscription | `subscriptionId` (required), `quantity` (required) |

### List Subscriptions

Call `sherweb_subscriptions_list` with optional parameters:

- **Filter by customer:** Set `customerId` to a customer ID
- **Filter by status:** Set `status` to one of the allowed values (see below)
- **Paginate:** Set `page` (1-based) and `pageSize` (default 25)

**Example: List all active subscriptions for a customer:**
- `sherweb_subscriptions_list` with `customerId=cust-abc-123`, `status=Active`, `pageSize=100`

**Example: List all subscriptions across all customers:**
- `sherweb_subscriptions_list` with `pageSize=100`

### Get Subscription Details

Call `sherweb_subscriptions_get` with the `subscriptionId` parameter.

**Example:**
- `sherweb_subscriptions_get` with `subscriptionId=sub-def-456`

### Change Subscription Quantity

Call `sherweb_subscriptions_change_quantity` with:

- **Required:** `subscriptionId` - the subscription to modify
- **Required:** `quantity` - the new desired quantity (absolute number, not a delta)

**Example: Increase seats from 25 to 30:**
- `sherweb_subscriptions_change_quantity` with `subscriptionId=sub-def-456`, `quantity=30`

## Key Concepts

### Subscription Lifecycle

```
Provisioning --> Active --> [Modify Quantity / Cancel] --> Cancelled
                   |                |
              Suspended        PendingChange
                   |
              Reactivated --> Active
```

### Subscription States

| State | Description |
|-------|-------------|
| `Active` | Subscription is live, provisioned, and billing |
| `Suspended` | Subscription temporarily paused (payment or compliance issue) |
| `Cancelled` | Subscription has been terminated |
| `Provisioning` | Initial setup in progress |
| `PendingChange` | A quantity or configuration change is being processed |
| `PendingCancellation` | Cancellation request submitted, not yet complete |
| `Failed` | Provisioning or modification failed |

### Quantity Management

The `quantity` field represents the number of licenses (seats, devices, or units depending on the product). Key rules:

- **Increasing quantity** - Generally immediate or near-immediate provisioning
- **Decreasing quantity** - May be restricted by vendor commitment terms or minimum quantities
- **Quantity is absolute** - When changing, specify the new total quantity, not the delta
- **Proration** - Mid-cycle changes are prorated in the next billing period
- **Minimum quantity** - Some products have minimum seat requirements
- **Maximum quantity** - Some products have maximum seat limits

### Quantity Change Workflow

1. **Verify current state** - Ensure subscription is `Active` (not Suspended, PendingChange, etc.)
2. **Check current quantity** - Call `sherweb_subscriptions_get` to see the current seat count
3. **Validate new quantity** - Ensure the new quantity meets product minimum/maximum requirements
4. **Submit change** - Call `sherweb_subscriptions_change_quantity` with the new quantity
5. **Verify change** - Call `sherweb_subscriptions_get` again to confirm the change was applied
6. **Monitor billing** - Check the next billing period for prorated charges reflecting the change

## Field Reference

### Subscription Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Subscription unique identifier |
| `customerId` | string | Customer this subscription belongs to |
| `customerName` | string | Customer display name |
| `productName` | string | Product or SKU name |
| `productId` | string | Product identifier |
| `quantity` | integer | Current number of licenses/seats |
| `status` | string | Current subscription state |
| `billingCycle` | string | Billing frequency (Monthly, Yearly) |
| `startDate` | date | Subscription start date |
| `endDate` | date | Subscription end date (for term commitments) |
| `renewalDate` | date | Next renewal date |
| `createdDate` | datetime | When the subscription was created |
| `modifiedDate` | datetime | Last modification timestamp |
| `autoRenew` | boolean | Whether the subscription auto-renews |

### Quantity Change Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | string | Subscription that was modified |
| `previousQuantity` | integer | Quantity before the change |
| `newQuantity` | integer | Quantity after the change |
| `status` | string | Change status (Completed, Pending, Failed) |
| `effectiveDate` | date | When the change takes effect |

## Common Workflows

### Check Subscriptions for a Customer

1. Find the customer ID using `sherweb_customers_list` with `search`
2. Call `sherweb_subscriptions_list` with `customerId` and `status=Active`
3. Review subscription list with product names, quantities, and billing cycles

### License Count Audit

1. Call `sherweb_customers_list` to get all customers (paginate through all pages)
2. For each customer, call `sherweb_subscriptions_list` with `customerId` and `status=Active`
3. Build a report: customer name, product, quantity, billing cycle
4. Cross-reference with actual usage data from the vendor (e.g., Microsoft 365 admin center)
5. Flag over-provisioned subscriptions for quantity reduction

### Increase Seats for a Customer

1. Find the subscription with `sherweb_subscriptions_list` filtered by `customerId`
2. Verify the subscription is `Active` and note the current `quantity`
3. Call `sherweb_subscriptions_change_quantity` with the new (higher) quantity
4. Verify the change with `sherweb_subscriptions_get`
5. Confirm billing impact in the next period's payable charges

### Decrease Seats for a Customer

1. Find the subscription and verify current quantity
2. Check if the product has minimum quantity requirements
3. Verify commitment terms allow decreases (annual commitments may restrict decreases)
4. Call `sherweb_subscriptions_change_quantity` with the new (lower) quantity
5. If the change is rejected, note the error and inform the customer of restrictions
6. Verify the change and monitor billing for prorated credits

### Subscription Renewal Review

1. Call `sherweb_subscriptions_list` with `status=Active`
2. Filter for subscriptions with `renewalDate` within the next 30 days
3. For each upcoming renewal, prepare a review list: customer, product, quantity, cost
4. Discuss with customers whether to renew, modify, or cancel

### Subscription Status Report

1. Call `sherweb_subscriptions_list` with `pageSize=100` (no status filter to get all)
2. Group results by status and calculate totals
3. Present: Active count, Suspended count, Pending changes, recent cancellations

## Response Examples

**Subscription:**

```json
{
  "id": "sub-def-456",
  "customerId": "cust-abc-123",
  "customerName": "Acme Corporation",
  "productName": "Microsoft 365 Business Premium",
  "productId": "prod-m365-bp",
  "quantity": 25,
  "status": "Active",
  "billingCycle": "Monthly",
  "startDate": "2025-06-01",
  "endDate": null,
  "renewalDate": "2026-04-01",
  "createdDate": "2025-05-28T14:30:00.000Z",
  "modifiedDate": "2026-02-15T09:00:00.000Z",
  "autoRenew": true
}
```

**Quantity Change Response:**

```json
{
  "subscriptionId": "sub-def-456",
  "previousQuantity": 25,
  "newQuantity": 30,
  "status": "Completed",
  "effectiveDate": "2026-03-10"
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Subscription not found | Invalid `subscriptionId` | Verify the ID with `sherweb_subscriptions_list` |
| Invalid quantity | Below minimum or above maximum | Check product requirements for quantity limits |
| Cannot modify | Subscription not in Active state | Verify subscription status before attempting changes |
| Quantity decrease restricted | Annual commitment prevents decrease | Wait for renewal period or contact Sherweb support |
| Change already pending | A previous change is still processing | Wait for the pending change to complete before submitting another |
| Authentication error | Expired or invalid token | Re-authenticate using OAuth 2.0 client credentials flow |

### State Transition Errors

| Current State | Attempted Action | Notes |
|---------------|-----------------|-------|
| Cancelled | Change quantity | Cannot modify cancelled subscriptions |
| Suspended | Change quantity | Resolve suspension before modifying |
| Provisioning | Change quantity | Wait for provisioning to complete |
| PendingChange | Change quantity | Wait for current change to finish |
| PendingCancellation | Change quantity | Cannot modify during cancellation |

## Best Practices

1. **Check state before modifying** - Always verify the subscription is `Active` before changing quantity
2. **Use absolute quantities** - Specify the total desired seat count, not a delta (+5 or -3)
3. **Verify after changes** - Always re-fetch the subscription to confirm the change applied
4. **Understand commitment terms** - Annual or multi-year commitments restrict quantity decreases
5. **Monitor pending states** - Subscriptions in pending states need follow-up attention
6. **Plan renewals ahead** - Review upcoming renewals 30 days in advance
7. **Track quantity history** - Document quantity changes for audit purposes
8. **Optimize regularly** - Monthly review of seat counts vs actual usage prevents waste
9. **Use customer filter** - Always filter by `customerId` when checking a specific client
10. **Respect rate limits** - When iterating through all customers' subscriptions, pace API calls appropriately

## Related Skills

- [Sherweb API Patterns](../api-patterns/SKILL.md) - Authentication, endpoints, and rate limits
- [Sherweb Customers](../customers/SKILL.md) - Customer management and hierarchy
- [Sherweb Billing](../billing/SKILL.md) - Billing impact of subscription changes
