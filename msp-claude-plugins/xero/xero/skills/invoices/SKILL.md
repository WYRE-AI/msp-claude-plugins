---
name: "Xero Invoices"
description: >
  Xero sales invoices (ACCREC) and supplier bills (ACCPAY): status lifecycle,
  invoice numbering, line items and tracking categories, tax handling, credit
  notes, batch creation, validation-error shapes, and recurring managed-services
  billing for MSPs.
when_to_use: >-
  When creating, searching, updating, voiding, or reconciling Xero invoices and supplier bills.
  Use when: xero invoice, xero bill, xero billing, xero accrec, xero accpay,
  create invoice, sales invoice, managed services invoice, monthly billing, or invoice management.
---

# Xero Invoices Management

## Overview

Invoices are the core transaction entity in Xero for billing and accounts payable. For MSPs, invoices represent two primary flows: sales invoices (ACCREC) for billing managed services clients, and supplier bills (ACCPAY) for vendor costs like software licenses, hardware purchases, and ISP charges.

## Anti-triggers

- **A quote or proposal the customer has not agreed to** — an invoice is a
  demand for payment, not an offer; use `salesbuildr-quotes`,
  `connectwise-cpq-quotes`, or `pandadoc-documents`.
- **Collecting the money the invoice asks for** — Xero records the receivable;
  the hosted payment rail is `alternative-payments-invoicing` and recording
  the receipt is `xero-payments`.
- **Aged receivables or revenue totals** — do not aggregate invoice rows by
  hand; use `xero-reports`.
- **The same operation in QuickBooks** — use `quickbooks-online-invoices`.
- **An invoice raised outside the ledger** — a PSA bills from
  agreements and time, and a distributor bills the MSP for licences;
  neither posts to Xero until it is entered. Use `halopsa-invoices`,
  `syncro-invoices`, or `pax8-invoices`.

## Core Concepts

### Invoice Types

| Type | Code | Description | MSP Use Case |
|------|------|-------------|-------------|
| Sales Invoice | `ACCREC` | Accounts Receivable - you bill a customer | Monthly managed services, project work |
| Supplier Bill | `ACCPAY` | Accounts Payable - a vendor bills you | Software licenses, hardware, ISP bills |

### Invoice Status Lifecycle

```
DRAFT --> SUBMITTED --> AUTHORISED --> PAID
                                  \--> VOIDED
                                  \--> DELETED (draft only)
```

| Status | Description | Editable | Can Pay |
|--------|-------------|----------|---------|
| `DRAFT` | Created but not submitted | Yes | No |
| `SUBMITTED` | Submitted for approval | Limited | No |
| `AUTHORISED` | Approved and sent to client | No | Yes |
| `PAID` | Fully paid | No | N/A |
| `VOIDED` | Cancelled/voided | No | No |
| `DELETED` | Removed (draft only) | N/A | N/A |

### Invoice Numbering

Xero auto-generates sequential invoice numbers (e.g., INV-0001, INV-0002) or you can set custom numbers using the `InvoiceNumber` field. MSPs often use prefixes like `MS-` for managed services or `PJ-` for project invoices.

### Key Fields

An invoice needs `Type`, a `Contact` with a valid `ContactID`, and at least one line item. Line items need `Description`, and — to reach AUTHORISED — `UnitAmount` and `AccountCode`. `LineAmountTypes` (`Exclusive`, `Inclusive`, `NoTax`) determines whether `UnitAmount` includes tax. `SubTotal`, `TotalTax`, `Total`, `AmountDue`, `AmountPaid`, and `AmountCredited` are read-only and calculated by Xero.

See [references/fields.md](references/fields.md) for the complete field reference.

## API Patterns

