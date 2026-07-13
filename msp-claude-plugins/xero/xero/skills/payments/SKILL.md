---
name: "Xero Payments"
description: >
  Use this skill when working with Xero payments - recording payments,
  tracking outstanding balances, payment allocation, overpayments,
  prepayments, and batch payment operations. Covers payment workflows
  for MSP client billing, vendor payments, and reconciliation.
when_to_use: >-
  When recording payments, tracking outstanding balances, payment allocation, overpayments,
  prepayments, and batch payment operations. Use when: xero payment, xero pay, payment tracking,
  payment status, outstanding balance, overdue payment, payment reconciliation, record payment,
  payment allocation, or accounts receivable.
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

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `PaymentID` | string (UUID) | System | Auto-generated unique identifier |
| `Invoice` | object | Yes* | Invoice being paid (InvoiceID or InvoiceNumber) |
| `Account` | object | Yes | Bank account receiving/sending payment (AccountID or Code) |
| `Date` | string | Yes | Payment date (YYYY-MM-DDT00:00:00) |
| `Amount` | decimal | Yes | Payment amount |
| `CurrencyRate` | decimal | No | Exchange rate for multi-currency |
| `Reference` | string | No | Payment reference (e.g., check number, EFT ref) |
| `IsReconciled` | boolean | No | Whether the payment is reconciled |
| `Status` | string | Read-only | AUTHORISED or DELETED |
| `PaymentType` | string | Read-only | ACCRECPAYMENT, ACCPAYPAYMENT, etc. |

*Either Invoice or CreditNote is required.

### Related Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `Invoice.InvoiceID` | string | UUID of the invoice |
| `Invoice.InvoiceNumber` | string | Invoice number |
| `Account.AccountID` | string | UUID of the bank account |
| `Account.Code` | string | Account code of the bank account |

## API Patterns

### List Payments

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**With Filters:**

```bash
# Payments received (AR)
curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments?where=PaymentType==%22ACCRECPAYMENT%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Payments in a date range
curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments?where=Date>=DateTime(2026,3,1)&&Date<=DateTime(2026,3,31)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Payments for a specific invoice
curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments?where=Invoice.InvoiceID==guid(%22${INVOICE_ID}%22)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

### Get Single Payment

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments/${PAYMENT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

### Record a Payment (AR - Client Pays Invoice)

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Payments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Invoice": {
      "InvoiceID": "'${INVOICE_ID}'"
    },
    "Account": {
      "Code": "090"
    },
    "Date": "2026-03-15T00:00:00",
    "Amount": 2500.00,
    "Reference": "EFT-2026-0315-ACME"
  }'
```

### Record a Payment (AP - Pay Vendor Bill)

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Payments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Invoice": {
      "InvoiceID": "'${VENDOR_BILL_ID}'"
    },
    "Account": {
      "Code": "090"
    },
    "Date": "2026-03-10T00:00:00",
    "Amount": 525.00,
    "Reference": "CHK-4521"
  }'
```

### Record Partial Payment

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Payments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Invoice": {
      "InvoiceID": "'${INVOICE_ID}'"
    },
    "Account": {
      "Code": "090"
    },
    "Date": "2026-03-15T00:00:00",
    "Amount": 1000.00,
    "Reference": "Partial payment - remainder due by 3/31"
  }'
```

### Delete (Reverse) a Payment

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Payments/${PAYMENT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "PaymentID": "'${PAYMENT_ID}'",
    "Status": "DELETED"
  }'
```

### Batch Create Payments

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Payments?summarizeErrors=false" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Payments": [
      {
        "Invoice": { "InvoiceID": "inv-001" },
        "Account": { "Code": "090" },
        "Date": "2026-03-15T00:00:00",
        "Amount": 2500.00,
        "Reference": "EFT-ACME"
      },
      {
        "Invoice": { "InvoiceID": "inv-002" },
        "Account": { "Code": "090" },
        "Date": "2026-03-15T00:00:00",
        "Amount": 1800.00,
        "Reference": "EFT-TECHSTART"
      }
    ]
  }'
```

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

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Payment amount exceeds the amount outstanding | Reduce payment amount to match AmountDue |
| 400 | Account is not valid for payments | Use a bank account (type BANK) |
| 400 | Invoice is not awaiting payment | Invoice must be AUTHORISED status |
| 400 | Payment date is before invoice date | Set payment date on or after invoice date |
| 401 | Unauthorized | Refresh access token |
| 404 | Invoice not found | Verify InvoiceID |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Amount exceeds outstanding | Overpayment attempted | Use exact AmountDue or less |
| Invalid account | Non-bank account used | Use a BANK type account |
| Invoice not payable | Wrong invoice status | Authorize invoice first |
| Date before invoice | Payment pre-dates invoice | Adjust payment date |

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

## Endpoint Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Payments` | GET | List payments (paginated, filterable) |
| `/Payments` | POST | Create payments (single or batch) |
| `/Payments/{PaymentID}` | GET | Get single payment |
| `/Payments/{PaymentID}` | POST | Update payment (delete only) |
| `/Overpayments` | GET | List overpayments |
| `/Overpayments/{OverpaymentID}` | GET | Get single overpayment |
| `/Overpayments/{OverpaymentID}/Allocations` | PUT | Allocate overpayment to invoices |
| `/Prepayments` | GET | List prepayments |
| `/Prepayments/{PrepaymentID}/Allocations` | PUT | Allocate prepayment to invoices |

## Best Practices

1. **Use the correct bank account** - Payments must reference a BANK type account
2. **Include payment references** - Add EFT numbers, check numbers for reconciliation
3. **Verify amount before recording** - Check invoice AmountDue to avoid overpayment errors
4. **Record payments promptly** - Keep payment dates accurate for cash flow reporting
5. **Use batch operations** - Record multiple payments in one API call when processing bank statements
6. **Monitor overdue invoices** - Build alerts for invoices past due date
7. **Handle partial payments** - Track remaining balance and follow up
8. **Reconcile regularly** - Match Xero payments to bank statements
9. **Delete, don't modify** - To correct a payment, delete and re-create
10. **Track payment patterns** - Monitor which clients consistently pay late

## Related Skills

- [Xero Invoices](../invoices/SKILL.md) - Invoices that payments apply to
- [Xero Contacts](../contacts/SKILL.md) - Contact balance information
- [Xero Accounts](../accounts/SKILL.md) - Bank accounts for payments
- [Xero Reports](../reports/SKILL.md) - Aged receivables and cash flow
- [Xero API Patterns](../api-patterns/SKILL.md) - API reference
