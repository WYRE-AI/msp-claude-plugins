# IT Glue API Patterns — Full Reference

## Common Filter Parameters

| Endpoint | Filter | Example |
|----------|--------|---------|
| Organizations | `filter[name]` | Partial name match |
| Organizations | `filter[organization-type-id]` | By type |
| Organizations | `filter[organization-status-id]` | By status |
| Configurations | `filter[organization-id]` | By organization |
| Configurations | `filter[configuration-type-id]` | By type |
| Configurations | `filter[configuration-status-id]` | By status |
| Contacts | `filter[organization-id]` | By organization |
| Passwords | `filter[organization-id]` | By organization |
| Documents | `filter[organization-id]` | By organization |

Combine filters with multiple parameters:

```http
GET /configurations?filter[organization-id]=123&filter[configuration-type-id]=456&filter[configuration-status-id]=1
```

Filter resources by PSA ID for cross-platform lookups:

```http
GET /organizations?filter[psa-id]=12345
GET /contacts?filter[psa-id]=67890
```

## Common Sort Fields

| Endpoint | Fields |
|----------|--------|
| Organizations | `name`, `created-at`, `updated-at` |
| Configurations | `name`, `hostname`, `created-at`, `updated-at` |
| Contacts | `name`, `first-name`, `last-name`, `created-at` |
| Passwords | `name`, `created-at`, `updated-at` |
| Documents | `name`, `created-at`, `updated-at` |

## Response Metadata

```json
{
  "meta": {
    "current-page": 1,
    "next-page": 2,
    "prev-page": null,
    "total-pages": 5,
    "total-count": 247
  }
}
```

## Common Includes

| Endpoint | Available Includes |
|----------|-------------------|
| Configurations | `organization`, `configuration-type`, `configuration-status`, `configuration-interfaces`, `related-items` |
| Contacts | `organization`, `contact-type`, `location` |
| Passwords | `organization`, `password-category` |
| Documents | `organization` |
| Flexible Assets | `organization`, `flexible-asset-type` |

### Response with Includes

```json
{
  "data": {
    "id": "123",
    "type": "configurations",
    "attributes": { "name": "DC-01" },
    "relationships": {
      "organization": {
        "data": { "id": "456", "type": "organizations" }
      }
    }
  },
  "included": [
    {
      "id": "456",
      "type": "organizations",
      "attributes": {
        "name": "Acme Corporation"
      }
    }
  ]
}
```

## CRUD Operations

### Create (POST)

```http
POST /organizations
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "organizations",
    "attributes": {
      "name": "New Client Inc",
      "organization-type-id": 12345,
      "organization-status-id": 1
    }
  }
}
```

### Read (GET)

**Single resource:**
```http
GET /organizations/123456
```

**Collection with filters:**
```http
GET /organizations?filter[name]=Acme&page[size]=50
```

### Update (PATCH)

```http
PATCH /organizations/123456
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "organizations",
    "attributes": {
      "quick-notes": "Updated contact info"
    }
  }
}
```

### Delete (DELETE)

```http
DELETE /organizations/123456
x-api-key: YOUR_API_KEY
```

Not all resources support DELETE. Check endpoint documentation.

## Nested Resources

### Organization-Scoped Endpoints

Access resources within an organization context:

```http
GET /organizations/123/relationships/configurations
GET /organizations/123/relationships/contacts
GET /organizations/123/relationships/passwords
GET /organizations/123/relationships/documents
```

### Creating Nested Resources

```http
POST /organizations/123/relationships/configurations
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "configurations",
    "attributes": {
      "name": "NEW-SERVER-01",
      "configuration-type-id": 456,
      "configuration-status-id": 1
    }
  }
}
```
