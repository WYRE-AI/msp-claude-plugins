---
name: "QuickBooks Online Expenses"
description: >
  QuickBooks Online expense entities: Purchase (check, cash, credit card),
  Bill for accounts payable, BillPayment, and Vendor. Covers account-based vs
  item-based expense lines, per-client cost allocation via CustomerRef and
  BillableStatus, expense categorization, query syntax, error codes, and MSP
  profitability analysis patterns.
when_to_use: >-
  When creating, searching, and managing expense records, bills, and vendor payments. Use when:
  quickbooks expense, qbo expense, quickbooks purchase, qbo purchase, quickbooks bill, qbo bill,
  quickbooks vendor, expense tracking, cost tracking, per-client cost, or vendor payment.
---

# QuickBooks Online Expense Management

## Overview

Expenses in QuickBooks Online are tracked through two primary entities: **Purchase** (for direct expenses like checks, credit card charges, and cash payments) and **Bill** (for accounts payable -- vendor invoices you owe). For MSPs, expense tracking is critical for per-client profitability analysis: tracking software licenses, hardware costs, subcontractor fees, and third-party service costs against the revenue each client generates.

## Anti-triggers

- **Money coming in** — this skill is accounts payable. Client billing and
  cash receipts are `quickbooks-invoices` and `quickbooks-payments`.
  "Bill" is the trap: a QBO Bill is something the MSP owes, while a PSA
  "bill" is usually something a client owes.
- **The books are in Xero, not QuickBooks** — use `xero-accounts` and
  `xero-invoices`.
- **The distributor's own charge detail** — Pax8 and Sherweb hold the
  line-level cost of cloud licences before it is entered as a bill here.
  Use `pax8-invoices` or `sherweb-billing`.
- **Technician time as a cost** — labour cost is not a Purchase or Bill;
  time originates in the PSA (`autotask-time-entries`,
  `connectwise-psa-time-entries`) and lands here only as payroll.
- **The profitability answer itself** — per-client margin is a report over
  these records, not a query against them; use `quickbooks-reports`.

## Key Concepts

### Expense Types (Purchase Entity)

The Purchase entity covers direct expenses paid immediately or via credit card:

| PaymentType | Description | MSP Example |
|-------------|-------------|-------------|
| `Cash` | Cash/bank payment | Petty cash for supplies |
| `Check` | Check payment | Vendor payment by check |
| `CreditCard` | Credit card charge | Software subscription charge |

### Bills vs Purchases

| Entity | When to Use | Payment Timing |
|--------|-------------|----------------|
| **Purchase** | Expense already paid | Immediate (check, cash, credit card) |
| **Bill** | Vendor invoice received | Deferred (pay later via BillPayment) |

### MSP Expense Categories

| Category | Description | Examples |
|----------|-------------|---------|
| Software Licenses | Per-seat or per-client licenses | Microsoft 365, antivirus, RMM seats |
| Hardware | Equipment for clients | Servers, firewalls, workstations |
| Subcontractors | Outsourced labor | Cabling, specialized consulting |
| Cloud Services | Hosted services | Azure, AWS, backup storage |
| Telecom | Communication services | Internet, VoIP, SIP trunks |
| Training | Staff certifications | Vendor certs, training courses |

### Per-Client Cost Tracking

QBO supports assigning expenses to customers, enabling per-client profitability analysis. Use the `CustomerRef` field on line items to allocate costs to specific MSP clients.

### Key Fields

A Purchase requires `PaymentType`, `AccountRef.value` (the bank or credit card
account it was paid from), and at least one `Line`. A Bill requires
`VendorRef.value` and `Line`. Per-client allocation lives on the line detail, not
the header: `AccountBasedExpenseLineDetail.CustomerRef.value` plus
`BillableStatus` ("Billable", "NotBillable", "HasBeenBilled"). `TotalAmt` and
`Balance` are read-only; `SyncToken` is required on updates.

See [references/fields.md](references/fields.md) for the complete Purchase, Bill,
and Vendor field reference.

## API Patterns

### Query Purchases (Expenses)

```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Purchase WHERE PaymentType = 'CreditCard' AND TxnDate >= '2026-01-01'&minorversion=73
Authorization: Bearer {access_token}
Accept: application/json
```

