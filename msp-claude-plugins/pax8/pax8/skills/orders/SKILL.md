---
name: "Pax8 Orders"
description: >
  Pax8 orders: order retrieval, order line items, provisioning status and timelines,
  billing terms, and the order-to-subscription workflow.
when_to_use: >-
  When viewing orders, tracking provisioning status, or following an order through to an
  active subscription. Use when: pax8 order, pax8 purchase, pax8 provision, pax8 buy,
  place order pax8, order status, order tracking, new subscription order, or pax8
  ordering.
---

# Pax8 Order Management

## Overview

Orders in Pax8 are the mechanism for provisioning new cloud subscriptions for client companies. When an MSP needs to set up a new product for a client -- whether it is Microsoft 365 licenses, a security tool, or backup solution -- they create an order. The order contains one or more line items, each specifying a product, quantity, and billing term. Once submitted, the order is processed and, upon successful provisioning, creates one or more subscriptions.

## Anti-triggers

- **What the client currently has** — an order is a historical purchase
  event; the live licence state is `pax8-subscriptions`. An order that
  provisioned twelve months ago tells you nothing about today's seat
  count.
- **What the MSP owes for it** — orders do not carry the charge; use
  `pax8-invoices`.
- **A quote to the client** — a Pax8 order is the MSP buying from the
  distributor, not the client buying from the MSP. Client-facing quoting
  lives in `connectwise-cpq-quotes` or `autotask-quotes`.
- **A purchase order in the accounting system** — use
  `qbo-expenses` or `xero-invoices`; a Pax8 order is not a PO on
  the books.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pax8-list-orders` | List orders with optional filters | `page`, `size`, `companyId` |
| `pax8-get-order-by-uuid` | Get a single order's details | `uuid` (required) |

### List Orders

Call `pax8-list-orders` with optional parameters:

- **Filter by company:** Set `companyId` to a company UUID
- **Paginate:** Set `page` (0-based) and `size` (up to 200)

**Example: List all orders for a company:**
- `pax8-list-orders` with `companyId=a1b2c3d4-...`, `size=200`

**Example: List recent orders (first page):**
- `pax8-list-orders` with `page=0`, `size=50`

### Get a Single Order

Call `pax8-get-order-by-uuid` with the `uuid` parameter.

**Example:**
- `pax8-get-order-by-uuid` with `uuid=o1r2d3e4-r5s6-7890-abcd-ef1234567890`

## Key Concepts

### Order Lifecycle

```
Create Order --> Processing --> Provisioning --> Completed --> Subscription Created
                                    |
                               PendingManual
                               (vendor action needed)
