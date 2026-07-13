---
name: "Xero Accounts"
description: >
  Use this skill when working with Xero chart of accounts - navigating
  account codes, creating accounts, understanding account types and classes,
  tax settings, and mapping MSP revenue and expense categories to the
  general ledger.
when_to_use: >-
  When navigating account codes, creating accounts, understanding account types and classes, tax
  settings, and mapping MSP revenue and expense categories to the general ledger. Use when: xero
  account, xero chart of accounts, xero gl, xero general ledger, account code, xero coa, xero
  account type, xero bank account, xero revenue account, or xero expense account.
---

# Xero Chart of Accounts

## Overview

The chart of accounts (COA) in Xero defines the general ledger structure for your organization. Every invoice line item, payment, and bank transaction references an account code. For MSPs, a well-structured COA enables tracking revenue by service line (managed services, projects, hardware sales), expenses by vendor category, and provides the foundation for meaningful financial reporting.

## Core Concepts

### Account Classes

Xero organizes accounts into five standard accounting classes:

| Class | Description | MSP Examples |
|-------|-------------|-------------|
| `ASSET` | Things you own | Bank accounts, accounts receivable, equipment |
| `EQUITY` | Owner's stake | Retained earnings, owner's equity |
| `EXPENSE` | Costs of business | Software licenses, salaries, ISP costs |
| `LIABILITY` | Things you owe | Accounts payable, loans, tax liabilities |
| `REVENUE` | Income earned | Managed services, project revenue, hardware sales |

### Account Types

Each class contains specific account types:

| Class | Type | Code | Description |
|-------|------|------|-------------|
| ASSET | `BANK` | BANK | Bank accounts (used for payments) |
| ASSET | `CURRENT` | CURRENT | Current assets (AR, inventory) |
| ASSET | `FIXED` | FIXED | Fixed assets (equipment) |
| ASSET | `PREPAYMENT` | PREPAYMENT | Prepaid expenses |
| EQUITY | `EQUITY` | EQUITY | Equity accounts |
| EXPENSE | `EXPENSE` | EXPENSE | Operating expenses |
| EXPENSE | `DIRECTCOSTS` | DIRECTCOSTS | Cost of goods sold |
| EXPENSE | `OVERHEADS` | OVERHEADS | Overhead expenses |
| LIABILITY | `CURRLIAB` | CURRLIAB | Current liabilities |
| LIABILITY | `LIABILITY` | LIABILITY | Long-term liabilities |
| LIABILITY | `TERMLIAB` | TERMLIAB | Term liabilities |
| REVENUE | `REVENUE` | REVENUE | Revenue accounts |
| REVENUE | `OTHERINCOME` | OTHERINCOME | Other income |
| REVENUE | `SALES` | SALES | Sales revenue |

### MSP Chart of Accounts Structure

A typical MSP chart of accounts includes:

```
Revenue (200-299)
  200 - Managed Services Revenue
  210 - Project Revenue
  220 - Hardware Sales
  230 - Software License Revenue
  240 - Cloud Services Revenue
  250 - Consulting Revenue

Cost of Sales (400-499)
  400 - Software License Costs
  410 - Hardware Costs
  420 - Cloud Platform Costs (Azure, AWS)
  430 - ISP/Connectivity Costs
  440 - Subcontractor Costs

Expenses (500-699)
  500 - Salaries & Wages
  510 - Employee Benefits
  520 - Office Rent
  530 - Insurance
  540 - Marketing
  550 - Professional Development
  560 - Tools & Subscriptions
```

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `AccountID` | string (UUID) | System | Auto-generated unique identifier |
| `Code` | string | Yes | Account code (e.g., "200", "400") |
| `Name` | string | Yes | Account name |
| `Type` | string | Yes | Account type (REVENUE, EXPENSE, BANK, etc.) |
| `Status` | string | No | ACTIVE or ARCHIVED |
| `Description` | string | No | Account description |
| `TaxType` | string | No | Default tax type for this account |
| `EnablePaymentsToAccount` | boolean | No | Whether payments can be made to this account |
| `ShowInExpenseClaims` | boolean | No | Show in expense claims |
| `Class` | string | Read-only | Account class (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE) |
| `BankAccountNumber` | string | No | Bank account number (BANK type only) |
| `BankAccountType` | string | No | BANK or CREDITCARD (BANK type only) |
| `CurrencyCode` | string | No | Currency for bank accounts |
| `ReportingCode` | string | No | Reporting code for financial statements |
| `ReportingCodeName` | string | Read-only | Reporting code name |

