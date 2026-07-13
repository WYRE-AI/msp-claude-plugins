---
name: "QuickBooks Online Payments"
description: >
  Use this skill when working with QuickBooks Online payments -
  recording customer payments, applying payments to invoices,
  handling overpayments, refunds, credit memos, and payment
  reconciliation. Covers payment methods, deposit tracking,
  unapplied payments, and MSP payment collection workflows.
when_to_use: >-
  When recording customer payments, applying payments to invoices, handling overpayments, refunds,
  credit memos, and payment reconciliation. Use when: quickbooks payment, qbo payment, record
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

## Field Reference

### Payment Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `CustomerRef.value` | string | Yes | Customer ID |
| `TotalAmt` | decimal | Yes | Total payment amount |
| `TxnDate` | date | No | Payment date (default: today) |
| `PaymentMethodRef.value` | string | No | Payment method ID |
| `PaymentRefNum` | string | No | Reference number (check number, etc.) |
| `DepositToAccountRef.value` | string | No | Bank account to deposit to |
| `Line` | array | No | Invoice linkages |
| `UnappliedAmt` | decimal | Read-only | Unapplied portion of payment |
| `PrivateNote` | string | No | Internal memo |
| `SyncToken` | string | Required for updates | Optimistic locking token |

### Payment Line Fields (Invoice Application)

| Field | Type | Description |
|-------|------|-------------|
| `Line.Amount` | decimal | Amount applied to this invoice |
| `Line.LinkedTxn[].TxnId` | string | Invoice ID to apply payment to |
| `Line.LinkedTxn[].TxnType` | string | Always "Invoice" |

### Credit Memo Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `CustomerRef.value` | string | Yes | Customer ID |
| `TotalAmt` | decimal | Read-only | Total credit amount |
| `TxnDate` | date | No | Credit memo date |
| `Line` | array | Yes | Credit line items |
| `RemainingCredit` | decimal | Read-only | Unapplied credit amount |
| `SyncToken` | string | Required for updates | Optimistic locking token |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `MetaData.CreateTime` | datetime | Creation timestamp |
| `MetaData.LastUpdatedTime` | datetime | Last update timestamp |

## API Patterns

### Query Payments

```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Payment WHERE CustomerRef = '123'&minorversion=73
Authorization: Bearer {access_token}
Accept: application/json
```

**Common Queries:**

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

### Record Payment (Applied to Invoice)

```http
POST /v3/company/{realmId}/payment?minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Single invoice payment:**

```json
{
  "CustomerRef": {
    "value": "123"
  },
  "TotalAmt": 2850.00,
  "TxnDate": "2026-02-15",
  "PaymentMethodRef": {
    "value": "2"
  },
  "PaymentRefNum": "CHK-10542",
  "DepositToAccountRef": {
    "value": "35"
  },
  "Line": [
    {
      "Amount": 2850.00,
      "LinkedTxn": [
        {
          "TxnId": "456",
          "TxnType": "Invoice"
        }
      ]
    }
  ],
  "PrivateNote": "February managed services payment - Acme Corp"
}
```

```bash
curl -s -X POST \
  -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/payment?minorversion=73" \
  -d '{
    "CustomerRef": { "value": "123" },
    "TotalAmt": 2850.00,
    "PaymentRefNum": "CHK-10542",
    "Line": [{
      "Amount": 2850.00,
      "LinkedTxn": [{ "TxnId": "456", "TxnType": "Invoice" }]
    }]
  }'
