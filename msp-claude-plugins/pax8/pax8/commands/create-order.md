---
description: Place an order for a product subscription in Pax8
argument-hint: "<company> <product> <quantity> [billing_term] [start_date]"
arguments: [company, product, quantity, billing_term, start_date]
---

# Create Pax8 Order

Place an order for a cloud product subscription on behalf of a client company. This provisions new licenses through the Pax8 marketplace.

## Prerequisites

- Pax8 MCP server connected with a valid MCP token
- MCP tools `pax8-list-companies`, `pax8-list-products`, `pax8-get-product-by-uuid`, and `pax8-get-product-pricing-by-uuid` available
- Company must exist in Pax8
- Product must be active and available for ordering
- Quantity must be within the product's min/max range

**Note:** Order creation is done through the Pax8 portal or direct API. The MCP tools support looking up all the information needed to prepare and validate an order.

## Steps

1. **Resolve company** - Find the company by name or use the provided UUID

   - If a name was provided, call `pax8-list-companies` with `company_name` set to the search term
   - If a UUID was provided, call `pax8-get-company-by-uuid` with `uuid`

2. **Resolve product** - Find the product by name or use the provided UUID

   - If a name was provided, call `pax8-list-products` with `search` set to the product name
   - If a UUID was provided, call `pax8-get-product-by-uuid` with `productId`

3. **Validate order** - Check product availability, quantity limits, and billing term

   Call `pax8-get-product-by-uuid` with the resolved `productId` to verify:
   - `active` is `true`
   - `quantity` is within `minQuantity` and `maxQuantity`
   - Requested billing term is in `billingTermOptions`

4. **Get pricing** for confirmation

   Call `pax8-get-product-pricing-by-uuid` with `productId` to show the user:
   - `partnerBuyPrice` (MSP cost)
   - `suggestedRetailPrice` (recommended client price)
   - Monthly and annual cost calculations

5. **Present order summary** for user confirmation before placing

6. **Place the order** through the Pax8 portal or API with the validated details

7. **Verify order status** by calling `pax8-list-orders` with `companyId` to confirm the order was created

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| company | string | Yes | - | Company name or UUID |
| product | string | Yes | - | Product name or UUID |
| quantity | integer | Yes | - | Number of seats/licenses |
| billing_term | string | No | Annual | Billing term (Monthly, Annual, Triennial) |
| start_date | string | No | today | Start date in YYYY-MM-DD format |

## Examples

### Basic Order

```
/create-order --company "Acme Corp" --product "Microsoft 365 Business Premium" --quantity 25
```

### Monthly Billing

```
/create-order --company "Acme Corp" --product "Microsoft Defender for Business" --quantity 25 --billing_term Monthly
```

### Future Start Date

```
/create-order --company "Acme Corp" --product "Microsoft 365 E3" --quantity 50 --start_date 2026-04-01
```

### By UUID

```
/create-order --company "a1b2c3d4-e5f6-7890-abcd-ef1234567890" --product "f9e8d7c6-b5a4-3210-fedc-ba0987654321" --quantity 10
```

## Output

### Order Confirmation

```
Order Placed Successfully
================================================================

Order ID:       o1r2d3e4-r5s6-7890-abcd-ef1234567890
Company:        Acme Corporation
Status:         Submitted
Created:        2026-02-23T14:30:00.000Z

Line Items:
+--------------------------------------------+------+----------+--------+-----------+
| Product                                    | Qty  | Term     | Price  | Monthly   |
+--------------------------------------------+------+----------+--------+-----------+
| Microsoft 365 Business Premium             | 25   | Annual   | $17.10 | $427.50   |
+--------------------------------------------+------+----------+--------+-----------+

Start Date:     2026-03-01
Est. Provision: Automated (minutes)

Total Monthly Cost: $427.50
Total Annual Cost:  $5,130.00

Next Steps:
  - Order is being provisioned automatically
  - Check status: /subscription-status --company "Acme Corporation"
  - Monitor order: Check Pax8 portal for real-time status
================================================================
```

### Order Summary (Pre-Confirmation)

```
Order Summary (Confirm Before Placing)
================================================================

Company:        Acme Corporation
Product:        Microsoft 365 Business Premium
Quantity:       25 users
Billing Term:   Annual (12-month commitment)
Start Date:     2026-03-01

Pricing:
  Unit Price:   $17.10/user/month
  Monthly Cost: $427.50
  Annual Cost:  $5,130.00

Annual savings vs. Monthly: $540.00 ($1.80/user/month)

WARNING: Annual billing term creates a 12-month commitment.
         Seat decreases may be restricted during the commitment period.

Proceed with order? (Review details above)
================================================================
```

### Validation Errors

```
Order Validation Failed
================================================================

Issues found:
  1. Quantity 500 exceeds maximum of 300 for "Microsoft 365 Business Premium"
  2. Annual billing term not available for this product

Suggestions:
  - Reduce quantity to 300 or fewer
  - Use Monthly billing term instead
  - Check product details: /search-products "Microsoft 365 Business Premium" --show_pricing

================================================================
```

### Company Not Found

```
Company not found: "Unknown Corp"

Suggestions:
  - Check spelling of the company name
  - Try a partial name match
  - Use the company UUID directly
  - Create the company first in Pax8 portal
```

### Product Not Found

```
Product not found: "Nonexistent Product"

Suggestions:
  - Check spelling of the product name
  - Search the catalog: /search-products "product name"
  - Browse by vendor: /search-products "" --vendor Microsoft
  - Verify the product is available in your Pax8 catalog
```

## Billing Term Reference

| Term | Commitment | Seat Changes | Discount |
|------|-----------|--------------|----------|
| Monthly | None | Increase/decrease anytime | Standard price |
| Annual | 12 months | Increase anytime, decrease restricted | ~10% discount |
| Triennial | 36 months | Increase anytime, decrease restricted | ~15% discount |

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to Pax8 MCP server

Check your MCP configuration and regenerate the token at app.pax8.com/integrations/mcp
```

### Rate Limit

```
Error: Rate limit exceeded (429)

Please wait a moment and try again.
The Pax8 API allows 1000 requests per minute.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `pax8-list-companies` | Find company by name |
| `pax8-get-company-by-uuid` | Get company by UUID |
| `pax8-list-products` | Find product by name |
| `pax8-get-product-by-uuid` | Validate product details |
| `pax8-get-product-pricing-by-uuid` | Get pricing for confirmation |
| `pax8-list-orders` | Verify order was created |
| `pax8-get-order-by-uuid` | Check order status |

## Related Commands

- `/search-products` - Find products before ordering
- `/subscription-status` - Check existing subscriptions
- `/license-summary` - View all licenses across clients
