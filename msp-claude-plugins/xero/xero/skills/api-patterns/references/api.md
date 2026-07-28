# Xero API Request, Response, and Endpoint Reference

## Standard API Request

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

## POST Request (Create)

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Invoices" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "Type": "ACCREC",
    "Contact": { "ContactID": "abc-123" },
    "LineItems": [
      {
        "Description": "Monthly Managed Services",
        "Quantity": 1,
        "UnitAmount": 2500.00,
        "AccountCode": "200"
      }
    ],
    "Date": "2026-03-01T00:00:00",
    "DueDate": "2026-03-31T00:00:00"
  }'
```

## Response Format

**Single Resource:**

```json
{
  "Id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "Status": "OK",
  "Contacts": [
    {
      "ContactID": "abc-123",
      "Name": "Acme Corp",
      "EmailAddress": "billing@acme.com",
      "ContactStatus": "ACTIVE"
    }
  ]
}
```

**Collection:**

```json
{
  "Id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "Status": "OK",
  "Invoices": [
    {
      "InvoiceID": "inv-456",
      "Type": "ACCREC",
      "InvoiceNumber": "INV-0042",
      "Contact": { "ContactID": "abc-123", "Name": "Acme Corp" },
      "Total": 2500.00,
      "Status": "AUTHORISED"
    }
  ]
}
```

## Where Clause Examples

```http
GET /api.xro/2.0/Contacts?where=Name=="Acme Corp"
GET /api.xro/2.0/Contacts?where=Name.StartsWith("Acme")
GET /api.xro/2.0/Contacts?where=ContactStatus=="ACTIVE"
GET /api.xro/2.0/Invoices?where=Type=="ACCREC"&&Status=="AUTHORISED"
GET /api.xro/2.0/Invoices?where=Contact.ContactID==guid("abc-123")
GET /api.xro/2.0/Invoices?where=AmountDue>0
```

**Important:** URL-encode the `where` parameter value in actual requests.

## If-Modified-Since Header

Use this header to retrieve only records modified after a given date:

```http
GET /api.xro/2.0/Contacts
If-Modified-Since: 2026-02-01T00:00:00
```

## Order Parameter

Sort results using the `order` parameter:

```http
GET /api.xro/2.0/Invoices?order=Date DESC
GET /api.xro/2.0/Contacts?order=Name ASC
```

## Pagination Loop

```javascript
async function fetchAllInvoices(auth, tenantId) {
  const allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const token = await auth.getToken();
    const response = await fetch(
      `https://api.xero.com/api.xro/2.0/Invoices?page=${page}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'xero-tenant-id': tenantId,
          'Accept': 'application/json'
        }
      }
    );

    const data = await response.json();
    const invoices = data.Invoices || [];
    allItems.push(...invoices);

    hasMore = invoices.length === 100;
    page++;
  }

  return allItems;
}
```

## Pagination-Required Endpoints

| Endpoint | Paginated | Notes |
|----------|-----------|-------|
| `/Contacts` | Yes | 100 per page |
| `/Invoices` | Yes | 100 per page |
| `/Payments` | Yes | 100 per page |
| `/BankTransactions` | Yes | 100 per page |
| `/CreditNotes` | Yes | 100 per page |
| `/Accounts` | No | Returns all accounts |
| `/Reports/*` | No | Returns full report |

## Batch Create/Update

Xero supports sending multiple resources in a single request:

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
        "LineItems": [{ "Description": "Managed Services - March", "Quantity": 1, "UnitAmount": 2500.00, "AccountCode": "200" }],
        "Date": "2026-03-01T00:00:00",
        "DueDate": "2026-03-31T00:00:00"
      },
      {
        "Type": "ACCREC",
        "Contact": { "ContactID": "def-456" },
        "LineItems": [{ "Description": "Managed Services - March", "Quantity": 1, "UnitAmount": 1800.00, "AccountCode": "200" }],
        "Date": "2026-03-01T00:00:00",
        "DueDate": "2026-03-31T00:00:00"
      }
    ]
  }'
```

Use `?summarizeErrors=false` to get per-item error details in batch operations.

## Endpoint Reference

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/Contacts` | GET, POST, PUT | Customer and supplier contacts |
| `/Invoices` | GET, POST, PUT | Sales invoices and bills |
| `/Payments` | GET, POST, PUT, DELETE | Payment records |
| `/Accounts` | GET, POST, PUT, DELETE | Chart of accounts |
| `/CreditNotes` | GET, POST, PUT | Credit notes |
| `/BankTransactions` | GET, POST, PUT | Bank transactions |
| `/Reports/ProfitAndLoss` | GET | Profit and Loss report |
| `/Reports/BalanceSheet` | GET | Balance Sheet report |
| `/Reports/AgedReceivablesByContact` | GET | Aged Receivables report |
| `/Reports/AgedPayablesByContact` | GET | Aged Payables report |
| `/Reports/TrialBalance` | GET | Trial Balance report |
| `/TaxRates` | GET | Tax rate configurations |
| `/Currencies` | GET | Configured currencies |
