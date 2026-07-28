# QuickBooks Online Invoice Request Examples

## Monthly Managed Services Invoice

```json
{
  "CustomerRef": {
    "value": "123"
  },
  "TxnDate": "2026-02-01",
  "SalesTermRef": {
    "value": "3"
  },
  "BillEmail": {
    "Address": "billing@acmecorp.com"
  },
  "EmailStatus": "NeedToSend",
  "Line": [
    {
      "Amount": 2500.00,
      "Description": "Monthly Managed IT Services - February 2026\nIncludes: 24/7 monitoring, patch management, help desk support (unlimited)",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "1" },
        "Qty": 1,
        "UnitPrice": 2500.00,
        "ServiceDate": "2026-02-01"
      }
    },
    {
      "Amount": 150.00,
      "Description": "Cloud Backup Service - 500GB - February 2026",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "2" },
        "Qty": 1,
        "UnitPrice": 150.00,
        "ServiceDate": "2026-02-01"
      }
    },
    {
      "Amount": 200.00,
      "Description": "Email Security Filtering - 50 mailboxes - February 2026",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "3" },
        "Qty": 50,
        "UnitPrice": 4.00,
        "ServiceDate": "2026-02-01"
      }
    }
  ],
  "CustomerMemo": {
    "value": "Thank you for choosing our managed IT services."
  },
  "PrivateNote": "Monthly recurring invoice - auto-generated"
}
```

## Create Invoice via curl

```bash
curl -s -X POST \
  -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/invoice?minorversion=73" \
  -d '{
    "CustomerRef": { "value": "123" },
    "Line": [{
      "Amount": 2500.00,
      "Description": "Monthly Managed IT Services - February 2026",
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "1" },
        "Qty": 1,
        "UnitPrice": 2500.00
      }
    }]
  }'
```

## Get Single Invoice via curl

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/invoice/456?minorversion=73"
```

## Send Invoice via curl

```bash
curl -s -X POST \
  -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/invoice/456/send?sendTo=billing@acmecorp.com&minorversion=73"
```