```

**Multi-invoice payment:**

```json
{
  "CustomerRef": {
    "value": "123"
  },
  "TotalAmt": 7500.00,
  "TxnDate": "2026-02-20",
  "PaymentMethodRef": {
    "value": "5"
  },
  "PaymentRefNum": "ACH-20260220",
  "Line": [
    {
      "Amount": 2500.00,
      "LinkedTxn": [{ "TxnId": "450", "TxnType": "Invoice" }]
    },
    {
      "Amount": 2500.00,
      "LinkedTxn": [{ "TxnId": "460", "TxnType": "Invoice" }]
    },
    {
      "Amount": 2500.00,
      "LinkedTxn": [{ "TxnId": "470", "TxnType": "Invoice" }]
    }
  ],
  "PrivateNote": "Bulk payment covering Dec, Jan, Feb invoices"
}
```

**Unapplied payment (retainer/advance):**

```json
{
  "CustomerRef": {
    "value": "123"
  },
  "TotalAmt": 5000.00,
  "TxnDate": "2026-02-01",
  "PaymentMethodRef": {
    "value": "5"
  },
  "PaymentRefNum": "WIRE-20260201",
  "PrivateNote": "Advance retainer payment - project deposit"
}
```

### Create Credit Memo

```json
{
  "CustomerRef": {
    "value": "123"
  },
  "TxnDate": "2026-02-15",
  "Line": [
    {
      "Amount": 500.00,
      "Description": "Service credit - downtime incident on 2026-02-10",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "1" },
        "Qty": 1,
        "UnitPrice": 500.00
      }
    }
  ],
  "CustomerMemo": {
    "value": "Credit for service disruption on February 10, 2026."
  }
}
```

### Void Payment

```http
POST /v3/company/{realmId}/payment?operation=void&minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "Id": "789",
  "SyncToken": "1"
}
```

### Get Payment Details

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/payment/789?minorversion=73"
```

## Common Workflows

### Record Client Payment

```javascript
async function recordClientPayment(customerId, amount, invoiceIds, metadata) {
  const lines = invoiceIds.map(invoiceId => {
    // Fetch invoice to determine amount to apply
    return {
      Amount: 0, // Will be calculated
      LinkedTxn: [{ TxnId: invoiceId, TxnType: 'Invoice' }]
    };
  });

  // Distribute payment across invoices (oldest first)
  let remaining = amount;
  for (const line of lines) {
    const invoice = await getInvoice(line.LinkedTxn[0].TxnId);
    const applyAmount = Math.min(remaining, invoice.Balance);
    line.Amount = applyAmount;
    remaining -= applyAmount;
    if (remaining <= 0) break;
  }

  return await createPayment({
    CustomerRef: { value: customerId },
    TotalAmt: amount,
    TxnDate: metadata.date || new Date().toISOString().split('T')[0],
    PaymentMethodRef: metadata.methodId ? { value: metadata.methodId } : undefined,
    PaymentRefNum: metadata.referenceNumber,
    DepositToAccountRef: metadata.depositAccountId ? { value: metadata.depositAccountId } : undefined,
    Line: lines.filter(l => l.Amount > 0),
    PrivateNote: metadata.note
  });
}
```

### Collections Workflow

```javascript
async function getCollectionsReport() {
  const today = new Date().toISOString().split('T')[0];

  // Get all overdue invoices
  const result = await qboQuery(
    `SELECT * FROM Invoice WHERE DueDate < '${today}' AND Balance > '0' ORDERBY DueDate ASC`
  );
  const overdueInvoices = result.QueryResponse.Invoice || [];

  // Group by customer
  const byCustomer = {};
  for (const inv of overdueInvoices) {
    const customerId = inv.CustomerRef.value;
    if (!byCustomer[customerId]) {
      byCustomer[customerId] = {
        customerName: inv.CustomerRef.name,
        invoices: [],
        totalOverdue: 0
      };
    }
    byCustomer[customerId].invoices.push({
      id: inv.Id,
      number: inv.DocNumber,
      amount: inv.TotalAmt,
      balance: inv.Balance,
      dueDate: inv.DueDate,
      daysOverdue: Math.floor((Date.now() - new Date(inv.DueDate)) / 86400000)
    });
    byCustomer[customerId].totalOverdue += inv.Balance;
  }

  return Object.values(byCustomer).sort((a, b) => b.totalOverdue - a.totalOverdue);
}
```

### Apply Unapplied Payments