**Common Queries:**

```sql
-- All credit card expenses in a date range
SELECT * FROM Purchase WHERE PaymentType = 'CreditCard' AND TxnDate >= '2026-01-01' AND TxnDate <= '2026-01-31'

-- Expenses for a specific vendor
SELECT * FROM Purchase WHERE EntityRef = '42'

-- All expenses in a month
SELECT * FROM Purchase WHERE TxnDate >= '2026-02-01' AND TxnDate <= '2026-02-28' ORDERBY TxnDate DESC

-- All bills (accounts payable)
SELECT * FROM Bill WHERE Balance > '0' ORDERBY DueDate ASC

-- Bills for a specific vendor
SELECT * FROM Bill WHERE VendorRef = '42' AND Balance > '0'

-- All vendors
SELECT * FROM Vendor WHERE Active = true ORDERBY DisplayName
```

### Create Purchase (Credit Card Expense)

```http
POST /v3/company/{realmId}/purchase?minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

Software license expense allocated to a client — note `AccountRef` on the header
is the funding account (credit card), while `AccountRef` inside the line detail
is the expense account:

```json
{
  "PaymentType": "CreditCard",
  "AccountRef": { "value": "41" },
  "EntityRef": { "value": "42", "type": "Vendor" },
  "TxnDate": "2026-02-15",
  "Line": [{
    "Amount": 450.00,
    "Description": "Microsoft 365 Business Premium - 30 seats - Acme Corp - February 2026",
    "DetailType": "AccountBasedExpenseLineDetail",
    "AccountBasedExpenseLineDetail": {
      "AccountRef": { "value": "60" },
      "CustomerRef": { "value": "123" },
      "BillableStatus": "Billable"
    }
  }],
  "PrivateNote": "Monthly software licenses for Acme Corp"
}
```

See [references/examples.md](references/examples.md) for the multi-line request
body, the curl equivalent, and a Create Vendor payload.

### Create Bill (Vendor Invoice)

```json
{
  "VendorRef": {
    "value": "42"
  },
  "TxnDate": "2026-02-10",
  "DueDate": "2026-03-12",
  "Line": [
    {
      "Amount": 2400.00,
      "Description": "Cabling project - Acme Corp new office build-out",
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": { "value": "62" },
        "CustomerRef": { "value": "123" },
        "BillableStatus": "Billable"
      }
    }
  ],
  "PrivateNote": "Subcontractor cabling for Acme Corp office expansion"
}
```

### Pay a Bill (BillPayment)

```json
{
  "VendorRef": {
    "value": "42"
  },
  "PayType": "Check",
  "CheckPayment": {
    "BankAccountRef": { "value": "35" }
  },
  "TotalAmt": 2400.00,
  "Line": [
    {
      "Amount": 2400.00,
      "LinkedTxn": [
        {
          "TxnId": "789",
          "TxnType": "Bill"
        }
      ]
    }
  ]
}
```

## Common Workflows

### Per-Client Expense Report

```javascript
async function getClientExpenses(customerId, startDate, endDate) {
  // Get all purchases with line items allocated to this customer
  const purchases = await queryAll('Purchase',
    `TxnDate >= '${startDate}' AND TxnDate <= '${endDate}'`
  );

  const clientExpenses = [];

  for (const purchase of purchases) {
    for (const line of purchase.Line || []) {
      const detail = line.AccountBasedExpenseLineDetail || line.ItemBasedExpenseLineDetail;
      if (detail?.CustomerRef?.value === customerId) {
        clientExpenses.push({
          date: purchase.TxnDate,
          vendor: purchase.EntityRef?.name || 'Unknown',
          description: line.Description,
          amount: line.Amount,
          billable: detail.BillableStatus === 'Billable',
          category: detail.AccountRef?.name
        });
      }
    }
  }

  return {
    customer: customerId,
    period: `${startDate} to ${endDate}`,
    expenses: clientExpenses,
    total: clientExpenses.reduce((sum, e) => sum + e.Amount, 0)
  };
}
```

### Monthly Software License Tracking

```javascript
async function recordMonthlyLicenses(month, licenseData) {
  const results = [];

  for (const license of licenseData) {
    const purchase = await createPurchase({
      PaymentType: 'CreditCard',
      AccountRef: { value: license.creditCardAccountId },
      EntityRef: { value: license.vendorId, type: 'Vendor' },
      TxnDate: `${month}-15`,
      Line: [{
        Amount: license.seats * license.perSeatCost,
        Description: `${license.productName} - ${license.seats} seats - ${license.customerName} - ${month}`,
        DetailType: 'AccountBasedExpenseLineDetail',
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: license.expenseAccountId },
          CustomerRef: { value: license.customerId },
          BillableStatus: license.billable ? 'Billable' : 'NotBillable'
        }
      }],
      PrivateNote: `Auto-recorded: ${license.productName} for ${license.customerName}`
    });

    results.push({
      customer: license.customerName,
      product: license.productName,
      amount: license.seats * license.perSeatCost,
      purchaseId: purchase.Id
    });
  }

  return results;
}
```

### Profitability Analysis

```javascript
async function clientProfitability(customerId, startDate, endDate) {
  // Revenue: sum of invoice line items for this customer
  const invoices = await qboQuery(
    `SELECT * FROM Invoice WHERE CustomerRef = '${customerId}' AND TxnDate >= '${startDate}' AND TxnDate <= '${endDate}'`
  );
  const revenue = (invoices.QueryResponse.Invoice || [])
    .reduce((sum, inv) => sum + inv.TotalAmt, 0);

  // Costs: sum of expense line items allocated to this customer
  const expenses = await getClientExpenses(customerId, startDate, endDate);

  return {
    customerId,
    period: `${startDate} to ${endDate}`,
    revenue,
    costs: expenses.total,
    profit: revenue - expenses.total,
    margin: revenue > 0 ? ((revenue - expenses.total) / revenue * 100).toFixed(1) + '%' : 'N/A'
  };
}
```

### Outstanding Bills Summary

```javascript
async function getOutstandingBills() {
  const result = await qboQuery(
    "SELECT * FROM Bill WHERE Balance > '0' ORDERBY DueDate ASC"
  );
  const bills = result.QueryResponse.Bill || [];
  const today = new Date().toISOString().split('T')[0];

  return bills.map(bill => ({
    vendor: bill.VendorRef.name,
    amount: bill.TotalAmt,
    balance: bill.Balance,
    dueDate: bill.DueDate,
    overdue: bill.DueDate < today
  }));
}
```

## Error Handling

- **Customer allocation is per line, not per transaction.** There is no
  header-level `CustomerRef` on Purchase or Bill — a report that reads only the
  header will show zero client cost.
- **610 Object Not Found** on a Purchase create is usually a stale or inactive
  `AccountRef`/`EntityRef`; the fault Detail names the field, the message does not.
- **Inactive references fail silently in intent.** Deactivating a vendor or
  account leaves existing transactions intact but rejects new ones referencing it.
- **6240 Duplicate Name** applies to Vendor `DisplayName`, which shares a
  namespace with Customer and Employee names in QBO.

See [references/errors.md](references/errors.md) for the full error-code and
validation tables plus a recovery pattern.

## Best Practices

1. **Allocate to customers** - Always set CustomerRef on expense lines for per-client tracking
2. **Mark billable expenses** - Use BillableStatus "Billable" for costs to re-invoice to clients
3. **Use consistent accounts** - Map expense categories to standard QBO accounts
4. **Track by vendor** - Create Vendor records for all suppliers and service providers
5. **Use Bills for deferred payment** - Record vendor invoices as Bills, then pay with BillPayment
6. **Record software licenses monthly** - Track per-seat costs monthly for accurate reporting
7. **Tag with PrivateNote** - Store PSA references and internal project codes
8. **Review billable expenses** - Regularly check for uninvoiced billable expenses

See [references/api.md](references/api.md) for the complete endpoint reference.

## Related Skills

- [QBO Customers](../customers/SKILL.md) - Customer allocation targets
- [QBO Invoices](../invoices/SKILL.md) - Re-invoicing billable expenses
- [QBO Payments](../payments/SKILL.md) - Bill payments
- [QBO Reports](../reports/SKILL.md) - P&L and expense reports
- [QBO API Patterns](../api-patterns/SKILL.md) - API reference