### System Accounts (Read-Only)

| Field | Type | Description |
|-------|------|-------------|
| `SystemAccount` | string | System account type (e.g., DEBTORS, CREDITORS) |

Xero creates these system accounts automatically:

| System Account | Description |
|----------------|-------------|
| `DEBTORS` | Accounts Receivable |
| `CREDITORS` | Accounts Payable |
| `GST` | Tax collected/paid |
| `GSTONIMPORTS` | Tax on imports |
| `HISTORICAL` | Historical adjustment |
| `REALISEDCURRENCYGAIN` | Realized currency gains |
| `UNREALISEDCURRENCYGAIN` | Unrealized currency gains |
| `ROUNDING` | Rounding adjustments |

## API Patterns

### List All Accounts

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**With Filters:**

```bash
# Revenue accounts only
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts?where=Class==%22REVENUE%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Bank accounts only
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts?where=Type==%22BANK%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Active accounts only
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts?where=Status==%22ACTIVE%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Expense accounts
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts?where=Class==%22EXPENSE%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

### Get Single Account

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts/${ACCOUNT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

### Create Account

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Accounts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Code": "245",
    "Name": "Cloud Services Revenue",
    "Type": "REVENUE",
    "Description": "Revenue from cloud hosting and Azure/AWS resale",
    "TaxType": "OUTPUT"
  }'
```

### Update Account

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Accounts/${ACCOUNT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "AccountID": "'${ACCOUNT_ID}'",
    "Name": "Cloud & Hosting Revenue",
    "Description": "Revenue from cloud hosting, Azure, AWS, and SaaS resale"
  }'
```

### Archive Account

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Accounts/${ACCOUNT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "AccountID": "'${ACCOUNT_ID}'",
    "Status": "ARCHIVED"
  }'
```

### Delete Account

```bash
curl -s -X DELETE "https://api.xero.com/api.xro/2.0/Accounts/${ACCOUNT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}"
```

**Note:** Accounts with transactions cannot be deleted. Archive them instead.

## Common Workflows

### Set Up MSP Revenue Accounts

```javascript
async function setupMspRevenueAccounts() {
  const accounts = [
    { Code: '200', Name: 'Managed Services Revenue', Type: 'REVENUE', Description: 'Monthly recurring managed services contracts' },
    { Code: '210', Name: 'Project Revenue', Type: 'REVENUE', Description: 'One-time project and implementation work' },
    { Code: '220', Name: 'Hardware Sales', Type: 'REVENUE', Description: 'Hardware sales and procurement markup' },
    { Code: '230', Name: 'Software License Revenue', Type: 'REVENUE', Description: 'Software license resale (M365, security, etc.)' },
    { Code: '240', Name: 'Cloud Services Revenue', Type: 'REVENUE', Description: 'Cloud hosting and IaaS/PaaS resale' },
    { Code: '250', Name: 'Consulting Revenue', Type: 'REVENUE', Description: 'Ad-hoc consulting and advisory services' }
  ];

  const results = [];
  for (const account of accounts) {
    try {
      const result = await createAccount(account);
      results.push({ code: account.Code, status: 'created' });
    } catch (error) {
      results.push({ code: account.Code, status: 'error', message: error.message });
    }
  }

  return results;
}
```

### Validate Account Codes for Invoice

```javascript
async function validateAccountCodes(lineItems) {
  const accounts = await fetchAllAccounts();
  const accountCodes = new Set(accounts.map(a => a.Code));
  const revenueAccounts = new Set(
    accounts.filter(a => a.Class === 'REVENUE').map(a => a.Code)
  );

  const issues = [];

  for (const item of lineItems) {
    if (!accountCodes.has(item.AccountCode)) {
      issues.push(`Account code '${item.AccountCode}' does not exist`);
    } else if (!revenueAccounts.has(item.AccountCode)) {
      issues.push(`Account code '${item.AccountCode}' is not a revenue account`);
    }
  }

  return { valid: issues.length === 0, issues };
}
```

