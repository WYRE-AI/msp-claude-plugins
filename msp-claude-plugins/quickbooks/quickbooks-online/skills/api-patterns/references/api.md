# QuickBooks Online Request/Response Reference

## Query Examples

**Find customers by name:**
```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Customer WHERE DisplayName LIKE '%Acme%'&minorversion=73
```

**Find unpaid invoices for a customer:**
```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Invoice WHERE CustomerRef = '123' AND Balance > '0'&minorversion=73
```

**Find recent invoices:**
```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Invoice WHERE TxnDate > '2026-01-01' ORDERBY TxnDate DESC&minorversion=73
```

**Find active items:**
```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Item WHERE Active = true&minorversion=73
```

**Count customers:**
```http
GET /v3/company/{realmId}/query?query=SELECT COUNT(*) FROM Customer&minorversion=73
```

## Iterating All Results

```javascript
async function queryAll(entityName, whereClause = '') {
  const allResults = [];
  let startPosition = 1;
  const maxResults = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = `SELECT * FROM ${entityName}`;
    if (whereClause) query += ` WHERE ${whereClause}`;
    query += ` STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;

    const response = await fetch(
      `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=73`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
    );

    const data = await response.json();
    const entities = data.QueryResponse[entityName] || [];
    allResults.push(...entities);

    hasMore = entities.length === maxResults;
    startPosition += maxResults;
  }

  return allResults;
}
```

## Request Format

### Standard JSON Request

QuickBooks Online uses standard JSON for request and response bodies:

```json
{
  "DisplayName": "Acme Corporation",
  "PrimaryPhone": {
    "FreeFormNumber": "555-123-4567"
  },
  "PrimaryEmailAddr": {
    "Address": "billing@acmecorp.com"
  }
}
```

### Response Format

**Single Resource (Read/Create/Update):**
```json
{
  "Customer": {
    "Id": "123",
    "DisplayName": "Acme Corporation",
    "Balance": 5000.00,
    "SyncToken": "2",
    "MetaData": {
      "CreateTime": "2025-06-15T10:30:00-07:00",
      "LastUpdatedTime": "2026-01-20T14:22:00-07:00"
    }
  },
  "time": "2026-02-23T10:00:00.000-07:00"
}
```

**Query Response (Collection):**
```json
{
  "QueryResponse": {
    "Customer": [
      { "Id": "1", "DisplayName": "Acme Corporation", "Balance": 5000.00 },
      { "Id": "2", "DisplayName": "TechStart Inc", "Balance": 1200.00 }
    ],
    "startPosition": 1,
    "maxResults": 2,
    "totalCount": 2
  },
  "time": "2026-02-23T10:00:00.000-07:00"
}
```

## CRUD Operations

### Create (POST)

```http
POST /v3/company/{realmId}/customer?minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "DisplayName": "New MSP Client LLC",
  "CompanyName": "New MSP Client LLC",
  "PrimaryPhone": { "FreeFormNumber": "555-867-5309" },
  "PrimaryEmailAddr": { "Address": "billing@newclient.com" }
}
```

### Read (GET)

**Single resource by ID:**
```http
GET /v3/company/{realmId}/customer/123?minorversion=73
Authorization: Bearer {access_token}
```

**Query for collection:**
```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Customer WHERE Active = true&minorversion=73
Authorization: Bearer {access_token}
```

### Update (POST with full object)

QuickBooks Online uses POST (not PUT) for updates. You must include `Id` and `SyncToken`, plus the `sparse` flag for partial updates:

**Full update:**
```http
POST /v3/company/{realmId}/customer?minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "Id": "123",
  "SyncToken": "2",
  "DisplayName": "Acme Corporation - Updated",
  "CompanyName": "Acme Corporation",
  "PrimaryPhone": { "FreeFormNumber": "555-123-9999" }
}
```

**Sparse update (partial):**
```json
{
  "Id": "123",
  "SyncToken": "2",
  "sparse": true,
  "PrimaryPhone": { "FreeFormNumber": "555-123-9999" }
}
```

### Delete (POST)

Not all entities support delete. For those that do, use the delete operation:

```http
POST /v3/company/{realmId}/customer?operation=delete&minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "Id": "123",
  "SyncToken": "2"
}
```

Most entities support deactivation (set `Active: false`) instead of hard delete.

## Retry Strategy

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        const jitter = Math.random() * 5000;
        await new Promise(r => setTimeout(r, retryAfter * 1000 + jitter));
        continue;
      }

      if (response.status === 401) {
        // Token may have expired -- attempt refresh
        await refreshAccessToken();
        options.headers.Authorization = `Bearer ${process.env.QBO_ACCESS_TOKEN}`;
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

## Webhook Payload

```json
{
  "eventNotifications": [
    {
      "realmId": "1234567890",
      "dataChangeEvent": {
        "entities": [
          {
            "name": "Invoice",
            "id": "456",
            "operation": "Create",
            "lastUpdated": "2026-02-23T10:00:00.000-07:00"
          }
        ]
      }
    }
  ]
}
```
