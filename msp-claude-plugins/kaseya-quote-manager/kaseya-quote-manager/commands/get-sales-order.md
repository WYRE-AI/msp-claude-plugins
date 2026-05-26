---
name: get-sales-order
description: Get a Kaseya Quote Manager sales order with its lines and payments
arguments:
  - name: id
    description: Sales order ID
    required: true
---

# Get Kaseya Quote Manager Sales Order

## Prerequisites
- Kaseya Quote Manager API key configured (read-only)

## Steps
1. Retrieve the sales order: `kqm_sales_order_get` with `id=$id`
2. List its lines: `kqm_sales_order_line_list`
3. List payments: `kqm_sales_order_payment_list`
4. Display the order with lines, totals, and payment status

## Examples

### Get sales order by ID
```
/get-sales-order id=67890
```

## Error Handling
| Error | Resolution |
|-------|------------|
| 404 Not Found | Verify the sales order ID exists |
| 401 Unauthorized | Verify the API key |
