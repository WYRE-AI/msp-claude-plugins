---
name: "Xero Accounts"
description: >
  Xero chart of accounts: account classes and types, account codes, tax
  settings, system accounts, and how MSP revenue, cost-of-sales, and expense
  categories map to the general ledger.
when_to_use: >-
  When navigating, creating, or mapping Xero account codes and the general ledger.
  Use when: xero account, xero chart of accounts, xero gl, xero general ledger,
  account code, xero coa, xero account type, xero bank account, xero revenue
  account, or xero expense account.
---

# Xero Chart of Accounts

## Overview

The chart of accounts (COA) in Xero defines the general ledger structure for your organization. Every invoice line item, payment, and bank transaction references an account code. For MSPs, a well-structured COA enables tracking revenue by service line (managed services, projects, hardware sales), expenses by vendor category, and provides the foundation for meaningful financial reporting.

## Anti-triggers

- **A customer or supplier account** — "account" in Xero means a general
  ledger code; the organization you bill is `xero-contacts`.
- **Balances and movement on those codes** — the chart of accounts is
  structure only and carries no figures; use `xero-reports`.
- **A login, tenant, or API credential** — use `xero-api-patterns`.

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

Each class contains specific account types. The ones that matter most for MSP
work: `BANK` (the only type payments can be applied to), `REVENUE`/`SALES`,
`DIRECTCOSTS` (cost of goods sold), and `OVERHEADS`/`EXPENSE`.

See [references/fields.md](references/fields.md) for the complete field reference,
the full account-type table, and the list of Xero-managed system accounts.

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

## API Patterns

Every request needs both `Authorization: Bearer ${ACCESS_TOKEN}` and
`xero-tenant-id: ${XERO_TENANT_ID}`. Two Xero-specific quirks apply here:

- **`/Accounts` is not paginated** — a single GET returns the whole COA.
- **Updates and archives use POST, not PUT**, against
  `/Accounts/{AccountID}`, and the body must repeat the `AccountID`.
- **Filters go in a URL-encoded `where` clause** with doubled quotes around
  string literals:

```bash
# Revenue accounts only
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts?where=Class==%22REVENUE%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

See [references/api.md](references/api.md) for the full endpoint catalog and
create/update/archive/delete examples.

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

## Gotchas

- **Accounts with transactions cannot be deleted.** The DELETE call fails;
  archive the account instead (`Status: "ARCHIVED"`).
- **System accounts are read-only.** `DEBTORS`, `CREDITORS`, `GST`, `ROUNDING`
  and friends are Xero-managed and reject modification.
- **Account codes must be unique** across the whole COA, including archived
  accounts, so a "code already exists" error may point at an archived record.
- **`Class` is derived from `Type`** and cannot be set directly.

See [references/errors.md](references/errors.md) for the complete error-code table.

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

## Best Practices

1. **Use consistent code ranges** - Revenue 200-299, COGS 400-499, Expenses 500-699
2. **Name accounts descriptively** - "Managed Services Revenue" not just "Revenue"
3. **Add descriptions** - Include what transactions belong in each account
4. **Set default tax types** - Reduces errors when creating invoices
5. **Archive, don't delete** - Preserve historical data for accounts with transactions
6. **Separate revenue streams** - Track managed services, projects, and hardware separately
7. **Map to PSA categories** - Align account codes with PSA service categories
8. **Use DIRECTCOSTS for COGS** - Separate direct vendor costs from overhead expenses

## Related Skills

- [Xero Invoices](../invoices/SKILL.md) - Account codes for invoice line items
- [Xero Payments](../payments/SKILL.md) - Bank accounts for payments
- [Xero Reports](../reports/SKILL.md) - P&L and Balance Sheet use accounts
- [Xero API Patterns](../api-patterns/SKILL.md) - API reference
