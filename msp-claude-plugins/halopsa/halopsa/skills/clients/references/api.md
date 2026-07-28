# HaloPSA Client API Reference

## Creating a Client

```http
POST /api/Client
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "name": "Acme Corporation",
    "emailaddress": "info@acme.example.com",
    "phonenumber": "555-123-4567",
    "website": "https://acme.example.com",
    "notes": "Enterprise client, premium support tier",
    "accountmanager_id": 101
  }
]
```

### Response

```json
{
  "clients": [
    {
      "id": 123,
      "name": "Acme Corporation",
      "emailaddress": "info@acme.example.com",
      "phonenumber": "555-123-4567",
      "inactive": false
    }
  ]
}
```

## Searching Clients

**Search by name:**
```http
GET /api/Client?search=acme
```

**Active clients only:**
```http
GET /api/Client?inactive=false
```

**By account manager:**
```http
GET /api/Client?accountmanager_id=101
```

**Paginated with sorting:**
```http
GET /api/Client?page_no=1&page_size=50&order=name&orderdesc=false
```

## Getting a Single Client

```http
GET /api/Client/123
```

**With additional details:**
```http
GET /api/Client/123?includesites=true&includeusers=true
```

## Updating a Client

```http
POST /api/Client
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "id": 123,
    "phonenumber": "555-987-6543",
    "website": "https://newsite.acme.example.com",
    "accountmanager_id": 102
  }
]
```

## Creating a Site

```http
POST /api/Site
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "client_id": 123,
    "name": "Acme HQ",
    "line1": "123 Main Street",
    "line2": "Suite 500",
    "line4": "Springfield",
    "postcode": "62701",
    "country": "United States",
    "phonenumber": "555-123-4567",
    "main_site": true
  }
]
```

## Creating a Contact (User)

```http
POST /api/Users
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "client_id": 123,
    "site_id": 456,
    "name": "John Smith",
    "firstname": "John",
    "surname": "Smith",
    "emailaddress": "john.smith@acme.example.com",
    "phonenumber": "555-123-4568",
    "mobilenumber": "555-987-6543",
    "jobtitle": "IT Director",
    "isimportantcontact": true
  }
]
```

## Searching Contacts

**Contacts for a client:**
```http
GET /api/Users?client_id=123
```

**Search by email:**
```http
GET /api/Users?search=john.smith@acme.example.com
```

**Active contacts only:**
```http
GET /api/Users?inactive=false&client_id=123
```

## Setting Up Client Hierarchy

```json
[
  {
    "id": 124,
    "name": "Acme West Branch",
    "client_to_invoice": 123,
    "toplevel_id": 123
  }
]
```

## Deactivating a Client

```json
[{ "id": 123, "inactive": true }]
```

## Data Quality Queries

### Find clients without contacts
```http
GET /api/Client?hasusers=false&inactive=false
```

### Find contacts without email
```http
GET /api/Users?emailaddress=null&inactive=false
```
