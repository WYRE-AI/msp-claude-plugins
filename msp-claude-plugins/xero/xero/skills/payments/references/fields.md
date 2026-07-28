# Xero Payment Field Reference

## Core Fields

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

## Related Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `Invoice.InvoiceID` | string | UUID of the invoice |
| `Invoice.InvoiceNumber` | string | Invoice number |
| `Account.AccountID` | string | UUID of the bank account |
| `Account.Code` | string | Account code of the bank account |
