# Autotask API Patterns — Extended Reference

## Complex Query Examples

**AND conditions (default):**
```json
{
  "filter": [
    {"field": "companyID", "op": "eq", "value": 12345},
    {"field": "priority", "op": "lte", "value": 2},
    {"field": "status", "op": "in", "value": [1, 2, 5]}
  ]
}
```

**Nested AND/OR:**
```json
{
  "filter": [
    {"field": "companyID", "op": "eq", "value": 12345},
    {
      "op": "or",
      "items": [
        {"field": "priority", "op": "in", "value": [3, 4]},
        {
          "op": "and",
          "items": [
            {"field": "status", "op": "eq", "value": 1},
            {"field": "estimatedHours", "op": "gt", "value": 10}
          ]
        }
      ]
    }
  ]
}
```

## Field Includes — Response Shape

**Request:**
```json
{
  "filter": [{"field": "id", "op": "gt", "value": 0}],
  "includeFields": [
    "Company.companyName",
    "Company.phone",
    "AssignedResource.firstName",
    "AssignedResource.lastName",
    "Contact.emailAddress"
  ]
}
```

**Response with includes:**
```json
{
  "items": [
    {
      "id": 54321,
      "title": "Email issue",
      "companyID": 12345,
      "companyName": "Acme Corporation",
      "companyPhone": "555-123-4567",
      "assignedResourceFirstName": "Jane",
      "assignedResourceLastName": "Tech"
    }
  ]
}
```

## Entity Information

### Get Field Definitions

```http
GET /v1.0/Tickets/entityInformation/fields
```

**Response:**
```json
{
  "fields": [
    {
      "name": "status",
      "dataType": "Integer",
      "isRequired": true,
      "isPickList": true,
      "picklistValues": [
        {"value": 1, "label": "New"},
        {"value": 2, "label": "In Progress"},
        {"value": 5, "label": "Complete"}
      ]
    }
  ]
}
```

### Get User-Defined Fields

```http
GET /v1.0/Tickets/entityInformation/userDefinedFields
```

## CRUD Operations

### Create (POST)

```http
POST /v1.0/Tickets
Content-Type: application/json

{
  "companyID": 12345,
  "title": "New ticket",
  "status": 1,
  "priority": 2,
  "queueID": 8
}
```

### Read (GET)

**Single entity:**
```http
GET /v1.0/Tickets/54321
```

**Query:**
```http
POST /v1.0/Tickets/query
```

### Update (PATCH)

```http
PATCH /v1.0/Tickets
Content-Type: application/json

{
  "id": 54321,
  "status": 2,
  "assignedResourceID": 29744150
}
```

### Replace (PUT)

```http
PUT /v1.0/Tickets/54321
Content-Type: application/json

{
  "id": 54321,
  "companyID": 12345,
  "title": "Updated ticket",
  "status": 2,
  "priority": 2,
  "queueID": 8
}
```

### Delete (DELETE)

```http
DELETE /v1.0/Tickets/54321
```

**Note:** Not all entities support DELETE. Check entity documentation.
