# QuickBooks Online Payment API Reference

## Query Payments

```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Payment WHERE CustomerRef = '123'&minorversion=73
Authorization: Bearer {access_token}
Accept: application/json
```

## Record Payment (Applied to Invoice)

```http
POST /v3/company/{realmId}/payment?minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Single invoice payment:**

```json
{
  "CustomerRef": {
    "value": "123"
  },
  "TotalAmt": 2850.00,
  "TxnDate": "2026-02-15",
  "PaymentMethodRef": {
    "value": "2"
  },
  "PaymentRefNum": "CHK-10542",
  "DepositToAccountRef": {
    "value": "35"
  },
  "Line": [
    {
      "Amount": 2850.00,
      "LinkedTxn": [
        {
          "TxnId": "456",
          "TxnType": "Invoice"
        }
      ]
    }
  ],
  "PrivateNote": "February managed services payment - Acme Corp"
}
```

```bash
curl -s -X POST \
  -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/payment?minorversion=73" \
  -d '{
    "CustomerRef": { "value": "123" },
    "TotalAmt": 2850.00,
    "PaymentRefNum": "CHK-10542",
    "Line": [{
      "Amount": 2850.00,
      "LinkedTxn": [{ "TxnId": "456", "TxnType": "Invoice" }]
    }]
  }'
```

**Multi-invoice payment:**

```json
{
  "CustomerRef": {
    "value": "123"
  },
  "TotalAmt": 7500.00,
  "TxnDate": "2026-02-20",
  "PaymentMethodRef": {
    "value": "5"
  },
  "PaymentRefNum": "ACH-20260220",
  "Line": [
    {
      "Amount": 2500.00,
      "LinkedTxn": [{ "TxnId": "450", "TxnType": "Invoice" }]
    },
    {
      "Amount": 2500.00,
      "LinkedTxn": [{ "TxnId": "460", "TxnType": "Invoice" }]
    },
    {
      "Amount": 2500.00,
      "LinkedTxn": [{ "TxnId": "470", "TxnType": "Invoice" }]
    }
  ],
  "PrivateNote": "Bulk payment covering Dec, Jan, Feb invoices"
}
```

**Unapplied payment (retainer/advance):**

```json
{
  "CustomerRef": {
    "value": "123"
  },
  "TotalAmt": 5000.00,
  "TxnDate": "2026-02-01",
  "PaymentMethodRef": {
    "value": "5"
  },
  "PaymentRefNum": "WIRE-20260201",
  "PrivateNote": "Advance retainer payment - project deposit"
}
```

## Create Credit Memo

```json
{
  "CustomerRef": {
    "value": "123"
  },
  "TxnDate": "2026-02-15",
  "Line": [
    {
      "Amount": 500.00,
      "Description": "Service credit - downtime incident on 2026-02-10",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "1" },
        "Qty": 1,
        "UnitPrice": 500.00
      }
    }
  ],
  "CustomerMemo": {
    "value": "Credit for service disruption on February 10, 2026."
  }
}
```

## Void Payment

```http
POST /v3/company/{realmId}/payment?operation=void&minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "Id": "789",
  "SyncToken": "1"
}
```

## Get Payment Details

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/payment/789?minorversion=73"
```

## Endpoint Reference

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create Payment | POST | `/v3/company/{realmId}/payment` |
| Read Payment | GET | `/v3/company/{realmId}/payment/{id}` |
| Update Payment | POST | `/v3/company/{realmId}/payment` |
| Void Payment | POST | `/v3/company/{realmId}/payment?operation=void` |
| Delete Payment | POST | `/v3/company/{realmId}/payment?operation=delete` |
| Create CreditMemo | POST | `/v3/company/{realmId}/creditmemo` |
| Read CreditMemo | GET | `/v3/company/{realmId}/creditmemo/{id}` |
| Query | GET | `/v3/company/{realmId}/query?query=...` |
