# Xero Contact Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ContactID` | string (UUID) | System | Auto-generated unique identifier |
| `Name` | string | Yes | Contact/company name (must be unique) |
| `ContactNumber` | string | No | Your reference number for this contact |
| `AccountNumber` | string | No | Account number in your system |
| `ContactStatus` | string | No | ACTIVE, ARCHIVED, or GDPR_REQUEST |
| `EmailAddress` | string | No | Primary email address |
| `FirstName` | string | No | First name (for individual contacts) |
| `LastName` | string | No | Last name (for individual contacts) |
| `BankAccountDetails` | string | No | Bank account information |
| `TaxNumber` | string | No | Tax identification number |
| `AccountsReceivableTaxType` | string | No | Default tax type for sales |
| `AccountsPayableTaxType` | string | No | Default tax type for purchases |
| `DefaultCurrency` | string | No | Default currency code (e.g., USD, AUD) |
| `IsSupplier` | boolean | Read-only | Has supplier invoices |
| `IsCustomer` | boolean | Read-only | Has customer invoices |

## Address Fields

Contacts support two address types: `POBOX` (mailing) and `STREET` (physical):

| Field | Type | Description |
|-------|------|-------------|
| `AddressType` | string | POBOX or STREET |
| `AddressLine1` | string | Street address line 1 |
| `AddressLine2` | string | Street address line 2 |
| `AddressLine3` | string | Street address line 3 |
| `AddressLine4` | string | Street address line 4 |
| `City` | string | City |
| `Region` | string | State/province/region |
| `PostalCode` | string | Postal/zip code |
| `Country` | string | Country |
| `AttentionTo` | string | Attention to name |

## Phone Fields

Contacts support four phone types: `DEFAULT`, `DDI`, `MOBILE`, `FAX`:

| Field | Type | Description |
|-------|------|-------------|
| `PhoneType` | string | DEFAULT, DDI, MOBILE, or FAX |
| `PhoneNumber` | string | Phone number |
| `PhoneAreaCode` | string | Area code |
| `PhoneCountryCode` | string | Country code |

## Financial Summary Fields (Read-Only)

| Field | Type | Description |
|-------|------|-------------|
| `Balances.AccountsReceivable.Outstanding` | decimal | Total outstanding AR |
| `Balances.AccountsReceivable.Overdue` | decimal | Total overdue AR |
| `Balances.AccountsPayable.Outstanding` | decimal | Total outstanding AP |
| `Balances.AccountsPayable.Overdue` | decimal | Total overdue AP |
| `UpdatedDateUTC` | datetime | Last modification timestamp |
