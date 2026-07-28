---
name: "Xero Payments"
description: >
  Xero payments: recording AR and AP payments, partial payments, payment
  allocation, overpayments and prepayments, batch payment creation, and
  outstanding-balance and aging tracking for MSP billing and reconciliation.
when_to_use: >-
  When recording payments, tracking outstanding balances, or reconciling money
  against invoices in Xero. Use when: xero payment, xero pay, payment tracking,
  payment status, outstanding balance, overdue payment, payment reconciliation,
  record payment, payment allocation, or accounts receivable.
---

# Xero Payments Management

## Overview

Payments in Xero record the movement of money against invoices, credit notes, and overpayments. For MSPs, payment tracking is critical for cash flow management -- monitoring which clients have paid their monthly managed services invoices, which are overdue, and reconciling incoming payments against the correct invoices.

## Core Concepts

### Payment Types

| Type | Description | MSP Use Case |
|------|-------------|-------------|
| Accounts Receivable Payment | Payment received from a customer | Client paying managed services invoice |
| Accounts Payable Payment | Payment made to a supplier | Paying vendor for software licenses |
| Overpayment | Payment exceeding invoice amount | Client overpayment to be credited |
| Prepayment | Payment before invoice is created | Retainer or deposit from client |

### Payment Status

| Status | Description |
|--------|-------------|
| `AUTHORISED` | Payment recorded and active |
| `DELETED` | Payment has been deleted/reversed |

### Payment Flow

```
Invoice (AUTHORISED) + Payment --> Invoice (PAID)
Invoice (AUTHORISED) + Partial Payment --> Invoice (AUTHORISED, AmountDue reduced)
Invoice (AUTHORISED) + Overpayment --> Invoice (PAID) + Overpayment Credit
```

### Key Fields

A payment needs an `Invoice` (by `InvoiceID` or `InvoiceNumber`), an `Account`
(by `AccountID` or `Code`, and it must be a `BANK` account), a `Date`, and an
`Amount`. `Status` and `PaymentType` are read-only and derived.

See [references/fields.md](references/fields.md) for the complete field reference.

## API Patterns

Every request needs both `Authorization: Bearer ${ACCESS_TOKEN}` and
`xero-tenant-id: ${XERO_TENANT_ID}`. Xero-specific quirks:

- **Payments are immutable.** The only supported "update" is POSTing
  `Status: "DELETED"` to `/Payments/{PaymentID}`; to correct a payment,
  delete and re-create it.
- **Batch creation** posts a `Payments` array. Add `?summarizeErrors=false`
  so valid payments still commit when one item in the batch fails.
- **Filters go in a URL-encoded `where` clause**; dates use
  `DateTime(yyyy,m,d)` and UUID comparisons use `guid("...")`:

