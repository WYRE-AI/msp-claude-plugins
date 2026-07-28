# Xero Invoice Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `InvoiceID` | string (UUID) | System | Auto-generated unique identifier |
| `InvoiceNumber` | string | No | Invoice number (auto-generated if blank) |
| `Type` | string | Yes | ACCREC (sales) or ACCPAY (bill) |
| `Contact` | object | Yes | Contact object with ContactID |
| `Date` | string | No | Invoice date (YYYY-MM-DDT00:00:00) |
| `DueDate` | string | No | Payment due date |
| `Status` | string | No | DRAFT, SUBMITTED, AUTHORISED, PAID, VOIDED |
| `LineAmountTypes` | string | No | Exclusive, Inclusive, or NoTax |
| `Reference` | string | No | Reference text (e.g., PO number) |
| `Url` | string | No | URL link for the invoice |
| `CurrencyCode` | string | No | Currency code (e.g., USD, AUD) |
| `BrandingThemeID` | string | No | Invoice template/theme ID |

## Line Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Description` | string | Yes | Line item description |
| `Quantity` | decimal | No | Quantity (default 1) |
| `UnitAmount` | decimal | Yes* | Price per unit |
| `AccountCode` | string | Yes* | GL account code |
| `TaxType` | string | No | Tax type code |
| `ItemCode` | string | No | Inventory item code |
| `LineAmount` | decimal | No | Total line amount (calculated) |
| `DiscountRate` | decimal | No | Discount percentage |
| `Tracking` | array | No | Tracking category assignments |

*Required for AUTHORISED status.

## Financial Summary Fields (Read-Only)

| Field | Type | Description |
|-------|------|-------------|
| `SubTotal` | decimal | Sum of line items before tax |
| `TotalTax` | decimal | Total tax amount |
| `Total` | decimal | Total including tax |
| `AmountDue` | decimal | Remaining unpaid amount |
| `AmountPaid` | decimal | Amount already paid |
| `AmountCredited` | decimal | Amount from credit notes |
| `HasAttachments` | boolean | Whether attachments exist |
| `Payments` | array | Associated payment records |
