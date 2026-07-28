# QuickBooks Online Payment Workflow Examples

## Record Client Payment

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

## Collections Workflow

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

## Apply Unapplied Payments

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

## Issue Service Credit

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

## Error Recovery Pattern

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