```javascript
async function applyUnappliedPayments(customerId) {
  // Find payments with unapplied amounts
  const payments = await qboQuery(
    `SELECT * FROM Payment WHERE CustomerRef = '${customerId}' AND UnappliedAmt > '0'`
  );
  const unapplied = payments.QueryResponse.Payment || [];

  // Find unpaid invoices (oldest first)
  const invoices = await qboQuery(
    `SELECT * FROM Invoice WHERE CustomerRef = '${customerId}' AND Balance > '0' ORDERBY TxnDate ASC`
  );
  const unpaid = invoices.QueryResponse.Invoice || [];

  const results = [];

  for (const payment of unapplied) {
    let remaining = payment.UnappliedAmt;

    for (const invoice of unpaid) {
      if (remaining <= 0 || invoice.Balance <= 0) continue;

      const applyAmount = Math.min(remaining, invoice.Balance);

      // Update payment to link to invoice
      await updatePayment({
        Id: payment.Id,
        SyncToken: payment.SyncToken,
        sparse: true,
        Line: [
          ...(payment.Line || []),
          {
            Amount: applyAmount,
            LinkedTxn: [{ TxnId: invoice.Id, TxnType: 'Invoice' }]
          }
        ]
      });

      results.push({
        paymentId: payment.Id,
        invoiceId: invoice.Id,
        applied: applyAmount
      });

      remaining -= applyAmount;
      invoice.Balance -= applyAmount;
    }
  }

  return results;
}
```

### Issue Service Credit

```javascript
async function issueServiceCredit(customerId, amount, reason) {
  // Create credit memo
  const credit = await createCreditMemo({
    CustomerRef: { value: customerId },
    Line: [{
      Amount: amount,
      Description: reason,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        ItemRef: { value: '1' }, // Service credit item
        Qty: 1,
        UnitPrice: amount
      }
    }],
    CustomerMemo: { value: `Service credit: ${reason}` }
  });

  return credit;
}
```

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

### Error Recovery Pattern

```javascript
async function safeRecordPayment(data) {
  try {
    return await createPayment(data);
  } catch (error) {
    const fault = error.Fault;
    if (!fault) throw error;

    const detail = fault.Error?.[0]?.Detail || '';

    if (detail.includes('exceeds')) {
      // Payment amount exceeds invoice balance
      // Re-fetch invoice and adjust
      const invoiceId = data.Line?.[0]?.LinkedTxn?.[0]?.TxnId;
      if (invoiceId) {
        const invoice = await getInvoice(invoiceId);
        data.Line[0].Amount = invoice.Balance;
        data.TotalAmt = invoice.Balance;
        return await createPayment(data);
      }
    }

    throw error;
  }
}
```

## Best Practices

1. **Always link to invoices** - Apply payments to specific invoices for accurate A/R
2. **Record reference numbers** - Include check numbers, ACH refs, and transaction IDs
3. **Set deposit account** - Specify DepositToAccountRef to track cash in correct bank account
4. **Use payment methods** - Create PaymentMethod records for consistent categorization
5. **Handle overpayments** - QBO automatically creates unapplied amounts; apply to future invoices
6. **Void instead of delete** - Voiding preserves audit trail
7. **Apply oldest first** - When paying multiple invoices, apply to oldest first
8. **Use credit memos for SLA credits** - Issue credits for service disruptions
9. **Reconcile regularly** - Match QBO payments to bank statements
10. **Track unapplied amounts** - Regularly review and apply unapplied payments

## Endpoint Reference

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create Payment | POST | `/v3/company/{realmId}/payment` |
| Read Payment | GET | `/v3/company/{realmId}/payment/{id}` |
| Update Payment | POST | `/v3/company/{realmId}/payment` |
| Void Payment | POST | `/v3/company/{realmId}/payment?operation=void` |
| Delete Payment | POST | `/v3/company/{realmId}/payment?operation=delete` |
| Create CreditMemo | POST | `/v3/company/{realmId}/creditmemo` |
| Read CreditMemo | GET | `/v3/company/{realmId}/creditmemo/{id}` |
| Query | GET | `/v3/company/{realmId}/query?query=...` |

## Related Skills

- [QBO Invoices](../invoices/SKILL.md) - Invoice management
- [QBO Customers](../customers/SKILL.md) - Customer balance tracking
- [QBO Reports](../reports/SKILL.md) - A/R Aging and cash flow reports
- [QBO API Patterns](../api-patterns/SKILL.md) - API reference
