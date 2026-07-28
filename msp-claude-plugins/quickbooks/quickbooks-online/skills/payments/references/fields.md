# QuickBooks Online Payment Field Reference

## Payment Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `CustomerRef.value` | string | Yes | Customer ID |
| `TotalAmt` | decimal | Yes | Total payment amount |
| `TxnDate` | date | No | Payment date (default: today) |
| `PaymentMethodRef.value` | string | No | Payment method ID |
| `PaymentRefNum` | string | No | Reference number (check number, etc.) |
| `DepositToAccountRef.value` | string | No | Bank account to deposit to |
| `Line` | array | No | Invoice linkages |
| `UnappliedAmt` | decimal | Read-only | Unapplied portion of payment |
| `PrivateNote` | string | No | Internal memo |
| `SyncToken` | string | Required for updates | Optimistic locking token |

## Payment Line Fields (Invoice Application)

| Field | Type | Description |
|-------|------|-------------|
| `Line.Amount` | decimal | Amount applied to this invoice |
| `Line.LinkedTxn[].TxnId` | string | Invoice ID to apply payment to |
| `Line.LinkedTxn[].TxnType` | string | Always "Invoice" |

## Credit Memo Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `CustomerRef.value` | string | Yes | Customer ID |
| `TotalAmt` | decimal | Read-only | Total credit amount |
| `TxnDate` | date | No | Credit memo date |
| `Line` | array | Yes | Credit line items |
| `RemainingCredit` | decimal | Read-only | Unapplied credit amount |
| `SyncToken` | string | Required for updates | Optimistic locking token |

## Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `MetaData.CreateTime` | datetime | Creation timestamp |
| `MetaData.LastUpdatedTime` | datetime | Last update timestamp |
