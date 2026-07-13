---
name: "QuickBooks Online Expenses"
description: >
  Use this skill when working with QuickBooks Online expenses and purchases -
  creating, searching, and managing expense records, bills, and vendor payments.
  Covers the Purchase entity (checks, credit cards, cash), Bill entity for
  accounts payable, per-client cost tracking, vendor management, and MSP
  expense categorization for profitability analysis.
when_to_use: >-
  When creating, searching, and managing expense records, bills, and vendor payments. Use when:
  quickbooks expense, qbo expense, quickbooks purchase, qbo purchase, quickbooks bill, qbo bill,
  quickbooks vendor, expense tracking, cost tracking, per-client cost, or vendor payment.
---

# QuickBooks Online Expense Management

## Overview

Expenses in QuickBooks Online are tracked through two primary entities: **Purchase** (for direct expenses like checks, credit card charges, and cash payments) and **Bill** (for accounts payable -- vendor invoices you owe). For MSPs, expense tracking is critical for per-client profitability analysis: tracking software licenses, hardware costs, subcontractor fees, and third-party service costs against the revenue each client generates.

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

## Field Reference

### Purchase Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `PaymentType` | string | Yes | "Cash", "Check", or "CreditCard" |
| `AccountRef.value` | string | Yes | Bank or credit card account ID |
| `EntityRef.value` | string | No | Vendor ID |
| `TxnDate` | date | No | Transaction date (default: today) |
| `TotalAmt` | decimal | Read-only | Total expense amount |
| `DocNumber` | string | No | Reference number |
| `PrivateNote` | string | No | Internal memo |
| `Line` | array | Yes | Array of expense line items |
| `SyncToken` | string | Required for updates | Optimistic locking token |

### Purchase Line Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Line.Amount` | decimal | Yes | Line amount |
| `Line.Description` | string | No | Line description |
| `Line.DetailType` | string | Yes | "AccountBasedExpenseLineDetail" or "ItemBasedExpenseLineDetail" |
| `Line.AccountBasedExpenseLineDetail.AccountRef.value` | string | Yes (account-based) | Expense account ID |
| `Line.AccountBasedExpenseLineDetail.CustomerRef.value` | string | No | Customer to allocate cost to |
| `Line.AccountBasedExpenseLineDetail.BillableStatus` | string | No | "Billable", "NotBillable", "HasBeenBilled" |
| `Line.ItemBasedExpenseLineDetail.ItemRef.value` | string | Yes (item-based) | Item ID |
| `Line.ItemBasedExpenseLineDetail.Qty` | decimal | No | Quantity |
| `Line.ItemBasedExpenseLineDetail.UnitPrice` | decimal | No | Unit price |

### Bill Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `VendorRef.value` | string | Yes | Vendor ID |
| `APAccountRef.value` | string | No | Accounts payable account ID |
| `TxnDate` | date | No | Bill date |
| `DueDate` | date | No | Payment due date |
| `TotalAmt` | decimal | Read-only | Total bill amount |
| `Balance` | decimal | Read-only | Remaining unpaid balance |
| `Line` | array | Yes | Array of line items |
| `SyncToken` | string | Required for updates | Optimistic locking token |

### Vendor Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `DisplayName` | string | Yes | Vendor name |
| `CompanyName` | string | No | Legal company name |
| `PrimaryPhone.FreeFormNumber` | string | No | Phone number |
| `PrimaryEmailAddr.Address` | string | No | Email address |
| `Balance` | decimal | Read-only | Outstanding balance owed |
| `Active` | boolean | No | Whether vendor is active |

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

**Software license expense allocated to a client:**

```json
{
  "PaymentType": "CreditCard",
  "AccountRef": {
    "value": "41"
  },
  "EntityRef": {
    "value": "42",
    "type": "Vendor"
  },
  "TxnDate": "2026-02-15",
  "Line": [
    {
      "Amount": 450.00,
      "Description": "Microsoft 365 Business Premium - 30 seats - Acme Corp - February 2026",
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": { "value": "60" },
        "CustomerRef": { "value": "123" },
        "BillableStatus": "Billable"
      }
    },
    {
      "Amount": 120.00,
      "Description": "SentinelOne Endpoint Protection - 30 seats - Acme Corp - February 2026",
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": { "value": "60" },
        "CustomerRef": { "value": "123" },
        "BillableStatus": "Billable"
      }
    }
  ],
  "PrivateNote": "Monthly software licenses for Acme Corp"
}
```

