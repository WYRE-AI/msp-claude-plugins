# Xero Payments API Reference

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Payments` | GET | List payments (paginated, filterable) |
| `/Payments` | POST | Create payments (single or batch) |
| `/Payments/{PaymentID}` | GET | Get single payment |
| `/Payments/{PaymentID}` | POST | Update payment (delete only) |
| `/Overpayments` | GET | List overpayments |
| `/Overpayments/{OverpaymentID}` | GET | Get single overpayment |
| `/Overpayments/{OverpaymentID}/Allocations` | PUT | Allocate overpayment to invoices |
| `/Prepayments` | GET | List prepayments |
| `/Prepayments/{PrepaymentID}/Allocations` | PUT | Allocate prepayment to invoices |

## List Payments

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**With Filters:**

```bash
# Payments received (AR)
curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments?where=PaymentType==%22ACCRECPAYMENT%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Payments in a date range
curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments?where=Date>=DateTime(2026,3,1)&&Date<=DateTime(2026,3,31)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Payments for a specific invoice
curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments?where=Invoice.InvoiceID==guid(%22${INVOICE_ID}%22)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

## Get Single Payment

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Payments/${PAYMENT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

## Record a Payment (AR - Client Pays Invoice)

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Payments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Invoice": {
      "InvoiceID": "'${INVOICE_ID}'"
    },
    "Account": {
      "Code": "090"
    },
    "Date": "2026-03-15T00:00:00",
    "Amount": 2500.00,
    "Reference": "EFT-2026-0315-ACME"
  }'
```

## Record a Payment (AP - Pay Vendor Bill)

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Payments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Invoice": {
      "InvoiceID": "'${VENDOR_BILL_ID}'"
    },
    "Account": {
      "Code": "090"
    },
    "Date": "2026-03-10T00:00:00",
    "Amount": 525.00,
    "Reference": "CHK-4521"
  }'
```

## Record Partial Payment

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Payments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Invoice": {
      "InvoiceID": "'${INVOICE_ID}'"
    },
    "Account": {
      "Code": "090"
    },
    "Date": "2026-03-15T00:00:00",
    "Amount": 1000.00,
    "Reference": "Partial payment - remainder due by 3/31"
  }'
```

## Delete (Reverse) a Payment

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Payments/${PAYMENT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "PaymentID": "'${PAYMENT_ID}'",
    "Status": "DELETED"
  }'
```

## Batch Create Payments

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Payments?summarizeErrors=false" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Payments": [
      {
        "Invoice": { "InvoiceID": "inv-001" },
        "Account": { "Code": "090" },
        "Date": "2026-03-15T00:00:00",
        "Amount": 2500.00,
        "Reference": "EFT-ACME"
      },
      {
        "Invoice": { "InvoiceID": "inv-002" },
        "Account": { "Code": "090" },
        "Date": "2026-03-15T00:00:00",
        "Amount": 1800.00,
        "Reference": "EFT-TECHSTART"
      }
    ]
  }'
```
