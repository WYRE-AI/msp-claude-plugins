---
name: "Kaseya Quote Manager Quotes & Sales Orders"
when_to_use: "When viewing or analyzing quotes, quote sections/lines, or sales orders in Kaseya Quote Manager"
description: >
  Use this skill when navigating Kaseya Quote Manager quotes — drilling from
  a quote into its sections and line items, and following quotes through to
  sales orders, order lines, and payments. The tool surface is read-only.
triggers:
  - kaseya quote manager quote
  - kqm quote
  - kqm quote lines
  - kqm sales order
  - quote manager sales order
  - quote sections lines
---

# Kaseya Quote Manager — Quotes & Sales Orders

## Overview

Quotes are the primary domain of Kaseya Quote Manager. A quote is composed of
one or more **sections**, and each section holds **line items** (products with
quantity and pricing). When a quote is accepted it becomes a **sales order**,
which has its own **order lines** and **payments**.

All access here is **read-only** — these tools list and retrieve data; they
never create or modify records.

## Tools

| Tool | Purpose |
|------|---------|
| `kqm_quote_list` | List quotes (paginate with page/pageSize, filter with modifiedAfter) |
| `kqm_quote_get` | Retrieve a single quote by id |
| `kqm_quote_section_list` | List sections, typically for a given quote |
| `kqm_quote_section_get` | Retrieve a single quote section |
| `kqm_quote_line_list` | List line items, typically for a given section/quote |
| `kqm_quote_line_get` | Retrieve a single quote line |
| `kqm_sales_order_list` | List sales orders |
| `kqm_sales_order_get` | Retrieve a single sales order |
| `kqm_sales_order_line_list` | List sales-order line items |
| `kqm_sales_order_line_get` | Retrieve a single sales-order line |
| `kqm_sales_order_payment_list` | List payments against sales orders |
| `kqm_sales_order_payment_get` | Retrieve a single payment |

## Quote Hierarchy

```
Quote
└── Quote Section
    └── Quote Line (product, qty, price)

Sales Order (created when a quote is accepted)
├── Sales Order Line
└── Sales Order Payment
```

## Common Workflows

### Inspect a quote and its line items

1. Find the quote: `kqm_quote_list` (filter by customer / modifiedAfter)
2. Get the quote: `kqm_quote_get` with the quote id
3. List its sections: `kqm_quote_section_list`
4. For each section, list lines: `kqm_quote_line_list`

### Trace a quote to revenue

1. Locate the sales order: `kqm_sales_order_list`
2. Pull its lines: `kqm_sales_order_line_list`
3. Review payments: `kqm_sales_order_payment_list`

### Summarize quoting activity

1. List recent quotes with `modifiedAfter` to bound the window
2. Page through with `pageSize=100` until a partial page is returned
3. Aggregate totals from quote lines / sales-order lines

## Notes

- Always paginate fully before reporting totals — a full page of 100 results
  usually means more pages remain.
- Use `modifiedAfter` to scope large pulls to a recent window.
