# Xero Account Field Reference

## Core Fields

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

## Account Types by Class

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

## System Accounts (Read-Only)

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
