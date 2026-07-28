# QuickBooks Online Expense Request Examples

## Create Purchase — software licenses allocated to a client

```json
{
  "PaymentType": "CreditCard",
  "AccountRef": {
    "value": "41"
  },
  "EntityRef": {
    "value": "42",
    "type": "Vendor"
  },
  "TxnDate": "2026-02-15",
  "Line": [
    {
      "Amount": 450.00,
      "Description": "Microsoft 365 Business Premium - 30 seats - Acme Corp - February 2026",
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": { "value": "60" },
        "CustomerRef": { "value": "123" },
        "BillableStatus": "Billable"
      }
    },
    {
      "Amount": 120.00,
      "Description": "SentinelOne Endpoint Protection - 30 seats - Acme Corp - February 2026",
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": { "value": "60" },
        "CustomerRef": { "value": "123" },
        "BillableStatus": "Billable"
      }
    }
  ],
  "PrivateNote": "Monthly software licenses for Acme Corp"
}
```

## Create Purchase via curl

```bash
curl -s -X POST \
  -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/purchase?minorversion=73" \
  -d '{
    "PaymentType": "CreditCard",
    "AccountRef": { "value": "41" },
    "EntityRef": { "value": "42", "type": "Vendor" },
    "Line": [{
      "Amount": 450.00,
      "Description": "Microsoft 365 - Acme Corp - Feb 2026",
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": { "value": "60" },
        "CustomerRef": { "value": "123" },
        "BillableStatus": "Billable"
      }
    }]
  }'
```

## Create Vendor

```json
{
  "DisplayName": "TechDistributor Inc",
  "CompanyName": "TechDistributor Inc",
  "PrimaryPhone": { "FreeFormNumber": "800-555-1234" },
  "PrimaryEmailAddr": { "Address": "orders@techdist.com" },
  "BillAddr": {
    "Line1": "100 Distribution Way",
    "City": "Dallas",
    "CountrySubDivisionCode": "TX",
    "PostalCode": "75201"
  }
}
```
