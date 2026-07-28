# QuickBooks Online Expense Field Reference

## Purchase Core Fields

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

## Purchase Line Item Fields

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

## Bill Core Fields

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

## Vendor Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `DisplayName` | string | Yes | Vendor name |
| `CompanyName` | string | No | Legal company name |
| `PrimaryPhone.FreeFormNumber` | string | No | Phone number |
| `PrimaryEmailAddr.Address` | string | No | Email address |
| `Balance` | decimal | Read-only | Outstanding balance owed |
| `Active` | boolean | No | Whether vendor is active |
