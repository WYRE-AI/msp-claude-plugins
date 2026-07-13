---
name: "Xero API Patterns"
description: >
  Use this skill when working with the Xero API - OAuth2 authentication,
  REST structure, filtering, pagination, rate limiting, error handling,
  and best practices. Covers Custom Connection OAuth2 flow, tenant ID headers,
  date formats, and batch operation patterns.
when_to_use: >-
  When working with OAuth2 authentication, REST structure, filtering, pagination, rate limiting,
  error handling, and best practices in the Xero API. Use when: xero api, xero query, xero filter,
  xero pagination, xero rate limit, xero authentication, xero oauth, xero rest, xero endpoint,
  xero request, or xero token.
---

# Xero API Patterns

## Overview

The Xero API is a RESTful JSON API that provides access to accounting data including contacts, invoices, payments, accounts, bank transactions, credit notes, and reports. This skill covers OAuth2 authentication (Custom Connections), query building, pagination, error handling, and performance optimization patterns specific to MSP billing operations.

## Authentication

### OAuth2 Custom Connections

Xero uses OAuth2 with Custom Connections for machine-to-machine (M2M) integrations. This is the recommended approach for server-side automations and CLI tools.

**Token Request:**

```http
POST https://identity.xero.com/connect/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic base64(CLIENT_ID:CLIENT_SECRET)

grant_type=client_credentials&scope=accounting.transactions accounting.contacts accounting.reports.read accounting.settings
```

**curl Example:**

```bash
curl -s -X POST https://identity.xero.com/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}" \
  -d "grant_type=client_credentials&scope=accounting.transactions accounting.contacts accounting.reports.read accounting.settings"
```

**Token Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI...",
  "expires_in": 1800,
  "token_type": "Bearer",
  "scope": "accounting.transactions accounting.contacts accounting.reports.read accounting.settings"
}
```

**Token Details:**

| Field | Value | Description |
|-------|-------|-------------|
| `access_token` | JWT string | Bearer token for API requests |
| `expires_in` | 1800 | Token lifetime in seconds (30 minutes) |
| `token_type` | Bearer | Token type for Authorization header |
| `scope` | Space-delimited | Granted OAuth scopes |

### Required Headers

All API requests require these headers:

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer {access_token}` | OAuth2 access token |
| `xero-tenant-id` | Your tenant ID | Target Xero organization |
| `Content-Type` | `application/json` | JSON content type |
| `Accept` | `application/json` | JSON response format |

### Environment Variables

```bash
export XERO_CLIENT_ID="your-client-id"
export XERO_CLIENT_SECRET="your-client-secret"
export XERO_TENANT_ID="your-tenant-id"
```

### Base URL Pattern

All accounting API endpoints follow the pattern:

```
https://api.xero.com/api.xro/2.0/{resource}
```

Examples:

```
https://api.xero.com/api.xro/2.0/Contacts
https://api.xero.com/api.xro/2.0/Invoices
https://api.xero.com/api.xro/2.0/Payments
https://api.xero.com/api.xro/2.0/Accounts
```

### OAuth Scopes

| Scope | Description |
|-------|-------------|
| `accounting.transactions` | Read/write invoices, payments, credit notes, bank transactions |
| `accounting.transactions.read` | Read-only access to transactions |
| `accounting.contacts` | Read/write contacts |
| `accounting.contacts.read` | Read-only access to contacts |
| `accounting.reports.read` | Read financial reports |
| `accounting.settings` | Read/write chart of accounts, tax rates |
| `accounting.settings.read` | Read-only access to settings |

### Token Management Pattern

```javascript
class XeroAuth {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
    this.expiresAt = 0;
  }

  async getToken() {
    if (this.accessToken && Date.now() < this.expiresAt - 60000) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString('base64');

    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: 'grant_type=client_credentials&scope=accounting.transactions accounting.contacts accounting.reports.read accounting.settings'
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + (data.expires_in * 1000);
    return this.accessToken;
  }
}
```

## Request Format

### Standard API Request

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

### POST Request (Create)

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

### Response Format

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

## Filtering

### Where Clause Filtering

Xero uses a `where` query parameter with OData-style expressions:

```http
GET /api.xro/2.0/Contacts?where=Name=="Acme Corp"
GET /api.xro/2.0/Contacts?where=Name.StartsWith("Acme")
GET /api.xro/2.0/Contacts?where=ContactStatus=="ACTIVE"
GET /api.xro/2.0/Invoices?where=Type=="ACCREC"&&Status=="AUTHORISED"
GET /api.xro/2.0/Invoices?where=Contact.ContactID==guid("abc-123")
GET /api.xro/2.0/Invoices?where=AmountDue>0
```

**Important:** URL-encode the `where` parameter value in actual requests.

### Where Clause Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equals | `Name=="Acme"` |
| `!=` | Not equals | `Status!="DELETED"` |
| `>` | Greater than | `AmountDue>0` |
| `<` | Less than | `AmountDue<100` |
| `>=` | Greater or equal | `Total>=1000` |
| `<=` | Less or equal | `Total<=5000` |
| `&&` | AND | `Type=="ACCREC"&&Status=="PAID"` |
| `||` | OR | `Status=="DRAFT"||Status=="SUBMITTED"` |
| `.StartsWith()` | Starts with | `Name.StartsWith("Acme")` |
| `.EndsWith()` | Ends with | `Name.EndsWith("Corp")` |
| `.Contains()` | Contains | `Name.Contains("tech")` |