```bash
# Payments received (AR) in a date range
curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments?where=PaymentType==%22ACCRECPAYMENT%22&&Date>=DateTime(2026,3,1)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

See [references/api.md](references/api.md) for the full endpoint catalog and
AR/AP/partial/batch payment examples.

## Common Workflows

### Check Outstanding Balances for All Clients

```javascript
async function getOutstandingBalances() {
  const invoices = await fetchAllInvoices({
    where: 'Type=="ACCREC"&&Status=="AUTHORISED"&&AmountDue>0'
  });

  const balancesByContact = {};

  for (const invoice of invoices) {
    const contactName = invoice.Contact.Name;
    if (!balancesByContact[contactName]) {
      balancesByContact[contactName] = {
        contactId: invoice.Contact.ContactID,
        totalOutstanding: 0,
        totalOverdue: 0,
        invoices: []
      };
    }

    balancesByContact[contactName].totalOutstanding += invoice.AmountDue;

    const dueDate = new Date(invoice.DueDate);
    if (dueDate < new Date()) {
      balancesByContact[contactName].totalOverdue += invoice.AmountDue;
    }

    balancesByContact[contactName].invoices.push({
      number: invoice.InvoiceNumber,
      amount: invoice.AmountDue,
      dueDate: invoice.DueDate,
      isOverdue: dueDate < new Date()
    });
  }

  return balancesByContact;
}
```

### Payment Aging Report

```javascript
async function getPaymentAging() {
  const invoices = await fetchAllInvoices({
    where: 'Type=="ACCREC"&&Status=="AUTHORISED"&&AmountDue>0'
  });

  const aging = {
    current: [],      // Not yet due
    thirtyDays: [],   // 1-30 days overdue
    sixtyDays: [],    // 31-60 days overdue
    ninetyDays: [],   // 61-90 days overdue
    overNinety: []    // 90+ days overdue
  };

  const now = new Date();

  for (const invoice of invoices) {
    const dueDate = new Date(invoice.DueDate);
    const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

    const entry = {
      contact: invoice.Contact.Name,
      invoiceNumber: invoice.InvoiceNumber,
      amountDue: invoice.AmountDue,
      dueDate: invoice.DueDate,
      daysOverdue: Math.max(0, daysOverdue)
    };

    if (daysOverdue <= 0) aging.current.push(entry);
    else if (daysOverdue <= 30) aging.thirtyDays.push(entry);
    else if (daysOverdue <= 60) aging.sixtyDays.push(entry);
    else if (daysOverdue <= 90) aging.ninetyDays.push(entry);
    else aging.overNinety.push(entry);
  }

  return aging;
}
```

### Record Batch Payments from Bank Statement

```javascript
async function recordBatchPayments(bankPayments) {
  const payments = [];

  for (const payment of bankPayments) {
    // Find matching invoice by reference or contact
    const invoice = await findInvoiceByReference(payment.reference);

    if (invoice) {
      payments.push({
        Invoice: { InvoiceID: invoice.InvoiceID },
        Account: { Code: payment.bankAccountCode },
        Date: payment.date,
        Amount: payment.amount,
        Reference: payment.reference
      });
    }
  }

  if (payments.length > 0) {
    return await createPayments(payments);
  }

  return { matched: 0 };
}
```

### Monthly Collections Summary

```javascript
async function getCollectionsSummary(month) {
  const startDate = `${month}-01`;
  const endDate = `${month}-28`;

  const payments = await fetchPayments({
    where: `PaymentType=="ACCRECPAYMENT"&&Date>=DateTime(${startDate.replace(/-/g, ',')})&&Date<=DateTime(${endDate.replace(/-/g, ',')})`
  });

  const summary = {
    totalCollected: 0,
    paymentCount: payments.length,
    byContact: {}
  };

  for (const payment of payments) {
    summary.totalCollected += payment.Amount;

    const contactName = payment.Invoice?.Contact?.Name || 'Unknown';
    if (!summary.byContact[contactName]) {
      summary.byContact[contactName] = { total: 0, count: 0 };
    }
    summary.byContact[contactName].total += payment.Amount;
    summary.byContact[contactName].count++;
  }

  return summary;
}
```

## Gotchas

- **A payment cannot exceed `AmountDue`.** Xero rejects the request rather than
  creating an overpayment automatically; re-read the invoice and pay the exact
  outstanding amount, or record an Overpayment explicitly.
- **Only `BANK` type accounts accept payments.** Pointing at a revenue or
  current-asset account returns "Account is not valid for payments."
- **The invoice must be `AUTHORISED`.** DRAFT and SUBMITTED invoices reject
  payments with "Invoice is not awaiting payment."
- **Payment date cannot precede the invoice date.**
- **Deleting a payment reopens the invoice** — its status drops back from PAID
  to AUTHORISED with the amount restored to `AmountDue`.

See [references/errors.md](references/errors.md) for the complete error-code table.

### Error Recovery Pattern

```javascript
async function safeRecordPayment(paymentData) {
  try {
    return await createPayment(paymentData);
  } catch (error) {
    if (error.message?.includes('amount exceeds')) {
      // Get current outstanding amount
      const invoice = await getInvoice(paymentData.Invoice.InvoiceID);
      paymentData.Amount = invoice.AmountDue;
      console.log(`Adjusted payment to outstanding amount: $${invoice.AmountDue}`);
      return await createPayment(paymentData);
    }

    if (error.message?.includes('not awaiting payment')) {
      console.log('Invoice is not in AUTHORISED status. Check invoice status.');
    }

    throw error;
  }
}
```

## Best Practices

1. **Include payment references** - Add EFT numbers, check numbers for reconciliation
2. **Verify amount before recording** - Check invoice AmountDue to avoid overpayment errors
3. **Record payments promptly** - Keep payment dates accurate for cash flow reporting
4. **Use batch operations** - Record multiple payments in one API call when processing bank statements
5. **Monitor overdue invoices** - Build alerts for invoices past due date
6. **Handle partial payments** - Track remaining balance and follow up
7. **Reconcile regularly** - Match Xero payments to bank statements
8. **Track payment patterns** - Monitor which clients consistently pay late

## Related Skills

- [Xero Invoices](../invoices/SKILL.md) - Invoices that payments apply to
- [Xero Contacts](../contacts/SKILL.md) - Contact balance information
- [Xero Accounts](../accounts/SKILL.md) - Bank accounts for payments
- [Xero Reports](../reports/SKILL.md) - Aged receivables and cash flow
- [Xero API Patterns](../api-patterns/SKILL.md) - API reference
