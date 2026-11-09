---
name: "GoGetSSL Billing Reconciliation"
description: >
  Reconciling a GoGetSSL reseller account against client billing: the
  prepaid balance, unpaid orders and invoices, invoice line items for a date
  window, the invoice behind a single order, and mapping certificate spend
  back to client domains so it can be rebilled.
when_to_use: >-
  When an MSP needs to check the GoGetSSL balance, chase unpaid items, or
  make sure every certificate bought this month or quarter was billed to the
  right client. Use when: gogetssl balance, ssl spend, certificate invoices,
  unpaid ssl orders, rebill certificates, ssl billing reconciliation,
  gogetssl invoice, or top up balance.
---

# GoGetSSL Billing Reconciliation

## Overview

Certificates are a small line item that leaks margin easily: a renewal gets
bought for a client and never makes it onto their invoice, or a failed order
sits unpaid while the client's site is about to expire. GoGetSSL bills the
reseller from a prepaid balance and issues invoices per order. This skill
reads those records and lines them up with client domains. Every tool here
is read tier and none is admin-gated in Conduit. Nothing here can pay an
invoice or top up the balance; that happens in the GoGetSSL client area.

## Key Concepts

| Record | Tool | Notes |
|--------|------|-------|
| Balance | `gogetssl_account_get_balance` | Available prepaid balance and currency. Orders are paid from it |
| Account | `gogetssl_account_get` | Reseller plan and account currency |
| Unpaid orders | `gogetssl_orders_list_unpaid` | `id`, `total_price`, `currency`, `date` |
| All invoices | `gogetssl_invoices_list` | Every invoice on the account |
| Unpaid invoices | `gogetssl_invoices_list_unpaid` | Invoices with status unpaid |
| Invoices with line items | `gogetssl_invoices_list_by_period` | `order_id`, `product_name`, `period`, `subtotal` per line, for up to 365 days |
| One invoice | `gogetssl_invoices_get` | One invoice with its line items |
| Invoice for an order | `gogetssl_orders_get_invoice` | Number, totals, status, payment method |

## Common Workflows

### Month-end rebilling check

1. Call `gogetssl_invoices_list_by_period` with `date_from` and `date_till`
   set to the month (`YYYY-MM-DD`). The window may span at most 365 days.
2. For each line, take `order_id` and look up its domain.
   `gogetssl_orders_list` maps `order_id` to `common_name` for many orders
   at once; call it once per relevant `status` (usually `active` and
   `processing`) and use `gogetssl_orders_get_status` only for orders those
   lists do not cover.
3. Map each domain to a client from the PSA or documentation platform.
4. Produce a table of client, domain, product, period and partner cost, and
   compare it with what was billed in the PSA. Any certificate with no
   matching client charge is unbilled spend.

GoGetSSL has no client field, so step 3 is the only link between a
certificate and a client. Report unmapped domains separately instead of
spreading their cost.

### Unpaid items sweep

1. `gogetssl_orders_list_unpaid` and `gogetssl_invoices_list_unpaid`.
2. For each unpaid order, check `gogetssl_orders_get_status`. An unpaid order
   for a domain that already has a newer active order is usually an
   abandoned attempt and can be cancelled in the client area. An unpaid
   order for a domain with nothing active is a renewal that has not
   happened, and the certificate may be about to lapse.
3. Report both lists with the oldest first.

### Balance forecast

1. `gogetssl_account_get_balance` for the current balance.
2. List what renews in the next 30-60 days (see
   [certificate-expiry](../certificate-expiry/SKILL.md)) and price it with
   `gogetssl_products_list_prices`.
3. If the balance is below the sum, say how much to top up and by when.

### Quarterly spend by client

Run the month-end steps over a quarter window with
`gogetssl_invoices_list_by_period`, then total `subtotal` by client. This is
the number to bring to a QBR, alongside the count of certificates renewed
on time.

## Gotchas

- `gogetssl_invoices_list_by_period` without dates returns the last 365
  days. On a busy account that can be large; always pass a window.
- Amounts are in the account currency from `gogetssl_account_get`. Do not
  mix them with client billing in another currency without converting.
- Invoice prices are partner cost. The client price lives in your PSA.

## Related Skills

- [certificate-expiry](../certificate-expiry/SKILL.md): what is about to renew
- [renewal-prep](../renewal-prep/SKILL.md): pricing a renewal before it is placed
- [api-patterns](../api-patterns/SKILL.md): date formats, size limits and errors