```bash
curl -s -X POST \
  -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/purchase?minorversion=73" \
  -d '{
    "PaymentType": "CreditCard",
    "AccountRef": { "value": "41" },
    "EntityRef": { "value": "42", "type": "Vendor" },
    "Line": [{
      "Amount": 450.00,
      "Description": "Microsoft 365 - Acme Corp - Feb 2026",
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": { "value": "60" },
        "CustomerRef": { "value": "123" },
        "BillableStatus": "Billable"
      }
    }]
  }'
```

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

### Create Vendor

```json
{
  "DisplayName": "TechDistributor Inc",
  "CompanyName": "TechDistributor Inc",
  "PrimaryPhone": { "FreeFormNumber": "800-555-1234" },
  "PrimaryEmailAddr": { "Address": "orders@techdist.com" },
  "BillAddr": {
    "Line1": "100 Distribution Way",
    "City": "Dallas",
    "CountrySubDivisionCode": "TX",
    "PostalCode": "75201"
  }
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

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 6000 | Business Validation | Check account refs and line amounts |
| 610 | Object Not Found | Verify AccountRef, VendorRef, or CustomerRef |
| 5010 | Stale Object | Re-fetch SyncToken and retry |
| 6240 | Duplicate Name | Use unique vendor DisplayName |
| 2050 | Invalid Reference | Check referenced entity IDs |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| PaymentType required | Missing payment type | Add "Cash", "Check", or "CreditCard" |
| AccountRef required | Missing bank/CC account | Add AccountRef.value |
| Line required | No line items | Add at least one Line item |
| Invalid AccountRef | Bad account ID | Query Account for valid IDs |

### Error Recovery Pattern

```javascript
async function safeCreatePurchase(data) {
  try {
    return await createPurchase(data);
  } catch (error) {
    const fault = error.Fault;
    if (!fault) throw error;

    const detail = fault.Error?.[0]?.Detail || '';

    if (detail.includes('inactive')) {
      console.log('Referenced account or vendor is inactive. Reactivate or use a different reference.');
    }

    if (detail.includes('AccountRef')) {
      console.log('Invalid account reference. Query Accounts to find valid IDs.');
    }

    throw error;
  }
}
```

## Best Practices

1. **Allocate to customers** - Always set CustomerRef on expense lines for per-client tracking
2. **Mark billable expenses** - Use BillableStatus "Billable" for costs to re-invoice to clients
3. **Use consistent accounts** - Map expense categories to standard QBO accounts
4. **Track by vendor** - Create Vendor records for all suppliers and service providers
5. **Include descriptions** - Detailed descriptions help with reconciliation and auditing
6. **Use Bills for deferred payment** - Record vendor invoices as Bills, then pay with BillPayment
7. **Record software licenses monthly** - Track per-seat costs monthly for accurate reporting
8. **Tag with PrivateNote** - Store PSA references and internal project codes
9. **Review billable expenses** - Regularly check for uninvoiced billable expenses
10. **Automate recurring expenses** - Script monthly license and subscription recording

## Endpoint Reference

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create Purchase | POST | `/v3/company/{realmId}/purchase` |
| Read Purchase | GET | `/v3/company/{realmId}/purchase/{id}` |
| Update Purchase | POST | `/v3/company/{realmId}/purchase` |
| Delete Purchase | POST | `/v3/company/{realmId}/purchase?operation=delete` |
| Create Bill | POST | `/v3/company/{realmId}/bill` |
| Read Bill | GET | `/v3/company/{realmId}/bill/{id}` |
| Create BillPayment | POST | `/v3/company/{realmId}/billpayment` |
| Create Vendor | POST | `/v3/company/{realmId}/vendor` |
| Query | GET | `/v3/company/{realmId}/query?query=...` |

## Related Skills

- [QBO Customers](../customers/SKILL.md) - Customer allocation targets
- [QBO Invoices](../invoices/SKILL.md) - Re-invoicing billable expenses
- [QBO Payments](../payments/SKILL.md) - Bill payments
- [QBO Reports](../reports/SKILL.md) - P&L and expense reports
- [QBO API Patterns](../api-patterns/SKILL.md) - API reference
