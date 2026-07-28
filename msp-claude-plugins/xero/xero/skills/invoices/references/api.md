# Xero Invoices API Reference

Complete request catalog for the `/Invoices` endpoints.

## List Invoices

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**With Filters:**

```bash
# Sales invoices only
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Type==%22ACCREC%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Outstanding invoices
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Type==%22ACCREC%22&&AmountDue>0" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Invoices for a specific contact
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Contact.ContactID==guid(%22${CONTACT_ID}%22)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Invoices by date range
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Date>=DateTime(2026,3,1)&&Date<=DateTime(2026,3,31)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Overdue invoices
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Type==%22ACCREC%22&&Status==%22AUTHORISED%22&&DueDate<DateTime(2026,2,23)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

## Get Single Invoice

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices/${INVOICE_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

## Create Sales Invoice (ACCREC)

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Type": "ACCREC",
    "Contact": {
      "ContactID": "'${CONTACT_ID}'"
    },
    "Date": "2026-03-01T00:00:00",
    "DueDate": "2026-03-31T00:00:00",
    "LineAmountTypes": "Exclusive",
    "Reference": "March 2026 Managed Services",
    "LineItems": [
      {
        "Description": "Monthly Managed Services - Acme Corp (25 endpoints)",
        "Quantity": 1,
        "UnitAmount": 2500.00,
        "AccountCode": "200",
        "TaxType": "OUTPUT"
      },
      {
        "Description": "Microsoft 365 Business Premium Licenses (25 users)",
        "Quantity": 25,
        "UnitAmount": 22.00,
        "AccountCode": "200",
        "TaxType": "OUTPUT"
      },
      {
        "Description": "Backup & Disaster Recovery - 500GB",
        "Quantity": 1,
        "UnitAmount": 350.00,
        "AccountCode": "200",
        "TaxType": "OUTPUT"
      }
    ],
    "Status": "DRAFT"
  }'
```

## Create Supplier Bill (ACCPAY)

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Type": "ACCPAY",
    "Contact": {
      "ContactID": "'${VENDOR_CONTACT_ID}'"
    },
    "Date": "2026-03-01T00:00:00",
    "DueDate": "2026-03-31T00:00:00",
    "InvoiceNumber": "VENDOR-INV-2026-03",
    "Reference": "Monthly software licenses",
    "LineAmountTypes": "Exclusive",
    "LineItems": [
      {
        "Description": "RMM Platform - 150 endpoints",
        "Quantity": 150,
        "UnitAmount": 3.50,
        "AccountCode": "400",
        "TaxType": "INPUT"
      }
    ],
    "Status": "DRAFT"
  }'
```

## Update Invoice

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices/${INVOICE_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "InvoiceID": "'${INVOICE_ID}'",
    "Reference": "Updated reference",
    "Status": "AUTHORISED"
  }'
```

## Void Invoice

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices/${INVOICE_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "InvoiceID": "'${INVOICE_ID}'",
    "Status": "VOIDED"
  }'
```

## Batch Create Invoices

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices?summarizeErrors=false" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Invoices": [
      {
        "Type": "ACCREC",
        "Contact": { "ContactID": "abc-123" },
        "Date": "2026-03-01T00:00:00",
        "DueDate": "2026-03-31T00:00:00",
        "LineItems": [{ "Description": "Managed Services - March 2026", "Quantity": 1, "UnitAmount": 2500.00, "AccountCode": "200" }]
      },
      {
        "Type": "ACCREC",
        "Contact": { "ContactID": "def-456" },
        "Date": "2026-03-01T00:00:00",
        "DueDate": "2026-03-31T00:00:00",
        "LineItems": [{ "Description": "Managed Services - March 2026", "Quantity": 1, "UnitAmount": 1800.00, "AccountCode": "200" }]
      }
    ]
  }'
```

## Credit Note for Service Adjustment

When a client needs a partial credit:

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/CreditNotes" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Type": "ACCRECCREDIT",
    "Contact": { "ContactID": "'${CONTACT_ID}'" },
    "Date": "2026-03-15T00:00:00",
    "LineItems": [
      {
        "Description": "Service credit - 3 day outage adjustment",
        "Quantity": 1,
        "UnitAmount": 250.00,
        "AccountCode": "200"
      }
    ],
    "Status": "AUTHORISED"
  }'
```

## Endpoint Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Invoices` | GET | List invoices (paginated, filterable) |
| `/Invoices` | POST | Create or update invoices (single or batch) |
| `/Invoices/{InvoiceID}` | GET | Get single invoice with full detail |
| `/Invoices/{InvoiceID}` | POST | Update an invoice |
| `/Invoices/{InvoiceID}/Attachments` | GET | List invoice attachments |
| `/Invoices/{InvoiceID}/Attachments/{FileName}` | PUT | Upload attachment |
| `/Invoices/{InvoiceID}/OnlineInvoice` | GET | Get online invoice URL |
| `/Invoices/{InvoiceID}/Email` | POST | Email invoice to contact |