### Revenue Breakdown by Account

```javascript
async function getRevenueBreakdown(startDate, endDate) {
  const accounts = await fetchAllAccounts();
  const revenueAccounts = accounts.filter(a => a.Class === 'REVENUE');

  const invoices = await fetchAllInvoices({
    where: `Type=="ACCREC"&&Status!="VOIDED"&&Status!="DELETED"&&Date>=DateTime(${startDate})&&Date<=DateTime(${endDate})`
  });

  const breakdown = {};

  for (const account of revenueAccounts) {
    breakdown[account.Code] = {
      name: account.Name,
      total: 0,
      invoiceCount: 0
    };
  }

  for (const invoice of invoices) {
    for (const line of invoice.LineItems || []) {
      if (breakdown[line.AccountCode]) {
        breakdown[line.AccountCode].total += line.LineAmount || 0;
        breakdown[line.AccountCode].invoiceCount++;
      }
    }
  }

  return breakdown;
}
```

### Find Bank Accounts for Payments

```javascript
async function getBankAccounts() {
  const accounts = await fetchAllAccounts();
  return accounts
    .filter(a => a.Type === 'BANK' && a.Status === 'ACTIVE')
    .map(a => ({
      accountId: a.AccountID,
      code: a.Code,
      name: a.Name,
      bankAccountNumber: a.BankAccountNumber,
      currencyCode: a.CurrencyCode
    }));
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Account code already exists | Use a different code |
| 400 | Account code is required | Provide Code field |
| 400 | Account name is required | Provide Name field |
| 400 | Invalid account type | Use valid Type value |
| 400 | Cannot delete account with transactions | Archive instead |
| 400 | System accounts cannot be modified | These are Xero-managed |
| 401 | Unauthorized | Refresh access token |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Code already exists | Duplicate account code | Choose unique code |
| Code is required | Missing Code field | Add Code to request |
| Invalid type | Wrong Type value | Use valid account type |
| Cannot delete | Account has transactions | Archive account instead |
| System account | Modifying system account | System accounts are read-only |

### Error Recovery Pattern

```javascript
async function safeCreateAccount(data) {
  try {
    return await createAccount(data);
  } catch (error) {
    if (error.message?.includes('already exists')) {
      // Account exists - find and return it
      const accounts = await fetchAllAccounts();
      return accounts.find(a => a.Code === data.Code);
    }

    throw error;
  }
}
```

## Endpoint Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Accounts` | GET | List all accounts (not paginated) |
| `/Accounts` | POST | Create an account |
| `/Accounts/{AccountID}` | GET | Get single account |
| `/Accounts/{AccountID}` | POST | Update an account |
| `/Accounts/{AccountID}` | DELETE | Delete an account |
| `/Accounts/{AccountID}/Attachments` | GET | List account attachments |

## Best Practices

1. **Use consistent code ranges** - Revenue 200-299, COGS 400-499, Expenses 500-699
2. **Name accounts descriptively** - "Managed Services Revenue" not just "Revenue"
3. **Add descriptions** - Include what transactions belong in each account
4. **Set default tax types** - Reduces errors when creating invoices
5. **Archive, don't delete** - Preserve historical data for accounts with transactions
6. **Separate revenue streams** - Track managed services, projects, and hardware separately
7. **Map to PSA categories** - Align account codes with PSA service categories
8. **Review quarterly** - Clean up unused accounts and verify mappings
9. **Document your COA** - Maintain a reference guide for account code usage
10. **Use DIRECTCOSTS for COGS** - Separate direct vendor costs from overhead expenses

## Related Skills

- [Xero Invoices](../invoices/SKILL.md) - Account codes for invoice line items
- [Xero Payments](../payments/SKILL.md) - Bank accounts for payments
- [Xero Reports](../reports/SKILL.md) - P&L and Balance Sheet use accounts
- [Xero API Patterns](../api-patterns/SKILL.md) - API reference
