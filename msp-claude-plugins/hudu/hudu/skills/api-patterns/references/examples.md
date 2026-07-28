# Hudu API Request and Response Examples

## Standard JSON Request

Hudu uses standard JSON (not JSON:API) for request and response bodies:

```json
{
  "company": {
    "name": "Acme Corporation",
    "nickname": "ACME",
    "address_line_1": "123 Main St",
    "city": "Springfield",
    "state": "IL"
  }
}
```

## Response Format

**Single Resource:**
```json
{
  "company": {
    "id": 1,
    "name": "Acme Corporation",
    "nickname": "ACME",
    "address_line_1": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-02-15T14:22:00.000Z"
  }
}
```

**Collection:**
```json
{
  "companies": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "nickname": "ACME"
    },
    {
      "id": 2,
      "name": "TechStart Inc",
      "nickname": "TSI"
    }
  ]
}
```

## Authenticated Request

```http
GET /api/v1/companies
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

## Rate Limit Response

When rate limited (HTTP 429):

```json
{
  "error": "Rate limit exceeded. Please wait before making more requests."
}
```

## CRUD Operations

### Create (POST)

```http
POST /api/v1/companies
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "company": {
    "name": "New Client Inc",
    "nickname": "NCI",
    "address_line_1": "456 Oak Ave",
    "city": "Portland",
    "state": "OR"
  }
}
```

### Read (GET)

**Single resource:**
```http
GET /api/v1/companies/123
```

**Collection with filters:**
```http
GET /api/v1/companies?name=Acme&page=1
```

### Update (PUT)

```http
PUT /api/v1/companies/123
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "company": {
    "nickname": "ACME-UPDATED",
    "notes": "Updated contact information"
  }
}
```

### Delete (DELETE)

```http
DELETE /api/v1/companies/123
x-api-key: YOUR_API_KEY
```

**Note:** DELETE operations require explicit API key permission. Not all API keys can delete records.

## Nested / Company-Scoped Patterns

Many resources can be filtered by company:

```http
GET /api/v1/assets?company_id=123
GET /api/v1/asset_passwords?company_id=123
GET /api/v1/articles?company_id=123
GET /api/v1/websites?company_id=123
```

For assets specifically, you can also scope by asset layout:

```http
GET /api/v1/assets?company_id=123&asset_layout_id=5
```

## Error Response Format

```json
{
  "error": "Validation failed: Name can't be blank"
}
```

Or for multiple errors:

```json
{
  "errors": [
    "Name can't be blank",
    "Company is required"
  ]
}
```

## Error Handling Pattern

```javascript
function handleApiError(response, body) {
  if (response.status === 401) {
    console.log('API key invalid or expired. Check HUDU_API_KEY.');
  } else if (response.status === 403) {
    console.log('Permission denied. Check API key permissions.');
    console.log('If accessing passwords, verify password access is enabled.');
  } else if (response.status === 404) {
    console.log('Resource not found. Check HUDU_BASE_URL and resource ID.');
  } else if (response.status === 422) {
    console.log('Validation error:', body.error || body.errors);
  } else if (response.status === 429) {
    console.log('Rate limited. Wait 60 seconds before retrying.');
  }
}
```
