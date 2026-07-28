# Vendor Field Mappings

Field-level correspondence between Pax8 subscriptions and the two supported
accounting platforms.

| Concept | Pax8 Field | Xero Field | QBO Field |
|---------|-----------|------------|-----------|
| Customer | `companyName` (via `/companies/{id}`) | `Contact.Name` | `Customer.DisplayName` |
| Product | `productName` (via `/products/{id}`) | `LineItem.Description` | `Line.Description` |
| Quantity | `quantity` | `LineItem.Quantity` | `Line.SalesItemLineDetail.Qty` |
| Unit Price (cost) | `price` | N/A (this is sell price) | N/A (this is sell price) |
| Unit Price (sell) | N/A (calculated) | `LineItem.UnitAmount` | `Line.SalesItemLineDetail.UnitPrice` |
| Line Total | `price x quantity` | `LineItem.LineAmount` | `Line.Amount` |
| Status | `status` (Active, Cancelled, ...) | `Invoice.Status` (AUTHORISED, PAID, ...) | `Invoice.Balance` (0 = paid) |
| Period Start | `startDate` | `Invoice.Date` | `Invoice.TxnDate` |
| Period End | `commitmentTermEnd` / `endDate` | `Invoice.DueDate` | `Invoice.DueDate` |
| Billing Term | `billingTerm` (Monthly, Annual) | Inferred from invoice frequency | Inferred from invoice frequency |
| Invoice Number | N/A | `Invoice.InvoiceNumber` | `Invoice.DocNumber` |
| Invoice ID | N/A | `Invoice.InvoiceID` | `Invoice.Id` |

## API Tool Mapping Per Step

| Step | Data Source | API / Tool |
|------|-----------|-----------|
| 1 - Subscriptions | Pax8 | `GET /v1/subscriptions?status=Active` |
| 1 - Company names | Pax8 | `GET /v1/companies/{id}` |
| 1 - Product names | Pax8 | `GET /v1/products/{id}` |
| 2 - Invoices (Xero) | Xero | `GET /api.xro/2.0/Invoices?where=Type=="ACCREC"` |
| 2 - Contacts (Xero) | Xero | `GET /api.xro/2.0/Contacts` |
| 2 - Invoices (QBO) | QuickBooks | `GET /v3/company/{realmId}/query?query=SELECT * FROM Invoice` |
| 2 - Customers (QBO) | QuickBooks | `GET /v3/company/{realmId}/query?query=SELECT * FROM Customer` |
| 3-5 - Matching | Local | In-memory comparison logic |