Both create and update go through `POST` — `POST /Invoices` creates (or batch-creates via an `Invoices` array), `POST /Invoices/{InvoiceID}` updates. There is no PATCH and no DELETE for authorised invoices; set `Status: "VOIDED"` instead.

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Type": "ACCREC",
    "Contact": { "ContactID": "'${CONTACT_ID}'" },
    "Date": "2026-03-01T00:00:00",
    "DueDate": "2026-03-31T00:00:00",
    "LineAmountTypes": "Exclusive",
    "Reference": "March 2026 Managed Services",
    "LineItems": [
      { "Description": "Monthly Managed Services (25 endpoints)", "Quantity": 1, "UnitAmount": 2500.00, "AccountCode": "200", "TaxType": "OUTPUT" }
    ],
    "Status": "DRAFT"
  }'
```

Filtering uses the `where` query parameter with URL-encoded expressions — `Type=="ACCREC"`, `AmountDue>0`, `Contact.ContactID==guid("...")`, `Date>=DateTime(2026,3,1)`. Add `?summarizeErrors=false` to batch requests to get per-invoice errors instead of a single aggregate failure.

See [references/api.md](references/api.md) for the full request catalog (filters, bills, void, batch, credit notes) and the endpoint reference.

## Common Workflows

### Monthly MSP Billing Cycle

1. **Generate invoices** for all managed services clients (1st of the month) — batch-create as DRAFT
2. **Review drafts** for accuracy
3. **Authorize invoices** to finalize
4. **Email invoices** to clients via `/Invoices/{InvoiceID}/Email`
5. **Track payments** as they arrive
6. **Follow up** on overdue invoices (`Status=="AUTHORISED" && DueDate < today`)

### Tracking Categories for Service-Line Reporting

Attach a `Tracking` array to each line item (Name/Option pairs like Department + Region) so P&L can be filtered by service line later.

### Credit Notes for Service Adjustments

Partial credits go through `/CreditNotes` with `Type: "ACCRECCREDIT"` rather than editing the original invoice — the invoice stays intact for audit.

### Find Unbilled Clients

Compare the set of active customer contacts against the `Contact.ContactID` values on ACCREC invoices in the billing period.

See [references/examples.md](references/examples.md) for working JavaScript implementations of these workflows.

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Account code is not valid | Verify AccountCode exists in chart of accounts |
| 400 | A Contact is required | Provide Contact with valid ContactID |
| 400 | At least one line item is required | Add LineItems array with entries |
| 400 | Invoice number already used | Use unique InvoiceNumber or omit for auto |
| 400 | Cannot void a paid invoice | Reverse payment first, then void |
| 401 | Unauthorized | Refresh access token |
| 404 | Invoice not found | Verify InvoiceID |

### Validation Errors

Validation failures return HTTP 200 with the error attached to the invoice object — check `HasErrors` on every returned invoice rather than relying on the status code:

```json
{
  "Invoices": [
    {
      "InvoiceID": "00000000-0000-0000-0000-000000000000",
      "HasErrors": true,
      "ValidationErrors": [
        { "Message": "Account code '999' is not a valid code for this document." }
      ]
    }
  ]
}
```

## Gotchas

- **Validation failures look like successes** - A 200 response can still contain `HasErrors: true`; parse per-invoice results, especially in batches.
- **Create as DRAFT, authorise separately** - AUTHORISED invoices cannot be edited, only voided; a bad batch created straight to AUTHORISED means voiding and re-issuing.
- **Void, never delete** - `DELETED` is only available for drafts. Voiding preserves the audit trail and the invoice number.
- **Batch without `summarizeErrors=false` hides detail** - The default collapses batch failures into one message, so you cannot tell which invoice broke.
- **`InvoiceNumber` collides silently across types** - Reusing a number a voided invoice already consumed still fails; omit the field to let Xero assign one.
- **Line item detail drives reporting** - Splitting services, licenses, and add-ons into separate lines with consistent account codes is what makes downstream P&L and margin analysis usable.

## Related Skills

- [Xero Contacts](../contacts/SKILL.md) - Managing invoice recipients
- [Xero Payments](../payments/SKILL.md) - Recording payments against invoices
- [Xero Accounts](../accounts/SKILL.md) - GL account codes for line items
- [Xero Reports](../reports/SKILL.md) - Financial reporting on invoices
- [Xero API Patterns](../api-patterns/SKILL.md) - API reference
