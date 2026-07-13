---
description: Change subscription seat/license quantity for a Sherweb customer
argument-hint: "<customer> <subscription> <quantity>"
arguments: [customer, subscription, quantity]
---

# Change Sherweb Subscription Quantity

Change the seat or license quantity on a subscription for a customer. Specify the new total quantity (not a delta). The change is applied immediately or enters a pending state depending on the vendor.

## Prerequisites

- Sherweb MCP server connected with valid credentials
- MCP tools `sherweb_customers_list`, `sherweb_subscriptions_list`, `sherweb_subscriptions_get`, and `sherweb_subscriptions_change_quantity` available
- Subscription must be in `Active` state
- New quantity must be within the product's minimum/maximum limits

## Steps

1. **Resolve customer** - Find the customer by name or ID

   - If a name was provided, call `sherweb_customers_list` with `search` set to the customer name
   - If an ID was provided, call `sherweb_customers_get` with `customerId`

2. **Resolve subscription** - Find the subscription by ID or product name

   - If a subscription ID was provided, call `sherweb_subscriptions_get` with `subscriptionId`
   - If a product name was provided, call `sherweb_subscriptions_list` with `customerId` and `status=Active`, then find the subscription matching the product name

3. **Validate the change**

   - Verify the subscription is in `Active` state
   - Verify the new quantity is different from the current quantity
   - Verify the new quantity is greater than 0

4. **Present change summary** for user confirmation

   Show: customer name, product, current quantity, new quantity, and any warnings about commitment terms

5. **Execute the quantity change**

   Call `sherweb_subscriptions_change_quantity` with:
   - `subscriptionId` set to the resolved subscription ID
   - `quantity` set to the new total quantity

6. **Verify the change**

   Call `sherweb_subscriptions_get` with the `subscriptionId` to confirm the new quantity is applied

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| customer | string | Yes | - | Customer name or ID |
| subscription | string | Yes | - | Subscription ID or product name |
| quantity | integer | Yes | - | New total quantity (absolute, not delta) |

## Examples

### Increase Seats by Product Name

```
/change-quantity --customer "Acme Corp" --subscription "Microsoft 365 Business Premium" --quantity 30
```

### Decrease Seats

```
/change-quantity --customer "Acme Corp" --subscription "Microsoft 365 Business Premium" --quantity 20
```

### By Subscription ID

```
/change-quantity --customer "cust-abc-123" --subscription "sub-def-456" --quantity 30
```

### By Customer ID and Product Name

```
/change-quantity --customer "cust-abc-123" --subscription "SentinelOne Singularity Control" --quantity 50
```

### Minimal Increase

```
/change-quantity --customer "Acme Corp" --subscription "Exchange Online Plan 1" --quantity 6
```

## Output

### Change Summary (Pre-Confirmation)

```
Subscription Quantity Change
================================================================

Customer:     Acme Corporation
Product:      Microsoft 365 Business Premium
Subscription: sub-def-456

Current Quantity: 25 seats
New Quantity:     30 seats (+5 seats)

Billing Impact:
  - Additional seats will be prorated for the current billing period
  - Full charge for new quantity starts next billing cycle

Proceed with quantity change? (Review details above)

================================================================
```

### Successful Change

```
Quantity Change Successful
================================================================

Customer:     Acme Corporation
Product:      Microsoft 365 Business Premium
Subscription: sub-def-456

Previous Quantity: 25 seats
New Quantity:      30 seats (+5 seats)
Effective Date:    2026-03-10
Status:            Completed

Next Steps:
  - Verify in billing: /billing-summary --customer "Acme Corporation"
  - Check subscriptions: /subscription-status --customer "Acme Corporation"

================================================================
```

### Pending Change

```
Quantity Change Submitted
================================================================

Customer:     Acme Corporation
Product:      Microsoft 365 Business Premium
Subscription: sub-def-456

Previous Quantity: 25 seats
New Quantity:      30 seats (+5 seats)
Status:            Pending

The change is being processed by the vendor. This may take a few minutes.
Check status: /subscription-status --customer "Acme Corporation"

================================================================
```

### Decrease Warning

```
Subscription Quantity Change
================================================================

Customer:     Acme Corporation
Product:      SentinelOne Singularity Control
Subscription: sub-ghi-789

Current Quantity: 40 seats
New Quantity:     35 seats (-5 seats)

WARNING: This subscription has a yearly billing cycle.
Quantity decreases may be restricted until the renewal date (2026-08-15).
If the decrease is rejected, you may need to wait until renewal.

Proceed with quantity change? (Review details above)

================================================================
```

### Validation Error - Same Quantity

```
Error: New quantity (25) is the same as current quantity (25)

No change needed. Specify a different quantity.
```

### Validation Error - Invalid State

```
Error: Cannot modify subscription in "Suspended" state

The subscription must be Active to change quantity.
Current status: Suspended

Resolution:
  - Resolve the suspension reason before modifying
  - Contact Sherweb support if the suspension is unexpected
```

### Validation Error - Quantity Restricted

```
Error: Quantity change rejected

The vendor does not allow decreasing quantity from 40 to 35 on this subscription.
Reason: Annual commitment active until 2026-08-15.

Options:
  - Wait until renewal date (2026-08-15) to decrease
  - Contact Sherweb support for exceptions
  - Increase quantity instead (no restrictions)
```

### Customer Not Found

```
Customer not found: "Unknown Corp"

Suggestions:
  - Check spelling of the customer name
  - Try a partial name match
  - Use the customer ID directly
  - List all customers: /list-customers
```

### Subscription Not Found

```
Subscription not found: "Nonexistent Product"

No active subscription matching "Nonexistent Product" was found for Acme Corporation.

Active subscriptions for this customer:
  - Microsoft 365 Business Premium (sub-def-456)
  - Microsoft 365 Business Basic (sub-ghi-789)
  - SentinelOne Singularity Control (sub-jkl-012)

Try again with one of the above product names or subscription IDs.
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to Sherweb MCP server

Check your MCP configuration and verify credentials at cumulus.sherweb.com > Security > APIs
```

### Authentication Error

```
Error: Authentication failed (401)

Your Sherweb OAuth token may have expired. Verify your Client ID and Client Secret.
```

### Rate Limit

```
Error: Rate limit exceeded (429)

Please wait a moment and try again.
```

### Conflict Error

```
Error: A quantity change is already pending for this subscription (409)

Wait for the current change to complete before submitting another.
Check status: /subscription-status --customer "Acme Corporation"
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `sherweb_customers_list` | Find customer by name |
| `sherweb_customers_get` | Get customer by ID |
| `sherweb_subscriptions_list` | Find subscription by customer and product |
| `sherweb_subscriptions_get` | Get current subscription details |
| `sherweb_subscriptions_change_quantity` | Execute the quantity change |

## Related Commands

- `/subscription-status` - View current subscriptions before making changes
- `/list-customers` - Find customer names and IDs
- `/billing-summary` - Check billing impact after changes
