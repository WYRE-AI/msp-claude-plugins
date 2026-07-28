---
name: "QuickBooks Online Payments"
description: >
  QuickBooks Online payment handling: recording customer payments and
  applying them to invoices, partial and multi-invoice application,
  unapplied amounts and overpayments, credit memos and refund receipts,
  payment methods, deposit accounts, voiding, and reconciliation.
when_to_use: >-
  When recording, applying, voiding, or reconciling QuickBooks Online customer payments
  and credits. Use when: quickbooks payment, qbo payment, record
  payment, apply payment, payment received, customer payment, payment reconciliation, credit memo,
  refund, or payment collection.
---

# QuickBooks Online Payment Management

## Overview

Payments in QuickBooks Online record money received from customers. For MSPs, payments are typically applied against outstanding invoices for managed services, project work, or hardware. QBO supports multiple payment methods (check, credit card, ACH, cash), allows partial payments, handles overpayments as credits, and tracks deposits. Proper payment recording is essential for accurate accounts receivable and cash flow management.

## Key Concepts

### Payment Application

Payments can be applied in several ways:

| Application | Description | MSP Example |
|-------------|-------------|-------------|
| Full payment | Covers one invoice completely | Client pays monthly invoice |
| Partial payment | Covers part of an invoice | Client makes installment payment |
| Multi-invoice | Applied across multiple invoices | Client pays several open invoices at once |
| Unapplied | Payment recorded without linking to invoice | Advance payment or retainer |
| Overpayment | Excess amount after invoice(s) paid | Credit applied to future invoices |

### Payment Methods

| Method | Description | Common MSP Usage |
|--------|-------------|------------------|
| Check | Paper check | Traditional clients |
| Credit Card | Card payment | Online payment via QBO |
| ACH/EFT | Bank transfer | Recurring autopay clients |
| Cash | Cash payment | Rare for MSPs |
| Other | Catch-all category | Wire transfers |

### Related Entities

| Entity | Description |
|--------|-------------|
| **Payment** | Money received from a customer |
| **CreditMemo** | Credit issued to a customer (reduces balance) |
| **RefundReceipt** | Refund issued to a customer |
| **Deposit** | Bank deposit grouping multiple payments |

### Core Fields

A `Payment` requires `CustomerRef.value` and `TotalAmt`. Invoice application happens through the `Line` array, where each line carries an `Amount` and a `LinkedTxn` entry of `{ TxnId: <invoice id>, TxnType: "Invoice" }`. `UnappliedAmt` (Payment) and `RemainingCredit` (CreditMemo) are read-only and reflect what is still available to apply.

See [references/fields.md](references/fields.md) for the complete Payment, Payment Line, CreditMemo, and metadata field reference.

## API Patterns

### Common Queries

```sql
-- All payments for a customer
SELECT * FROM Payment WHERE CustomerRef = '123' ORDERBY TxnDate DESC

-- Payments in a date range
SELECT * FROM Payment WHERE TxnDate >= '2026-01-01' AND TxnDate <= '2026-01-31'

-- Payments with unapplied amount
SELECT * FROM Payment WHERE UnappliedAmt > '0'

-- Recent payments
SELECT * FROM Payment ORDERBY TxnDate DESC MAXRESULTS 25

-- Credit memos with remaining credit
SELECT * FROM CreditMemo WHERE RemainingCredit > '0'
```

### Write Operations

| Operation | Request |
|-----------|---------|
| Record payment | `POST /v3/company/{realmId}/payment` with `CustomerRef`, `TotalAmt`, and a `Line` per invoice |
| Unapplied payment | Same POST, omit `Line` entirely — QBO holds the full amount as `UnappliedAmt` |
| Issue credit | `POST /v3/company/{realmId}/creditmemo` with `SalesItemLineDetail` lines |
| Void payment | `POST /v3/company/{realmId}/payment?operation=void` with `Id` + `SyncToken` |

See [references/api.md](references/api.md) for full request bodies (single-invoice, multi-invoice, unapplied, credit memo, void) and the endpoint catalog.

## Common Workflows

### Record Client Payment

Distribute a single received amount across the customer's open invoices oldest-first: fetch each invoice's `Balance`, apply `min(remaining, balance)` to that line, and drop any line that ends up at zero before posting.

### Collections Review

Query `Invoice WHERE DueDate < today AND Balance > '0' ORDERBY DueDate ASC`, group by `CustomerRef.value`, and rank clients by total overdue balance.

### Apply Unapplied Payments

Query payments with `UnappliedAmt > '0'` and open invoices for the same customer, then sparse-update each payment to append `LinkedTxn` lines against the oldest invoices.

### Issue Service Credit

Create a CreditMemo with a service-credit item line for SLA breaches or downtime; the credit reduces the customer's balance and can be applied to future invoices.

See [references/examples.md](references/examples.md) for working implementations of each workflow.

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 6000 | Business Validation | Check amounts, references, and required fields |
| 610 | Object Not Found | Verify CustomerRef, Invoice ID, or Payment ID |
| 5010 | Stale Object | Re-fetch SyncToken and retry |
| 6140 | Duplicate | Payment may already be recorded |
| 2050 | Invalid Reference | Check CustomerRef, PaymentMethodRef, or AccountRef |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| CustomerRef required | Missing customer | Add CustomerRef.value |
| TotalAmt required | Missing amount | Add TotalAmt |
| Amount exceeds balance | Payment > invoice balance | Reduce applied amount |
| Invalid LinkedTxn | Bad invoice ID | Verify invoice exists and has balance |

See [references/examples.md](references/examples.md) for an error recovery wrapper that re-fetches an invoice balance when a payment amount exceeds it.

## Best Practices

1. **Always link to invoices** - Apply payments to specific invoices for accurate A/R; unlinked payments sit as `UnappliedAmt` and quietly overstate open balances
2. **Record reference numbers** - Include check numbers, ACH refs, and transaction IDs
3. **Set deposit account** - Specify `DepositToAccountRef` to track cash in the correct bank account
4. **Use payment methods** - Create PaymentMethod records for consistent categorization
5. **Handle overpayments** - QBO automatically creates unapplied amounts; apply to future invoices
6. **Void instead of delete** - Voiding preserves the audit trail
7. **Apply oldest first** - When paying multiple invoices, apply to oldest first
8. **Use credit memos for SLA credits** - Issue credits for service disruptions rather than editing the original invoice
9. **Reconcile regularly** - Match QBO payments to bank statements
10. **Track unapplied amounts** - Regularly review and apply unapplied payments

## Related Skills

- [QBO Invoices](../invoices/SKILL.md) - Invoice management
- [QBO Customers](../customers/SKILL.md) - Customer balance tracking
- [QBO Reports](../reports/SKILL.md) - A/R Aging and cash flow reports
- [QBO API Patterns](../api-patterns/SKILL.md) - API reference