```

### Order States

| State | Description |
|-------|-------------|
| `Submitted` | Order received and being processed |
| `Processing` | Order is being provisioned |
| `Completed` | Order fulfilled; subscriptions created |
| `Failed` | Order could not be provisioned |
| `PendingApproval` | Awaiting MSP approval (self-service orders) |
| `Cancelled` | Order was cancelled before completion |

### Line Items

Each order contains one or more line items. Each line item corresponds to a single product:

| Concept | Description |
|---------|-------------|
| Product | The cloud software being ordered |
| Quantity | Number of seats/licenses |
| Billing Term | Monthly, Annual, or Triennial |
| Provision Start Date | When the subscription should begin |

### Order-to-Subscription Flow

1. **MSP creates an order** with line items for one or more products
2. **Pax8 processes the order** and initiates provisioning with the vendor
3. **Provisioning completes** (automated: seconds/minutes; manual: hours/days)
4. **Subscription is created** and becomes Active
5. **Billing begins** on the provision start date

## Field Reference

### Order Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | System | Order unique identifier |
| `companyId` | UUID | Yes | Company the order is for |
| `lineItems` | array | Yes | Products being ordered |
| `status` | string | System | Current order status |
| `createdDate` | datetime | System | When the order was placed |
| `orderedBy` | string | System | Who placed the order |

### Line Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | System | Line item unique identifier |
| `productId` | UUID | Yes | Product being ordered |
| `quantity` | integer | Yes | Number of licenses |
| `billingTerm` | string | Yes | Billing term (Monthly, Annual) |
| `provisionStartDate` | date | No | When subscription starts |
| `lineItemNumber` | integer | System | Position in the order |

## Common Workflows

### Track Order Provisioning Status

1. Call `pax8-get-order-by-uuid` with the order's `uuid`
2. Check the `status` field for the current state
3. Review each line item for product details and quantities
4. If status is not `Completed`, check back periodically

### View Order History for a Client

1. Find the company UUID using `pax8-list-companies` with `company_name`
2. Call `pax8-list-orders` with `companyId` and `size=200`
3. Paginate if needed to get all orders
4. Review order dates, statuses, and line items

### Verify Order Created Subscriptions

1. After an order shows `Completed` status, call `pax8-list-subscriptions` with `companyId`
2. Look for subscriptions matching the ordered product IDs
3. Verify quantities and billing terms match the original order

### Standard MSP Onboarding Order Verification

When onboarding a new client, verify the typical stack was ordered:

1. Call `pax8-list-orders` with the `companyId`
2. Check that orders exist for the expected products (M365, security, backup)
3. Verify each order reached `Completed` status
4. Cross-reference with `pax8-list-subscriptions` to confirm active subscriptions

## Response Examples

**Order:**

```json
{
  "id": "o1r2d3e4-r5s6-7890-abcd-ef1234567890",
  "companyId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "Completed",
  "createdDate": "2026-02-20T09:15:00.000Z",
  "orderedBy": "partner@msp.com",
  "lineItems": [
    {
      "id": "l1i2n3e4-i5t6-7890-abcd-ef1234567890",
      "productId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
      "quantity": 25,
      "billingTerm": "Annual",
      "provisionStartDate": "2026-03-01",
      "lineItemNumber": 1
    }
  ]
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Order not found | Invalid UUID | Verify the order UUID with `pax8-list-orders` |
| No orders found | Company has no orders | Verify the company UUID is correct |

### Order State Issues

| State | Meaning | Action |
|-------|---------|--------|
| `Failed` | Provisioning failed | Check the Pax8 portal for details; may need to resubmit |
| `PendingApproval` | Awaiting approval | Approve in the Pax8 portal if `orderApprovalRequired` is set |
| `Cancelled` | Order was cancelled | Create a new order if still needed |

## Billing Term Reference

| Term | Commitment | Seat Changes | Discount |
|------|-----------|--------------|----------|
| Monthly | None | Increase/decrease anytime | Standard price |
| Annual | 12 months | Increase anytime, decrease restricted | ~10% discount |
| Triennial | 36 months | Increase anytime, decrease restricted | ~15% discount |

## Best Practices

1. **Validate before ordering** - Check company, product, and quantity before submitting orders in the Pax8 portal
2. **Use annual billing** - Annual commitments save money; recommend to clients
3. **Bundle line items** - Include all products in a single order when possible
4. **Track provisioning** - Monitor order status until completion using `pax8-get-order-by-uuid`
5. **Check product availability** - Use `pax8-get-product-by-uuid` to verify products are active before ordering
6. **Handle failures gracefully** - Failed orders may need to be resubmitted
7. **Respect quantity limits** - Stay within product min/max quantity bounds
8. **Document orders** - Record order IDs in your PSA for cross-reference
9. **Test with small quantities** - For new products, test with minimal seats before scaling up
10. **Verify subscriptions** - After order completion, confirm subscriptions are active with `pax8-list-subscriptions`

## Related Skills

- [Pax8 API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [Pax8 Products](../products/SKILL.md) - Product catalog and pricing
- [Pax8 Subscriptions](../subscriptions/SKILL.md) - Managing resulting subscriptions
- [Pax8 Companies](../companies/SKILL.md) - Company management
- [Pax8 Invoices](../invoices/SKILL.md) - Billing for orders
