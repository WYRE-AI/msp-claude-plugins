# QuickBooks Online Invoice Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `DocNumber` | string | No | Invoice number (auto-generated if blank) |
| `TxnDate` | date | No | Invoice date (default: today) |
| `DueDate` | date | No | Payment due date (calculated from terms) |
| `CustomerRef.value` | string | Yes | Customer ID |
| `Line` | array | Yes | Array of line items |
| `TotalAmt` | decimal | Read-only | Total invoice amount |
| `Balance` | decimal | Read-only | Remaining unpaid balance |
| `SyncToken` | string | Required for updates | Optimistic locking token |

## Billing Fields

| Field | Type | Description |
|-------|------|-------------|
| `SalesTermRef.value` | string | Payment terms ID |
| `BillEmail.Address` | string | Email to send invoice to |
| `BillAddr` | object | Billing address |
| `ShipAddr` | object | Shipping address |
| `CustomerMemo.value` | string | Memo visible to customer |
| `PrivateNote` | string | Internal note (not visible to customer) |
| `EmailStatus` | string | "NotSet", "NeedToSend", "EmailSent" |

## Line Item Fields (SalesItemLineDetail)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Line.Amount` | decimal | Yes | Line total (Qty x Rate) |
| `Line.Description` | string | No | Line item description |
| `Line.DetailType` | string | Yes | "SalesItemLineDetail" |
| `Line.SalesItemLineDetail.ItemRef.value` | string | Yes | Item ID |
| `Line.SalesItemLineDetail.Qty` | decimal | No | Quantity |
| `Line.SalesItemLineDetail.UnitPrice` | decimal | No | Unit price |
| `Line.SalesItemLineDetail.ServiceDate` | date | No | Service date |

## Tax Fields

| Field | Type | Description |
|-------|------|-------------|
| `TxnTaxDetail.TotalTax` | decimal | Total tax amount |
| `TxnTaxDetail.TxnTaxCodeRef.value` | string | Tax code ID |
| `GlobalTaxCalculation` | string | "TaxExcluded", "TaxInclusive", "NotApplicable" |

## Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `MetaData.CreateTime` | datetime | Creation timestamp |
| `MetaData.LastUpdatedTime` | datetime | Last update timestamp |