### If-Modified-Since Header

Use this header to retrieve only records modified after a given date:

```http
GET /api.xro/2.0/Contacts
If-Modified-Since: 2026-02-01T00:00:00
```

### Order Parameter

Sort results using the `order` parameter:

```http
GET /api.xro/2.0/Invoices?order=Date DESC
GET /api.xro/2.0/Contacts?order=Name ASC
```

## Pagination

### Page-Based Pagination

Xero uses page-based pagination with the `page` query parameter:

```http
GET /api.xro/2.0/Invoices?page=1
GET /api.xro/2.0/Invoices?page=2
```

**Pagination Details:**

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number (1-based) | 1 |
| Results per page | Fixed by Xero | 100 |

### Detecting End of Pages

When a page returns fewer than 100 results, you have reached the last page:

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

### Pagination-Required Endpoints

These endpoints require pagination (return max 100 per page):

| Endpoint | Paginated | Notes |
|----------|-----------|-------|
| `/Contacts` | Yes | 100 per page |
| `/Invoices` | Yes | 100 per page |
| `/Payments` | Yes | 100 per page |
| `/BankTransactions` | Yes | 100 per page |
| `/CreditNotes` | Yes | 100 per page |
| `/Accounts` | No | Returns all accounts |
| `/Reports/*` | No | Returns full report |

## Rate Limiting

### Rate Limit Details

| Metric | Limit |
|--------|-------|
| Requests per minute | 60 |
| Requests per day | 5,000 |

### Rate Limit Headers

Xero returns rate limit information in response headers:

| Header | Description |
|--------|-------------|
| `X-Rate-Limit-Problem` | Present when rate limited |
| `Retry-After` | Seconds to wait before retry |

### Rate Limit Response

When rate limited (HTTP 429):

```json
{
  "Type": "RateLimitException",
  "Message": "Rate limit exceeded. Please wait before making more requests.",
  "Detail": "Minute rate limit exceeded"
}
```

### Retry Strategy

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      const jitter = Math.random() * 5000;
      console.log(`Rate limited. Retrying in ${retryAfter}s...`);
      await new Promise(r => setTimeout(r, retryAfter * 1000 + jitter));
      continue;
    }

    if (response.status >= 500) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.log(`Server error ${response.status}. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    return response;
  }

  throw new Error(`Max retries (${maxRetries}) exceeded`);
}
```

## Date Formats

### Standard Date Format

Xero uses the format `YYYY-MM-DDT00:00:00` for dates:

```json
{
  "Date": "2026-03-01T00:00:00",
  "DueDate": "2026-03-31T00:00:00"
}
```

### Microsoft JSON Date Format

Some responses return dates in Microsoft JSON format:

```json
{
  "Date": "/Date(1772524800000+0000)/"
}
```

Parse this by extracting the timestamp:

```javascript
function parseXeroDate(dateString) {
  if (dateString.startsWith('/Date(')) {
    const timestamp = parseInt(dateString.match(/\d+/)[0], 10);
    return new Date(timestamp);
  }
  return new Date(dateString);
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check request format and required fields |
| 401 | Unauthorized | Refresh access token |
| 403 | Forbidden | Check tenant ID and scopes |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Wait and retry with backoff |
| 500 | Server Error | Retry with backoff |

### Validation Error Response

Xero returns validation errors as an array within the resource:

```json
{
  "Id": "...",
  "Status": "OK",
  "Invoices": [
    {
      "InvoiceID": "00000000-0000-0000-0000-000000000000",
      "HasErrors": true,
      "ValidationErrors": [
        {
          "Message": "Account code '999' is not a valid code for this document."
        },
        {
          "Message": "A Contact is required to create an Invoice."
        }
      ]
    }
  ]
}
```

### Error Handling Pattern

```javascript
function handleXeroResponse(data, resourceName) {
  const resources = data[resourceName] || [];

  for (const resource of resources) {
    if (resource.HasErrors && resource.ValidationErrors) {
      const errors = resource.ValidationErrors.map(e => e.Message);
      throw new Error(`Validation errors: ${errors.join('; ')}`);
    }
  }

  return resources;
}
```

## Batch Operations

### Batch Create/Update

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

## Best Practices

1. **Cache access tokens** - Tokens last 30 minutes; do not request a new token for every API call
2. **Always include xero-tenant-id** - Every API request requires the tenant header
3. **Use If-Modified-Since** - For sync operations, only fetch changed records
4. **Paginate large results** - Loop through pages until fewer than 100 results returned
5. **URL-encode where clauses** - The `where` parameter must be properly encoded
6. **Use summarizeErrors=false** - Get detailed per-item errors in batch operations
7. **Implement retry logic** - Handle rate limits (429) and transient errors (500)
8. **Respect rate limits** - Stay under 60 requests per minute and 5,000 per day
9. **Use batch operations** - Send multiple items in one request to reduce API calls
10. **Parse dates carefully** - Handle both ISO and Microsoft JSON date formats

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

## Related Skills

- [Xero Contacts](../contacts/SKILL.md) - Contact management
- [Xero Invoices](../invoices/SKILL.md) - Invoice management
- [Xero Payments](../payments/SKILL.md) - Payment tracking
- [Xero Accounts](../accounts/SKILL.md) - Chart of accounts
- [Xero Reports](../reports/SKILL.md) - Financial reporting
