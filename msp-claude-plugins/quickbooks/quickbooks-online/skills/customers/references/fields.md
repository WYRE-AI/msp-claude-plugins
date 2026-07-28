# QuickBooks Online Customer Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `DisplayName` | string | Yes | Unique display name (customer-facing) |
| `CompanyName` | string | No | Legal company name |
| `GivenName` | string | No | Contact first name |
| `FamilyName` | string | No | Contact last name |
| `Active` | boolean | No | Whether customer is active (default: true) |
| `Balance` | decimal | Read-only | Outstanding balance |
| `BalanceWithJobs` | decimal | Read-only | Balance including sub-customers |
| `SyncToken` | string | Required for updates | Optimistic locking token |

## Contact Fields

| Field | Type | Description |
|-------|------|-------------|
| `PrimaryPhone.FreeFormNumber` | string | Primary phone number |
| `AlternatePhone.FreeFormNumber` | string | Alternate phone |
| `Mobile.FreeFormNumber` | string | Mobile phone |
| `Fax.FreeFormNumber` | string | Fax number |
| `PrimaryEmailAddr.Address` | string | Primary email (used for invoice delivery) |
| `WebAddr.URI` | string | Website URL |

## Address Fields

| Field | Type | Description |
|-------|------|-------------|
| `BillAddr.Line1` | string | Billing street address |
| `BillAddr.City` | string | Billing city |
| `BillAddr.CountrySubDivisionCode` | string | Billing state/province |
| `BillAddr.PostalCode` | string | Billing postal code |
| `BillAddr.Country` | string | Billing country |
| `ShipAddr` | object | Shipping address (same structure as BillAddr) |

## Billing Fields

| Field | Type | Description |
|-------|------|-------------|
| `SalesTermRef.value` | string | Payment terms ID (e.g., Net 30) |
| `PaymentMethodRef.value` | string | Default payment method ID |
| `CurrencyRef.value` | string | Currency code (e.g., "USD") |
| `PreferredDeliveryMethod` | string | "Print", "Email", or "None" |
| `Taxable` | boolean | Whether customer is taxable |

## Hierarchy Fields

| Field | Type | Description |
|-------|------|-------------|
| `ParentRef.value` | string | Parent customer ID (for sub-customers) |
| `Job` | boolean | Whether this is a job (sub-customer) |
| `Level` | integer | Depth in hierarchy (0 = top-level) |
| `FullyQualifiedName` | string | Full path (e.g., "Acme Corp:Managed Services") |

## Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `MetaData.CreateTime` | datetime | Creation timestamp |
| `MetaData.LastUpdatedTime` | datetime | Last update timestamp |
